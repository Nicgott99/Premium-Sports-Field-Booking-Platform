/**
 * pitchLineMarkingRobotScheduler.js
 *
 * Automated pitch line marking robot dispatch and certification engine.
 * Handles FIFA/UEFA line tolerance specs, paint volume calculations,
 * robot fleet management, and pre-match compliance sign-offs.
 *
 * @module pitchLineMarkingRobotScheduler
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FIFA_LINE_SPECS = {
  WIDTH_MIN_MM: 50,
  WIDTH_MAX_MM: 120,
  WIDTH_RECOMMENDED_MM: 80,
  BOUNDARY_TOLERANCE_MM: 10,
  CENTRE_CIRCLE_RADIUS_M: 9.15,
  PENALTY_AREA_WIDTH_M: 40.32,
  PENALTY_AREA_DEPTH_M: 16.5,
  GOAL_AREA_WIDTH_M: 18.32,
  GOAL_AREA_DEPTH_M: 5.5,
  PENALTY_SPOT_DIST_M: 11.0,
};

export const ROBOT_MODELS = {
  TURF_PRO_X1: {
    id: 'turf_pro_x1',
    name: 'TurfPro X1',
    paintTankLitres: 20,
    speedMPerMin: 25,
    gpsAccuracyMm: 3,
    batteryMinutes: 180,
    supportsNightOp: true,
  },
  LINEMASTER_3000: {
    id: 'linemaster_3000',
    name: 'LineMaster 3000',
    paintTankLitres: 15,
    speedMPerMin: 18,
    gpsAccuracyMm: 5,
    batteryMinutes: 120,
    supportsNightOp: false,
  },
  GRASSBOT_ELITE: {
    id: 'grassbot_elite',
    name: 'GrassBot Elite',
    paintTankLitres: 25,
    speedMPerMin: 30,
    gpsAccuracyMm: 2,
    batteryMinutes: 240,
    supportsNightOp: true,
  },
};

export const JOB_TYPES = {
  FULL_PITCH: 'FULL_PITCH',
  TOUCH_UP: 'TOUCH_UP',
  PENALTY_BOX_ONLY: 'PENALTY_BOX_ONLY',
  CENTRE_CIRCLE_ONLY: 'CENTRE_CIRCLE_ONLY',
  CUSTOM_ZONE: 'CUSTOM_ZONE',
};

export const JOB_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CERTIFIED: 'CERTIFIED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

export const PAINT_TYPES = {
  WATER_BASED_WHITE: { id: 'water_based_white', coverageM2PerLitre: 12, dryTimeMin: 20 },
  AEROSOL_MARKING: { id: 'aerosol_marking', coverageM2PerLitre: 10, dryTimeMin: 10 },
  UV_REACTIVE: { id: 'uv_reactive', coverageM2PerLitre: 8, dryTimeMin: 30 },
};

// Approximate total line length for a standard FIFA full pitch (m)
const FULL_PITCH_LINE_LENGTH_M = 462;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validates a robot model ID.
 * @param {string} modelId
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRobotModel(modelId) {
  const knownIds = Object.values(ROBOT_MODELS).map((r) => r.id);
  if (!modelId || typeof modelId !== 'string') {
    return { valid: false, error: 'robotModelId must be a non-empty string.' };
  }
  if (!knownIds.includes(modelId)) {
    return { valid: false, error: `Unknown robot model "${modelId}". Known: ${knownIds.join(', ')}.` };
  }
  return { valid: true };
}

/**
 * Validates a job scheduling request.
 * @param {Object} req
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateJobRequest(req) {
  const errors = [];

  if (!req || typeof req !== 'object') {
    return { valid: false, errors: ['Job request must be a non-null object.'] };
  }

  if (!req.pitchId || typeof req.pitchId !== 'string') {
    errors.push('pitchId must be a non-empty string.');
  }

  if (!req.robotModelId) {
    errors.push('robotModelId is required.');
  } else {
    const { valid, error } = validateRobotModel(req.robotModelId);
    if (!valid) {
      errors.push(error);
    }
  }

  if (!Object.values(JOB_TYPES).includes(req.jobType)) {
    errors.push(`jobType must be one of: ${Object.values(JOB_TYPES).join(', ')}.`);
  }

  if (!req.paintTypeId || !Object.values(PAINT_TYPES).map((p) => p.id).includes(req.paintTypeId)) {
    errors.push(`paintTypeId must be one of: ${Object.values(PAINT_TYPES).map((p) => p.id).join(', ')}.`);
  }

  if (!req.scheduledAt || isNaN(new Date(req.scheduledAt).getTime())) {
    errors.push('scheduledAt must be a valid ISO 8601 datetime string.');
  }

  if (req.lineWidthMm !== undefined) {
    const w = Number(req.lineWidthMm);
    if (isNaN(w) || w < FIFA_LINE_SPECS.WIDTH_MIN_MM || w > FIFA_LINE_SPECS.WIDTH_MAX_MM) {
      errors.push(
        `lineWidthMm must be between ${FIFA_LINE_SPECS.WIDTH_MIN_MM} and ${FIFA_LINE_SPECS.WIDTH_MAX_MM} mm.`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Core calculations
// ---------------------------------------------------------------------------

/**
 * Estimates the total line length in metres for a given job type.
 * @param {string} jobType - One of JOB_TYPES values
 * @returns {number} Estimated line length in metres
 */
export function estimateLineLengthM(jobType) {
  const lineWidthM = FIFA_LINE_SPECS.WIDTH_RECOMMENDED_MM / 1000;
  const proportions = {
    [JOB_TYPES.FULL_PITCH]: 1.0,
    [JOB_TYPES.TOUCH_UP]: 0.15,
    [JOB_TYPES.PENALTY_BOX_ONLY]: 0.25,
    [JOB_TYPES.CENTRE_CIRCLE_ONLY]: 0.12,
    [JOB_TYPES.CUSTOM_ZONE]: 0.3,
  };
  const factor = proportions[jobType] ?? 1.0;
  void lineWidthM; // width used for paint calc, not length
  return Math.round(FULL_PITCH_LINE_LENGTH_M * factor * 10) / 10;
}

/**
 * Calculates the paint volume required for a job.
 * @param {string} jobType
 * @param {string} paintTypeId
 * @param {number} lineWidthMm
 * @returns {{ lineLengthM: number, areaM2: number, paintLitres: number }}
 */
export function calculatePaintVolume(jobType, paintTypeId, lineWidthMm = FIFA_LINE_SPECS.WIDTH_RECOMMENDED_MM) {
  const paint = Object.values(PAINT_TYPES).find((p) => p.id === paintTypeId);
  if (!paint) {
    throw new Error(`Unknown paintTypeId: ${paintTypeId}`);
  }

  const lineLengthM = estimateLineLengthM(jobType);
  const lineWidthM = lineWidthMm / 1000;
  const areaM2 = Math.round(lineLengthM * lineWidthM * 100) / 100;
  const paintLitres = Math.ceil((areaM2 / paint.coverageM2PerLitre) * 10) / 10;

  return { lineLengthM, areaM2, paintLitres };
}

/**
 * Estimates job duration in minutes for a given robot and job type.
 * @param {string} robotModelId
 * @param {string} jobType
 * @returns {{ durationMinutes: number, batteryAdequate: boolean }}
 */
export function estimateJobDuration(robotModelId, jobType) {
  const robot = Object.values(ROBOT_MODELS).find((r) => r.id === robotModelId);
  if (!robot) {
    throw new Error(`Unknown robotModelId: ${robotModelId}`);
  }

  const lineLengthM = estimateLineLengthM(jobType);
  const durationMinutes = Math.ceil(lineLengthM / robot.speedMPerMin);
  const batteryAdequate = durationMinutes <= robot.batteryMinutes;

  return { durationMinutes, batteryAdequate };
}

// ---------------------------------------------------------------------------
// Job lifecycle management
// ---------------------------------------------------------------------------

/**
 * Creates a new line marking job record.
 * @param {Object} req - Validated job request
 * @returns {Object} Job record
 */
export function createJob(req) {
  const validation = validateJobRequest(req);
  if (!validation.valid) {
    throw new Error(`Invalid job request: ${validation.errors.join('; ')}`);
  }

  const robot = Object.values(ROBOT_MODELS).find((r) => r.id === req.robotModelId);
  const lineWidthMm = req.lineWidthMm ?? FIFA_LINE_SPECS.WIDTH_RECOMMENDED_MM;
  const paintVolume = calculatePaintVolume(req.jobType, req.paintTypeId, lineWidthMm);
  const duration = estimateJobDuration(req.robotModelId, req.jobType);

  const paintType = Object.values(PAINT_TYPES).find((p) => p.id === req.paintTypeId);
  const scheduledAt = new Date(req.scheduledAt);
  const estimatedEndAt = new Date(scheduledAt.getTime() + duration.durationMinutes * 60 * 1000);
  const dryReadyAt = new Date(estimatedEndAt.getTime() + paintType.dryTimeMin * 60 * 1000);

  return {
    jobId: `JOB-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    pitchId: req.pitchId,
    robot: { id: robot.id, name: robot.name },
    jobType: req.jobType,
    paintTypeId: req.paintTypeId,
    lineWidthMm,
    status: JOB_STATUS.SCHEDULED,
    paintVolume,
    duration,
    scheduledAt: scheduledAt.toISOString(),
    estimatedEndAt: estimatedEndAt.toISOString(),
    dryReadyAt: dryReadyAt.toISOString(),
    fifaCompliant: lineWidthMm >= FIFA_LINE_SPECS.WIDTH_MIN_MM && lineWidthMm <= FIFA_LINE_SPECS.WIDTH_MAX_MM,
    certifiedBy: null,
    certifiedAt: null,
    notes: req.notes || '',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Marks a job as certified by a ground staff member.
 * @param {Object} job - Existing job record
 * @param {string} certifierName - Name of the certifying official
 * @returns {Object} Updated job record
 */
export function certifyJob(job, certifierName) {
  if (!job || job.status !== JOB_STATUS.COMPLETED) {
    throw new Error('Only COMPLETED jobs can be certified.');
  }
  if (!certifierName || typeof certifierName !== 'string') {
    throw new Error('certifierName must be a non-empty string.');
  }

  return {
    ...job,
    status: JOB_STATUS.CERTIFIED,
    certifiedBy: certifierName,
    certifiedAt: new Date().toISOString(),
  };
}

/**
 * Builds a fleet utilisation report across multiple jobs.
 * @param {Object[]} jobs - Array of job records
 * @returns {Object} Fleet utilisation summary
 */
export function buildFleetReport(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error('jobs must be an array.');
  }

  const byRobot = {};

  for (const job of jobs) {
    const key = job.robot?.id ?? 'unknown';
    if (!byRobot[key]) {
      byRobot[key] = {
        robotId: key,
        robotName: job.robot?.name ?? 'Unknown',
        totalJobs: 0,
        certifiedJobs: 0,
        failedJobs: 0,
        totalLineM: 0,
        totalPaintLitres: 0,
      };
    }
    byRobot[key].totalJobs += 1;
    if (job.status === JOB_STATUS.CERTIFIED) {
      byRobot[key].certifiedJobs += 1;
    }
    if (job.status === JOB_STATUS.FAILED) {
      byRobot[key].failedJobs += 1;
    }
    byRobot[key].totalLineM += job.paintVolume?.lineLengthM ?? 0;
    byRobot[key].totalPaintLitres += job.paintVolume?.paintLitres ?? 0;
  }

  return {
    generatedAt: new Date().toISOString(),
    totalJobs: jobs.length,
    byRobot: Object.values(byRobot),
  };
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  FIFA_LINE_SPECS,
  ROBOT_MODELS,
  JOB_TYPES,
  JOB_STATUS,
  PAINT_TYPES,
  validateRobotModel,
  validateJobRequest,
  estimateLineLengthM,
  calculatePaintVolume,
  estimateJobDuration,
  createJob,
  certifyJob,
  buildFleetReport,
};
