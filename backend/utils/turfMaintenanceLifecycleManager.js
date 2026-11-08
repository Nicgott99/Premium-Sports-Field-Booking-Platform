/**
 * Pitch Turf Aeration & Infill Maintenance Lifecycle Manager
 * 
 * Computes pitch structural wear index based on aggregate play hours,
 * schedules automated decompaction and crumb rubber infill replenishment,
 * and issues maintenance certifications under FIFA Quality Pro standards.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const TURF_SURFACE_SPECS = {
  SYNTHETIC_3G_MONOFILAMENT: {
    type: '3G Synthetic Monofilament',
    maxConsecutivePlayHoursBeforeBrushing: 35,
    deepDecompactionIntervalHours: 250,
    idealInfillDepthMm: 15.0,
    minAllowedInfillDepthMm: 10.0,
    recommendedGroomingCadenceDays: 7,
  },
  SYNTHETIC_4G_NON_INFILL: {
    type: '4G Synthetic Non-Infill Carpet',
    maxConsecutivePlayHoursBeforeBrushing: 50,
    deepDecompactionIntervalHours: 400,
    idealInfillDepthMm: 0,
    minAllowedInfillDepthMm: 0,
    recommendedGroomingCadenceDays: 14,
  },
  HYBRID_REINFORCED_GRASS: {
    type: 'Reinforced Hybrid Natural Grass',
    maxConsecutivePlayHoursBeforeBrushing: 20,
    deepDecompactionIntervalHours: 120,
    idealInfillDepthMm: 22.0,
    minAllowedInfillDepthMm: 16.0,
    recommendedGroomingCadenceDays: 4,
  },
};

/**
 * Validates turf usage and maintenance telemetry data.
 * 
 * @param {Object} data - Turf inspection metrics
 * @returns {Object} Validation outcome and errors
 */
export function validateTurfTelemetry(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Missing turf inspection payload.');
  }

  const errors = [];
  if (typeof data.accumulatedPlayHours !== 'number' || data.accumulatedPlayHours < 0) {
    errors.push('accumulatedPlayHours must be a non-negative number.');
  }
  if (typeof data.measuredInfillDepthMm !== 'number' || data.measuredInfillDepthMm < 0) {
    errors.push('measuredInfillDepthMm must be a non-negative number.');
  }
  if (!data.surfaceType || !TURF_SURFACE_SPECS[data.surfaceType]) {
    errors.push('Invalid or unsupported turf surface type.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates fiber wear percentage and decompaction urgency.
 * 
 * @param {Object} options
 * @param {string} options.pitchId - Unique pitch identifier
 * @param {string} options.surfaceType - Key in TURF_SURFACE_SPECS
 * @param {number} options.accumulatedPlayHours - Total hours played since last deep service
 * @param {number} options.measuredInfillDepthMm - Current measured rubber crumb infill depth
 * @returns {Object} Comprehensive maintenance diagnosis
 */
export function diagnoseTurfMaintenanceState({
  pitchId,
  surfaceType = 'SYNTHETIC_3G_MONOFILAMENT',
  accumulatedPlayHours = 0,
  measuredInfillDepthMm = 15.0,
}) {
  const validation = validateTurfTelemetry({ surfaceType, accumulatedPlayHours, measuredInfillDepthMm });
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
  }

  const spec = TURF_SURFACE_SPECS[surfaceType];
  const decompactionRatio = accumulatedPlayHours / spec.deepDecompactionIntervalHours;
  const fiberWearPct = Math.min(100, Math.round(decompactionRatio * 100));

  const infillDeficitMm = Math.max(0, Math.round((spec.idealInfillDepthMm - measuredInfillDepthMm) * 10) / 10);
  const isInfillCritical = spec.idealInfillDepthMm > 0 && measuredInfillDepthMm < spec.minAllowedInfillDepthMm;

  // Determine priority action
  let maintenancePriority = 'NORMAL_OPERATING';
  let recommendedService = 'ROUTINE_TRIANGULAR_BRUSHING';

  if (fiberWearPct >= 90 || isInfillCritical) {
    maintenancePriority = 'URGENT_MAINTENANCE_REQUIRED';
    recommendedService = isInfillCritical
      ? 'CRUMB_INFILL_TOP_UP_AND_ROTARY_DECOMPACTION'
      : 'DEEP_TINE_AERATION_AND_GROOMING';
  } else if (fiberWearPct >= 65 || infillDeficitMm >= 3.0) {
    maintenancePriority = 'SCHEDULED_SERVICE_DUE';
    recommendedService = 'POWER_BRUSH_AND_MAGNET_SWEEP';
  }

  // Calculate estimated infill material required in metric tonnes (standard 7000 sqm pitch)
  const pitchAreaSqm = 7000;
  const infillBulkDensityKgPerMmPerSqm = 0.8;
  const infillTonnageRequired = isInfillCritical || infillDeficitMm > 0
    ? Math.round((infillDeficitMm * infillBulkDensityKgPerMmPerSqm * pitchAreaSqm / 1000) * 10) / 10
    : 0;

  return {
    assessmentId: `TURF-${pitchId}-${Date.now().toString(36).toUpperCase()}`,
    pitchId,
    surfaceType,
    surfaceTypeName: spec.type,
    accumulatedPlayHours,
    fiberWearPct,
    measuredInfillDepthMm,
    idealInfillDepthMm: spec.idealInfillDepthMm,
    infillDeficitMm,
    infillTonnageRequired,
    maintenancePriority,
    recommendedService,
    isPitchPlaySafe: !isInfillCritical && fiberWearPct < 95,
  };
}

/**
 * Issues a completed service sign-off certificate resetting pitch wear metrics.
 * 
 * @param {string} pitchId
 * @param {string} serviceType
 * @param {string} technicianName
 * @returns {Object} Signed maintenance certification
 */
export function issueMaintenanceSignOff(pitchId, serviceType, technicianName) {
  if (!pitchId || !serviceType || !technicianName) {
    throw new Error('pitchId, serviceType, and technicianName are required for certification.');
  }

  return {
    certificateId: `CERT-TURF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    pitchId,
    serviceType,
    technicianName,
    signedAt: new Date().toISOString(),
    status: 'ACTIVE_CERTIFIED',
    nextScheduledAuditDays: 30,
    fifaQualityProCompliant: true,
  };
}

export default {
  TURF_SURFACE_SPECS,
  validateTurfTelemetry,
  diagnoseTurfMaintenanceState,
  issueMaintenanceSignOff,
};
