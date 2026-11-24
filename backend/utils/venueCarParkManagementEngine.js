/**
 * venueCarParkManagementEngine.js
 *
 * Venue car park management engine.
 * Handles multi-zone car park configuration, space booking and release,
 * permit and season-pass validation, real-time occupancy tracking,
 * barrier control event logging, and end-of-event revenue reporting.
 *
 * @module venueCarParkManagementEngine
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ZONE_TYPES = {
  GENERAL:    'GENERAL',
  ACCESSIBLE: 'ACCESSIBLE',   // Disabled badge holders
  VIP:        'VIP',
  COACH:      'COACH',        // Coaches / minibuses
  STAFF:      'STAFF',
  ELECTRIC:   'ELECTRIC',     // EV charging bays
};

export const SPACE_STATUS = {
  AVAILABLE:  'AVAILABLE',
  RESERVED:   'RESERVED',
  OCCUPIED:   'OCCUPIED',
  BLOCKED:    'BLOCKED',      // Maintenance / coned off
};

export const BOOKING_STATUS = {
  PENDING:    'PENDING',
  CONFIRMED:  'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED:  'COMPLETED',
  CANCELLED:  'CANCELLED',
  NO_SHOW:    'NO_SHOW',
};

export const PERMIT_TYPES = {
  MATCH_DAY:    'MATCH_DAY',
  SEASON_PASS:  'SEASON_PASS',
  ACCESSIBLE:   'ACCESSIBLE',
  STAFF_PASS:   'STAFF_PASS',
  VIP_PASS:     'VIP_PASS',
};

export const BARRIER_EVENTS = {
  ENTRY:  'ENTRY',
  EXIT:   'EXIT',
  DENIED: 'DENIED',
};

// Default tariffs per zone type (£ per event / per session)
export const DEFAULT_TARIFFS_GBP = {
  [ZONE_TYPES.GENERAL]:    10.00,
  [ZONE_TYPES.ACCESSIBLE]:  0.00,  // Free for blue badge holders
  [ZONE_TYPES.VIP]:        25.00,
  [ZONE_TYPES.COACH]:      15.00,
  [ZONE_TYPES.STAFF]:       0.00,  // Free for staff
  [ZONE_TYPES.ELECTRIC]:   12.00,  // Includes charge session
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validates a car park zone definition.
 * @param {Object} zone
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateZone(zone) {
  const errors = [];
  if (!zone || typeof zone !== 'object') return { valid: false, errors: ['Zone must be a non-null object.'] };
  if (!zone.zoneId || typeof zone.zoneId !== 'string') errors.push('zoneId must be a non-empty string.');
  if (!zone.name  || typeof zone.name  !== 'string') errors.push('name must be a non-empty string.');
  if (!Object.values(ZONE_TYPES).includes(zone.type)) {
    errors.push(`type must be one of: ${Object.values(ZONE_TYPES).join(', ')}.`);
  }
  if (!Number.isInteger(zone.totalSpaces) || zone.totalSpaces < 1) {
    errors.push('totalSpaces must be a positive integer.');
  }
  if (zone.tariffGBP !== undefined && (typeof zone.tariffGBP !== 'number' || zone.tariffGBP < 0)) {
    errors.push('tariffGBP must be a non-negative number.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a booking request.
 * @param {Object} req
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBookingRequest(req) {
  const errors = [];
  if (!req || typeof req !== 'object') return { valid: false, errors: ['Booking request must be a non-null object.'] };
  if (!req.zoneId || typeof req.zoneId !== 'string') errors.push('zoneId must be a non-empty string.');
  if (!req.vehicleReg || typeof req.vehicleReg !== 'string') errors.push('vehicleReg must be a non-empty string.');
  if (!Object.values(PERMIT_TYPES).includes(req.permitType)) {
    errors.push(`permitType must be one of: ${Object.values(PERMIT_TYPES).join(', ')}.`);
  }
  if (!req.holderName || typeof req.holderName !== 'string') errors.push('holderName must be a non-empty string.');
  if (req.eventId !== undefined && typeof req.eventId !== 'string') errors.push('eventId must be a string.');
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a permit record.
 * @param {Object} permit
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePermit(permit) {
  const errors = [];
  if (!permit || typeof permit !== 'object') return { valid: false, errors: ['Permit must be a non-null object.'] };
  if (!permit.permitId   || typeof permit.permitId   !== 'string') errors.push('permitId must be a non-empty string.');
  if (!permit.vehicleReg || typeof permit.vehicleReg !== 'string') errors.push('vehicleReg must be a non-empty string.');
  if (!Object.values(PERMIT_TYPES).includes(permit.permitType)) {
    errors.push(`permitType must be one of: ${Object.values(PERMIT_TYPES).join(', ')}.`);
  }
  if (!permit.validFrom || isNaN(new Date(permit.validFrom).getTime())) errors.push('validFrom must be a valid ISO 8601 datetime.');
  if (!permit.validUntil || isNaN(new Date(permit.validUntil).getTime())) errors.push('validUntil must be a valid ISO 8601 datetime.');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Zone management
// ---------------------------------------------------------------------------

/**
 * Creates a new car park zone record.
 * @param {Object} params
 * @returns {Object} Zone record
 */
export function createZone(params) {
  const v = validateZone(params);
  if (!v.valid) throw new Error(`Invalid zone: ${v.errors.join('; ')}`);

  const tariffGBP = params.tariffGBP ?? DEFAULT_TARIFFS_GBP[params.type] ?? 10.00;

  return {
    zoneId:       params.zoneId,
    name:         params.name,
    type:         params.type,
    totalSpaces:  params.totalSpaces,
    tariffGBP:    Math.round(tariffGBP * 100) / 100,
    occupiedCount: 0,
    reservedCount: 0,
    blockedCount:  0,
    description:  params.description || '',
    createdAt:    new Date().toISOString(),
  };
}

/**
 * Calculates the number of available spaces in a zone.
 * @param {Object} zone
 * @returns {number}
 */
export function availableSpaces(zone) {
  return Math.max(0, zone.totalSpaces - zone.occupiedCount - zone.reservedCount - zone.blockedCount);
}

/**
 * Returns the occupancy percentage of a zone.
 * @param {Object} zone
 * @returns {number}
 */
export function occupancyPct(zone) {
  return Math.round(((zone.occupiedCount + zone.reservedCount) / zone.totalSpaces) * 1000) / 10;
}

/**
 * Increments the blocked count (e.g. maintenance bay).
 * @param {Object} zone
 * @param {number} count
 * @returns {Object} Updated zone
 */
export function blockSpaces(zone, count) {
  if (!Number.isInteger(count) || count < 1) throw new Error('count must be a positive integer.');
  if (count > availableSpaces(zone)) throw new Error(`Cannot block ${count} spaces; only ${availableSpaces(zone)} available.`);
  return { ...zone, blockedCount: zone.blockedCount + count };
}

/**
 * Releases blocked spaces back to available.
 * @param {Object} zone
 * @param {number} count
 * @returns {Object} Updated zone
 */
export function unblockSpaces(zone, count) {
  if (!Number.isInteger(count) || count < 1) throw new Error('count must be a positive integer.');
  return { ...zone, blockedCount: Math.max(0, zone.blockedCount - count) };
}

// ---------------------------------------------------------------------------
// Permit management
// ---------------------------------------------------------------------------

/**
 * Creates a permit record.
 * @param {Object} params
 * @returns {Object} Permit record
 */
export function createPermit(params) {
  const v = validatePermit(params);
  if (!v.valid) throw new Error(`Invalid permit: ${v.errors.join('; ')}`);
  return {
    permitId:    params.permitId,
    vehicleReg:  params.vehicleReg.toUpperCase().trim(),
    permitType:  params.permitType,
    holderName:  params.holderName || '',
    validFrom:   params.validFrom,
    validUntil:  params.validUntil,
    allowedZoneTypes: params.allowedZoneTypes ?? [ZONE_TYPES.GENERAL],
    issuedAt:    new Date().toISOString(),
  };
}

/**
 * Checks whether a permit is currently valid and covers a given zone type.
 * @param {Object} permit
 * @param {string} zoneType
 * @param {string|Date} [atDate=now]
 * @returns {{ valid: boolean, reasons: string[] }}
 */
export function checkPermit(permit, zoneType, atDate = new Date()) {
  const reasons = [];
  const now = new Date(atDate);
  if (now < new Date(permit.validFrom))  reasons.push('Permit not yet active.');
  if (now > new Date(permit.validUntil)) reasons.push('Permit has expired.');
  if (!permit.allowedZoneTypes.includes(zoneType)) {
    reasons.push(`Permit does not cover zone type "${zoneType}".`);
  }
  return { valid: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// Booking lifecycle
// ---------------------------------------------------------------------------

/**
 * Creates a confirmed space booking for a zone.
 * @param {Object} zone - Zone record (will be mutated immutably)
 * @param {Object} req  - Booking request
 * @returns {{ booking: Object, zone: Object }} Updated booking and zone records
 */
export function createBooking(zone, req) {
  const v = validateBookingRequest(req);
  if (!v.valid) throw new Error(`Invalid booking request: ${v.errors.join('; ')}`);
  if (availableSpaces(zone) < 1) {
    throw new Error(`No available spaces in zone "${zone.zoneId}".`);
  }

  const booking = {
    bookingId:    `BKG-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    zoneId:       zone.zoneId,
    zoneName:     zone.name,
    zoneType:     zone.type,
    vehicleReg:   req.vehicleReg.toUpperCase().trim(),
    permitType:   req.permitType,
    holderName:   req.holderName,
    eventId:      req.eventId ?? null,
    tariffGBP:    zone.tariffGBP,
    status:       BOOKING_STATUS.CONFIRMED,
    spaceRef:     `${zone.zoneId}-${String(zone.occupiedCount + zone.reservedCount + 1).padStart(3, '0')}`,
    confirmedAt:  new Date().toISOString(),
    checkedInAt:  null,
    checkedOutAt: null,
    paidAt:       null,
  };

  const updatedZone = { ...zone, reservedCount: zone.reservedCount + 1 };
  return { booking, zone: updatedZone };
}

/**
 * Records barrier entry (check-in) for a booking.
 * @param {Object} booking
 * @param {Object} zone
 * @returns {{ booking: Object, zone: Object, barrierEvent: Object }}
 */
export function checkIn(booking, zone) {
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new Error(`Only CONFIRMED bookings can check in (current: ${booking.status}).`);
  }
  const now = new Date().toISOString();
  const updatedBooking = { ...booking, status: BOOKING_STATUS.CHECKED_IN, checkedInAt: now };
  const updatedZone    = { ...zone, reservedCount: Math.max(0, zone.reservedCount - 1), occupiedCount: zone.occupiedCount + 1 };
  const barrierEvent   = { eventType: BARRIER_EVENTS.ENTRY, bookingId: booking.bookingId, vehicleReg: booking.vehicleReg, zoneId: zone.zoneId, recordedAt: now };
  return { booking: updatedBooking, zone: updatedZone, barrierEvent };
}

/**
 * Records barrier exit (check-out) for a booking and marks it paid.
 * @param {Object} booking
 * @param {Object} zone
 * @returns {{ booking: Object, zone: Object, barrierEvent: Object }}
 */
export function checkOut(booking, zone) {
  if (booking.status !== BOOKING_STATUS.CHECKED_IN) {
    throw new Error(`Only CHECKED_IN bookings can check out (current: ${booking.status}).`);
  }
  const now = new Date().toISOString();
  const updatedBooking = { ...booking, status: BOOKING_STATUS.COMPLETED, checkedOutAt: now, paidAt: now };
  const updatedZone    = { ...zone, occupiedCount: Math.max(0, zone.occupiedCount - 1) };
  const barrierEvent   = { eventType: BARRIER_EVENTS.EXIT, bookingId: booking.bookingId, vehicleReg: booking.vehicleReg, zoneId: zone.zoneId, recordedAt: now };
  return { booking: updatedBooking, zone: updatedZone, barrierEvent };
}

/**
 * Cancels a booking (before check-in).
 * @param {Object} booking
 * @param {Object} zone
 * @returns {{ booking: Object, zone: Object }}
 */
export function cancelBooking(booking, zone) {
  if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
    throw new Error(`Only PENDING or CONFIRMED bookings can be cancelled (current: ${booking.status}).`);
  }
  const updatedBooking = { ...booking, status: BOOKING_STATUS.CANCELLED, cancelledAt: new Date().toISOString() };
  const updatedZone    = { ...zone, reservedCount: Math.max(0, zone.reservedCount - 1) };
  return { booking: updatedBooking, zone: updatedZone };
}

// ---------------------------------------------------------------------------
// Revenue reporting
// ---------------------------------------------------------------------------

/**
 * Builds an end-of-event revenue and utilisation report.
 * @param {Object[]} bookings - Array of booking records
 * @param {Object[]} zones    - Array of zone records (final state)
 * @param {string}   eventId  - Event identifier
 * @returns {Object} Revenue report
 */
export function buildEventReport(bookings, zones, eventId) {
  if (!Array.isArray(bookings)) throw new Error('bookings must be an array.');
  if (!Array.isArray(zones))    throw new Error('zones must be an array.');

  const completed  = bookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED);
  const cancelled  = bookings.filter((b) => b.status === BOOKING_STATUS.CANCELLED);
  const noShows    = bookings.filter((b) => b.status === BOOKING_STATUS.NO_SHOW);

  const grossRevenue = Math.round(completed.reduce((s, b) => s + (b.tariffGBP ?? 0), 0) * 100) / 100;

  // By zone
  const byZone = {};
  for (const b of completed) {
    if (!byZone[b.zoneId]) {
      byZone[b.zoneId] = { zoneId: b.zoneId, zoneName: b.zoneName, bookings: 0, revenueGBP: 0 };
    }
    byZone[b.zoneId].bookings   += 1;
    byZone[b.zoneId].revenueGBP += b.tariffGBP ?? 0;
  }

  // By permit type
  const byPermit = {};
  for (const b of bookings) {
    byPermit[b.permitType] = (byPermit[b.permitType] ?? 0) + 1;
  }

  // Zone utilisation
  const zoneUtilisation = zones.map((z) => ({
    zoneId:       z.zoneId,
    name:         z.name,
    type:         z.type,
    totalSpaces:  z.totalSpaces,
    occupiedCount: z.occupiedCount,
    occupancyPct:  occupancyPct(z),
  }));

  return {
    reportId:        `CPRPT-${Date.now()}`,
    eventId:         eventId || null,
    generatedAt:     new Date().toISOString(),
    totalBookings:   bookings.length,
    completedCount:  completed.length,
    cancelledCount:  cancelled.length,
    noShowCount:     noShows.length,
    grossRevenueGBP: grossRevenue,
    byZone:          Object.values(byZone).map((z) => ({ ...z, revenueGBP: Math.round(z.revenueGBP * 100) / 100 })),
    byPermitType:    byPermit,
    zoneUtilisation,
  };
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  ZONE_TYPES,
  SPACE_STATUS,
  BOOKING_STATUS,
  PERMIT_TYPES,
  BARRIER_EVENTS,
  DEFAULT_TARIFFS_GBP,
  validateZone,
  validateBookingRequest,
  validatePermit,
  createZone,
  availableSpaces,
  occupancyPct,
  blockSpaces,
  unblockSpaces,
  createPermit,
  checkPermit,
  createBooking,
  checkIn,
  checkOut,
  cancelBooking,
  buildEventReport,
};
