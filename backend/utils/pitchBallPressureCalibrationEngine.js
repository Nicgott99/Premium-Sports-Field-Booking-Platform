/**
 * Pitchside Ball Pressure & Equipment Calibration Engine
 * 
 * Manages match ball bar/PSI pressure auditing, FIFA Quality Pro compliance,
 * digital referee inflation sign-offs, and multi-ball system tracking.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const BALL_STANDARDS = {
  FIFA_QUALITY_PRO: {
    id: 'FIFA_QUALITY_PRO',
    label: 'FIFA Quality Pro (Official Fixture)',
    minPsi: 8.5,
    maxPsi: 15.6,
    optimalPsi: 11.5,
    minBar: 0.6,
    maxBar: 1.1,
    optimalBar: 0.8,
    reboundHeightCmMin: 135,
    reboundHeightCmMax: 155,
  },
  TRAINING_RECREATIONAL: {
    id: 'TRAINING_RECREATIONAL',
    label: 'Recreational / Training Tier',
    minPsi: 8.0,
    maxPsi: 16.0,
    optimalPsi: 10.5,
    minBar: 0.55,
    maxBar: 1.1,
    optimalBar: 0.72,
    reboundHeightCmMin: 120,
    reboundHeightCmMax: 160,
  },
  WET_TURF_HEAVY: {
    id: 'WET_TURF_HEAVY',
    label: 'Heavy Rain / Waterlogged Turf Spec',
    minPsi: 8.5,
    maxPsi: 13.0,
    optimalPsi: 10.0,
    minBar: 0.6,
    maxBar: 0.9,
    optimalBar: 0.7,
    reboundHeightCmMin: 125,
    reboundHeightCmMax: 145,
  },
};

export const MULTI_BALL_STATIONS = [
  { id: 'CONE_NORTH_GOAL', label: 'North Goalmouth Ball Plinth', coneIndex: 1 },
  { id: 'CONE_SOUTH_GOAL', label: 'South Goalmouth Ball Plinth', coneIndex: 2 },
  { id: 'CONE_TOUCH_EAST_1', label: 'East Touchline Plinth A (Near Dugout)', coneIndex: 3 },
  { id: 'CONE_TOUCH_EAST_2', label: 'East Touchline Plinth B (Midfield)', coneIndex: 4 },
  { id: 'CONE_TOUCH_WEST_1', label: 'West Touchline Plinth A (Assistant Path)', coneIndex: 5 },
  { id: 'CONE_TOUCH_WEST_2', label: 'West Touchline Plinth B (Corner Arc)', coneIndex: 6 },
];

/**
 * Validates match ball pressure metrics.
 * 
 * @param {Object} ballData
 * @returns {Object} Validation outcome
 */
export function validateBallTelemetry(ballData) {
  if (!ballData || typeof ballData !== 'object') {
    throw new Error('Missing match ball telemetry payload.');
  }

  const errors = [];
  if (!ballData.ballId || typeof ballData.ballId !== 'string') {
    errors.push('ballId is required.');
  }
  if (typeof ballData.measuredPsi !== 'number' || ballData.measuredPsi < 2 || ballData.measuredPsi > 25) {
    errors.push('measuredPsi must be a number between 2 and 25.');
  }
  if (!ballData.standardKey || !BALL_STANDARDS[ballData.standardKey]) {
    errors.push('Invalid ball standardKey.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Inspects match ball pressure and compliance against tournament regulations.
 * 
 * @param {Object} options
 * @param {string} options.ballId - Unique RFID/serial of the ball
 * @param {number} options.measuredPsi - Pressure measured in PSI
 * @param {string} [options.standardKey='FIFA_QUALITY_PRO']
 * @param {number} [options.measuredCircumferenceCm=69.0] - Official circumference (68.5 - 69.5 cm)
 * @returns {Object} Ball certification audit
 */
export function auditBallPressureCompliance({
  ballId,
  measuredPsi,
  standardKey = 'FIFA_QUALITY_PRO',
  measuredCircumferenceCm = 69.0,
}) {
  const validation = validateBallTelemetry({ ballId, measuredPsi, standardKey });
  if (!validation.isValid) {
    throw new Error(`Ball audit failed: ${validation.errors.join('; ')}`);
  }

  const standard = BALL_STANDARDS[standardKey];
  const measuredBar = Math.round((measuredPsi * 0.0689476) * 100) / 100;
  const isPressureCompliant = measuredPsi >= standard.minPsi && measuredPsi <= standard.maxPsi;
  const isCircumferenceCompliant = measuredCircumferenceCm >= 68.5 && measuredCircumferenceCm <= 69.5;

  let calibrationAdvisory = 'Optimal match pressure. Approved for kickoff.';
  if (measuredPsi < standard.minPsi) {
    const deficitPsi = Math.round((standard.optimalPsi - measuredPsi) * 10) / 10;
    calibrationAdvisory = `Underinflated by ${deficitPsi} PSI. Top up with hand pump before match start.`;
  } else if (measuredPsi > standard.maxPsi) {
    const excessPsi = Math.round((measuredPsi - standard.optimalPsi) * 10) / 10;
    calibrationAdvisory = `Overinflated by ${excessPsi} PSI. Bleed valve release required to prevent explosive rupture.`;
  }

  return {
    auditTimestamp: new Date().toISOString(),
    ballId,
    standardKey,
    standardName: standard.label,
    measuredPsi,
    measuredBar,
    optimalPsi: standard.optimalPsi,
    optimalBar: standard.optimalBar,
    measuredCircumferenceCm,
    isPressureCompliant,
    isCircumferenceCompliant,
    isCertifiedForMatch: isPressureCompliant && isCircumferenceCompliant,
    calibrationAdvisory,
    certificateToken: `BALL-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}

/**
 * Generates an automated multi-ball rotation manifest for pitchside ball carriers.
 * 
 * @param {string} matchId
 * @param {number} totalBallsCount
 * @returns {Object} Multi-ball rotation manifest
 */
export function generateMultiBallManifest(matchId, totalBallsCount = 6) {
  if (!matchId || typeof totalBallsCount !== 'number' || totalBallsCount < 4) {
    throw new Error('Valid matchId and minimum 4 balls required for multi-ball system.');
  }

  const manifest = MULTI_BALL_STATIONS.slice(0, totalBallsCount).map((station, index) => ({
    ballIndex: index + 1,
    ballRef: `BALL-${matchId}-#${index + 1}`,
    plinthId: station.id,
    plinthLocation: station.label,
    targetPsi: 11.5,
    status: 'INSPECTED_ON_CONE',
  }));

  return {
    manifestId: `MBALL-${Date.now().toString(36).toUpperCase()}`,
    matchId,
    totalBallsAllocated: manifest.length,
    stations: manifest,
    multiBallProtocolActive: true,
  };
}

export default {
  BALL_STANDARDS,
  MULTI_BALL_STATIONS,
  validateBallTelemetry,
  auditBallPressureCompliance,
  generateMultiBallManifest,
};
