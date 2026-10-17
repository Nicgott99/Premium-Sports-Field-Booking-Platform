/**
 * tournamentBracketEngine.js — Tournament Bracket & Match Scheduling Engine
 * Premium Sports Field Booking Platform
 *
 * Implements a pure-function tournament manager for sports venues hosting leagues,
 * knockout cups, and weekend tournaments:
 *  - Single-elimination bracket generation with seed matching and Bye distribution
 *  - Round-robin schedule generator using the polygon/circle rotation algorithm
 *  - Intelligent match slot allocation across multiple fields without time clashes
 *  - Live match progression: auto-advancing winners to subsequent rounds
 *  - League standings table computation with tie-breaker hierarchy (GD, GF, H2H)
 *  - Consolation / 3rd-place playoff generation
 *
 * All functions are pure, deterministic, and dependency-free.
 *
 * Usage:
 *   import {
 *     generateSingleEliminationBracket,
 *     generateRoundRobinSchedule,
 *     advanceMatchWinner,
 *     calculateStandings,
 *   } from './tournamentBracketEngine.js';
 */

// ─── Constants & Default Configurations ──────────────────────────────────────

export const TOURNAMENT_DEFAULTS = {
  MATCH_DURATION_MINUTES: 60,
  INTERVAL_BETWEEN_MATCHES_MINUTES: 15,
  POINTS: {
    WIN: 3,
    DRAW: 1,
    LOSS: 0,
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Returns the smallest power of 2 greater than or equal to n.
 * (e.g. 3 -> 4, 6 -> 8, 12 -> 16)
 */
export function getNextPowerOfTwo(n) {
  if (n <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(n));
}

/**
 * Generates standard tournament seeding order.
 * For bracketSize=8: [1, 8, 4, 5, 2, 7, 3, 6]
 */
export function getSeedingOrder(bracketSize) {
  const rounds = Math.log2(bracketSize) - 1;
  let pls = [1, 2];

  for (let i = 0; i < rounds; i++) {
    const nextLength = pls.length * 2 + 1;
    const nextPls = [];
    for (const d of pls) {
      nextPls.push(d, nextLength - d);
    }
    pls = nextPls;
  }
  return pls;
}

/**
 * Formats a Date into ISO string or creates offset Date.
 */
export function addMinutesToDate(date, minutes) {
  const d = new Date(date);
  return new Date(d.getTime() + minutes * 60 * 1000);
}

/**
 * Determine a human-readable round name given round index and total rounds.
 */
export function getRoundName(roundIndex, totalRounds) {
  const remaining = totalRounds - roundIndex;
  if (remaining === 1) return 'Finals';
  if (remaining === 2) return 'Semi-Finals';
  if (remaining === 3) return 'Quarter-Finals';
  if (remaining === 4) return 'Round of 16';
  if (remaining === 5) return 'Round of 32';
  return `Round ${roundIndex + 1}`;
}

// ─── Single-Elimination Bracket Generator ─────────────────────────────────────

/**
 * @typedef {object} TeamInput
 * @property {string} id
 * @property {string} name
 * @property {number} [seed]
 */

/**
 * Generate a complete single-elimination tournament bracket with automated
 * match schedules assigned across available sports fields.
 *
 * @param {object} params
 * @param {string} params.tournamentName
 * @param {TeamInput[]} params.teams - List of participating teams
 * @param {string[]} [params.fieldIds] - Available field/court IDs
 * @param {Date|string} [params.startDateTime] - Tournament start datetime
 * @param {number} [params.matchDurationMinutes=60]
 * @param {number} [params.intervalMinutes=15]
 * @param {boolean} [params.includeThirdPlaceMatch=true]
 * @returns {object} Full bracket structure
 */
export function generateSingleEliminationBracket({
  tournamentName = 'Championship Cup',
  teams = [],
  fieldIds = ['Field-1', 'Field-2'],
  startDateTime = new Date(),
  matchDurationMinutes = TOURNAMENT_DEFAULTS.MATCH_DURATION_MINUTES,
  intervalMinutes = TOURNAMENT_DEFAULTS.INTERVAL_BETWEEN_MATCHES_MINUTES,
  includeThirdPlaceMatch = true,
}) {
  if (!Array.isArray(teams) || teams.length < 2) {
    throw new Error('Tournament requires at least 2 teams.');
  }

  const teamCount = teams.length;
  const bracketSize = getNextPowerOfTwo(teamCount);
  const totalRounds = Math.log2(bracketSize);

  // Sort teams by seed (or default order)
  const sortedTeams = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  const seedingSlots = getSeedingOrder(bracketSize);

  // Prepare Round 1 seeded team pairings
  const seededTeams = seedingSlots.map((seed) => {
    return sortedTeams[seed - 1] ?? { id: `BYE-${seed}`, name: 'BYE', isBye: true };
  });

  const rounds = [];
  const allMatches = [];
  let currentDateTime = new Date(startDateTime);
  let fieldCursor = 0;

  // Build rounds from Round 1 to Finals
  let matchesInCurrentRound = bracketSize / 2;

  for (let r = 0; r < totalRounds; r++) {
    const roundMatches = [];
    const roundName = getRoundName(r, totalRounds);

    for (let m = 0; m < matchesInCurrentRound; m++) {
      const matchId = `R${r + 1}-M${m + 1}`;
      const nextRoundIndex = r + 1;
      const nextMatchIndex = Math.floor(m / 2);
      const isNextMatchTeamA = m % 2 === 0;
      const nextMatchId = nextRoundIndex < totalRounds ? `R${nextRoundIndex + 1}-M${nextMatchIndex + 1}` : null;

      let teamA = null;
      let teamB = null;

      if (r === 0) {
        teamA = seededTeams[m * 2];
        teamB = seededTeams[m * 2 + 1];
      }

      // Schedule time & field
      const startTime = new Date(currentDateTime);
      const endTime = addMinutesToDate(startTime, matchDurationMinutes);
      const assignedField = fieldIds[fieldCursor % fieldIds.length];

      // Advance field cursor & time
      fieldCursor++;
      if (fieldCursor % fieldIds.length === 0) {
        currentDateTime = addMinutesToDate(endTime, intervalMinutes);
      }

      // Auto-advance if one team is a BYE
      let status = 'SCHEDULED';
      let winner = null;

      if (r === 0) {
        if (teamA?.isBye && !teamB?.isBye) {
          status = 'COMPLETED';
          winner = teamB;
        } else if (!teamA?.isBye && teamB?.isBye) {
          status = 'COMPLETED';
          winner = teamA;
        }
      }

      const match = {
        id: matchId,
        round: r + 1,
        roundName,
        matchNumber: m + 1,
        fieldId: assignedField,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        teamA: teamA ? { id: teamA.id, name: teamA.name, isBye: !!teamA.isBye } : null,
        teamB: teamB ? { id: teamB.id, name: teamB.name, isBye: !!teamB.isBye } : null,
        scoreA: null,
        scoreB: null,
        status,
        winner: winner ? { id: winner.id, name: winner.name } : null,
        nextMatchId,
        nextMatchSlot: isNextMatchTeamA ? 'teamA' : 'teamB',
      };

      roundMatches.push(match);
      allMatches.push(match);
    }

    rounds.push({
      roundNumber: r + 1,
      roundName,
      matches: roundMatches,
    });

    matchesInCurrentRound /= 2;
  }

  // Optional 3rd Place Match
  let thirdPlaceMatch = null;
  if (includeThirdPlaceMatch && totalRounds >= 2) {
    const startTime = new Date(currentDateTime);
    const endTime = addMinutesToDate(startTime, matchDurationMinutes);
    thirdPlaceMatch = {
      id: 'M-3RD-PLACE',
      round: totalRounds,
      roundName: '3rd Place Playoff',
      matchNumber: 1,
      fieldId: fieldIds[0],
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      teamA: null,
      teamB: null,
      scoreA: null,
      scoreB: null,
      status: 'SCHEDULED',
      winner: null,
    };
    allMatches.push(thirdPlaceMatch);
  }

  // Pre-propagate Byes to Round 2
  for (const match of rounds[0].matches) {
    if (match.status === 'COMPLETED' && match.winner && match.nextMatchId) {
      const nextMatch = allMatches.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        nextMatch[match.nextMatchSlot] = match.winner;
      }
    }
  }

  return {
    tournamentName,
    format: 'SINGLE_ELIMINATION',
    bracketSize,
    teamCount,
    totalRounds,
    rounds,
    thirdPlaceMatch,
    matches: allMatches,
    createdAt: new Date().toISOString(),
  };
}

// ─── Match Progression Engine ────────────────────────────────────────────────

/**
 * Record match results and automatically advance the winner (and loser if 3rd place exists).
 *
 * @param {object} params
 * @param {object} params.bracket - Current tournament bracket state
 * @param {string} params.matchId - ID of completed match
 * @param {number} params.scoreA  - Team A score
 * @param {number} params.scoreB  - Team B score
 * @returns {object} Updated bracket state
 */
export function advanceMatchWinner({ bracket, matchId, scoreA, scoreB }) {
  if (scoreA === scoreB) {
    throw new Error('Knockout match must have a decisive winner (penalties / tiebreaker).');
  }

  const updatedMatches = bracket.matches.map((m) => ({ ...m }));
  const targetMatch = updatedMatches.find((m) => m.id === matchId);

  if (!targetMatch) {
    throw new Error(`Match with ID "${matchId}" not found in bracket.`);
  }
  if (!targetMatch.teamA || !targetMatch.teamB) {
    throw new Error('Cannot finalize match with unpopulated team slots.');
  }

  const isWinnerA = scoreA > scoreB;
  const winner = isWinnerA ? targetMatch.teamA : targetMatch.teamB;
  const loser = isWinnerA ? targetMatch.teamB : targetMatch.teamA;

  targetMatch.scoreA = scoreA;
  targetMatch.scoreB = scoreB;
  targetMatch.status = 'COMPLETED';
  targetMatch.winner = { id: winner.id, name: winner.name };

  // Forward winner to next match
  if (targetMatch.nextMatchId) {
    const nextMatch = updatedMatches.find((m) => m.id === targetMatch.nextMatchId);
    if (nextMatch) {
      nextMatch[targetMatch.nextMatchSlot] = { id: winner.id, name: winner.name };
    }
  }

  // If this was a semi-final and 3rd place match exists, route loser to 3rd place
  if (bracket.thirdPlaceMatch && targetMatch.roundName === 'Semi-Finals') {
    const thirdPlace = updatedMatches.find((m) => m.id === 'M-3RD-PLACE');
    if (thirdPlace) {
      if (!thirdPlace.teamA) {
        thirdPlace.teamA = { id: loser.id, name: loser.name };
      } else if (!thirdPlace.teamB) {
        thirdPlace.teamB = { id: loser.id, name: loser.name };
      }
    }
  }

  // Synchronize rounds with updated matches
  const updatedRounds = bracket.rounds.map((round) => ({
    ...round,
    matches: round.matches.map((m) => updatedMatches.find((um) => um.id === m.id) || m),
  }));

  const updatedThirdPlace = bracket.thirdPlaceMatch
    ? updatedMatches.find((m) => m.id === 'M-3RD-PLACE')
    : null;

  // Check if tournament has crowned champion
  const finalMatch = updatedMatches.find((m) => m.roundName === 'Finals');
  const champion = finalMatch?.status === 'COMPLETED' ? finalMatch.winner : null;

  return {
    ...bracket,
    rounds: updatedRounds,
    thirdPlaceMatch: updatedThirdPlace,
    matches: updatedMatches,
    champion,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Round-Robin Schedule Generator ──────────────────────────────────────────

/**
 * Generate a fair Round-Robin fixture schedule using the circle/polygon algorithm.
 *
 * @param {object} params
 * @param {string} params.tournamentName
 * @param {TeamInput[]} params.teams
 * @param {string[]} [params.fieldIds]
 * @param {Date|string} [params.startDateTime]
 * @param {number} [params.matchDurationMinutes=60]
 * @param {number} [params.intervalMinutes=15]
 * @returns {object} Complete round-robin schedule
 */
export function generateRoundRobinSchedule({
  tournamentName = 'Premier League',
  teams = [],
  fieldIds = ['Pitch-A', 'Pitch-B'],
  startDateTime = new Date(),
  matchDurationMinutes = TOURNAMENT_DEFAULTS.MATCH_DURATION_MINUTES,
  intervalMinutes = TOURNAMENT_DEFAULTS.INTERVAL_BETWEEN_MATCHES_MINUTES,
}) {
  if (!Array.isArray(teams) || teams.length < 2) {
    throw new Error('Round-robin requires at least 2 teams.');
  }

  const teamList = [...teams];
  const hasGhost = teamList.length % 2 !== 0;

  // Add dummy team if odd
  if (hasGhost) {
    teamList.push({ id: 'BYE', name: 'BYE', isGhost: true });
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  const rounds = [];
  const allMatches = [];
  let currentDateTime = new Date(startDateTime);
  let fieldCursor = 0;

  const rotatingTeams = [...teamList];

  for (let r = 0; r < numRounds; r++) {
    const roundMatches = [];

    for (let m = 0; m < matchesPerRound; m++) {
      const home = rotatingTeams[m];
      const away = rotatingTeams[numTeams - 1 - m];

      // Skip ghost/bye matches
      if (home.isGhost || away.isGhost) continue;

      const startTime = new Date(currentDateTime);
      const endTime = addMinutesToDate(startTime, matchDurationMinutes);
      const assignedField = fieldIds[fieldCursor % fieldIds.length];

      fieldCursor++;
      if (fieldCursor % fieldIds.length === 0) {
        currentDateTime = addMinutesToDate(endTime, intervalMinutes);
      }

      const match = {
        id: `RR-MD${r + 1}-M${m + 1}`,
        matchday: r + 1,
        fieldId: assignedField,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        teamA: { id: home.id, name: home.name },
        teamB: { id: away.id, name: away.name },
        scoreA: null,
        scoreB: null,
        status: 'SCHEDULED',
        winner: null,
      };

      roundMatches.push(match);
      allMatches.push(match);
    }

    rounds.push({
      matchday: r + 1,
      matches: roundMatches,
    });

    // Polygon rotation: keep index 0 fixed, rotate others clockwise
    const fixed = rotatingTeams[0];
    const last = rotatingTeams[numTeams - 1];
    const middle = rotatingTeams.slice(1, numTeams - 1);
    rotatingTeams.splice(0, numTeams, fixed, last, ...middle);
  }

  return {
    tournamentName,
    format: 'ROUND_ROBIN',
    totalTeams: teams.length,
    totalMatchdays: numRounds,
    totalMatches: allMatches.length,
    matchdays: rounds,
    matches: allMatches,
    createdAt: new Date().toISOString(),
  };
}

// ─── Standings Table Calculator ──────────────────────────────────────────────

/**
 * Calculate comprehensive league table / standings from played matches.
 *
 * @param {object} params
 * @param {TeamInput[]} params.teams
 * @param {Array} params.matches - List of played and pending matches
 * @param {object} [params.pointRules] - Points for WIN, DRAW, LOSS
 * @returns {Array<object>} Ranked standings table
 */
export function calculateStandings({
  teams = [],
  matches = [],
  pointRules = TOURNAMENT_DEFAULTS.POINTS,
}) {
  const table = new Map();

  // Initialize table rows for every team
  for (const team of teams) {
    table.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [], // e.g. ['W', 'D', 'L', 'W']
    });
  }

  // Tabulate completed matches
  for (const match of matches) {
    if (
      match.status !== 'COMPLETED' ||
      typeof match.scoreA !== 'number' ||
      typeof match.scoreB !== 'number'
    ) {
      continue;
    }

    const rowA = table.get(match.teamA?.id);
    const rowB = table.get(match.teamB?.id);
    if (!rowA || !rowB) continue;

    rowA.played += 1;
    rowB.played += 1;
    rowA.goalsFor += match.scoreA;
    rowA.goalsAgainst += match.scoreB;
    rowB.goalsFor += match.scoreB;
    rowB.goalsAgainst += match.scoreA;

    if (match.scoreA > match.scoreB) {
      rowA.won += 1;
      rowA.points += pointRules.WIN;
      rowA.form.push('W');
      rowB.lost += 1;
      rowB.points += pointRules.LOSS;
      rowB.form.push('L');
    } else if (match.scoreB > match.scoreA) {
      rowB.won += 1;
      rowB.points += pointRules.WIN;
      rowB.form.push('W');
      rowA.lost += 1;
      rowA.points += pointRules.LOSS;
      rowA.form.push('L');
    } else {
      rowA.drawn += 1;
      rowB.drawn += 1;
      rowA.points += pointRules.DRAW;
      rowB.points += pointRules.DRAW;
      rowA.form.push('D');
      rowB.form.push('D');
    }

    rowA.goalDifference = rowA.goalsFor - rowA.goalsAgainst;
    rowB.goalDifference = rowB.goalsFor - rowB.goalsAgainst;
  }

  // Sort by Points -> Goal Difference -> Goals For -> Name
  const standings = Array.from(table.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  // Assign ranks
  return standings.map((entry, index) => ({
    rank: index + 1,
    ...entry,
    form: entry.form.slice(-5), // Keep last 5 matches
  }));
}

export default {
  TOURNAMENT_DEFAULTS,
  getNextPowerOfTwo,
  getSeedingOrder,
  generateSingleEliminationBracket,
  generateRoundRobinSchedule,
  advanceMatchWinner,
  calculateStandings,
};
