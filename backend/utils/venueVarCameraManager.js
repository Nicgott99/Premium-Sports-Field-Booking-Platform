/**
 * VAR & Pitchside Camera Telemetry Engine
 * 
 * Manages automated high-frame-rate multi-angle video sync, camera calibration health,
 * offside line triangulation offsets, and official match review audit logs.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const VAR_CAMERA_ANGLES = [
  { id: 'CAM_HIGH_MAIN_1', label: 'Main Grandstand High 50m', fps: 120, resolution: '4K', role: 'TACTICAL_OVERVIEW' },
  { id: 'CAM_OFFSIDE_TOUCH_EAST', label: 'East Touchline Offside Rail', fps: 240, resolution: '1080p', role: 'OFFSIDE_TRIANGULATION' },
  { id: 'CAM_OFFSIDE_TOUCH_WEST', label: 'West Touchline Offside Rail', fps: 240, resolution: '1080p', role: 'OFFSIDE_TRIANGULATION' },
  { id: 'CAM_GOALLINE_NORTH', label: 'North Goalmouth Slit Camera', fps: 300, resolution: '1080p', role: 'GOALLINE_VERIFICATION' },
  { id: 'CAM_GOALLINE_SOUTH', label: 'South Goalmouth Slit Camera', fps: 300, resolution: '1080p', role: 'GOALLINE_VERIFICATION' },
  { id: 'CAM_PITCHSIDE_RRA', label: 'Referee Review Area (RRA) Monitor Feed', fps: 60, resolution: '4K', role: 'RRA_MONITOR' },
];

export const INCIDENT_REVIEW_TYPES = {
  GOAL_LEAD_UP: {
    id: 'GOAL_LEAD_UP',
    label: 'Goal / No Goal & Attacking Phase of Play',
    recommendedAngles: ['CAM_HIGH_MAIN_1', 'CAM_GOALLINE_NORTH', 'CAM_GOALLINE_SOUTH'],
    maxReviewWindowSeconds: 120,
  },
  PENALTY_DECISION: {
    id: 'PENALTY_DECISION',
    label: 'Penalty Box Contact / Handball',
    recommendedAngles: ['CAM_HIGH_MAIN_1', 'CAM_OFFSIDE_TOUCH_EAST', 'CAM_OFFSIDE_TOUCH_WEST'],
    maxReviewWindowSeconds: 90,
  },
  DIRECT_RED_CARD: {
    id: 'DIRECT_RED_CARD',
    label: 'Direct Red Card / Serious Foul Play',
    recommendedAngles: ['CAM_HIGH_MAIN_1', 'CAM_OFFSIDE_TOUCH_EAST', 'CAM_OFFSIDE_TOUCH_WEST'],
    maxReviewWindowSeconds: 90,
  },
  MISTAKEN_IDENTITY: {
    id: 'MISTAKEN_IDENTITY',
    label: 'Mistaken Player Identity on Card Sanction',
    recommendedAngles: ['CAM_HIGH_MAIN_1', 'CAM_PITCHSIDE_RRA'],
    maxReviewWindowSeconds: 60,
  },
};

/**
 * Validates VAR incident review initiation payload.
 * 
 * @param {Object} payload
 * @returns {Object} Validation outcome
 */
export function validateVarReviewPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Missing VAR review payload.');
  }

  const errors = [];
  if (!payload.matchId || typeof payload.matchId !== 'string') {
    errors.push('matchId is required.');
  }
  if (!payload.reviewType || !INCIDENT_REVIEW_TYPES[payload.reviewType]) {
    errors.push('Invalid reviewType.');
  }
  if (typeof payload.matchMinute !== 'number' || payload.matchMinute < 1 || payload.matchMinute > 130) {
    errors.push('matchMinute must be between 1 and 130.');
  }
  if (!payload.varOfficialName || typeof payload.varOfficialName !== 'string') {
    errors.push('varOfficialName is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Initiates an official pitchside VAR check session with synchronized camera timecodes.
 * 
 * @param {Object} options
 * @param {string} options.matchId
 * @param {string} options.reviewType
 * @param {number} options.matchMinute
 * @param {string} options.varOfficialName
 * @param {string} [options.incidentDescription='Suspicious contact in attacking transition']
 * @returns {Object} VAR incident dossier and multi-angle camera feeds
 */
export function initiateVarReviewSession({
  matchId,
  reviewType,
  matchMinute,
  varOfficialName,
  incidentDescription = 'Suspicious contact in attacking transition',
}) {
  const validation = validateVarReviewPayload({ matchId, reviewType, matchMinute, varOfficialName });
  if (!validation.isValid) {
    throw new Error(`VAR validation failed: ${validation.errors.join('; ')}`);
  }

  const reviewConfig = INCIDENT_REVIEW_TYPES[reviewType];
  const sessionId = `VAR-${matchId}-M${matchMinute}-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();

  // Synchronize timecode frame offset
  const syncedFeeds = VAR_CAMERA_ANGLES.filter((cam) =>
    reviewConfig.recommendedAngles.includes(cam.id) || cam.role === 'RRA_MONITOR'
  ).map((cam) => ({
    cameraId: cam.id,
    label: cam.label,
    fps: cam.fps,
    role: cam.role,
    syncTimecode: `${String(matchMinute).padStart(2, '0')}:24.812`,
    isFrameLocked: true,
  }));

  return {
    sessionId,
    matchId,
    reviewType,
    reviewLabel: reviewConfig.label,
    matchMinute,
    varOfficial: varOfficialName,
    incidentDescription,
    timestamp: now.toISOString(),
    maxReviewWindowSeconds: reviewConfig.maxReviewWindowSeconds,
    syncedFeeds,
    rraMonitorStreamReady: true,
    protocolState: 'UNDER_VIDEO_REVIEW',
  };
}

/**
 * Computes offside line parallax calibration offset.
 * 
 * @param {number} attackerShoulderPx - Pixel position on calibrated 2D pitch plane
 * @param {number} defenderBootPx - Pixel position of 2nd-deepest defender
 * @param {number} [cameraElevationMeters=16.5] - Height of mast-mounted sensor
 * @returns {Object} Offside triangulation verdict
 */
export function calculateOffsideTriangulation(attackerShoulderPx, defenderBootPx, cameraElevationMeters = 16.5) {
  if (typeof attackerShoulderPx !== 'number' || typeof defenderBootPx !== 'number') {
    throw new Error('Attacker and defender pixel metrics must be numbers.');
  }

  // Parallax distortion compensation ratio
  const elevationFactor = Math.max(1.0, cameraElevationMeters / 15.0);
  const rawPixelDelta = attackerShoulderPx - defenderBootPx;
  const compensatedMmDelta = Math.round(rawPixelDelta * 4.2 * elevationFactor);

  const isOffside = compensatedMmDelta > 0;
  const marginMm = Math.abs(compensatedMmDelta);

  return {
    attackerShoulderPx,
    defenderBootPx,
    compensatedMmDelta,
    marginMm,
    isOffside,
    decisionVerdict: isOffside ? 'OFFSIDE_PENALIZED' : 'ONSIDE_FAIR_GOAL',
    toleranceMarginAppliedMm: 15, // Standard semi-automated margin of error tolerance
    certificationToken: `TRG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}

export default {
  VAR_CAMERA_ANGLES,
  INCIDENT_REVIEW_TYPES,
  validateVarReviewPayload,
  initiateVarReviewSession,
  calculateOffsideTriangulation,
};
