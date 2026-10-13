/**
 * sportsMatchmaker.js — Smart Sports Player & Team Matchmaker
 * Premium Sports Booking Platform
 *
 * Finds compatible players or teams for an open booking slot based on:
 *  - Sport type and skill/rating range
 *  - Location proximity (uses Haversine distance)
 *  - Player availability windows
 *  - Team size requirements per sport
 *  - Preferred play style tags (competitive, casual, training, etc.)
 *
 * Designed to work with the platform's User and Booking Mongoose models.
 *
 * Public API:
 *  - findCompatiblePlayers(criteria)   → Promise<MatchResult[]>
 *  - findCompatibleTeams(criteria)     → Promise<TeamMatchResult[]>
 *  - scoreCompatibility(playerA, playerB, sport) → CompatibilityScore
 *  - buildMatchRequest(bookingId, userId, options) → MatchRequest
 *  - rankMatches(matches, weights)     → RankedMatch[]
 */

// ─── Sport Configuration ─────────────────────────────────────────────────────

/**
 * Defines team-size requirements and default skill bands for each sport.
 */
export const SPORT_CONFIG = {
  football: {
    minPlayers: 2,
    maxPlayers: 22,
    recommendedTeamSize: 11,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
  },
  cricket: {
    minPlayers: 2,
    maxPlayers: 22,
    recommendedTeamSize: 11,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['batsman', 'bowler', 'all-rounder', 'wicketkeeper', 'any'],
  },
  basketball: {
    minPlayers: 2,
    maxPlayers: 10,
    recommendedTeamSize: 5,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['point-guard', 'shooting-guard', 'small-forward', 'power-forward', 'center', 'any'],
  },
  tennis: {
    minPlayers: 2,
    maxPlayers: 4,
    recommendedTeamSize: 2,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['singles', 'doubles', 'any'],
  },
  badminton: {
    minPlayers: 2,
    maxPlayers: 4,
    recommendedTeamSize: 2,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['singles', 'doubles', 'mixed-doubles', 'any'],
  },
  volleyball: {
    minPlayers: 4,
    maxPlayers: 12,
    recommendedTeamSize: 6,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['setter', 'libero', 'outside-hitter', 'middle-blocker', 'opposite', 'any'],
  },
  rugby: {
    minPlayers: 4,
    maxPlayers: 30,
    recommendedTeamSize: 15,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['prop', 'hooker', 'lock', 'flanker', 'number-8', 'scrum-half', 'fly-half', 'winger', 'fullback', 'any'],
  },
  hockey: {
    minPlayers: 4,
    maxPlayers: 22,
    recommendedTeamSize: 11,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'],
  },
  default: {
    minPlayers: 2,
    maxPlayers: 20,
    recommendedTeamSize: 10,
    skillBands: ['beginner', 'amateur', 'intermediate', 'advanced', 'professional'],
    positionTags: ['any'],
  },
};

// ─── Skill Level Numeric Mapping ─────────────────────────────────────────────

const SKILL_RANK = {
  beginner: 1,
  amateur: 2,
  intermediate: 3,
  advanced: 4,
  professional: 5,
};

/**
 * Convert skill label to numeric rank (1–5).
 * @param {string} skill
 * @returns {number}
 */
export function skillToRank(skill) {
  return SKILL_RANK[skill?.toLowerCase()] ?? 1;
}

/**
 * Convert numeric rank back to skill label.
 * @param {number} rank
 * @returns {string}
 */
export function rankToSkill(rank) {
  return Object.keys(SKILL_RANK).find((k) => SKILL_RANK[k] === rank) ?? 'beginner';
}

// ─── Haversine Distance ──────────────────────────────────────────────────────

/**
 * Calculate great-circle distance between two lat/lon points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometres
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Availability Overlap ─────────────────────────────────────────────────────

/**
 * Check if two time windows overlap.
 * @param {{ start: Date|string, end: Date|string }} windowA
 * @param {{ start: Date|string, end: Date|string }} windowB
 * @returns {boolean}
 */
export function doWindowsOverlap(windowA, windowB) {
  const aStart = new Date(windowA.start).getTime();
  const aEnd = new Date(windowA.end).getTime();
  const bStart = new Date(windowB.start).getTime();
  const bEnd = new Date(windowB.end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Calculate overlap duration in minutes between two time windows.
 * @param {{ start: Date|string, end: Date|string }} windowA
 * @param {{ start: Date|string, end: Date|string }} windowB
 * @returns {number} Overlap in minutes (0 if no overlap)
 */
export function overlapMinutes(windowA, windowB) {
  const aStart = new Date(windowA.start).getTime();
  const aEnd = new Date(windowA.end).getTime();
  const bStart = new Date(windowB.start).getTime();
  const bEnd = new Date(windowB.end).getTime();
  const overlapMs = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
  return Math.round(overlapMs / 60000);
}

// ─── Tag Similarity ───────────────────────────────────────────────────────────

/**
 * Compute Jaccard similarity between two tag arrays.
 * Returns 0.0 – 1.0 (1.0 = identical sets).
 * @param {string[]} tagsA
 * @param {string[]} tagsB
 * @returns {number}
 */
export function tagSimilarity(tagsA, tagsB) {
  const setA = new Set((tagsA || []).map((t) => t.toLowerCase()));
  const setB = new Set((tagsB || []).map((t) => t.toLowerCase()));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter((t) => setB.has(t)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// ─── Core Compatibility Scorer ───────────────────────────────────────────────

/**
 * Score how compatible two player profiles are for a given sport.
 *
 * @param {PlayerProfile} playerA         - The requesting player
 * @param {PlayerProfile} playerB         - The candidate player
 * @param {string}        sport           - Sport type (key in SPORT_CONFIG)
 * @param {object}        [weights]       - Override default scoring weights
 * @returns {CompatibilityScore}
 *
 * @typedef {object} PlayerProfile
 * @property {string}   id
 * @property {string}   name
 * @property {string}   skillLevel        - One of SPORT_CONFIG[sport].skillBands
 * @property {number}   [rating]          - Numeric ELO-style rating (optional)
 * @property {number}   [lat]             - Player's home/preferred location latitude
 * @property {number}   [lon]
 * @property {string[]} [preferredTags]   - e.g. ['casual', 'evening', 'competitive']
 * @property {string[]} [positions]       - Preferred positions for the sport
 * @property {{ start: string, end: string }[]} [availability] - ISO date windows
 */
export function scoreCompatibility(playerA, playerB, sport = 'default', weights = {}) {
  const w = {
    skill: 0.35,
    distance: 0.25,
    tags: 0.20,
    availability: 0.20,
    ...weights,
  };

  const factors = {};
  let totalWeight = 0;
  let weightedScore = 0;

  // ── Skill compatibility (35%) ──────────────────────────────────────────────
  const rankA = playerA.rating ?? skillToRank(playerA.skillLevel) * 200;
  const rankB = playerB.rating ?? skillToRank(playerB.skillLevel) * 200;
  const rankDiff = Math.abs(rankA - rankB);
  const maxDiff = 800; // 4 full skill bands apart
  const skillScore = Math.max(0, 1 - rankDiff / maxDiff);
  factors.skill = +skillScore.toFixed(3);
  weightedScore += skillScore * w.skill;
  totalWeight += w.skill;

  // ── Distance score (25%) ───────────────────────────────────────────────────
  if (playerA.lat != null && playerA.lon != null && playerB.lat != null && playerB.lon != null) {
    const distKm = haversineKm(playerA.lat, playerA.lon, playerB.lat, playerB.lon);
    // Score decays linearly from 1.0 at 0km to 0.0 at 50km
    const distScore = Math.max(0, 1 - distKm / 50);
    factors.distance = +distScore.toFixed(3);
    factors.distanceKm = +distKm.toFixed(1);
    weightedScore += distScore * w.distance;
    totalWeight += w.distance;
  } else {
    // No location data — skip factor but redistribute weight
    totalWeight += 0; // neutral — just don't count this factor
  }

  // ── Tag/play-style similarity (20%) ───────────────────────────────────────
  const tagScore = tagSimilarity(playerA.preferredTags || [], playerB.preferredTags || []);
  factors.tags = +tagScore.toFixed(3);
  weightedScore += tagScore * w.tags;
  totalWeight += w.tags;

  // ── Availability overlap (20%) ─────────────────────────────────────────────
  const availA = playerA.availability || [];
  const availB = playerB.availability || [];
  if (availA.length > 0 && availB.length > 0) {
    const totalOverlap = availA.reduce((sum, wA) => {
      return sum + availB.reduce((s, wB) => s + overlapMinutes(wA, wB), 0);
    }, 0);
    // Full score at 120 minutes of overlap
    const availScore = Math.min(1, totalOverlap / 120);
    factors.availability = +availScore.toFixed(3);
    factors.overlapMinutes = totalOverlap;
    weightedScore += availScore * w.availability;
    totalWeight += w.availability;
  }

  const overall = totalWeight > 0 ? weightedScore / totalWeight : 0;

  return {
    overall: +overall.toFixed(3),
    percentage: Math.round(overall * 100),
    factors,
    isGoodMatch: overall >= 0.65,
    label:
      overall >= 0.85 ? 'Excellent'
      : overall >= 0.70 ? 'Good'
      : overall >= 0.55 ? 'Fair'
      : 'Poor',
  };
}

// ─── Player Matching ──────────────────────────────────────────────────────────

/**
 * Find players compatible with a given player for a booking slot.
 *
 * @param {object} criteria
 * @param {PlayerProfile}   criteria.requestingPlayer  - The player seeking a match
 * @param {PlayerProfile[]} criteria.candidatePool     - Pool of players to match against
 * @param {string}          criteria.sport             - Sport type
 * @param {object}          [criteria.bookingWindow]   - { start, end } of the booking
 * @param {number}          [criteria.maxResults=10]
 * @param {number}          [criteria.minScore=0.4]    - Minimum compatibility score
 * @param {object}          [criteria.weights]         - Custom factor weights
 * @returns {MatchResult[]}
 *
 * @typedef {object} MatchResult
 * @property {PlayerProfile}      player
 * @property {CompatibilityScore} compatibility
 * @property {number}             rank
 */
export function findCompatiblePlayers(criteria) {
  const {
    requestingPlayer,
    candidatePool = [],
    sport = 'default',
    bookingWindow,
    maxResults = 10,
    minScore = 0.4,
    weights,
  } = criteria;

  if (!requestingPlayer) throw new Error('requestingPlayer is required');

  const results = candidatePool
    .filter((p) => p.id !== requestingPlayer.id) // exclude self
    .map((candidate) => {
      // Inject booking window into availability check
      const enrichedCandidate = bookingWindow
        ? {
            ...candidate,
            availability: [
              ...(candidate.availability || []),
            ].filter((w) => doWindowsOverlap(w, bookingWindow)),
          }
        : candidate;

      const enrichedRequester = bookingWindow
        ? {
            ...requestingPlayer,
            availability: [bookingWindow],
          }
        : requestingPlayer;

      const compatibility = scoreCompatibility(enrichedRequester, enrichedCandidate, sport, weights);
      return { player: candidate, compatibility };
    })
    .filter((r) => r.compatibility.overall >= minScore)
    .sort((a, b) => b.compatibility.overall - a.compatibility.overall)
    .slice(0, maxResults)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return results;
}

// ─── Team Matching ─────────────────────────────────────────────────────────────

/**
 * Find teams compatible with a booking slot.
 *
 * @param {object} criteria
 * @param {TeamProfile}   criteria.requestingTeam  - The team seeking opponents or fill-ins
 * @param {TeamProfile[]} criteria.candidateTeams
 * @param {string}        criteria.sport
 * @param {object}        [criteria.bookingWindow]
 * @param {number}        [criteria.maxResults=5]
 * @param {number}        [criteria.minScore=0.4]
 * @returns {TeamMatchResult[]}
 *
 * @typedef {object} TeamProfile
 * @property {string}          id
 * @property {string}          name
 * @property {string}          sport
 * @property {string}          skillLevel
 * @property {number}          [rating]
 * @property {number}          [memberCount]
 * @property {number}          [lat]
 * @property {number}          [lon]
 * @property {string[]}        [preferredTags]
 * @property {{ start, end }[]} [availability]
 *
 * @typedef {object} TeamMatchResult
 * @property {TeamProfile}        team
 * @property {CompatibilityScore} compatibility
 * @property {number}             rank
 * @property {string}             matchType    - 'opponent' | 'partner'
 */
export function findCompatibleTeams(criteria) {
  const {
    requestingTeam,
    candidateTeams = [],
    sport = 'default',
    bookingWindow,
    maxResults = 5,
    minScore = 0.4,
    weights,
  } = criteria;

  if (!requestingTeam) throw new Error('requestingTeam is required');

  const sportCfg = SPORT_CONFIG[sport.toLowerCase()] ?? SPORT_CONFIG.default;

  const results = candidateTeams
    .filter((t) => t.id !== requestingTeam.id && t.sport === sport)
    .map((team) => {
      // Treat each team like a player profile for scoring
      const teamAsPlayer = (t) => ({
        id: t.id,
        skillLevel: t.skillLevel,
        rating: t.rating,
        lat: t.lat,
        lon: t.lon,
        preferredTags: t.preferredTags,
        availability: t.availability,
      });

      const compatibility = scoreCompatibility(
        teamAsPlayer(requestingTeam),
        teamAsPlayer(team),
        sport,
        weights
      );

      // Determine if team is a viable size match
      const sizeOk =
        !team.memberCount ||
        (team.memberCount >= sportCfg.minPlayers && team.memberCount <= sportCfg.maxPlayers);

      if (!sizeOk) {
        compatibility.overall = Math.max(0, compatibility.overall - 0.2);
        compatibility.percentage = Math.round(compatibility.overall * 100);
      }

      return {
        team,
        compatibility,
        matchType: 'opponent',
      };
    })
    .filter((r) => r.compatibility.overall >= minScore)
    .sort((a, b) => b.compatibility.overall - a.compatibility.overall)
    .slice(0, maxResults)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return results;
}

// ─── Match Request Builder ────────────────────────────────────────────────────

/**
 * Build a structured match request object to store in the database.
 *
 * @param {string}  bookingId
 * @param {string}  userId
 * @param {object}  options
 * @param {string}  options.sport
 * @param {string}  options.skillLevel
 * @param {number}  options.playersNeeded
 * @param {string}  [options.matchType]  - 'casual' | 'competitive' | 'training'
 * @param {string[]} [options.tags]
 * @param {string}  [options.notes]
 * @returns {MatchRequest}
 *
 * @typedef {object} MatchRequest
 */
export function buildMatchRequest(bookingId, userId, options = {}) {
  const {
    sport = 'default',
    skillLevel = 'intermediate',
    playersNeeded = 1,
    matchType = 'casual',
    tags = [],
    notes = '',
  } = options;

  const sportCfg = SPORT_CONFIG[sport.toLowerCase()] ?? SPORT_CONFIG.default;

  if (playersNeeded < 1) throw new Error('playersNeeded must be at least 1');
  if (playersNeeded > sportCfg.maxPlayers) {
    throw new Error(`playersNeeded exceeds maximum of ${sportCfg.maxPlayers} for ${sport}`);
  }

  return {
    bookingId,
    userId,
    sport,
    skillLevel,
    skillRank: skillToRank(skillLevel),
    playersNeeded,
    matchType,
    tags: tags.map((t) => t.toLowerCase().trim()),
    notes: notes.trim(),
    status: 'open', // 'open' | 'filled' | 'cancelled'
    createdAt: new Date().toISOString(),
    expiresAt: null, // set by caller to booking start time
  };
}

// ─── Ranking with Custom Weights ──────────────────────────────────────────────

/**
 * Re-rank an existing list of MatchResults with custom priority weights.
 * Useful for re-sorting after UI preference changes.
 *
 * @param {MatchResult[]} matches
 * @param {{ skill?: number, distance?: number, tags?: number, availability?: number }} weights
 * @returns {RankedMatch[]}
 */
export function rankMatches(matches, weights = {}) {
  return matches
    .map((m) => {
      const f = m.compatibility.factors;
      const w = { skill: 0.35, distance: 0.25, tags: 0.20, availability: 0.20, ...weights };
      const total = w.skill + w.distance + w.tags + w.availability;
      const score =
        ((f.skill ?? 0) * w.skill +
          (f.distance ?? 0) * w.distance +
          (f.tags ?? 0) * w.tags +
          (f.availability ?? 0) * w.availability) /
        total;
      return { ...m, rerankedScore: +score.toFixed(3) };
    })
    .sort((a, b) => b.rerankedScore - a.rerankedScore)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  SPORT_CONFIG,
  skillToRank,
  rankToSkill,
  haversineKm,
  doWindowsOverlap,
  overlapMinutes,
  tagSimilarity,
  scoreCompatibility,
  findCompatiblePlayers,
  findCompatibleTeams,
  buildMatchRequest,
  rankMatches,
};
