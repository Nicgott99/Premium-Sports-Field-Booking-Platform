/**
 * smartLockerAccessManager.js — Smart Locker & IoT Pitch Access Control Engine
 * Premium Sports Field Booking Platform
 *
 * Automates physical venue infrastructure access for booked players and teams:
 *  - High-entropy, time-bounded dynamic PIN code generation (Gate & Locker)
 *  - Intelligent locker bank allocation by squad size, VIP tier, and sport
 *  - Turnstile QR/barcode digital gate pass generation with buffer windows
 *  - Floodlight & scoreboard IoT activation token generation
 *  - Real-time PIN validity checks with early-arrival & grace-period handling
 *  - Overstay penalty calculation against security deposits
 *  - Security access event auditing (Unlock, Lock, Remote Override, Tamper)
 *
 * Pure ES Module with zero external dependencies.
 */

// ─── Enums & Configurations ──────────────────────────────────────────────────

export const LOCKER_TYPES = {
  TEAM_XL_CAGE: {
    typeId: 'TEAM_XL_CAGE',
    name: 'Squad Kit & Ball Cage (XL)',
    capacityBags: 22,
    dimensions: '180cm x 120cm x 80cm',
    depositUsd: 25.0,
    hourlyRateUsd: 12.0,
    targetSports: ['FOOTBALL', 'SOCCER', 'RUGBY', 'CRICKET'],
  },
  SOLO_DUFFEL: {
    typeId: 'SOLO_DUFFEL',
    name: 'Individual Player Locker (Standard)',
    capacityBags: 2,
    dimensions: '90cm x 40cm x 50cm',
    depositUsd: 5.0,
    hourlyRateUsd: 3.0,
    targetSports: ['TENNIS', 'PADEL', 'BADMINTON', 'BASKETBALL', 'ALL'],
  },
  VIP_CABIN: {
    typeId: 'VIP_CABIN',
    name: 'Executive Suite & Shower Cabin',
    capacityBags: 8,
    dimensions: '220cm x 200cm x 150cm',
    depositUsd: 40.0,
    hourlyRateUsd: 20.0,
    targetSports: ['ALL'],
  },
  OFFICIAL_PRIVATE: {
    typeId: 'OFFICIAL_PRIVATE',
    name: 'Match Official Secure Vault',
    capacityBags: 4,
    dimensions: '100cm x 60cm x 60cm',
    depositUsd: 0.0, // Complimentary for registered referees
    hourlyRateUsd: 0.0,
    targetSports: ['OFFICIALS'],
  },
};

export const ACCESS_DEFAULTS = {
  EARLY_ACTIVATION_BUFFER_MINS: 20, // PIN becomes valid 20m before match
  POST_MATCH_GRACE_PERIOD_MINS: 25, // Valid for 25m after match for shower/change
  OVERSTAY_CHARGE_INTERVAL_MINS: 15,
  OVERSTAY_RATE_PER_INTERVAL_USD: 5.0,
};

export const ACCESS_STATUS = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  OVERSTAY: 'OVERSTAY',
  REVOKED: 'REVOKED',
};

// ─── PIN & Token Generator ───────────────────────────────────────────────────

/**
 * Generates a non-trivial, randomized numeric PIN.
 *
 * @param {number} [length=6] - Number of digits
 * @returns {string} Numeric PIN string
 */
export function generateSecurePin(length = 6) {
  const digits = Math.max(4, Math.min(8, length));
  const trivialPatterns = ['123456', '000000', '111111', '999999', '1234', '0000'];

  for (let attempt = 0; attempt < 10; attempt++) {
    let pin = '';
    for (let i = 0; i < digits; i++) {
      pin += Math.floor(Math.random() * 10).toString();
    }
    // Prevent first digit from being 0 if length is 6 for better legibility
    if (pin.length === 6 && pin.startsWith('0')) {
      pin = (Math.floor(Math.random() * 9) + 1).toString() + pin.slice(1);
    }
    if (!trivialPatterns.includes(pin)) {
      return pin;
    }
  }
  return '739284'; // Safe fallback
}

// ─── Locker Bank Allocation ──────────────────────────────────────────────────

/**
 * Allocates available locker(s) for a booking based on party size and sport.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking identifier
 * @param {string} [params.sport='FOOTBALL'] - Sport being played
 * @param {number} [params.teamSize=14] - Number of participants
 * @param {string} [params.preferredLockerType] - Optional override from LOCKER_TYPES
 * @param {Array<Object>} [params.venueInventory=[]] - List of venue locker objects
 * @returns {Object} Allocation result
 */
export function allocateSmartLockers({
  bookingId,
  sport = 'FOOTBALL',
  teamSize = 14,
  preferredLockerType,
  venueInventory = [],
}) {
  if (!bookingId) {
    throw new Error('bookingId is required for smart locker allocation');
  }

  // Determine ideal locker type
  let targetType = preferredLockerType;
  if (!targetType) {
    if (teamSize >= 8) {
      targetType = 'TEAM_XL_CAGE';
    } else if (sport.toUpperCase() === 'TENNIS' || sport.toUpperCase() === 'PADEL') {
      targetType = 'SOLO_DUFFEL';
    } else {
      targetType = 'SOLO_DUFFEL';
    }
  }

  const lockerConfig = LOCKER_TYPES[targetType] || LOCKER_TYPES.SOLO_DUFFEL;

  // Filter available lockers from venue inventory
  const availableLockers = venueInventory.filter(
    (l) => l.type === targetType && (l.status === 'AVAILABLE' || !l.isOccupied)
  );

  const assignedLockers = [];
  if (availableLockers.length > 0) {
    assignedLockers.push(availableLockers[0].id);
  } else {
    // Generate virtual bank assignment
    const bankLetter = targetType === 'TEAM_XL_CAGE' ? 'B' : 'A';
    const unitNum = Math.floor(Math.random() * 40 + 10);
    assignedLockers.push(`LOCKER-${bankLetter}-${unitNum}`);
  }

  return {
    bookingId,
    lockerType: targetType,
    lockerName: lockerConfig.name,
    assignedLockers,
    capacityBags: lockerConfig.capacityBags,
    depositChargedUsd: lockerConfig.depositUsd,
    allocatedAt: new Date().toISOString(),
  };
}

// ─── Gate & Pitch Access Pass Generator ──────────────────────────────────────

/**
 * Creates the complete IoT physical access bundle for a match booking.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Unique booking ID
 * @param {string} params.fieldId - Turf / pitch identifier
 * @param {string} params.startTime - ISO string for booking start
 * @param {string} params.endTime - ISO string for booking end
 * @param {string} [params.lockerId='LOCKER-B-24'] - Assigned locker
 * @param {boolean} [params.isNightGame=false] - Whether floodlights are required
 * @returns {Object} Access pass dossier
 */
export function generatePitchAccessPass({
  bookingId,
  fieldId,
  startTime,
  endTime,
  lockerId = 'LOCKER-B-24',
  isNightGame = false,
}) {
  if (!bookingId || !fieldId || !startTime || !endTime) {
    throw new Error('bookingId, fieldId, startTime, and endTime are required');
  }

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();

  const validFromMs = startMs - ACCESS_DEFAULTS.EARLY_ACTIVATION_BUFFER_MINS * 60 * 1000;
  const validUntilMs = endMs + ACCESS_DEFAULTS.POST_MATCH_GRACE_PERIOD_MINS * 60 * 1000;

  const gatePin = generateSecurePin(6);
  const lockerPin = generateSecurePin(4);
  const turnstileBarcode = `BAR-${bookingId.replace(/[^a-zA-Z0-9]/g, '')}-${gatePin.substring(0, 4)}`;

  // Floodlight IoT Token (Activates automated pitch lighting)
  const floodlightToken = isNightGame
    ? `FL-IOT-${fieldId.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    : null;

  return {
    passId: `PASS-${bookingId.toUpperCase()}`,
    bookingId,
    fieldId,
    assignedLockerId: lockerId,
    gatePin,
    lockerPin,
    turnstileBarcode,
    floodlightToken,
    validFrom: new Date(validFromMs).toISOString(),
    validUntil: new Date(validUntilMs).toISOString(),
    matchStartTime: startTime,
    matchEndTime: endTime,
    status: ACCESS_STATUS.SCHEDULED,
    issuedAt: new Date().toISOString(),
  };
}

// ─── Real-Time PIN Verifier ──────────────────────────────────────────────────

/**
 * Validates an entered PIN at a physical keypad or turnstile.
 *
 * @param {Object} accessPass - Issued access pass object
 * @param {string} enteredPin - PIN entered by user
 * @param {string|Date} [currentTimestamp=new Date()] - Verification time
 * @returns {{ granted: boolean, code: string, message: string }}
 */
export function verifyAccessPin(accessPass, enteredPin, currentTimestamp = new Date()) {
  if (!accessPass) {
    return { granted: false, code: 'PASS_NOT_FOUND', message: 'No active access pass provided' };
  }

  const nowMs = new Date(currentTimestamp).getTime();
  const validFromMs = new Date(accessPass.validFrom).getTime();
  const validUntilMs = new Date(accessPass.validUntil).getTime();

  // 1. PIN matching check
  const isPinMatch =
    String(enteredPin).trim() === String(accessPass.gatePin) ||
    String(enteredPin).trim() === String(accessPass.lockerPin);

  if (!isPinMatch) {
    return { granted: false, code: 'INVALID_PIN', message: 'Incorrect PIN entered' };
  }

  // 2. Early arrival check
  if (nowMs < validFromMs) {
    const minutesRemaining = Math.ceil((validFromMs - nowMs) / (60 * 1000));
    return {
      granted: false,
      code: 'EARLY_ACCESS_DENIED',
      message: `Access opens in ${minutesRemaining} minute(s) (${ACCESS_DEFAULTS.EARLY_ACTIVATION_BUFFER_MINS}m before match)`,
    };
  }

  // 3. Expiration / Overstay check
  if (nowMs > validUntilMs) {
    return {
      granted: false,
      code: 'PASS_EXPIRED',
      message: 'Access pass has expired. Grace period has ended.',
    };
  }

  return {
    granted: true,
    code: 'ACCESS_GRANTED',
    message: 'Welcome! Access gate unlocked.',
  };
}

// ─── Overstay Penalty Calculator ─────────────────────────────────────────────

/**
 * Calculates overstay fees if locker or pitch is not cleared after grace period.
 *
 * @param {string|Date} checkoutTimestamp - Actual check-out time
 * @param {string|Date} validUntilTimestamp - Allowed grace-period expiry
 * @param {number} [customDepositUsd=25.0] - Security deposit available
 * @returns {Object} Overstay deduction breakdown
 */
export function calculateOverstayFee(checkoutTimestamp, validUntilTimestamp, customDepositUsd = 25.0) {
  const checkOutMs = new Date(checkoutTimestamp).getTime();
  const validUntilMs = new Date(validUntilTimestamp).getTime();

  if (checkOutMs <= validUntilMs) {
    return {
      hasOverstayed: false,
      overstayMinutes: 0,
      penaltyChargedUsd: 0.0,
      depositRefundedUsd: customDepositUsd,
      message: 'Checked out on time within grace period.',
    };
  }

  const overstayMs = checkOutMs - validUntilMs;
  const overstayMinutes = Math.ceil(overstayMs / (60 * 1000));

  const intervals = Math.ceil(overstayMinutes / ACCESS_DEFAULTS.OVERSTAY_CHARGE_INTERVAL_MINS);
  const rawPenalty = intervals * ACCESS_DEFAULTS.OVERSTAY_RATE_PER_INTERVAL_USD;

  const penaltyChargedUsd = Math.min(customDepositUsd, rawPenalty);
  const depositRefundedUsd = Math.max(0, customDepositUsd - penaltyChargedUsd);

  return {
    hasOverstayed: true,
    overstayMinutes,
    intervalsCharged: intervals,
    penaltyChargedUsd: Math.round(penaltyChargedUsd * 100) / 100,
    depositRefundedUsd: Math.round(depositRefundedUsd * 100) / 100,
    message: `Overstay of ${overstayMinutes}m detected. Charged $${penaltyChargedUsd.toFixed(2)} from deposit.`,
  };
}

// ─── Audit Logger ────────────────────────────────────────────────────────────

/**
 * Appends an entry to the physical access security log.
 *
 * @param {Array<Object>} auditLog - Existing logs
 * @param {Object} eventData - Access event details
 * @returns {Array<Object>} Updated audit log
 */
export function logAccessEvent(auditLog = [], eventData = {}) {
  const newEntry = {
    eventId: `LOG-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    eventType: eventData.type || 'GATE_ACCESS',
    bookingId: eventData.bookingId || 'UNKNOWN',
    unitId: eventData.unitId || 'TURNSTILE-1',
    status: eventData.status || 'SUCCESS',
    details: eventData.details || '',
    recordedAt: new Date().toISOString(),
  };

  return [newEntry, ...auditLog];
}

export default {
  LOCKER_TYPES,
  ACCESS_DEFAULTS,
  ACCESS_STATUS,
  generateSecurePin,
  allocateSmartLockers,
  generatePitchAccessPass,
  verifyAccessPin,
  calculateOverstayFee,
  logAccessEvent,
};
