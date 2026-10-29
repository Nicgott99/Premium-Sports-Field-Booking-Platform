/**
 * coachSessionBookingEngine.js — Sports Coach Booking, Skill Drills & Training Engine
 * Premium Sports Field Booking Platform
 *
 * Provides training session lifecycle management and pricing logic:
 *  - Multi-tier coach certification rates (Elite Master, Pro Certified, Rising Dev)
 *  - Flexible session formats (1-on-1 Private, Small Group, Team Tactical, Video Review)
 *  - Bundled pitch reservation discount logic (syncs venue turf with trainer booking)
 *  - Schedule conflict and mandatory coach transit buffer validation
 *  - Player skill drill evaluation and progression tracking
 *  - Fair cancellation and reschedule fee calculators
 *  - Training session pass certification
 *
 * Pure ES Module with zero external dependencies.
 */

// ─── Enums & Configurations ──────────────────────────────────────────────────

export const COACH_TIERS = {
  ELITE_MASTER: {
    tierId: 'ELITE_MASTER',
    name: 'Elite Master Coach (UEFA Pro / National Ex-Pro)',
    baseHourlyUsd: 75.0,
    rateMultiplier: 1.5,
    minExperienceYears: 8,
    badgeColor: '#FBBF24',
  },
  PRO_CERTIFIED: {
    tierId: 'PRO_CERTIFIED',
    name: 'Pro Certified Coach (UEFA B / ITF Certified)',
    baseHourlyUsd: 50.0,
    rateMultiplier: 1.2,
    minExperienceYears: 4,
    badgeColor: '#7dd3fc',
  },
  RISING_DEV: {
    tierId: 'RISING_DEV',
    name: 'Rising Academy Coach (Grassroots Specialist)',
    baseHourlyUsd: 35.0,
    rateMultiplier: 1.0,
    minExperienceYears: 2,
    badgeColor: '#ff5e07',
  },
};

export const SESSION_FORMATS = {
  ONE_ON_ONE: {
    formatId: 'ONE_ON_ONE',
    name: '1-on-1 Elite Private Training',
    maxParticipants: 1,
    rateMultiplier: 1.0,
    description: 'Personalized individual development with dedicated coach attention',
  },
  SMALL_GROUP: {
    formatId: 'SMALL_GROUP',
    name: 'Small Group Skills Clinic (2-5 Players)',
    maxParticipants: 5,
    rateMultiplier: 1.35,
    description: 'Competitive peer drills, passing combinations, and 1v1 duels',
  },
  TEAM_TACTICAL: {
    formatId: 'TEAM_TACTICAL',
    name: 'Squad / Team Tactical Masterclass (6-18 Players)',
    maxParticipants: 18,
    rateMultiplier: 2.2,
    description: 'Full team tactical shape, pressing triggers, and set-piece routines',
  },
  VIDEO_ANALYSIS: {
    formatId: 'VIDEO_ANALYSIS',
    name: 'Tactical Video & Performance Chalkboard',
    maxParticipants: 3,
    rateMultiplier: 0.8,
    description: 'Match film review, positioning critique, and tactical homework',
  },
};

export const DRILL_CATEGORIES = {
  BALL_MASTERY: 'Ball Mastery & Close Control',
  FINISHING_STRIKING: 'Shooting Accuracy & Finishing',
  DEFENSIVE_AWARENESS: 'Defensive Positioning & Interceptions',
  SPEED_AGILITY: 'SAQ (Speed, Agility, Quickness)',
  GOALKEEPER_REFLEXES: 'Goalkeeper Shot-Stopping & Handling',
};

// ─── Pricing & Bundling Calculator ──────────────────────────────────────────

/**
 * Calculates coaching session pricing, pitch bundle discounts, and platform fees.
 *
 * @param {Object} params
 * @param {number} [params.coachBaseRate] - Optional custom hourly rate
 * @param {string} [params.coachTier='PRO_CERTIFIED'] - Coach tier from COACH_TIERS
 * @param {string} [params.sessionFormat='ONE_ON_ONE'] - Format from SESSION_FORMATS
 * @param {number} [params.durationMinutes=60] - Length of training session
 * @param {number} [params.numParticipants=1] - Number of players attending
 * @param {boolean} [params.includesPitchBundle=false] - Whether turf is bundled
 * @param {number} [params.pitchHourlyRate=60] - Hourly price of the turf pitch
 * @returns {Object} Full financial breakdown
 */
export function calculateCoachSessionPricing({
  coachBaseRate,
  coachTier = 'PRO_CERTIFIED',
  sessionFormat = 'ONE_ON_ONE',
  durationMinutes = 60,
  numParticipants = 1,
  includesPitchBundle = false,
  pitchHourlyRate = 60,
}) {
  const tierConfig = COACH_TIERS[coachTier] || COACH_TIERS.PRO_CERTIFIED;
  const formatConfig = SESSION_FORMATS[sessionFormat] || SESSION_FORMATS.ONE_ON_ONE;

  const durationHours = Math.max(0.5, Math.min(6, (Number(durationMinutes) || 60) / 60));
  const participants = Math.max(1, Math.min(formatConfig.maxParticipants, Number(numParticipants) || 1));

  // Determine base hourly coaching rate
  const effectiveBaseRate = Number(coachBaseRate) > 0 ? Number(coachBaseRate) : tierConfig.baseHourlyUsd;
  const baseCoachSubtotal = effectiveBaseRate * formatConfig.rateMultiplier * durationHours;

  // Small group extra participant surcharge (+15% per player beyond first)
  let participantAdjustment = 0;
  if (sessionFormat === 'SMALL_GROUP' && participants > 1) {
    participantAdjustment = baseCoachSubtotal * 0.15 * (participants - 1);
  }

  const rawCoachFee = Math.round((baseCoachSubtotal + participantAdjustment) * 100) / 100;

  // Bundled Pitch Calculation
  let pitchFee = 0;
  let bundleDiscount = 0;
  if (includesPitchBundle) {
    const rawPitchCost = (Number(pitchHourlyRate) || 60) * durationHours;
    // 10% discount on both coach and pitch when bundled together
    bundleDiscount = Math.round((rawPitchCost + rawCoachFee) * 0.1 * 100) / 100;
    pitchFee = Math.round(rawPitchCost * 100) / 100;
  }

  const totalBeforePlatform = Math.max(0, rawCoachFee + pitchFee - bundleDiscount);

  // Platform booking commission (8%)
  const platformFee = Math.round(totalBeforePlatform * 0.08 * 100) / 100;
  const finalPrice = Math.round((totalBeforePlatform + platformFee) * 100) / 100;
  const pricePerParticipant = Math.round((finalPrice / participants) * 100) / 100;

  return {
    coachTier: tierConfig.tierId,
    sessionFormat: formatConfig.formatId,
    durationHours,
    durationMinutes,
    participants,
    coachFee: rawCoachFee,
    pitchFee,
    bundleDiscount,
    platformFee,
    finalPrice,
    pricePerParticipant,
    currency: 'USD',
  };
}

// ─── Schedule Availability & Conflict Validator ─────────────────────────────

/**
 * Validates coach schedule and ensures transit buffers between sessions.
 *
 * @param {string} requestedStart - ISO timestamp
 * @param {string} requestedEnd - ISO timestamp
 * @param {Array<Object>} existingSessions - Existing coach sessions
 * @param {number} [bufferMinutes=30] - Mandatory rest/travel buffer in minutes
 * @returns {{ isAvailable: boolean, conflictReason: string|null }}
 */
export function validateCoachAvailability(
  requestedStart,
  requestedEnd,
  existingSessions = [],
  bufferMinutes = 30
) {
  const reqStartMs = new Date(requestedStart).getTime();
  const reqEndMs = new Date(requestedEnd).getTime();
  const bufferMs = bufferMinutes * 60 * 1000;

  if (Number.isNaN(reqStartMs) || Number.isNaN(reqEndMs) || reqStartMs >= reqEndMs) {
    return { isAvailable: false, conflictReason: 'Invalid requested start or end time' };
  }

  for (const session of existingSessions) {
    if (['CANCELLED', 'REJECTED'].includes(session.status)) continue;

    const sessStartMs = new Date(session.startTime).getTime() - bufferMs;
    const sessEndMs = new Date(session.endTime).getTime() + bufferMs;

    if (reqStartMs < sessEndMs && reqEndMs > sessStartMs) {
      return {
        isAvailable: false,
        conflictReason: `Time conflict with existing session #${session.id || 'N/A'} (includes ${bufferMinutes}m buffer)`,
      };
    }
  }

  return { isAvailable: true, conflictReason: null };
}

// ─── Player Skill Drill Progression Tracker ─────────────────────────────────

/**
 * Evaluates skill progression scores and computes player training velocity.
 *
 * @param {Object} baselineRatings - Object mapping drill categories to 1-100 scores
 * @param {Object} currentDrillScores - Object mapping drill categories to session scores
 * @returns {Object} Evaluated progress report
 */
export function evaluatePlayerDrillProgress(baselineRatings = {}, currentDrillScores = {}) {
  const updatedRatings = {};
  const progressDeltas = {};
  let totalScoreSum = 0;
  let categoryCount = 0;

  for (const categoryKey of Object.keys(DRILL_CATEGORIES)) {
    const prevScore = Number(baselineRatings[categoryKey]) || 60;
    const sessionScore = Number(currentDrillScores[categoryKey]);

    if (!Number.isNaN(sessionScore) && sessionScore > 0) {
      // Exponential moving average: 70% historical, 30% current session
      const newScore = Math.round(prevScore * 0.7 + sessionScore * 0.3);
      updatedRatings[categoryKey] = Math.max(10, Math.min(99, newScore));
      progressDeltas[categoryKey] = updatedRatings[categoryKey] - prevScore;
    } else {
      updatedRatings[categoryKey] = prevScore;
      progressDeltas[categoryKey] = 0;
    }

    totalScoreSum += updatedRatings[categoryKey];
    categoryCount++;
  }

  const overallRating = Math.round(totalScoreSum / Math.max(1, categoryCount));

  return {
    overallRating,
    updatedRatings,
    progressDeltas,
    drillCategories: DRILL_CATEGORIES,
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── Reschedule & Cancellation Policy Calculator ────────────────────────────

/**
 * Calculates refund and penalty fees based on how far in advance a session is changed.
 *
 * @param {string|Date} sessionStartTime - Scheduled start
 * @param {string|Date} requestTime - Time of cancellation/reschedule request
 * @param {number} totalFeeUsd - Total session fee
 * @returns {Object} Cancellation / reschedule financial terms
 */
export function calculateRescheduleFee(sessionStartTime, requestTime = new Date(), totalFeeUsd = 60.0) {
  const sessionMs = new Date(sessionStartTime).getTime();
  const requestMs = new Date(requestTime).getTime();
  const hoursNotice = (sessionMs - requestMs) / (60 * 60 * 1000);

  let penaltyPct = 0;
  let policyTier = 'FREE_CANCELLATION_OVER_24_HOURS';

  if (hoursNotice < 4) {
    penaltyPct = 100;
    policyTier = 'NO_REFUND_UNDER_4_HOURS';
  } else if (hoursNotice < 12) {
    penaltyPct = 50;
    policyTier = 'LATE_CANCELLATION_50_PCT';
  } else if (hoursNotice < 24) {
    penaltyPct = 15;
    policyTier = 'MODERATE_NOTICE_15_PCT';
  }

  const fee = Math.max(0, Number(totalFeeUsd) || 0);
  const penaltyUsd = Math.round(((fee * penaltyPct) / 100) * 100) / 100;
  const refundUsd = Math.round((fee - penaltyUsd) * 100) / 100;

  return {
    hoursNotice: Math.round(hoursNotice * 10) / 10,
    policyTier,
    penaltyPercentage: penaltyPct,
    penaltyUsd,
    refundUsd,
    currency: 'USD',
  };
}

// ─── Session Pass Generator ─────────────────────────────────────────────────

/**
 * Creates a verified training session pass.
 *
 * @param {Object} sessionDetails
 * @returns {Object} Formatted pass
 */
export function generateCoachSessionPass(sessionDetails) {
  const token = `TRN-PASS-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 9000 + 1000
  )}`;

  return {
    passToken: token,
    sessionId: sessionDetails.sessionId || `SESS-${Date.now()}`,
    coachId: sessionDetails.coachId,
    coachName: sessionDetails.coachName,
    playerId: sessionDetails.playerId,
    sessionFormat: sessionDetails.sessionFormat || 'ONE_ON_ONE',
    scheduledTime: sessionDetails.scheduledTime,
    durationMinutes: sessionDetails.durationMinutes || 60,
    pitchLocation: sessionDetails.pitchLocation || 'Pitch 1 — North Turf',
    status: 'CONFIRMED',
    issuedAt: new Date().toISOString(),
  };
}

export default {
  COACH_TIERS,
  SESSION_FORMATS,
  DRILL_CATEGORIES,
  calculateCoachSessionPricing,
  validateCoachAvailability,
  evaluatePlayerDrillProgress,
  calculateRescheduleFee,
  generateCoachSessionPass,
};
