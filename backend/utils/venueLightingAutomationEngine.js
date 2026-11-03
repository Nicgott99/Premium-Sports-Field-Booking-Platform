/**
 * Venue Lighting & Floodlight Automation Engine
 * 
 * Provides automated scheduling, lumen intensity calculations, dusk/dawn astronomical offsets,
 * eco-saving idle dimming, and energy consumption estimation for sports pitch floodlights.
 * 
 * Zero external dependencies, pure ES Module.
 */

export const LIGHTING_PRESETS = {
  TRAINING: {
    id: 'TRAINING',
    label: 'Training & Practice',
    targetLux: 200,
    powerConsumptionKwPerHour: 18,
    minimumWarmupMinutes: 5,
  },
  AMATEUR_MATCH: {
    id: 'AMATEUR_MATCH',
    label: 'Amateur League Match',
    targetLux: 350,
    powerConsumptionKwPerHour: 32,
    minimumWarmupMinutes: 8,
  },
  BROADCAST_COMPETITION: {
    id: 'BROADCAST_COMPETITION',
    label: 'Broadcast / Semi-Pro Tier',
    targetLux: 500,
    powerConsumptionKwPerHour: 48,
    minimumWarmupMinutes: 12,
  },
  IDLE_SECURITY: {
    id: 'IDLE_SECURITY',
    label: 'Field Vacant / Low Glow',
    targetLux: 50,
    powerConsumptionKwPerHour: 4,
    minimumWarmupMinutes: 1,
  },
};

export const LIGHT_BANK_ZONES = [
  'NORTH_MAST_A',
  'NORTH_MAST_B',
  'SOUTH_MAST_A',
  'SOUTH_MAST_B',
  'PITCH_PERIMETER_PATHWAY',
];

/**
 * Calculates dusk trigger timestamp based on simple solar offset estimation.
 * 
 * @param {string} dateString - Format YYYY-MM-DD
 * @param {number} [sunsetHour=18] - Standard sunset hour (24-hour)
 * @param {number} [preDuskBufferMinutes=15] - Minutes before sunset to start warmup
 * @returns {Date} Scheduled activation start
 */
export function calculateDuskActivationTime(dateString, sunsetHour = 18, preDuskBufferMinutes = 15) {
  const duskDate = new Date(`${dateString}T00:00:00Z`);
  duskDate.setUTCHours(sunsetHour, 0, 0, 0);
  // Subtract buffer for ballast warm-up
  duskDate.setUTCMinutes(duskDate.getUTCMinutes() - preDuskBufferMinutes);
  return duskDate;
}

/**
 * Generates an automated lighting schedule for a match or training booking.
 *
 * @param {Object} options
 * @param {string} options.bookingId - Unique booking reference
 * @param {string} options.pitchId - Pitch identifier
 * @param {string} options.presetType - Key in LIGHTING_PRESETS
 * @param {string} options.startTimeISO - Session start ISO string
 * @param {string} options.endTimeISO - Session end ISO string
 * @param {number} [options.electricityRatePerKwh=0.28] - Price per kWh
 * @returns {Object} Lighting schedule and energy breakdown
 */
export function generatePitchLightingSchedule({
  bookingId,
  pitchId,
  presetType = 'AMATEUR_MATCH',
  startTimeISO,
  endTimeISO,
  electricityRatePerKwh = 0.28,
}) {
  if (!bookingId || !pitchId || !startTimeISO || !endTimeISO) {
    throw new Error('Missing required booking and timestamp parameters.');
  }

  const preset = LIGHTING_PRESETS[presetType] || LIGHTING_PRESETS.AMATEUR_MATCH;
  const start = new Date(startTimeISO);
  const end = new Date(endTimeISO);

  if (end <= start) {
    throw new Error('End time must be strictly after start time.');
  }

  const sessionMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const totalActiveMinutes = sessionMinutes + preset.minimumWarmupMinutes;
  const totalActiveHours = totalActiveMinutes / 60;

  const warmupStart = new Date(start.getTime() - preset.minimumWarmupMinutes * 60 * 1000);
  const estimatedKwh = Math.round(preset.powerConsumptionKwPerHour * totalActiveHours * 100) / 100;
  const estimatedCost = Math.round(estimatedKwh * electricityRatePerKwh * 100) / 100;

  // Generate automated activation steps per mast bank
  const activationSequence = LIGHT_BANK_ZONES.map((zone, index) => {
    const staggeredDelaySec = index * 8; // Prevent simultaneous in-rush current surge
    const activationTime = new Date(warmupStart.getTime() + staggeredDelaySec * 1000);
    return {
      zone,
      status: 'SCHEDULED',
      staggerDelaySeconds: staggeredDelaySec,
      targetLux: preset.targetLux,
      scheduledOnTime: activationTime.toISOString(),
      scheduledOffTime: end.toISOString(),
    };
  });

  return {
    scheduleId: `FLS-${pitchId}-${Date.now().toString(36).toUpperCase()}`,
    bookingId,
    pitchId,
    preset: preset.id,
    targetLux: preset.targetLux,
    warmupMinutes: preset.minimumWarmupMinutes,
    warmupStartTime: warmupStart.toISOString(),
    sessionStartTime: start.toISOString(),
    sessionEndTime: end.toISOString(),
    totalActiveMinutes,
    estimatedKwh,
    estimatedCostCurrency: 'GBP',
    estimatedCost,
    inrushSurgeProtectionActive: true,
    activationSequence,
  };
}

/**
 * Calculates eco-idle dimming savings when a pitch is unoccupied between consecutive bookings.
 *
 * @param {number} gapMinutes - Unoccupied transition interval in minutes
 * @param {string} currentPreset - Currently loaded lighting preset
 * @param {number} [electricityRatePerKwh=0.28] - Rate per kWh
 * @returns {Object} Dimming recommendation and saved kWh
 */
export function calculateIdleDimmingSavings(gapMinutes, currentPreset = 'AMATEUR_MATCH', electricityRatePerKwh = 0.28) {
  const activePreset = LIGHTING_PRESETS[currentPreset] || LIGHTING_PRESETS.AMATEUR_MATCH;
  const idlePreset = LIGHTING_PRESETS.IDLE_SECURITY;

  // Threshold: If gap is less than 10 mins, ballast cycling causes more wear than savings
  if (gapMinutes < 10) {
    return {
      recommendedAction: 'MAINTAIN_CURRENT_LEVEL',
      reason: 'Gap too short for ballast cycle wear threshold (<10 mins)',
      dimmingApplicable: false,
      kwhSaved: 0,
      costSaved: 0,
    };
  }

  const hours = gapMinutes / 60;
  const baselineKwh = activePreset.powerConsumptionKwPerHour * hours;
  const dimmedKwh = idlePreset.powerConsumptionKwPerHour * hours;
  const kwhSaved = Math.round((baselineKwh - dimmedKwh) * 100) / 100;
  const costSaved = Math.round(kwhSaved * electricityRatePerKwh * 100) / 100;

  return {
    recommendedAction: 'DIM_TO_IDLE_SECURITY',
    reason: `Saves ${kwhSaved} kWh during ${gapMinutes}-minute inter-match lull`,
    dimmingApplicable: true,
    targetLux: idlePreset.targetLux,
    kwhSaved,
    costSaved,
  };
}

/**
 * Verifies if light lux levels meet official league certification standards.
 *
 * @param {number} measuredLux - Actual pitch lux measurement
 * @param {string} competitionLevel - 'GRASSROOTS' | 'REGIONAL' | 'SEMI_PRO'
 * @returns {Object} Compliance check result
 */
export function verifyLuxCompliance(measuredLux, competitionLevel = 'GRASSROOTS') {
  const standards = {
    GRASSROOTS: 150,
    REGIONAL: 250,
    SEMI_PRO: 500,
  };

  const requiredLux = standards[competitionLevel] || standards.GRASSROOTS;
  const isCompliant = measuredLux >= requiredLux;
  const variance = measuredLux - requiredLux;

  return {
    competitionLevel,
    requiredLux,
    measuredLux,
    isCompliant,
    varianceLux: variance,
    statusNote: isCompliant
      ? 'Meets competition standard'
      : `Deficient by ${Math.abs(variance)} lux for ${competitionLevel} play`,
  };
}

export default {
  LIGHTING_PRESETS,
  LIGHT_BANK_ZONES,
  calculateDuskActivationTime,
  generatePitchLightingSchedule,
  calculateIdleDimmingSavings,
  verifyLuxCompliance,
};
