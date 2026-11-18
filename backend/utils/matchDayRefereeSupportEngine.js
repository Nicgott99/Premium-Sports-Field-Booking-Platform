/**
 * matchDayRefereeSupportEngine.js
 *
 * Match-day referee duty management engine.
 * Handles referee roster management, fitness and certification validation,
 * match assignment, AR/VAR coordination, and pre-match readiness sign-offs
 * in accordance with FIFA/UEFA officiating standards.
 *
 * @module matchDayRefereeSupportEngine
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const REFEREE_GRADES = {
  FIFA_INTERNATIONAL: { id: 'fifa_international', label: 'FIFA International', maxLeagueLevel: 1 },
  NATIONAL_A: { id: 'national_a', label: 'National A', maxLeagueLevel: 2 },
  NATIONAL_B: { id: 'national_b', label: 'National B', maxLeagueLevel: 3 },
  REGIONAL: { id: 'regional', label: 'Regional', maxLeagueLevel: 4 },
  GRASSROOTS: { id: 'grassroots', label: 'Grassroots', maxLeagueLevel: 5 },
};

export const OFFICIAL_ROLES = {
  CENTRE_REFEREE: 'CENTRE_REFEREE',
  ASSISTANT_REFEREE_1: 'ASSISTANT_REFEREE_1',
  ASSISTANT_REFEREE_2: 'ASSISTANT_REFEREE_2',
  FOURTH_OFFICIAL: 'FOURTH_OFFICIAL',
  VAR_OPERATOR: 'VAR_OPERATOR',
  AVAR_OPERATOR: 'AVAR_OPERATOR',
};

export const ASSIGNMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  MATCH_STARTED: 'MATCH_STARTED',
  COMPLETED: 'COMPLETED',
  WITHDREW: 'WITHDREW',
  NO_SHOW: 'NO_SHOW',
};

export const FITNESS_STATUS = {
  FIT: 'FIT',
  MINOR_ISSUE: 'MINOR_ISSUE',
  UNFIT: 'UNFIT',
  PENDING_ASSESSMENT: 'PENDING_ASSESSMENT',
};

export const CERT_STATUS = {
  CURRENT: 'CURRENT',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
};

// Days before expiry to flag as EXPIRING_SOON
const CERT_EXPIRY_WARN_DAYS = 30;

// Minimum rest hours between assignments
export const MIN_REST_HOURS = 48;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validates a referee record.
 * @param {Object} referee
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateReferee(referee) {
  const errors = [];

  if (!referee || typeof referee !== 'object') {
    return { valid: false, errors: ['Referee must be a non-null object.'] };
  }
  if (!referee.refereeId || typeof referee.refereeId !== 'string') {
    errors.push('refereeId must be a non-empty string.');
  }
  if (!referee.name || typeof referee.name !== 'string') {
    errors.push('name must be a non-empty string.');
  }
  if (!Object.values(REFEREE_GRADES).map((g) => g.id).includes(referee.gradeId)) {
    errors.push(`gradeId must be one of: ${Object.values(REFEREE_GRADES).map((g) => g.id).join(', ')}.`);
  }
  if (!Array.isArray(referee.qualifiedRoles) || referee.qualifiedRoles.length === 0) {
    errors.push('qualifiedRoles must be a non-empty array of OFFICIAL_ROLES values.');
  }
  if (!referee.certExpiryDate || isNaN(new Date(referee.certExpiryDate).getTime())) {
    errors.push('certExpiryDate must be a valid ISO 8601 date string.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a match assignment request.
 * @param {Object} req
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAssignmentRequest(req) {
  const errors = [];

  if (!req || typeof req !== 'object') {
    return { valid: false, errors: ['Assignment request must be a non-null object.'] };
  }
  if (!req.matchId || typeof req.matchId !== 'string') {
    errors.push('matchId must be a non-empty string.');
  }
  if (!req.refereeId || typeof req.refereeId !== 'string') {
    errors.push('refereeId must be a non-empty string.');
  }
  if (!Object.values(OFFICIAL_ROLES).includes(req.role)) {
    errors.push(`role must be one of: ${Object.values(OFFICIAL_ROLES).join(', ')}.`);
  }
  if (!req.matchKickoffAt || isNaN(new Date(req.matchKickoffAt).getTime())) {
    errors.push('matchKickoffAt must be a valid ISO 8601 datetime string.');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Certification and fitness checks
// ---------------------------------------------------------------------------

/**
 * Evaluates the certification status of a referee relative to today.
 * @param {string} certExpiryDate - ISO date string
 * @returns {{ status: string, daysRemaining: number }}
 */
export function evaluateCertStatus(certExpiryDate) {
  const expiry = new Date(certExpiryDate);
  const now = new Date();
  const msRemaining = expiry.getTime() - now.getTime();
  const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));

  let status;
  if (daysRemaining < 0) {
    status = CERT_STATUS.EXPIRED;
  } else if (daysRemaining <= CERT_EXPIRY_WARN_DAYS) {
    status = CERT_STATUS.EXPIRING_SOON;
  } else {
    status = CERT_STATUS.CURRENT;
  }

  return { status, daysRemaining };
}

/**
 * Checks whether a referee is eligible for a given role and league level.
 * @param {Object} referee
 * @param {string} role - One of OFFICIAL_ROLES values
 * @param {number} leagueLevel - Numeric league tier (1 = top)
 * @returns {{ eligible: boolean, reasons: string[] }}
 */
export function checkEligibility(referee, role, leagueLevel) {
  const reasons = [];

  const grade = Object.values(REFEREE_GRADES).find((g) => g.id === referee.gradeId);
  if (!grade) {
    reasons.push(`Unknown gradeId: ${referee.gradeId}`);
  } else if (leagueLevel < grade.maxLeagueLevel) {
    reasons.push(
      `Grade "${grade.label}" only qualifies up to league level ${grade.maxLeagueLevel}; requested level ${leagueLevel}.`,
    );
  }

  if (!referee.qualifiedRoles.includes(role)) {
    reasons.push(`Referee is not qualified for role "${role}".`);
  }

  const cert = evaluateCertStatus(referee.certExpiryDate);
  if (cert.status === CERT_STATUS.EXPIRED) {
    reasons.push(`Certification expired ${Math.abs(cert.daysRemaining)} days ago.`);
  }

  if (referee.fitnessStatus === FITNESS_STATUS.UNFIT) {
    reasons.push('Referee is marked as UNFIT.');
  }

  return { eligible: reasons.length === 0, reasons };
}

/**
 * Checks whether sufficient rest has elapsed since a referee's last match.
 * @param {string|null} lastMatchAt - ISO datetime of last match end, or null
 * @param {string} nextMatchAt - ISO datetime of next match kickoff
 * @returns {{ adequate: boolean, restHours: number }}
 */
export function checkRestPeriod(lastMatchAt, nextMatchAt) {
  if (!lastMatchAt) {
    return { adequate: true, restHours: Infinity };
  }
  const last = new Date(lastMatchAt);
  const next = new Date(nextMatchAt);
  const restHours = (next.getTime() - last.getTime()) / (1000 * 60 * 60);
  return { adequate: restHours >= MIN_REST_HOURS, restHours: Math.round(restHours * 10) / 10 };
}

// ---------------------------------------------------------------------------
// Assignment lifecycle
// ---------------------------------------------------------------------------

/**
 * Creates a match assignment record after eligibility checks.
 * @param {Object} referee - Referee record
 * @param {Object} req - Assignment request
 * @param {number} leagueLevel - Numeric league tier
 * @returns {Object} Assignment record
 */
export function createAssignment(referee, req, leagueLevel = 3) {
  const reqValidation = validateAssignmentRequest(req);
  if (!reqValidation.valid) {
    throw new Error(`Invalid assignment request: ${reqValidation.errors.join('; ')}`);
  }

  const eligibility = checkEligibility(referee, req.role, leagueLevel);
  const cert = evaluateCertStatus(referee.certExpiryDate);
  const rest = checkRestPeriod(referee.lastMatchAt ?? null, req.matchKickoffAt);

  return {
    assignmentId: `ASGN-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    matchId: req.matchId,
    refereeId: referee.refereeId,
    refereeName: referee.name,
    role: req.role,
    matchKickoffAt: req.matchKickoffAt,
    status: ASSIGNMENT_STATUS.PENDING,
    eligibility,
    certStatus: cert.status,
    certDaysRemaining: cert.daysRemaining,
    restCheck: rest,
    fitnessStatus: referee.fitnessStatus ?? FITNESS_STATUS.PENDING_ASSESSMENT,
    preMatchSignOff: false,
    signOffBy: null,
    signOffAt: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Records a pre-match readiness sign-off on an assignment.
 * @param {Object} assignment
 * @param {string} officialName - Name of the signing official
 * @returns {Object} Updated assignment
 */
export function signOffPreMatch(assignment, officialName) {
  if (!assignment || assignment.status === ASSIGNMENT_STATUS.WITHDREW) {
    throw new Error('Cannot sign off a withdrawn or missing assignment.');
  }
  if (!officialName || typeof officialName !== 'string') {
    throw new Error('officialName must be a non-empty string.');
  }

  return {
    ...assignment,
    status: ASSIGNMENT_STATUS.CONFIRMED,
    preMatchSignOff: true,
    signOffBy: officialName,
    signOffAt: new Date().toISOString(),
  };
}

/**
 * Builds a match-day officiating panel from multiple assignments.
 * @param {Object[]} assignments - Array of assignment records
 * @returns {Object} Panel summary
 */
export function buildMatchPanel(assignments) {
  if (!Array.isArray(assignments)) {
    throw new Error('assignments must be an array.');
  }

  const panel = {};
  const warnings = [];

  for (const a of assignments) {
    if (panel[a.role]) {
      warnings.push(`Duplicate role "${a.role}" for match "${a.matchId}".`);
    }
    panel[a.role] = {
      assignmentId: a.assignmentId,
      refereeName: a.refereeName,
      status: a.status,
      preMatchSignOff: a.preMatchSignOff,
      eligibility: a.eligibility,
    };
  }

  const requiredRoles = [
    OFFICIAL_ROLES.CENTRE_REFEREE,
    OFFICIAL_ROLES.ASSISTANT_REFEREE_1,
    OFFICIAL_ROLES.ASSISTANT_REFEREE_2,
  ];
  const missingRoles = requiredRoles.filter((r) => !panel[r]);
  if (missingRoles.length > 0) {
    warnings.push(`Missing required roles: ${missingRoles.join(', ')}.`);
  }

  const allSignedOff = Object.values(panel).every((p) => p.preMatchSignOff);
  const anyIneligible = Object.values(panel).some((p) => !p.eligibility.eligible);

  return {
    matchId: assignments[0]?.matchId ?? null,
    panelReady: missingRoles.length === 0 && allSignedOff && !anyIneligible,
    allSignedOff,
    anyIneligible,
    missingRoles,
    warnings,
    roles: panel,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Produces a referee utilisation summary from a list of assignments.
 * @param {Object[]} assignments
 * @returns {Object} Utilisation report
 */
export function buildUtilisationReport(assignments) {
  if (!Array.isArray(assignments)) {
    throw new Error('assignments must be an array.');
  }

  const byReferee = {};

  for (const a of assignments) {
    const key = a.refereeId;
    if (!byReferee[key]) {
      byReferee[key] = {
        refereeId: key,
        refereeName: a.refereeName,
        totalAssignments: 0,
        completedMatches: 0,
        withdrawals: 0,
        rolesCount: {},
      };
    }
    byReferee[key].totalAssignments += 1;
    if (a.status === ASSIGNMENT_STATUS.COMPLETED) {
      byReferee[key].completedMatches += 1;
    }
    if (a.status === ASSIGNMENT_STATUS.WITHDREW) {
      byReferee[key].withdrawals += 1;
    }
    byReferee[key].rolesCount[a.role] = (byReferee[key].rolesCount[a.role] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    totalAssignments: assignments.length,
    byReferee: Object.values(byReferee),
  };
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  REFEREE_GRADES,
  OFFICIAL_ROLES,
  ASSIGNMENT_STATUS,
  FITNESS_STATUS,
  CERT_STATUS,
  MIN_REST_HOURS,
  validateReferee,
  validateAssignmentRequest,
  evaluateCertStatus,
  checkEligibility,
  checkRestPeriod,
  createAssignment,
  signOffPreMatch,
  buildMatchPanel,
  buildUtilisationReport,
};
