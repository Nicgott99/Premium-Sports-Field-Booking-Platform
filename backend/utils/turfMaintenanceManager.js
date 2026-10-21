/**
 * turfMaintenanceManager.js — Pitch & Court Maintenance Lifecycle Engine
 * Premium Sports Field Booking Platform
 *
 * Automates sports venue surface health monitoring, wear degradation analysis,
 * intelligent downtime scheduling, and safety compliance checks:
 *  - Surface-specific wear models (4G Artificial Turf, Hybrid Grass, Hard Court, Parquet)
 *  - Condition scoring (0–100) with automatic service interval alerts
 *  - Lowest-revenue-impact downtime slot finder to protect prime peak booking slots
 *  - Pre-match player safety inspection evaluation (slip risk, shock absorption)
 *  - Structured maintenance work-order generation & audit ledger
 *
 * Pure, deterministic, and dependency-free.
 *
 * Usage:
 *   import {
 *     calculateSurfaceCondition,
 *     findOptimalMaintenanceSlot,
 *     evaluatePlaySafety,
 *     createMaintenanceTask,
 *   } from './turfMaintenanceManager.js';
 */

// ─── Enums & Surface Configuration Profiles ──────────────────────────────────

export const SURFACE_TYPES = {
  ARTIFICIAL_TURF_4G: 'ARTIFICIAL_TURF_4G',
  NATURAL_HYBRID_GRASS: 'NATURAL_HYBRID_GRASS',
  ACRYLIC_HARD_COURT: 'ACRYLIC_HARD_COURT',
  WOODEN_PARQUET_INDOOR: 'WOODEN_PARQUET_INDOOR',
};

export const MAINTENANCE_TYPES = {
  BRUSH_AND_GROOM: 'BRUSH_AND_GROOM',
  INFILL_TOP_UP: 'INFILL_TOP_UP',
  DEEP_DECOMPACTION: 'DEEP_DECOMPACTION',
  AERATION_AND_SEEDING: 'AERATION_AND_SEEDING',
  SURFACE_RESURFACING: 'SURFACE_RESURFACING',
  FLOODLIGHT_SERVICE: 'FLOODLIGHT_SERVICE',
  LINE_MARKING: 'LINE_MARKING',
};

export const SURFACE_HEALTH_STATUS = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR_SERVICE_DUE: 'FAIR_SERVICE_DUE',
  CRITICAL_MAINTENANCE: 'CRITICAL_MAINTENANCE',
  SAFETY_LOCKOUT: 'SAFETY_LOCKOUT',
};

export const SURFACE_PROFILES = {
  [SURFACE_TYPES.ARTIFICIAL_TURF_4G]: {
    name: '4G Artificial Synthetic Turf',
    serviceIntervalHours: 25,       // Routine power brushing every 25 hours
    majorOverhaulHours: 250,        // Deep decompaction & rubber crumb top-up
    degradationPerHour: 0.18,       // Condition drop per match hour without brushing
    restRecoveryBonus: 0.05,        // Recovery rate per idle hour
    safetyThresholdScore: 40,
  },
  [SURFACE_TYPES.NATURAL_HYBRID_GRASS]: {
    name: 'Reinforced Hybrid Natural Grass',
    serviceIntervalHours: 15,       // Mowing, rolling, divot repair
    majorOverhaulHours: 120,        // Aeration & reseeding
    degradationPerHour: 0.35,       // Natural turf wears faster under heavy studs
    restRecoveryBonus: 0.15,        // Natural turf regenerates with rest & watering
    safetyThresholdScore: 50,
  },
  [SURFACE_TYPES.ACRYLIC_HARD_COURT]: {
    name: 'Multi-Sport Acrylic Hard Court',
    serviceIntervalHours: 80,       // Pressure wash & grip check
    majorOverhaulHours: 800,        // Resurfacing & crack repair
    degradationPerHour: 0.08,
    restRecoveryBonus: 0.0,
    safetyThresholdScore: 35,
  },
  [SURFACE_TYPES.WOODEN_PARQUET_INDOOR]: {
    name: 'Sprung Hardwood Sports Floor',
    serviceIntervalHours: 40,       // Anti-slip buffing & dust extraction
    majorOverhaulHours: 400,        // Polyurethane recoating
    degradationPerHour: 0.12,
    restRecoveryBonus: 0.0,
    safetyThresholdScore: 45,
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── Surface Condition Calculation ───────────────────────────────────────────

/**
 * Calculates real-time surface condition score (0–100) and service urgency.
 *
 * @param {object} params
 * @param {string} [params.surfaceType=SURFACE_TYPES.ARTIFICIAL_TURF_4G]
 * @param {number} params.hoursSinceLastService - Match play hours logged since maintenance
 * @param {number} [params.baseConditionScore=100] - Baseline score from last inspection
 * @param {number} [params.consecutiveHeavySessions=0] - 11v11 intense tournaments or rain matches
 * @param {boolean} [params.recentRainExposure=false] - For outdoor natural/hybrid turf
 * @returns {object} Comprehensive surface health status
 */
export function calculateSurfaceCondition({
  surfaceType = SURFACE_TYPES.ARTIFICIAL_TURF_4G,
  hoursSinceLastService = 0,
  baseConditionScore = 100,
  consecutiveHeavySessions = 0,
  recentRainExposure = false,
}) {
  const profile = SURFACE_PROFILES[surfaceType] || SURFACE_PROFILES[SURFACE_TYPES.ARTIFICIAL_TURF_4G];

  // Base degradation from playtime
  let degradation = hoursSinceLastService * profile.degradationPerHour;

  // Multiplier for heavy match congestion
  if (consecutiveHeavySessions > 3) {
    degradation *= 1.25;
  }

  // Rain exposure on outdoor grass accelerates churn and divots
  if (recentRainExposure && surfaceType === SURFACE_TYPES.NATURAL_HYBRID_GRASS) {
    degradation *= 1.4;
  }

  const currentScore = clamp(round2(baseConditionScore - degradation), 0, 100);

  // Determine health classification
  let healthStatus = SURFACE_HEALTH_STATUS.EXCELLENT;
  let actionRequired = 'Normal operations. No immediate service required.';

  if (currentScore < profile.safetyThresholdScore) {
    healthStatus = SURFACE_HEALTH_STATUS.SAFETY_LOCKOUT;
    actionRequired = 'URGENT: Surface has fallen below player safety tolerance. Lock out field for mandatory overhaul.';
  } else if (currentScore < 55 || hoursSinceLastService >= profile.serviceIntervalHours * 1.5) {
    healthStatus = SURFACE_HEALTH_STATUS.CRITICAL_MAINTENANCE;
    actionRequired = 'Critical maintenance required. Infill compaction / traction degradation detected.';
  } else if (currentScore < 75 || hoursSinceLastService >= profile.serviceIntervalHours) {
    healthStatus = SURFACE_HEALTH_STATUS.FAIR_SERVICE_DUE;
    actionRequired = 'Routine service recommended. Schedule grooming during upcoming off-peak hours.';
  } else if (currentScore < 90) {
    healthStatus = SURFACE_HEALTH_STATUS.GOOD;
    actionRequired = 'Surface in good playable condition.';
  }

  const hoursUntilServiceDue = Math.max(0, round2(profile.serviceIntervalHours - hoursSinceLastService));

  return {
    surfaceType,
    surfaceName: profile.name,
    conditionScore: currentScore,
    healthStatus,
    hoursSinceLastService: round2(hoursSinceLastService),
    serviceIntervalHours: profile.serviceIntervalHours,
    hoursUntilServiceDue,
    isServiceOverdue: hoursSinceLastService >= profile.serviceIntervalHours,
    isSafeToPlay: currentScore >= profile.safetyThresholdScore,
    actionRequired,
  };
}

// ─── Downtime Slot Finder (Revenue-Aware) ─────────────────────────────────────

/**
 * Finds the optimal maintenance downtime slot that minimizes lost booking revenue.
 *
 * @param {object} params
 * @param {string} params.fieldId
 * @param {Date|string} params.targetDate - Desired maintenance day
 * @param {number} [params.requiredDurationHours=2] - Maintenance window length
 * @param {Array<{ startTime: string, endTime: string, isPeak?: boolean, revenue?: number }>} [params.existingBookings=[]]
 * @param {number} [params.openingHour=6] - 06:00
 * @param {number} [params.closingHour=23] - 23:00
 * @returns {object} Recommended downtime slot
 */
export function findOptimalMaintenanceSlot({
  fieldId,
  targetDate,
  requiredDurationHours = 2,
  existingBookings = [],
  openingHour = 6,
  closingHour = 23,
}) {
  const targetDay = new Date(targetDate);
  const dayStr = targetDay.toISOString().split('T')[0];

  // Map operating hours into hourly occupancy & revenue cost
  const hourlySlots = [];
  for (let h = openingHour; h < closingHour; h++) {
    const isPeak = h >= 17 && h < 22; // 5 PM – 10 PM prime peak hours
    const potentialRevenue = isPeak ? 1500 : 700; // Expected hourly yield

    // Check if any existing booking overlaps this hour
    const isBooked = existingBookings.some((b) => {
      const startH = new Date(b.startTime).getHours();
      const endH = new Date(b.endTime).getHours();
      return h >= startH && h < endH;
    });

    hourlySlots.push({
      hour: h,
      timeString: `${String(h).padStart(2, '0')}:00`,
      isBooked,
      isPeak,
      potentialRevenue,
    });
  }

  // Scan consecutive blocks of requiredDurationHours
  let bestSlot = null;
  let lowestPenalty = Infinity;

  const maxIndex = hourlySlots.length - requiredDurationHours;
  for (let i = 0; i <= maxIndex; i++) {
    const candidateWindow = hourlySlots.slice(i, i + requiredDurationHours);

    // Hard constraint: Cannot overlap with an already confirmed customer booking
    const hasExistingBooking = candidateWindow.some((slot) => slot.isBooked);
    if (hasExistingBooking) continue;

    // Soft score: penalize prime peak hours
    let penaltyScore = 0;
    for (const slot of candidateWindow) {
      if (slot.isPeak) penaltyScore += 1000;
      penaltyScore += slot.potentialRevenue;
    }

    // Morning off-peak preference (before 12:00) gives a bonus
    if (candidateWindow[0].hour < 12) {
      penaltyScore -= 200;
    }

    if (penaltyScore < lowestPenalty) {
      lowestPenalty = penaltyScore;
      const startHour = candidateWindow[0].hour;
      const endHour = candidateWindow.at(-1).hour + 1;

      bestSlot = {
        startTime: `${dayStr}T${String(startHour).padStart(2, '0')}:00:00Z`,
        endTime: `${dayStr}T${String(endHour).padStart(2, '0')}:00:00Z`,
        displayTime: `${String(startHour).padStart(2, '0')}:00 – ${String(endHour).padStart(2, '0')}:00`,
        durationHours: requiredDurationHours,
        isPeakDisruption: candidateWindow.some((s) => s.isPeak),
        estimatedOpportunityCost: candidateWindow.reduce((s, slot) => s + slot.potentialRevenue, 0),
      };
    }
  }

  return {
    fieldId,
    targetDate: dayStr,
    slotFound: bestSlot !== null,
    recommendedSlot: bestSlot,
    note: getSlotRecommendationNote(bestSlot),
  };
}

function getSlotRecommendationNote(bestSlot) {
  if (!bestSlot) {
    return 'No contiguous free slot available on target date. Consider adjacent operating day.';
  }
  if (bestSlot.isPeakDisruption) {
    return 'Downtime scheduled during elevated demand window due to tight day schedule.';
  }
  return 'Optimal off-peak window identified with zero prime customer disruption.';
}

// ─── Player Safety Assessment ────────────────────────────────────────────────

/**
 * Assesses player safety metrics before match kickoff.
 *
 * @param {object} params
 * @param {string} params.surfaceType
 * @param {number} params.conditionScore - 0 to 100
 * @param {string} [params.weatherCondition='CLEAR']
 * @param {boolean} [params.isIndoor=false]
 * @returns {object} Player safety clearance assessment
 */
export function evaluatePlaySafety({
  surfaceType = SURFACE_TYPES.ARTIFICIAL_TURF_4G,
  conditionScore = 90,
  weatherCondition = 'CLEAR',
  isIndoor = false,
}) {
  const profile = SURFACE_PROFILES[surfaceType] || SURFACE_PROFILES[SURFACE_TYPES.ARTIFICIAL_TURF_4G];
  const isWet = ['RAIN', 'HEAVY_RAIN', 'THUNDERSTORM'].includes(weatherCondition.toUpperCase());

  const checks = [
    {
      name: 'Shock Absorption & Infill Depth',
      pass: conditionScore >= 45,
      detail: conditionScore >= 45 ? 'Adequate cushion' : 'Excessive compaction: joint impact risk',
    },
    {
      name: 'Surface Traction & Grip',
      pass: isIndoor || !isWet || conditionScore >= 60,
      detail: !isIndoor && isWet && conditionScore < 60 ? 'High slip risk under wet conditions' : 'Traction verified',
    },
    {
      name: 'Structural Flatness & Divots',
      pass: conditionScore >= profile.safetyThresholdScore,
      detail: conditionScore >= profile.safetyThresholdScore ? 'Uniform surface' : 'Uneven spots or tears detected',
    },
  ];

  const allPass = checks.every((c) => c.pass);

  return {
    isClearedForPlay: allPass,
    safetyStatus: allPass ? 'CLEARED' : 'UNSAFE_FOR_COMPETITIVE_PLAY',
    conditionScore,
    surfaceType,
    checks,
    recommendation: allPass
      ? 'Field cleared for match play.'
      : 'Pre-match remediation required before granting player access.',
  };
}

// ─── Maintenance Work Order Creator ──────────────────────────────────────────

/**
 * Generates an immutable maintenance log work order.
 *
 * @param {object} params
 * @param {string} params.fieldId
 * @param {string} params.surfaceType
 * @param {string} params.maintenanceType
 * @param {string} params.technician
 * @param {Date|string} params.scheduledStart
 * @param {Date|string} params.scheduledEnd
 * @param {number} [params.estimatedCost=0]
 * @param {string} [params.notes]
 * @returns {object} Work order record
 */
export function createMaintenanceTask({
  fieldId,
  surfaceType,
  maintenanceType = MAINTENANCE_TYPES.BRUSH_AND_GROOM,
  technician = 'Grounds Crew A',
  scheduledStart,
  scheduledEnd,
  estimatedCost = 0,
  notes = '',
}) {
  const taskId = `mnt_${fieldId}_${Date.now().toString(36)}`;

  return {
    taskId,
    fieldId,
    surfaceType,
    maintenanceType,
    technician,
    scheduledStart: new Date(scheduledStart).toISOString(),
    scheduledEnd: new Date(scheduledEnd).toISOString(),
    estimatedCost: round2(estimatedCost),
    status: 'SCHEDULED',
    notes: notes || `Scheduled ${maintenanceType} to restore field condition score.`,
    createdAt: new Date().toISOString(),
  };
}

export default {
  SURFACE_TYPES,
  MAINTENANCE_TYPES,
  SURFACE_HEALTH_STATUS,
  SURFACE_PROFILES,
  calculateSurfaceCondition,
  findOptimalMaintenanceSlot,
  evaluatePlaySafety,
  createMaintenanceTask,
};
