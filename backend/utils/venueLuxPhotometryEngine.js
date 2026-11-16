/**
 * Stadium Floodlight Lux Mapping & Drone Survey Engine
 * 
 * Manages automated 88-point pitch illumination grid evaluations,
 * UEFA Stadium Infrastructure Regulations Category 4 broadcast lux uniformity ratios (U1/U2),
 * and drone photometric survey path scheduling.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const BROADCAST_LUX_STANDARDS = {
  UEFA_ELITE_CATEGORY_4: {
    id: 'UEFA_ELITE_CATEGORY_4',
    label: 'UEFA Elite Category 4 (Champions League Final / HD Broadcast)',
    minMainCameraLux: 1500,
    minSecondaryCameraLux: 1000,
    minUniformityU1: 0.6, // U1 = E_min / E_max
    minUniformityU2: 0.7, // U2 = E_min / E_ave
    glareRatingLimitGR: 50,
  },
  FIFA_TOURNAMENT_TIER_A: {
    id: 'FIFA_TOURNAMENT_TIER_A',
    label: 'FIFA Tournament Tier A (International Broadcast)',
    minMainCameraLux: 2000,
    minSecondaryCameraLux: 1400,
    minUniformityU1: 0.65,
    minUniformityU2: 0.75,
    glareRatingLimitGR: 48,
  },
  DOMESTIC_COMPETITIVE_TIER_B: {
    id: 'DOMESTIC_COMPETITIVE_TIER_B',
    label: 'National League / Regional Semi-Pro',
    minMainCameraLux: 800,
    minSecondaryCameraLux: 500,
    minUniformityU1: 0.45,
    minUniformityU2: 0.55,
    glareRatingLimitGR: 55,
  },
};

export const GRID_SAMPLE_ZONES = [
  { zoneId: 'NORTH_GOALMOUTH', label: 'North Goal & 6-Yard Box', defaultLux: 1650 },
  { zoneId: 'NORTH_PENALTY_ARC', label: 'North 18-Yard Box & Spot', defaultLux: 1720 },
  { zoneId: 'CENTRE_CIRCLE', label: 'Pitch Center & Transverse Line', defaultLux: 1850 },
  { zoneId: 'SOUTH_PENALTY_ARC', label: 'South 18-Yard Box & Spot', defaultLux: 1710 },
  { zoneId: 'SOUTH_GOALMOUTH', label: 'South Goal & 6-Yard Box', defaultLux: 1640 },
  { zoneId: 'EAST_TOUCHLINE_FLANK', label: 'East Broadcast Wing & Dugout', defaultLux: 1520 },
  { zoneId: 'WEST_TOUCHLINE_FLANK', label: 'West Touchline & Assistant Path', defaultLux: 1530 },
];

/**
 * Validates raw drone photometer lux sampling points.
 * 
 * @param {Array<number>} luxReadings
 * @returns {Object} Validation outcome
 */
export function validateLuxReadings(luxReadings) {
  if (!Array.isArray(luxReadings) || luxReadings.length === 0) {
    throw new Error('luxReadings must be a non-empty array of numbers.');
  }

  const errors = [];
  luxReadings.forEach((reading, index) => {
    if (typeof reading !== 'number' || reading < 0 || reading > 5000) {
      errors.push(`Invalid lux reading at index ${index}: must be between 0 and 5000.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Computes UEFA/FIFA broadcast lux uniformity ratios (U1 = Emin/Emax, U2 = Emin/Eave).
 * 
 * @param {Object} options
 * @param {string} options.pitchId - Unique pitch identifier
 * @param {Array<number>} options.luxReadings - Photometric grid samples (8-88 points)
 * @param {string} [options.standardKey='UEFA_ELITE_CATEGORY_4']
 * @returns {Object} Comprehensive lux uniformity and compliance audit
 */
export function auditPitchLuxUniformity({
  pitchId,
  luxReadings,
  standardKey = 'UEFA_ELITE_CATEGORY_4',
}) {
  const validation = validateLuxReadings(luxReadings);
  if (!validation.isValid) {
    throw new Error(`Lux audit failed: ${validation.errors.join('; ')}`);
  }

  const standard = BROADCAST_LUX_STANDARDS[standardKey] || BROADCAST_LUX_STANDARDS.UEFA_ELITE_CATEGORY_4;

  const minLux = Math.min(...luxReadings);
  const maxLux = Math.max(...luxReadings);
  const sumLux = luxReadings.reduce((sum, val) => sum + val, 0);
  const aveLux = Math.round((sumLux / luxReadings.length) * 10) / 10;

  // Uniformity Ratios
  const u1Ratio = Math.round((minLux / (maxLux || 1)) * 100) / 100; // Emin / Emax
  const u2Ratio = Math.round((minLux / (aveLux || 1)) * 100) / 100; // Emin / Eave

  const isMinLuxCompliant = minLux >= standard.minMainCameraLux;
  const isU1Compliant = u1Ratio >= standard.minUniformityU1;
  const isU2Compliant = u2Ratio >= standard.minUniformityU2;
  const isBroadcastApproved = isMinLuxCompliant && isU1Compliant && isU2Compliant;

  let calibrationAdvisory = 'Illumination uniformity exceeds broadcast HD flicker-free compliance.';
  if (!isMinLuxCompliant) {
    calibrationAdvisory = `Minimum lux deficiency: ${minLux} Lux recorded (Standard requires ≥ ${standard.minMainCameraLux} Lux). Tilt mast luminaires down.`;
  } else if (!isU1Compliant || !isU2Compliant) {
    calibrationAdvisory = `Uniformity ratio non-compliant (U1: ${u1Ratio}, U2: ${u2Ratio}). Luminaire re-aiming required to resolve dark spots.`;
  }

  return {
    assessmentTimestamp: new Date().toISOString(),
    pitchId,
    standardKey,
    standardName: standard.label,
    samplePointsCount: luxReadings.length,
    minLux,
    maxLux,
    aveLux,
    u1Ratio,
    u2Ratio,
    requiredMinLux: standard.minMainCameraLux,
    requiredU1: standard.minUniformityU1,
    requiredU2: standard.minUniformityU2,
    isMinLuxCompliant,
    isU1Compliant,
    isU2Compliant,
    isBroadcastApproved,
    calibrationAdvisory,
    surveyToken: `LUX-DRONE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}

/**
 * Generates an automated drone flight plan for photometric sensor grid sweeps.
 * 
 * @param {string} pitchId
 * @param {number} [flightAltitudeMeters=12.0]
 * @returns {Object} Drone flight plan manifest
 */
export function generateDronePhotometricSurveyPlan(pitchId, flightAltitudeMeters = 12.0) {
  if (!pitchId) {
    throw new Error('pitchId is required.');
  }

  const waypoints = GRID_SAMPLE_ZONES.map((zone, index) => ({
    waypointIndex: index + 1,
    zoneId: zone.zoneId,
    targetLocation: zone.label,
    altitudeMeters: flightAltitudeMeters,
    hoverDurationSeconds: 4,
    photometerMode: 'COSINE_CORRECTED_SPECTRAL',
  }));

  return {
    surveyPlanId: `FLIGHT-LUX-${Date.now().toString(36).toUpperCase()}`,
    pitchId,
    flightAltitudeMeters,
    totalWaypoints: waypoints.length,
    estimatedFlightMinutes: Math.round(((waypoints.length * 15) / 60) * 10) / 10,
    waypoints,
    geofenceRestrictionClearance: true,
  };
}

export default {
  BROADCAST_LUX_STANDARDS,
  GRID_SAMPLE_ZONES,
  validateLuxReadings,
  auditPitchLuxUniformity,
  generateDronePhotometricSurveyPlan,
};
