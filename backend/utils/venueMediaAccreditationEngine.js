/**
 * venueMediaAccreditationEngine.js
 *
 * Venue media accreditation management engine.
 * Handles media organisation registration, individual credential applications,
 * vetting and approval workflows, zone-access control, bibs/vest assignment,
 * and match-day check-in logging for journalists, photographers, and broadcasters.
 * Complies with UEFA/FIFA media operations guidelines.
 *
 * @module venueMediaAccreditationEngine
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MEDIA_TYPES = {
  PRINT:         'PRINT',
  BROADCAST_TV:  'BROADCAST_TV',
  BROADCAST_RADIO: 'BROADCAST_RADIO',
  ONLINE:        'ONLINE',
  PHOTOGRAPHY:   'PHOTOGRAPHY',
  AGENCY:        'AGENCY',
  PODCAST:       'PODCAST',
};

export const CREDENTIAL_ROLES = {
  JOURNALIST:        'JOURNALIST',
  PHOTOGRAPHER:      'PHOTOGRAPHER',
  CAMERA_OPERATOR:   'CAMERA_OPERATOR',
  SOUND_ENGINEER:    'SOUND_ENGINEER',
  PRODUCER:          'PRODUCER',
  REPORTER:          'REPORTER',
  EDITOR:            'EDITOR',
  SOCIAL_MEDIA:      'SOCIAL_MEDIA',
};

export const ACCESS_ZONES = {
  PRESS_BOX:         'PRESS_BOX',
  MIXED_ZONE:        'MIXED_ZONE',
  PITCH_SIDE:        'PITCH_SIDE',         // Photographers / TV cameras
  PRESS_CONFERENCE:  'PRESS_CONFERENCE',
  TV_GANTRY:         'TV_GANTRY',
  TUNNEL:            'TUNNEL',
  MEDIA_CENTRE:      'MEDIA_CENTRE',
  BROADCAST_COMPOUND:'BROADCAST_COMPOUND',
};

export const ACCREDITATION_STATUS = {
  DRAFT:      'DRAFT',
  SUBMITTED:  'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED:   'APPROVED',
  REJECTED:   'REJECTED',
  REVOKED:    'REVOKED',
  EXPIRED:    'EXPIRED',
};

export const VETTING_OUTCOMES = {
  PASS:            'PASS',
  CONDITIONAL:     'CONDITIONAL',
  FAIL:            'FAIL',
  PENDING:         'PENDING',
};

// Default zone access by role (least-privilege principle)
export const DEFAULT_ZONE_ACCESS = {
  [CREDENTIAL_ROLES.JOURNALIST]:      [ACCESS_ZONES.PRESS_BOX, ACCESS_ZONES.PRESS_CONFERENCE, ACCESS_ZONES.MIXED_ZONE, ACCESS_ZONES.MEDIA_CENTRE],
  [CREDENTIAL_ROLES.PHOTOGRAPHER]:    [ACCESS_ZONES.PITCH_SIDE, ACCESS_ZONES.MIXED_ZONE, ACCESS_ZONES.MEDIA_CENTRE, ACCESS_ZONES.PRESS_CONFERENCE],
  [CREDENTIAL_ROLES.CAMERA_OPERATOR]: [ACCESS_ZONES.TV_GANTRY, ACCESS_ZONES.PITCH_SIDE, ACCESS_ZONES.BROADCAST_COMPOUND, ACCESS_ZONES.MIXED_ZONE],
  [CREDENTIAL_ROLES.SOUND_ENGINEER]:  [ACCESS_ZONES.BROADCAST_COMPOUND, ACCESS_ZONES.TV_GANTRY],
  [CREDENTIAL_ROLES.PRODUCER]:        [ACCESS_ZONES.BROADCAST_COMPOUND, ACCESS_ZONES.PRESS_CONFERENCE, ACCESS_ZONES.MEDIA_CENTRE],
  [CREDENTIAL_ROLES.REPORTER]:        [ACCESS_ZONES.PRESS_BOX, ACCESS_ZONES.MIXED_ZONE, ACCESS_ZONES.PRESS_CONFERENCE, ACCESS_ZONES.MEDIA_CENTRE],
  [CREDENTIAL_ROLES.EDITOR]:          [ACCESS_ZONES.MEDIA_CENTRE, ACCESS_ZONES.PRESS_CONFERENCE],
  [CREDENTIAL_ROLES.SOCIAL_MEDIA]:    [ACCESS_ZONES.MEDIA_CENTRE, ACCESS_ZONES.PRESS_CONFERENCE],
};

// Max pitch-side photographers per match (UEFA guideline)
export const MAX_PITCH_SIDE_PHOTOGRAPHERS = 20;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validates a media organisation record.
 * @param {Object} org
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateOrganisation(org) {
  const errors = [];
  if (!org || typeof org !== 'object') return { valid: false, errors: ['Organisation must be a non-null object.'] };
  if (!org.orgId   || typeof org.orgId   !== 'string') errors.push('orgId must be a non-empty string.');
  if (!org.name    || typeof org.name    !== 'string') errors.push('name must be a non-empty string.');
  if (!Object.values(MEDIA_TYPES).includes(org.mediaType)) {
    errors.push(`mediaType must be one of: ${Object.values(MEDIA_TYPES).join(', ')}.`);
  }
  if (!org.country || typeof org.country !== 'string') errors.push('country must be a non-empty string.');
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a credential application.
 * @param {Object} app
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateApplication(app) {
  const errors = [];
  if (!app || typeof app !== 'object') return { valid: false, errors: ['Application must be a non-null object.'] };
  if (!app.orgId        || typeof app.orgId        !== 'string') errors.push('orgId must be a non-empty string.');
  if (!app.applicantName|| typeof app.applicantName!== 'string') errors.push('applicantName must be a non-empty string.');
  if (!app.email        || typeof app.email        !== 'string') errors.push('email must be a non-empty string.');
  if (!Object.values(CREDENTIAL_ROLES).includes(app.role)) {
    errors.push(`role must be one of: ${Object.values(CREDENTIAL_ROLES).join(', ')}.`);
  }
  if (!app.eventId || typeof app.eventId !== 'string') errors.push('eventId must be a non-empty string.');
  if (app.requestedZones && !Array.isArray(app.requestedZones)) {
    errors.push('requestedZones must be an array when provided.');
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Organisation management
// ---------------------------------------------------------------------------

/**
 * Creates a registered media organisation.
 * @param {Object} params
 * @returns {Object} Organisation record
 */
export function createOrganisation(params) {
  const v = validateOrganisation(params);
  if (!v.valid) throw new Error(`Invalid organisation: ${v.errors.join('; ')}`);
  return {
    orgId:         params.orgId,
    name:          params.name,
    mediaType:     params.mediaType,
    country:       params.country,
    website:       params.website || null,
    contactEmail:  params.contactEmail || null,
    isAccredited:  false,
    registeredAt:  new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Credential application lifecycle
// ---------------------------------------------------------------------------

/**
 * Submits a new credential application.
 * @param {Object} app - Application request
 * @returns {Object} Application record
 */
export function submitApplication(app) {
  const v = validateApplication(app);
  if (!v.valid) throw new Error(`Invalid application: ${v.errors.join('; ')}`);

  const defaultZones = DEFAULT_ZONE_ACCESS[app.role] ?? [ACCESS_ZONES.MEDIA_CENTRE];
  const requestedZones = app.requestedZones
    ? [...new Set([...defaultZones, ...app.requestedZones])]
    : defaultZones;

  return {
    applicationId:   `APP-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    orgId:           app.orgId,
    applicantName:   app.applicantName,
    email:           app.email.toLowerCase().trim(),
    role:            app.role,
    eventId:         app.eventId,
    requestedZones,
    approvedZones:   [],
    status:          ACCREDITATION_STATUS.SUBMITTED,
    vettingOutcome:  VETTING_OUTCOMES.PENDING,
    vettingNotes:    '',
    bibNumber:       null,
    vestColour:      null,
    submittedAt:     new Date().toISOString(),
    reviewedAt:      null,
    approvedAt:      null,
    checkedInAt:     null,
    checkedOutAt:    null,
    revokedAt:       null,
    revokedReason:   null,
  };
}

/**
 * Advances application to UNDER_REVIEW state.
 * @param {Object} application
 * @returns {Object} Updated application
 */
export function startReview(application) {
  if (application.status !== ACCREDITATION_STATUS.SUBMITTED) {
    throw new Error(`Only SUBMITTED applications can enter review (current: ${application.status}).`);
  }
  return { ...application, status: ACCREDITATION_STATUS.UNDER_REVIEW, reviewedAt: new Date().toISOString() };
}

/**
 * Records a vetting outcome on an application under review.
 * @param {Object} application
 * @param {string} outcome   - One of VETTING_OUTCOMES values
 * @param {string} [notes]   - Optional reviewer notes
 * @returns {Object} Updated application
 */
export function recordVettingOutcome(application, outcome, notes = '') {
  if (application.status !== ACCREDITATION_STATUS.UNDER_REVIEW) {
    throw new Error(`Vetting can only be recorded on UNDER_REVIEW applications (current: ${application.status}).`);
  }
  if (!Object.values(VETTING_OUTCOMES).includes(outcome)) {
    throw new Error(`outcome must be one of: ${Object.values(VETTING_OUTCOMES).join(', ')}.`);
  }
  return { ...application, vettingOutcome: outcome, vettingNotes: notes };
}

/**
 * Approves a credential application, assigning zone access and bib number.
 * @param {Object} application
 * @param {Object} options
 * @param {string[]} [options.approvedZones]  - Zones to grant (defaults to requestedZones)
 * @param {number}  [options.bibNumber]       - Bib/vest number for pitch-side access
 * @param {string}  [options.vestColour]      - Vest colour code
 * @returns {Object} Updated application
 */
export function approveApplication(application, options = {}) {
  if (application.status !== ACCREDITATION_STATUS.UNDER_REVIEW) {
    throw new Error(`Only UNDER_REVIEW applications can be approved (current: ${application.status}).`);
  }
  if (application.vettingOutcome === VETTING_OUTCOMES.FAIL) {
    throw new Error('Cannot approve an application with a FAIL vetting outcome.');
  }

  const approvedZones = options.approvedZones ?? application.requestedZones;

  return {
    ...application,
    status:        ACCREDITATION_STATUS.APPROVED,
    approvedZones,
    bibNumber:     options.bibNumber ?? null,
    vestColour:    options.vestColour ?? null,
    approvedAt:    new Date().toISOString(),
  };
}

/**
 * Rejects a credential application.
 * @param {Object} application
 * @param {string} reason
 * @returns {Object} Updated application
 */
export function rejectApplication(application, reason) {
  if (![ACCREDITATION_STATUS.UNDER_REVIEW, ACCREDITATION_STATUS.SUBMITTED].includes(application.status)) {
    throw new Error(`Application cannot be rejected in status "${application.status}".`);
  }
  if (!reason || typeof reason !== 'string') throw new Error('reason must be a non-empty string.');
  return {
    ...application,
    status:        ACCREDITATION_STATUS.REJECTED,
    vettingNotes:  reason,
    reviewedAt:    application.reviewedAt ?? new Date().toISOString(),
  };
}

/**
 * Revokes an already-approved credential.
 * @param {Object} application
 * @param {string} reason
 * @returns {Object} Updated application
 */
export function revokeCredential(application, reason) {
  if (application.status !== ACCREDITATION_STATUS.APPROVED) {
    throw new Error(`Only APPROVED credentials can be revoked (current: ${application.status}).`);
  }
  if (!reason || typeof reason !== 'string') throw new Error('reason must be a non-empty string.');
  return {
    ...application,
    status:        ACCREDITATION_STATUS.REVOKED,
    revokedAt:     new Date().toISOString(),
    revokedReason: reason,
    approvedZones: [],
  };
}

// ---------------------------------------------------------------------------
// Match-day access control
// ---------------------------------------------------------------------------

/**
 * Checks whether a credential holder may access a specific zone.
 * @param {Object} application - Approved application record
 * @param {string} zone        - One of ACCESS_ZONES values
 * @returns {{ allowed: boolean, reasons: string[] }}
 */
export function checkZoneAccess(application, zone) {
  const reasons = [];
  if (application.status !== ACCREDITATION_STATUS.APPROVED) {
    reasons.push(`Credential status is "${application.status}", not APPROVED.`);
  }
  if (!application.approvedZones.includes(zone)) {
    reasons.push(`Zone "${zone}" is not on the approved access list.`);
  }
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Records match-day check-in for a credential holder.
 * @param {Object} application
 * @returns {Object} Updated application
 */
export function checkIn(application) {
  if (application.status !== ACCREDITATION_STATUS.APPROVED) {
    throw new Error(`Only APPROVED credentials can check in (current: ${application.status}).`);
  }
  return { ...application, checkedInAt: new Date().toISOString() };
}

/**
 * Records match-day check-out.
 * @param {Object} application
 * @returns {Object} Updated application
 */
export function checkOut(application) {
  if (!application.checkedInAt) throw new Error('Credential holder has not checked in.');
  return { ...application, checkedOutAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Quota and reporting
// ---------------------------------------------------------------------------

/**
 * Checks whether adding another pitch-side photographer would breach the UEFA cap.
 * @param {Object[]} applications - All approved applications for the event
 * @returns {{ withinQuota: boolean, current: number, max: number }}
 */
export function checkPitchSideQuota(applications) {
  const pitchSideApproved = applications.filter(
    (a) =>
      a.status === ACCREDITATION_STATUS.APPROVED &&
      a.approvedZones.includes(ACCESS_ZONES.PITCH_SIDE) &&
      a.role === CREDENTIAL_ROLES.PHOTOGRAPHER,
  ).length;

  return {
    withinQuota: pitchSideApproved < MAX_PITCH_SIDE_PHOTOGRAPHERS,
    current:     pitchSideApproved,
    max:         MAX_PITCH_SIDE_PHOTOGRAPHERS,
  };
}

/**
 * Builds a media accreditation summary report for an event.
 * @param {Object[]} applications
 * @param {string}   eventId
 * @returns {Object} Report
 */
export function buildAccreditationReport(applications, eventId) {
  if (!Array.isArray(applications)) throw new Error('applications must be an array.');

  const byStatus = {};
  const byRole   = {};
  const byOrg    = {};

  for (const app of applications) {
    byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
    byRole[app.role]     = (byRole[app.role]     ?? 0) + 1;
    byOrg[app.orgId]     = (byOrg[app.orgId]     ?? 0) + 1;
  }

  const checkedIn  = applications.filter((a) => a.checkedInAt).length;
  const approved   = applications.filter((a) => a.status === ACCREDITATION_STATUS.APPROVED).length;
  const pitchQuota = checkPitchSideQuota(applications);

  return {
    reportId:          `MRPT-${Date.now()}`,
    eventId:           eventId || null,
    generatedAt:       new Date().toISOString(),
    totalApplications: applications.length,
    approvedCount:     approved,
    checkedInCount:    checkedIn,
    byStatus,
    byRole,
    organisationCount: Object.keys(byOrg).length,
    pitchSideQuota:    pitchQuota,
  };
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  MEDIA_TYPES,
  CREDENTIAL_ROLES,
  ACCESS_ZONES,
  ACCREDITATION_STATUS,
  VETTING_OUTCOMES,
  DEFAULT_ZONE_ACCESS,
  MAX_PITCH_SIDE_PHOTOGRAPHERS,
  validateOrganisation,
  validateApplication,
  createOrganisation,
  submitApplication,
  startReview,
  recordVettingOutcome,
  approveApplication,
  rejectApplication,
  revokeCredential,
  checkZoneAccess,
  checkIn,
  checkOut,
  checkPitchSideQuota,
  buildAccreditationReport,
};
