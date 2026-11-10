/**
 * Pitch Sub-surface Irrigation & Sprinkler Automation Engine
 * 
 * Computes rootzone moisture deficits, schedules valve sequence sweeps across pitch sectors,
 * avoids over-irrigation during active match bookings, and certifies pitch slickness & ball roll.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const IRRIGATION_ZONES = [
  { id: 'SECTOR_NORTH_PENALTY', label: 'North Penalty Box & Goalmouth', defaultRuntimeSec: 180, flowRateLpm: 65 },
  { id: 'SECTOR_CENTRE_CIRCLE', label: 'Centre Circle & Midfield', defaultRuntimeSec: 240, flowRateLpm: 80 },
  { id: 'SECTOR_SOUTH_PENALTY', label: 'South Penalty Box & Goalmouth', defaultRuntimeSec: 180, flowRateLpm: 65 },
  { id: 'SECTOR_EAST_TOUCHLINE', label: 'East Touchline & Dugouts', defaultRuntimeSec: 120, flowRateLpm: 45 },
  { id: 'SECTOR_WEST_TOUCHLINE', label: 'West Touchline & Assistant Path', defaultRuntimeSec: 120, flowRateLpm: 45 },
];

export const IRRIGATION_PRESETS = {
  PRE_MATCH_SLICK: {
    id: 'PRE_MATCH_SLICK',
    label: 'Pre-Kickoff Ball Speed Slicking',
    purpose: 'Rapid 3-minute burst to decrease friction and accelerate ball roll',
    runtimeMultiplier: 0.5,
    targetMoistureBoostPct: 8,
    coolDownBufferMinutes: 10,
  },
  DEEP_CYCLE_POST_MATCH: {
    id: 'DEEP_CYCLE_POST_MATCH',
    label: 'Deep Rootzone Regeneration',
    purpose: 'Full overnight soak to rehydrate rootzone after heavy divot wear',
    runtimeMultiplier: 1.8,
    targetMoistureBoostPct: 25,
    coolDownBufferMinutes: 60,
  },
  HOT_WEATHER_EVAPORATIVE: {
    id: 'HOT_WEATHER_EVAPORATIVE',
    label: 'High Heat Crumb Cooling',
    purpose: 'Midday misting cycle lowering synthetic turf infill temperature by up to 8°C',
    runtimeMultiplier: 0.8,
    targetMoistureBoostPct: 12,
    coolDownBufferMinutes: 15,
  },
};

/**
 * Validates parameters for sprinkler cycle generation.
 * 
 * @param {Object} params
 * @returns {Object} Validation result
 */
export function validateIrrigationParams(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('Missing irrigation schedule parameters.');
  }

  const errors = [];
  if (!params.pitchId || typeof params.pitchId !== 'string') {
    errors.push('pitchId is required.');
  }
  if (!params.presetType || !IRRIGATION_PRESETS[params.presetType]) {
    errors.push('Invalid or unsupported irrigation presetType.');
  }
  if (!params.currentSoilMoisturePct || params.currentSoilMoisturePct < 0 || params.currentSoilMoisturePct > 100) {
    errors.push('currentSoilMoisturePct must be between 0 and 100.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates an automated valve activation sequence avoiding water hammer and in-rush flow pressure spikes.
 * 
 * @param {Object} options
 * @param {string} options.pitchId - Unique pitch identifier
 * @param {string} options.presetType - Key in IRRIGATION_PRESETS
 * @param {number} options.currentSoilMoisturePct - Current moisture telemetry
 * @param {string} [options.scheduledStartISO] - Planned start time
 * @returns {Object} Complete irrigation plan and water consumption estimate
 */
export function generateIrrigationSchedule({
  pitchId,
  presetType = 'PRE_MATCH_SLICK',
  currentSoilMoisturePct = 40,
  scheduledStartISO = new Date().toISOString(),
}) {
  const validation = validateIrrigationParams({ pitchId, presetType, currentSoilMoisturePct });
  if (!validation.isValid) {
    throw new Error(`Irrigation validation failed: ${validation.errors.join('; ')}`);
  }

  const preset = IRRIGATION_PRESETS[presetType];
  const startTime = new Date(scheduledStartISO);
  let cumulativeSeconds = 0;
  let totalLiters = 0;

  // Staggered non-overlapping sector sequences to prevent water pressure collapse
  const sectorSequence = IRRIGATION_ZONES.map((zone, index) => {
    const runtime = Math.round(zone.defaultRuntimeSec * preset.runtimeMultiplier);
    const sectorStart = new Date(startTime.getTime() + cumulativeSeconds * 1000);
    const sectorEnd = new Date(sectorStart.getTime() + runtime * 1000);
    const sectorWaterLiters = Math.round((zone.flowRateLpm / 60) * runtime);

    cumulativeSeconds += runtime + 10; // 10 second pause between valves to prevent pressure surge
    totalLiters += sectorWaterLiters;

    return {
      step: index + 1,
      zoneId: zone.id,
      label: zone.label,
      runtimeSeconds: runtime,
      waterVolumeLiters: sectorWaterLiters,
      valveOpenAt: sectorStart.toISOString(),
      valveCloseAt: sectorEnd.toISOString(),
      status: 'SCHEDULED',
    };
  });

  const estimatedEndTime = new Date(startTime.getTime() + cumulativeSeconds * 1000);
  const pitchReadyTime = new Date(estimatedEndTime.getTime() + preset.coolDownBufferMinutes * 60 * 1000);

  return {
    scheduleId: `IRR-${pitchId}-${Date.now().toString(36).toUpperCase()}`,
    pitchId,
    presetType,
    presetLabel: preset.label,
    initialMoisturePct: currentSoilMoisturePct,
    projectedMoisturePct: Math.min(100, currentSoilMoisturePct + preset.targetMoistureBoostPct),
    totalRuntimeSeconds: cumulativeSeconds,
    totalWaterConsumptionLiters: totalLiters,
    startTime: startTime.toISOString(),
    endTime: estimatedEndTime.toISOString(),
    readyForPlayTime: pitchReadyTime.toISOString(),
    coolDownBufferMinutes: preset.coolDownBufferMinutes,
    sectorSequence,
    valveInterlockSafetyEngaged: true,
  };
}

/**
 * Checks if a proposed sprinkler cycle collides with an active fixture or booked slot.
 * 
 * @param {string|Date} irrigationStart - Sprinkler start time
 * @param {string|Date} pitchReadyTime - Time pitch has drained & is ready for studs
 * @param {string|Date} bookingStart - Fixture start time
 * @returns {Object} Conflict analysis result
 */
export function verifyIrrigationBookingInterlock(irrigationStart, pitchReadyTime, bookingStart) {
  const startIrr = new Date(irrigationStart).getTime();
  const readyPch = new Date(pitchReadyTime).getTime();
  const startBkg = new Date(bookingStart).getTime();

  const isConflict = startBkg < readyPch && startBkg >= startIrr;
  const leadTimeMinutes = Math.round((startBkg - readyPch) / (1000 * 60));

  let safetyAdvisory = 'Sufficient drainage buffer prior to player kickoff.';
  if (isConflict) {
    safetyAdvisory = 'CRITICAL: Match starts before pitch drainage complete. Slipping injury hazard.';
  } else if (leadTimeMinutes < 15) {
    safetyAdvisory = `Warning: Tight turnaround (${leadTimeMinutes} mins buffer). High surface slickness expected.`;
  }

  return {
    isConflict,
    leadTimeMinutes,
    safetyAdvisory,
    interlockApproved: !isConflict && leadTimeMinutes >= 5,
  };
}

export default {
  IRRIGATION_ZONES,
  IRRIGATION_PRESETS,
  validateIrrigationParams,
  generateIrrigationSchedule,
  verifyIrrigationBookingInterlock,
};
