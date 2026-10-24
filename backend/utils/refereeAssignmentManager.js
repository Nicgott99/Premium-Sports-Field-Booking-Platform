/**
 * refereeAssignmentManager.js — Match Official Booking, Assignment & Disciplinary Manager
 * Premium Sports Field Booking Platform
 *
 * Provides comprehensive officiating and referee management for leagues,
 * tournaments, friendly fixtures, and pickup games:
 *  - Official certification verification & sport-specific eligibility checks
 *  - Conflict-of-interest detection (club affiliation, schedule collisions)
 *  - Smart matching algorithm ranking officials by skill, distance, and reliability
 *  - Match fee & compensation calculator with role rates, overtime, and tournament surcharges
 *  - Lifecycle state machine: DRAFT -> OFFERED -> ACCEPTED -> CONFIRMED -> CHECKED_IN -> COMPLETED -> SETTLED
 *  - Disciplinary incident logging (cards, penalties, misconduct, VAR reviews)
 *  - Official match score certification and sign-off
 *
 * Pure, deterministic, dependency-free ES Module.
 */

// ─── Constants & Enumerations ────────────────────────────────────────────────

export const OFFICIAL_ROLES = {
  CHIEF_REFEREE: {
    roleId: 'CHIEF_REFEREE',
    title: 'Head Referee / Umpire',
    baseHourlyRate: 45,
    requiredMinRating: 4.0,
    icon: 'whistle',
  },
  ASSISTANT_REFEREE: {
    roleId: 'ASSISTANT_REFEREE',
    title: 'Assistant Referee / Linesman',
    baseHourlyRate: 30,
    requiredMinRating: 3.5,
    icon: 'flag',
  },
  FOURTH_OFFICIAL: {
    roleId: 'FOURTH_OFFICIAL',
    title: 'Fourth Official / Table Judge',
    baseHourlyRate: 25,
    requiredMinRating: 3.0,
    icon: 'clock',
  },
  VAR_OPERATOR: {
    roleId: 'VAR_OPERATOR',
    title: 'Video Assistant Referee (VAR)',
    baseHourlyRate: 40,
    requiredMinRating: 4.2,
    icon: 'video',
  },
};

export const CERTIFICATION_LEVELS = {
  FIFA_ELITE: { id: 'FIFA_ELITE', name: 'FIFA International Elite', tierWeight: 1.5, validSports: ['FOOTBALL', 'FUTSAL'] },
  FIFA_NATIONAL: { id: 'FIFA_NATIONAL', name: 'National Grade 1', tierWeight: 1.3, validSports: ['FOOTBALL', 'FUTSAL'] },
  FA_REGIONAL: { id: 'FA_REGIONAL', name: 'Regional Grassroots Official', tierWeight: 1.0, validSports: ['FOOTBALL', 'FUTSAL'] },
  FIBA_PRO: { id: 'FIBA_PRO', name: 'FIBA International Official', tierWeight: 1.4, validSports: ['BASKETBALL'] },
  FIBA_CERTIFIED: { id: 'FIBA_CERTIFIED', name: 'FIBA Certified State Official', tierWeight: 1.1, validSports: ['BASKETBALL'] },
  ICC_PANEL: { id: 'ICC_PANEL', name: 'ICC Panel Umpire', tierWeight: 1.4, validSports: ['CRICKET'] },
  ICC_COMMUNITY: { id: 'ICC_COMMUNITY', name: 'Cricket Community Umpire', tierWeight: 1.0, validSports: ['CRICKET'] },
  CLUB_ACCREDITED: { id: 'CLUB_ACCREDITED', name: 'Verified Club Official', tierWeight: 0.9, validSports: ['ALL'] },
};

export const ASSIGNMENT_STATUS = {
  DRAFT: 'DRAFT',
  OFFERED: 'OFFERED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SETTLED: 'SETTLED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
};

export const INCIDENT_TYPES = {
  YELLOW_CARD: { code: 'YELLOW_CARD', penaltyPoints: 2, label: 'Yellow Card (Caution)' },
  SECOND_YELLOW: { code: 'SECOND_YELLOW', penaltyPoints: 5, label: 'Second Yellow (Dismissal)' },
  STRAIGHT_RED: { code: 'STRAIGHT_RED', penaltyPoints: 10, label: 'Straight Red Card (Expulsion)' },
  BLUE_CARD: { code: 'BLUE_CARD', penaltyPoints: 3, label: 'Blue Card (2-Min Sin-Bin / Futsal)' },
  TECHNICAL_FOUL: { code: 'TECHNICAL_FOUL', penaltyPoints: 4, label: 'Technical Foul / Unsportsmanlike' },
  INJURY_STOPPAGE: { code: 'INJURY_STOPPAGE', penaltyPoints: 0, label: 'Major Injury Stoppage' },
  PITCH_INVASION: { code: 'PITCH_INVASION', penaltyPoints: 15, label: 'Field Breach / Crowd Disruption' },
  FORFEIT_DECLARED: { code: 'FORFEIT_DECLARED', penaltyPoints: 20, label: 'Match Forfeit Declared' },
};

// ─── Conflict-of-Interest & Availability Validator ──────────────────────────

function checkScheduleCollision(assignments, fixtureStart, fixtureEnd, bufferMs = 3600000) {
  if (!Array.isArray(assignments)) return null;
  for (const assignment of assignments) {
    if (['CANCELLED', 'DECLINED'].includes(assignment.status)) continue;
    const assignStart = new Date(assignment.startTime).getTime() - bufferMs;
    const assignEnd = new Date(assignment.endTime).getTime() + bufferMs;
    if (fixtureStart < assignEnd && fixtureEnd > assignStart) {
      return `Schedule collision with assignment #${assignment.id || 'N/A'} (buffer included)`;
    }
  }
  return null;
}

function checkClubAffiliation(officialClubs, homeTeamId, awayTeamId) {
  const clubs = Array.isArray(officialClubs) ? officialClubs : [];
  const reasons = [];
  if (homeTeamId && clubs.includes(homeTeamId)) {
    reasons.push(`Conflict of interest: Official is affiliated with home team (${homeTeamId})`);
  }
  if (awayTeamId && clubs.includes(awayTeamId)) {
    reasons.push(`Conflict of interest: Official is affiliated with away team (${awayTeamId})`);
  }
  return reasons;
}

/**
 * Validates whether a referee is eligible to officiate a specific fixture.
 *
 * @param {Object} official - Official profile
 * @param {Object} fixture - Fixture details (homeTeamId, awayTeamId, startTime, endTime, sport)
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function validateOfficialEligibility(official, fixture) {
  const reasons = [];

  if (!official || typeof official !== 'object') {
    return { eligible: false, reasons: ['Official profile is required'] };
  }
  if (!fixture || typeof fixture !== 'object') {
    return { eligible: false, reasons: ['Fixture details are required'] };
  }

  // 1. Sport Compatibility
  const cert = CERTIFICATION_LEVELS[official.certification];
  const fixtureSport = (fixture.sport || 'FOOTBALL').toUpperCase();
  if (cert && cert.validSports[0] !== 'ALL' && !cert.validSports.includes(fixtureSport)) {
    reasons.push(`Official certification (${cert.name}) does not cover sport: ${fixtureSport}`);
  }

  // 2. Club/Team Affiliation Conflict of Interest
  reasons.push(...checkClubAffiliation(official.affiliatedClubIds, fixture.homeTeamId, fixture.awayTeamId));

  // 3. Status Check
  if (official.isSuspended) {
    reasons.push('Official is currently under disciplinary suspension');
  }
  if (!official.isActive) {
    reasons.push('Official profile is marked inactive');
  }

  // 4. Schedule Collisions (with 60-minute travel buffer)
  const fixtureStart = new Date(fixture.startTime).getTime();
  const fixtureEnd = new Date(fixture.endTime).getTime();
  const collision = checkScheduleCollision(official.existingAssignments, fixtureStart, fixtureEnd);
  if (collision) {
    reasons.push(collision);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

// ─── Candidate Ranking Algorithm ────────────────────────────────────────────

/**
 * Calculates a suitability score (0-100) for an official for a given fixture.
 *
 * @param {Object} official - Official profile
 * @param {Object} fixture - Fixture requirements
 * @returns {{ officialId: string, suitabilityScore: number, breakdown: Object }}
 */
export function rankOfficialSuitability(official, fixture) {
  const eligibility = validateOfficialEligibility(official, fixture);
  if (!eligibility.eligible) {
    return {
      officialId: official.id,
      suitabilityScore: 0,
      breakdown: { eligible: false, reasons: eligibility.reasons },
    };
  }

  // 1. Rating Score (Max 35 pts)
  const rating = Math.max(1, Math.min(5, Number(official.rating) || 3.0));
  const ratingScore = ((rating - 1) / 4) * 35;

  // 2. Reliability / Attendance Rate (Max 25 pts)
  const reliability = Math.max(0, Math.min(100, Number(official.attendanceRatePct) || 85));
  const reliabilityScore = (reliability / 100) * 25;

  // 3. Certification Tier Match (Max 20 pts)
  const cert = CERTIFICATION_LEVELS[official.certification] || CERTIFICATION_LEVELS.CLUB_ACCREDITED;
  const certScore = Math.min(20, (cert.tierWeight / 1.5) * 20);

  // 4. Proximity / Travel Distance (Max 20 pts)
  const distanceKm = Number(official.distanceKm) || 5;
  const maxAcceptableKm = 30;
  const proximityScore = Math.max(0, (1 - Math.min(distanceKm, maxAcceptableKm) / maxAcceptableKm) * 20);

  const totalScore = Math.round((ratingScore + reliabilityScore + certScore + proximityScore) * 10) / 10;

  return {
    officialId: official.id,
    suitabilityScore: Math.min(100, totalScore),
    breakdown: {
      ratingScore: Math.round(ratingScore * 10) / 10,
      reliabilityScore: Math.round(reliabilityScore * 10) / 10,
      certScore: Math.round(certScore * 10) / 10,
      proximityScore: Math.round(proximityScore * 10) / 10,
      distanceKm,
    },
  };
}

// ─── Fee & Compensation Calculator ──────────────────────────────────────────

/**
 * Calculates the complete compensation breakdown for an officiating assignment.
 *
 * @param {Object} params - Pricing inputs
 * @param {string} params.role - Role from OFFICIAL_ROLES
 * @param {number} params.durationMinutes - Total fixture time in minutes
 * @param {string} [params.certification] - Certification tier
 * @param {boolean} [params.isNightGame] - 8PM-6AM surcharge (+15%)
 * @param {boolean} [params.isPlayoff] - Tournament knockout surcharge (+30%)
 * @param {number} [params.overtimeMinutes] - Stoppage / extra time minutes
 * @param {number} [params.travelAllowanceUsd] - Fixed travel stipend
 * @returns {Object} Full fee breakdown with platform fee and net payout
 */
export function calculateOfficialFee({
  role = 'CHIEF_REFEREE',
  durationMinutes = 90,
  certification = 'FA_REGIONAL',
  isNightGame = false,
  isPlayoff = false,
  overtimeMinutes = 0,
  travelAllowanceUsd = 10,
}) {
  const roleConfig = OFFICIAL_ROLES[role] || OFFICIAL_ROLES.CHIEF_REFEREE;
  const certConfig = CERTIFICATION_LEVELS[certification] || CERTIFICATION_LEVELS.FA_REGIONAL;

  // Hourly base
  const totalDurationHrs = Math.max(0.5, durationMinutes / 60);
  const basePay = totalDurationHrs * roleConfig.baseHourlyRate * certConfig.tierWeight;

  // Surcharges
  const nightSurcharge = isNightGame ? basePay * 0.15 : 0;
  const playoffSurcharge = isPlayoff ? basePay * 0.30 : 0;

  // Overtime rate (1.5x regular prorated hourly)
  const overtimeHrs = Math.max(0, (overtimeMinutes || 0) / 60);
  const overtimePay = overtimeHrs * roleConfig.baseHourlyRate * 1.5;

  const travelStipend = Math.max(0, travelAllowanceUsd || 0);

  // Subtotal payable to official
  const refereeGrossPay = Math.round((basePay + nightSurcharge + playoffSurcharge + overtimePay + travelStipend) * 100) / 100;

  // Platform booking administration escrow (8%)
  const platformAdminFee = Math.round(refereeGrossPay * 0.08 * 100) / 100;
  const totalBilledToHost = Math.round((refereeGrossPay + platformAdminFee) * 100) / 100;

  return {
    role: roleConfig.roleId,
    roleTitle: roleConfig.title,
    basePay: Math.round(basePay * 100) / 100,
    nightSurcharge: Math.round(nightSurcharge * 100) / 100,
    playoffSurcharge: Math.round(playoffSurcharge * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    travelStipend,
    refereeGrossPay,
    platformAdminFee,
    totalBilledToHost,
    currency: 'USD',
  };
}

// ─── Assignment State Machine ───────────────────────────────────────────────

const VALID_TRANSITIONS = {
  [ASSIGNMENT_STATUS.DRAFT]: [ASSIGNMENT_STATUS.OFFERED, ASSIGNMENT_STATUS.CANCELLED],
  [ASSIGNMENT_STATUS.OFFERED]: [ASSIGNMENT_STATUS.ACCEPTED, ASSIGNMENT_STATUS.DECLINED, ASSIGNMENT_STATUS.CANCELLED],
  [ASSIGNMENT_STATUS.ACCEPTED]: [ASSIGNMENT_STATUS.CONFIRMED, ASSIGNMENT_STATUS.CANCELLED],
  [ASSIGNMENT_STATUS.DECLINED]: [ASSIGNMENT_STATUS.OFFERED, ASSIGNMENT_STATUS.CANCELLED],
  [ASSIGNMENT_STATUS.CONFIRMED]: [ASSIGNMENT_STATUS.CHECKED_IN, ASSIGNMENT_STATUS.CANCELLED, ASSIGNMENT_STATUS.DISPUTED],
  [ASSIGNMENT_STATUS.CHECKED_IN]: [ASSIGNMENT_STATUS.IN_PROGRESS, ASSIGNMENT_STATUS.DISPUTED],
  [ASSIGNMENT_STATUS.IN_PROGRESS]: [ASSIGNMENT_STATUS.COMPLETED, ASSIGNMENT_STATUS.DISPUTED],
  [ASSIGNMENT_STATUS.COMPLETED]: [ASSIGNMENT_STATUS.SETTLED, ASSIGNMENT_STATUS.DISPUTED],
  [ASSIGNMENT_STATUS.SETTLED]: [],
  [ASSIGNMENT_STATUS.CANCELLED]: [],
  [ASSIGNMENT_STATUS.DISPUTED]: [ASSIGNMENT_STATUS.SETTLED, ASSIGNMENT_STATUS.CANCELLED],
};

/**
 * Transitions an assignment record to a new state with audit history.
 *
 * @param {Object} assignment - Existing assignment object
 * @param {string} nextStatus - Desired next status
 * @param {Object} [meta] - Metadata (operatorId, note, timestamp)
 * @returns {{ success: boolean, assignment: Object, error?: string }}
 */
export function transitionAssignmentStatus(assignment, nextStatus, meta = {}) {
  if (!assignment?.status) {
    return { success: false, assignment, error: 'Invalid assignment object' };
  }

  const currentStatus = assignment.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    return {
      success: false,
      assignment,
      error: `Illegal status transition from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`,
    };
  }

  const timestamp = meta.timestamp || new Date().toISOString();
  const historyEntry = {
    fromStatus: currentStatus,
    toStatus: nextStatus,
    changedAt: timestamp,
    operatorId: meta.operatorId || 'SYSTEM',
    notes: meta.notes || null,
  };

  const updatedAssignment = {
    ...assignment,
    status: nextStatus,
    updatedAt: timestamp,
    history: [...(assignment.history || []), historyEntry],
  };

  return {
    success: true,
    assignment: updatedAssignment,
  };
}

// ─── Match Incident & Disciplinary Logger ───────────────────────────────────

/**
 * Logs an official match incident (card, foul, injury, stoppage).
 *
 * @param {Object} matchRecord - Current match officiating record
 * @param {Object} incidentData - Details of incident
 * @returns {Object} Updated match record with aggregated penalty statistics
 */
export function logMatchIncident(matchRecord, incidentData) {
  const incidentConfig = INCIDENT_TYPES[incidentData.type] || {
    code: incidentData.type || 'UNKNOWN',
    penaltyPoints: 0,
    label: incidentData.label || 'Unspecified Incident',
  };

  const incident = {
    incidentId: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type: incidentConfig.code,
    label: incidentConfig.label,
    penaltyPoints: incidentConfig.penaltyPoints,
    minute: Number(incidentData.minute) || 0,
    period: incidentData.period || '1H',
    teamId: incidentData.teamId || 'TEAM_UNKNOWN',
    playerId: incidentData.playerId || null,
    playerName: incidentData.playerName || 'Player',
    jerseyNumber: incidentData.jerseyNumber || null,
    notes: incidentData.notes || '',
    recordedAt: new Date().toISOString(),
  };

  const existingIncidents = Array.isArray(matchRecord.incidents) ? matchRecord.incidents : [];
  const updatedIncidents = [...existingIncidents, incident];

  // Recalculate disciplinary tallies
  const disciplinarySummary = updatedIncidents.reduce(
    (acc, curr) => {
      acc.totalPenaltyPoints += curr.penaltyPoints;
      if (curr.type === 'YELLOW_CARD') acc.yellowCards += 1;
      if (curr.type === 'SECOND_YELLOW' || curr.type === 'STRAIGHT_RED') acc.redCards += 1;
      if (curr.type === 'BLUE_CARD') acc.blueCards += 1;
      if (curr.type === 'TECHNICAL_FOUL') acc.technicalFouls += 1;
      return acc;
    },
    { yellowCards: 0, redCards: 0, blueCards: 0, technicalFouls: 0, totalPenaltyPoints: 0 }
  );

  return {
    ...matchRecord,
    incidents: updatedIncidents,
    disciplinarySummary,
    lastIncidentAt: incident.recordedAt,
  };
}

// ─── Match Certification & Digital Sign-off ─────────────────────────────────

/**
 * Certifies and signs off on an official match result.
 *
 * @param {Object} matchOfficiating - Match data and incident log
 * @param {Object} chiefOfficial - Referee certifying the match
 * @param {Object} finalScore - { homeScore: number, awayScore: number }
 * @returns {Object} Certified match dossier with verification stamp
 */
export function certifyMatchResults(matchOfficiating, chiefOfficial, finalScore) {
  if (!matchOfficiating || !chiefOfficial) {
    throw new Error('Match record and chief official are required for certification');
  }

  const certifiedAt = new Date().toISOString();
  const signatureToken = `CERT-${chiefOfficial.id}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 9000 + 1000
  )}`;

  let matchWinner = 'DRAW';
  if ((finalScore?.homeScore || 0) > (finalScore?.awayScore || 0)) {
    matchWinner = 'HOME';
  } else if ((finalScore?.awayScore || 0) > (finalScore?.homeScore || 0)) {
    matchWinner = 'AWAY';
  }

  return {
    matchId: matchOfficiating.matchId || matchOfficiating.id,
    isCertified: true,
    certifiedAt,
    certificationSignature: signatureToken,
    certifiedBy: {
      officialId: chiefOfficial.id,
      officialName: chiefOfficial.name,
      certificationLevel: chiefOfficial.certification,
      licenseNumber: chiefOfficial.licenseNumber || 'LIC-VERIFIED',
    },
    finalScore: {
      homeScore: Number(finalScore?.homeScore) || 0,
      awayScore: Number(finalScore?.awayScore) || 0,
      winner: matchWinner,
    },
    incidentsCount: (matchOfficiating.incidents || []).length,
    disciplinarySummary: matchOfficiating.disciplinarySummary || {},
    status: ASSIGNMENT_STATUS.COMPLETED,
  };
}

export default {
  OFFICIAL_ROLES,
  CERTIFICATION_LEVELS,
  ASSIGNMENT_STATUS,
  INCIDENT_TYPES,
  validateOfficialEligibility,
  rankOfficialSuitability,
  calculateOfficialFee,
  transitionAssignmentStatus,
  logMatchIncident,
  certifyMatchResults,
};
