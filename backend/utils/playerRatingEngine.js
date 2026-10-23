/**
 * playerRatingEngine.js — Elo Skill Rating, Match Handicap & Fair-Play Engine
 * Premium Sports Field Booking Platform
 *
 * Implements competitive matchmaking metrics for sports players and squads:
 *  - Modified Elo rating calculation with margin-of-victory and tournament stakes scaling
 *  - Expected win probability prediction between matched opponents
 *  - Automated match handicap calculation to balance friendly/casual matches
 *  - Five-tier competitive ranking hierarchy (Rookie -> Amateur -> Challenger -> Pro -> Elite)
 *  - Sportsmanship & Fair-Play Conduct Score tracking (card penalties & endorsements)
 *
 * Pure, deterministic, and dependency-free.
 *
 * Usage:
 *   import {
 *     calculateExpectedWinProbability,
 *     updateEloRatings,
 *     calculateMatchHandicap,
 *     evaluateSportsmanshipScore,
 *     getSkillTier,
 *   } from './playerRatingEngine.js';
 */

// ─── Enums & Ranking Tier Thresholds ─────────────────────────────────────────

export const SKILL_TIERS = {
  ROOKIE: {
    tierId: 'ROOKIE',
    name: 'Bronze Rookie',
    minRating: 0,
    maxRating: 1199,
    badgeColor: '#cd7f32',
    icon: '🥉',
  },
  AMATEUR: {
    tierId: 'AMATEUR',
    name: 'Silver Amateur',
    minRating: 1200,
    maxRating: 1499,
    badgeColor: '#94a3b8',
    icon: '🥈',
  },
  CHALLENGER: {
    tierId: 'CHALLENGER',
    name: 'Gold Challenger',
    minRating: 1500,
    maxRating: 1799,
    badgeColor: '#f59e0b',
    icon: '🥇',
  },
  PRO: {
    tierId: 'PRO',
    name: 'Platinum Pro',
    minRating: 1800,
    maxRating: 2099,
    badgeColor: '#06b6d4',
    icon: '💎',
  },
  ELITE: {
    tierId: 'ELITE',
    name: 'Diamond Elite',
    minRating: 2100,
    maxRating: 9999,
    badgeColor: '#8b5cf6',
    icon: '👑',
  },
};

export const CONDUCT_STATUS = {
  EXEMPLARY: 'EXEMPLARY',     // 90–100%
  RESPECTABLE: 'RESPECTABLE', // 75–89%
  PROBATION: 'PROBATION',     // 50–74%
  RESTRICTED: 'RESTRICTED',   // <50%
};

export const RATING_DEFAULTS = {
  BASE_RATING: 1200,
  DEFAULT_K_FACTOR: 32,
  TOURNAMENT_K_MULTIPLIER: 1.25,
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── Skill Tier Resolution ───────────────────────────────────────────────────

/**
 * Resolves rating to corresponding tier profile.
 *
 * @param {number} rating
 * @returns {object} Tier profile
 */
export function getSkillTier(rating = RATING_DEFAULTS.BASE_RATING) {
  const r = Math.max(0, rating);
  for (const tier of Object.values(SKILL_TIERS)) {
    if (r >= tier.minRating && r <= tier.maxRating) {
      return tier;
    }
  }
  return SKILL_TIERS.ROOKIE;
}

// ─── Expected Win Probability ────────────────────────────────────────────────

/**
 * Calculates expected win probability of Player/Team A against B using Elo logistic distribution.
 *
 * @param {number} ratingA - Rating of team A
 * @param {number} ratingB - Rating of team B
 * @returns {number} Probability between 0.0 and 1.0 (A's expected chance)
 */
export function calculateExpectedWinProbability(ratingA, ratingB) {
  const exponent = (ratingB - ratingA) / 400;
  const probability = 1 / (1 + 10 ** exponent);
  return round2(probability);
}

// ─── Elo Rating Update Engine ────────────────────────────────────────────────

/**
 * @typedef {object} EloUpdateParams
 * @property {number} teamARating - Current rating of Team A
 * @property {number} teamBRating - Current rating of Team B
 * @property {number} scoreA - Final score of Team A
 * @property {number} scoreB - Final score of Team B
 * @property {number} [kFactor=32] - Base sensitivity K-factor
 * @property {boolean} [isTournament=false] - Whether match is high-stakes tournament
 */

/**
 * Updates player/squad Elo ratings with margin-of-victory weighting and tournament multipliers.
 *
 * @param {EloUpdateParams} params
 * @returns {object} Updated ratings, delta shifts, and tier changes
 */
export function updateEloRatings({
  teamARating = RATING_DEFAULTS.BASE_RATING,
  teamBRating = RATING_DEFAULTS.BASE_RATING,
  scoreA = 0,
  scoreB = 0,
  kFactor = RATING_DEFAULTS.DEFAULT_K_FACTOR,
  isTournament = false,
}) {
  const expectedA = calculateExpectedWinProbability(teamARating, teamBRating);
  const expectedB = round2(1 - expectedA);

  // Actual match outcome score (1 for win, 0.5 for draw, 0 for loss)
  let actualA = 0.5;
  let actualB = 0.5;

  if (scoreA > scoreB) {
    actualA = 1.0;
    actualB = 0.0;
  } else if (scoreB > scoreA) {
    actualA = 0.0;
    actualB = 1.0;
  }

  // Margin of victory multiplier: Blowout games award more than 1-point squeaks
  const goalDiff = Math.abs(scoreA - scoreB);
  let movMultiplier = 1.0;
  if (goalDiff >= 4) {
    movMultiplier = 1.35;
  } else if (goalDiff >= 2) {
    movMultiplier = 1.15;
  }

  // Tournament multiplier
  const tournamentMultiplier = isTournament ? RATING_DEFAULTS.TOURNAMENT_K_MULTIPLIER : 1.0;
  const effectiveK = kFactor * movMultiplier * tournamentMultiplier;

  // Calculate rating deltas
  const deltaA = Math.round(effectiveK * (actualA - expectedA));
  const deltaB = Math.round(effectiveK * (actualB - expectedB));

  const newRatingA = Math.max(100, teamARating + deltaA);
  const newRatingB = Math.max(100, teamBRating + deltaB);

  const prevTierA = getSkillTier(teamARating);
  const nextTierA = getSkillTier(newRatingA);
  const prevTierB = getSkillTier(teamBRating);
  const nextTierB = getSkillTier(newRatingB);

  return {
    teamA: {
      previousRating: teamARating,
      newRating: newRatingA,
      delta: deltaA,
      expectedWinProbability: expectedA,
      previousTier: prevTierA.tierId,
      newTier: nextTierA.tierId,
      tierChanged: prevTierA.tierId !== nextTierA.tierId,
    },
    teamB: {
      previousRating: teamBRating,
      newRating: newRatingB,
      delta: deltaB,
      expectedWinProbability: expectedB,
      previousTier: prevTierB.tierId,
      newTier: nextTierB.tierId,
      tierChanged: prevTierB.tierId !== nextTierB.tierId,
    },
    matchSummary: {
      scoreA,
      scoreB,
      goalDifference: goalDiff,
      movMultiplier,
      effectiveK: round2(effectiveK),
      isTournament,
    },
  };
}

// ─── Match Handicap Generator ────────────────────────────────────────────────

/**
 * Calculates a fair goal/point handicap for friendly games between uneven teams.
 *
 * @param {object} params
 * @param {number} params.ratingA
 * @param {number} params.ratingB
 * @param {string} [params.sport='football']
 * @returns {object} Recommended handicap
 */
export function calculateMatchHandicap({
  ratingA,
  ratingB,
  sport = 'football',
}) {
  const diff = ratingA - ratingB;
  const absDiff = Math.abs(diff);

  let handicapValue = 0;
  const favoredTeam = diff >= 0 ? 'Team A' : 'Team B';
  const underdogTeam = diff >= 0 ? 'Team B' : 'Team A';

  const normalizedSport = sport.toLowerCase();

  if (normalizedSport === 'football' || normalizedSport === 'futsal') {
    if (absDiff >= 400) handicapValue = 3.0;
    else if (absDiff >= 250) handicapValue = 2.0;
    else if (absDiff >= 120) handicapValue = 1.0;
    else if (absDiff >= 60) handicapValue = 0.5;
  } else if (normalizedSport === 'basketball') {
    handicapValue = Math.round((absDiff / 30) * 2) / 2; // e.g. +6.5 points
  } else if (normalizedSport === 'cricket') {
    handicapValue = Math.round((absDiff / 15) * 5); // +25 runs headstart
  } else {
    // Default points
    handicapValue = Math.round(absDiff / 80);
  }

  return {
    ratingDifference: absDiff,
    isEvenMatchup: absDiff < 50,
    favoredTeam,
    underdogTeam,
    handicapValue,
    handicapDescription: handicapValue > 0
      ? `${underdogTeam} receives a +${handicapValue} head start handicap to ensure competitive balance.`
      : 'Even matchup. No handicap required.',
  };
}

// ─── Sportsmanship & Fair-Play Evaluation ────────────────────────────────────

/**
 * Evaluates sportsmanship conduct score and fair-play badge.
 *
 * @param {object} params
 * @param {number} [params.baseScore=100]
 * @param {number} [params.yellowCards=0]
 * @param {number} [params.redCards=0]
 * @param {number} [params.lateArrivalMinutes=0]
 * @param {number} [params.positiveEndorsements=0]
 * @returns {object} Fair play evaluation
 */
export function evaluateSportsmanshipScore({
  baseScore = 100,
  yellowCards = 0,
  redCards = 0,
  lateArrivalMinutes = 0,
  positiveEndorsements = 0,
}) {
  let score = baseScore;

  // Infractions penalties
  score -= yellowCards * 4;
  score -= redCards * 15;

  if (lateArrivalMinutes > 15) {
    score -= 8;
  } else if (lateArrivalMinutes > 5) {
    score -= 3;
  }

  // Endorsements bonus (fair play commendations from opponents)
  score += positiveEndorsements * 2;
  score = clamp(Math.round(score), 0, 100);

  let status = CONDUCT_STATUS.EXEMPLARY;
  let badgeLabel = 'Fair-Play Champion';

  if (score < 50) {
    status = CONDUCT_STATUS.RESTRICTED;
    badgeLabel = 'League Restricted';
  } else if (score < 75) {
    status = CONDUCT_STATUS.PROBATION;
    badgeLabel = 'Conduct Warning';
  } else if (score < 90) {
    status = CONDUCT_STATUS.RESPECTABLE;
    badgeLabel = 'Respectable Player';
  }

  return {
    score,
    status,
    badgeLabel,
    yellowCards,
    redCards,
    positiveEndorsements,
    isEligibleForTournaments: score >= 60,
  };
}

export default {
  SKILL_TIERS,
  CONDUCT_STATUS,
  RATING_DEFAULTS,
  getSkillTier,
  calculateExpectedWinProbability,
  updateEloRatings,
  calculateMatchHandicap,
  evaluateSportsmanshipScore,
};
