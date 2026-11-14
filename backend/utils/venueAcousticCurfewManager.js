/**
 * Stadium Acoustic PA Curfew & Noise Cancellation Engine
 * 
 * Manages active boundary noise attenuation, perimeter acoustic threshold checks,
 * municipal late-night curfew decibel limiting, and public speech intelligibility (STIPA) ratings.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const ACOUSTIC_ZONES = [
  { id: 'ZONE_RESIDENTIAL_NORTH', label: 'North Boundary (Residential Neighbours)', maxDaytimeDb: 70, maxCurfewDb: 55, distanceMeters: 45 },
  { id: 'ZONE_SCHOOL_EAST', label: 'East Perimeter (Local School / Library)', maxDaytimeDb: 68, maxCurfewDb: 50, distanceMeters: 80 },
  { id: 'ZONE_MAIN_STAND_INTERIOR', label: 'Main Covered Grandstand (Spectator Tier)', maxDaytimeDb: 95, maxCurfewDb: 85, distanceMeters: 10 },
  { id: 'ZONE_PITCH_INFIELD', label: 'Pitch Field Center Line', maxDaytimeDb: 92, maxCurfewDb: 80, distanceMeters: 0 },
];

export const NOISE_PROFILES = {
  LEAGUE_MATCH_STANDARD: {
    id: 'LEAGUE_MATCH_STANDARD',
    label: 'Competitive League Fixture',
    targetInfieldDb: 86,
    subBassAttenuationDb: -6,
    noiseCancellingPhaseActive: true,
  },
  EVENING_CURFEW_RESTRICTED: {
    id: 'EVENING_CURFEW_RESTRICTED',
    label: 'Post-21:00 Curfew Whisper Spec',
    targetInfieldDb: 68,
    subBassAttenuationDb: -18,
    noiseCancellingPhaseActive: true,
  },
  COMMUNITY_YOUTH_TRAINING: {
    id: 'COMMUNITY_YOUTH_TRAINING',
    label: 'Youth Coaching & Whistle Priority',
    targetInfieldDb: 74,
    subBassAttenuationDb: -12,
    noiseCancellingPhaseActive: false,
  },
  CONCERT_SPECIAL_EVENT: {
    id: 'CONCERT_SPECIAL_EVENT',
    label: 'Licensed Exhibition Event',
    targetInfieldDb: 98,
    subBassAttenuationDb: 0,
    noiseCancellingPhaseActive: true,
  },
};

/**
 * Validates acoustic evaluation input parameters.
 * 
 * @param {Object} params
 * @returns {Object} Validation outcome
 */
export function validateAcousticParams(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('Missing acoustic evaluation payload.');
  }

  const errors = [];
  if (typeof params.measuredSplDb !== 'number' || params.measuredSplDb < 30 || params.measuredSplDb > 130) {
    errors.push('measuredSplDb must be a number between 30 and 130.');
  }
  if (!params.profileKey || !NOISE_PROFILES[params.profileKey]) {
    errors.push('Invalid noise profileKey.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates stadium acoustic compliance against residential perimeter boundaries.
 * 
 * @param {Object} options
 * @param {number} options.measuredSplDb - Live sound pressure level in dB
 * @param {string} [options.profileKey='LEAGUE_MATCH_STANDARD']
 * @param {string|Date} [options.evaluationTime=new Date()]
 * @returns {Object} Boundary acoustic compliance report
 */
export function evaluateAcousticPerimeterCompliance({
  measuredSplDb,
  profileKey = 'LEAGUE_MATCH_STANDARD',
  evaluationTime = new Date(),
}) {
  const validation = validateAcousticParams({ measuredSplDb, profileKey });
  if (!validation.isValid) {
    throw new Error(`Acoustic validation failed: ${validation.errors.join('; ')}`);
  }

  const profile = NOISE_PROFILES[profileKey];
  const evalDate = new Date(evaluationTime);
  const currentHour = evalDate.getHours();
  // Curfew operates between 21:00 and 07:00
  const isCurfewActive = currentHour >= 21 || currentHour < 7;

  let violationsCount = 0;
  const boundaryAssessments = ACOUSTIC_ZONES.map((zone) => {
    // Sound drop-off over distance approximation (inverse square law ~ 6dB per doubling of distance)
    const distanceDropoffDb = zone.distanceMeters > 0
      ? Math.round(20 * Math.log10(zone.distanceMeters / 5))
      : 0;

    const netEstimatedBoundaryDb = Math.max(35, measuredSplDb - distanceDropoffDb + profile.subBassAttenuationDb);
    const statutoryCapDb = isCurfewActive ? zone.maxCurfewDb : zone.maxDaytimeDb;
    const isExceeded = netEstimatedBoundaryDb > statutoryCapDb;

    if (isExceeded) violationsCount += 1;

    return {
      zoneId: zone.id,
      label: zone.label,
      distanceMeters: zone.distanceMeters,
      statutoryCapDb,
      estimatedBoundaryDb: netEstimatedBoundaryDb,
      isExceeded,
      marginDb: statutoryCapDb - netEstimatedBoundaryDb,
    };
  });

  const isFullyCompliant = violationsCount === 0;

  return {
    assessmentId: `ACOUSTIC-${Date.now().toString(36).toUpperCase()}`,
    measuredSplDb,
    profileKey,
    profileName: profile.label,
    isCurfewActive,
    currentHour,
    isFullyCompliant,
    violationsCount,
    boundaryAssessments,
    recommendedAction: isFullyCompliant
      ? 'LEVELS_COMPLIANT_CONTINUE_BROADCAST'
      : 'ENGAGE_ACTIVE_PERIMETER_PHASE_ATTENUATION',
    stipaIntelligibilityRating: measuredSplDb >= 70 && measuredSplDb <= 90 ? 'EXCELLENT_0.74' : 'ACCEPTABLE_0.58',
    complianceCertificateRef: `CERT-NOISE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}

/**
 * Calculates phase cancellation gain required to neutralise boundary spillover.
 * 
 * @param {number} excessDb - Amount in decibels exceeding curfew limit
 * @returns {Object} Anti-phase calibration settings
 */
export function calculatePhaseCancellationMatrix(excessDb) {
  if (typeof excessDb !== 'number' || excessDb <= 0) {
    return {
      antiPhaseEngaged: false,
      dspGainReductionDb: 0,
      phaseInversionDegrees: 0,
      attenuationMessage: 'No acoustic attenuation required at current volume.',
    };
  }

  const dspReduction = Math.min(24, Math.round(excessDb * 1.25));
  return {
    antiPhaseEngaged: true,
    dspGainReductionDb: -dspReduction,
    phaseInversionDegrees: 180,
    attenuationMessage: `Active boundary phase cancellation active: -${dspReduction} dB applied to perimeter baffle arrays.`,
  };
}

export default {
  ACOUSTIC_ZONES,
  NOISE_PROFILES,
  validateAcousticParams,
  evaluateAcousticPerimeterCompliance,
  calculatePhaseCancellationMatrix,
};
