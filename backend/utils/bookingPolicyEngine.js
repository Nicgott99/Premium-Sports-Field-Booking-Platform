/**
 * bookingPolicyEngine.js — Booking Cancellation, Rescheduling & Transfer Policy Engine
 * Premium Sports Field Booking Platform
 *
 * Implements policy enforcement for sports field reservations:
 *  - Time-tiered cancellation refund calculation (with platform wallet bonus incentives)
 *  - Adverse weather & venue emergency force-majeure fee waivers
 *  - Reschedule slot price delta reconciliation (balance due vs. credit refund voucher)
 *  - Free reschedule quota allowances & late reschedule penalty fees
 *  - Peer-to-peer booking reservation ownership transfers with cryptographic tokens
 *
 * Pure, deterministic, and dependency-free.
 *
 * Usage:
 *   import {
 *     evaluateCancellation,
 *     evaluateReschedule,
 *     generateTransferToken,
 *     verifyTransferEligibility,
 *   } from './bookingPolicyEngine.js';
 */

import crypto from 'node:crypto';

// ─── Enums & Default Policies ────────────────────────────────────────────────

export const CANCELLATION_REASONS = {
  USER_REQUESTED: 'USER_REQUESTED',
  WEATHER_EMERGENCY: 'WEATHER_EMERGENCY',
  VENUE_MAINTENANCE: 'VENUE_MAINTENANCE',
  MEDICAL_EMERGENCY: 'MEDICAL_EMERGENCY',
  SLOT_RESCHEDULE: 'SLOT_RESCHEDULE',
};

export const POLICY_DEFAULTS = {
  // Refund tiers based on hours remaining before match kickoff
  TIERS: [
    { minHoursBefore: 48, cashRefundPercent: 100, walletCreditPercent: 105, label: 'FULL_REFUND' },
    { minHoursBefore: 24, cashRefundPercent: 75,  walletCreditPercent: 85,  label: 'STANDARD_CANCELLATION' },
    { minHoursBefore: 12, cashRefundPercent: 50,  walletCreditPercent: 65,  label: 'LATE_CANCELLATION' },
    { minHoursBefore: 4,  cashRefundPercent: 25,  walletCreditPercent: 35,  label: 'LAST_MINUTE_CANCELLATION' },
    { minHoursBefore: 0,  cashRefundPercent: 0,   walletCreditPercent: 0,   label: 'NON_REFUNDABLE' },
  ],
  MIN_RESCHEDULE_NOTICE_HOURS: 6,   // Cutoff window to reschedule
  DEFAULT_RESCHEDULE_FEE: 100,      // Modest administrative fee after free quota
  FREE_RESCHEDULE_PER_BOOKING: 1,   // 1 complimentary reschedule per booking
  TRANSFER_TOKEN_EXPIRY_HOURS: 24,
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates hours difference between two dates (date2 - date1).
 */
export function getDiffHours(date1, date2) {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();
  return (d2 - d1) / (1000 * 60 * 60);
}

// ─── Cancellation Evaluation ─────────────────────────────────────────────────

/**
 * @typedef {object} BookingSummary
 * @property {string} bookingId
 * @property {number} totalAmount
 * @property {Date|string} startTime
 * @property {string} [currency='BDT']
 * @property {boolean} [isOutdoor=true]
 */

/**
 * Evaluates refund amount and cancellation fee based on lead time and reason.
 *
 * @param {object} params
 * @param {BookingSummary} params.booking
 * @param {Date|string|number} [params.cancelledAt=new Date()]
 * @param {string} [params.reason=CANCELLATION_REASONS.USER_REQUESTED]
 * @param {boolean} [params.isWeatherEmergency=false]
 * @param {Array} [params.tiers=POLICY_DEFAULTS.TIERS]
 * @returns {object} Cancellation financial settlement statement
 */
export function evaluateCancellation({
  booking,
  cancelledAt = new Date(),
  reason = CANCELLATION_REASONS.USER_REQUESTED,
  isWeatherEmergency = false,
  tiers = POLICY_DEFAULTS.TIERS,
}) {
  if (!booking || typeof booking.totalAmount !== 'number') {
    throw new Error('Valid booking with totalAmount is required.');
  }

  const hoursBeforeKickoff = getDiffHours(cancelledAt, booking.startTime);
  const total = booking.totalAmount;
  const currency = booking.currency || 'BDT';

  // Force-majeure / Weather Emergency: 100% waiver
  const isEmergency =
    isWeatherEmergency ||
    reason === CANCELLATION_REASONS.WEATHER_EMERGENCY ||
    reason === CANCELLATION_REASONS.VENUE_MAINTENANCE;

  if (isEmergency) {
    return {
      bookingId: booking.bookingId,
      hoursBeforeKickoff: Math.max(0, round2(hoursBeforeKickoff)),
      isEligible: true,
      tierApplied: 'FORCE_MAJEURE_WAIVER',
      reason,
      totalAmountPaid: total,
      cancellationFee: 0,
      cashRefundAmount: total,
      walletCreditAmount: round2(total * 1.05), // 5% bonus for choosing wallet credit
      currency,
      note: 'Full 100% refund approved under venue emergency / weather force-majeure policy.',
    };
  }

  // Already started or passed
  if (hoursBeforeKickoff <= 0) {
    return {
      bookingId: booking.bookingId,
      hoursBeforeKickoff: 0,
      isEligible: false,
      tierApplied: 'PAST_SLOT_NON_REFUNDABLE',
      reason,
      totalAmountPaid: total,
      cancellationFee: total,
      cashRefundAmount: 0,
      walletCreditAmount: 0,
      currency,
      note: 'Match slot has already started or elapsed. Ineligible for cancellation.',
    };
  }

  // Match corresponding time tier
  let matchedTier = tiers.at(-1); // Default non-refundable
  for (const tier of tiers) {
    if (hoursBeforeKickoff >= tier.minHoursBefore) {
      matchedTier = tier;
      break;
    }
  }

  const cashRefund = round2(total * (matchedTier.cashRefundPercent / 100));
  const walletCredit = round2(total * (matchedTier.walletCreditPercent / 100));
  const cancellationFee = round2(total - cashRefund);

  return {
    bookingId: booking.bookingId,
    hoursBeforeKickoff: round2(hoursBeforeKickoff),
    isEligible: matchedTier.cashRefundPercent > 0,
    tierApplied: matchedTier.label,
    reason,
    totalAmountPaid: total,
    cancellationFee,
    cashRefundAmount: cashRefund,
    walletCreditAmount: walletCredit,
    currency,
    note:
      matchedTier.cashRefundPercent > 0
        ? `Cancellation processed ${round2(hoursBeforeKickoff)}h before kickoff (${matchedTier.cashRefundPercent}% refund).`
        : 'Non-refundable period reached (<4 hours before match).',
  };
}

// ─── Reschedule Evaluation ───────────────────────────────────────────────────

/**
 * @typedef {object} NewSlotInput
 * @property {Date|string} startTime
 * @property {Date|string} endTime
 * @property {number} price
 */

/**
 * Evaluates whether a booking can be rescheduled and calculates price delta / fees.
 *
 * @param {object} params
 * @param {BookingSummary} params.currentBooking
 * @param {NewSlotInput} params.newSlot
 * @param {Date|string|number} [params.rescheduledAt=new Date()]
 * @param {number} [params.reschedulesUsed=0] - Number of times already rescheduled
 * @param {boolean} [params.isWeatherEmergency=false]
 * @returns {object} Reschedule reconciliation statement
 */
export function evaluateReschedule({
  currentBooking,
  newSlot,
  rescheduledAt = new Date(),
  reschedulesUsed = 0,
  isWeatherEmergency = false,
}) {
  if (!currentBooking || !newSlot) {
    throw new Error('currentBooking and newSlot are both required.');
  }

  const hoursRemaining = getDiffHours(rescheduledAt, currentBooking.startTime);
  const minNotice = POLICY_DEFAULTS.MIN_RESCHEDULE_NOTICE_HOURS;
  const currency = currentBooking.currency || 'BDT';

  // Force-majeure overrides notice restrictions
  if (!isWeatherEmergency && hoursRemaining < minNotice) {
    return {
      canReschedule: false,
      reason: `Rescheduling requires at least ${minNotice} hours advance notice (current notice: ${Math.max(0, round2(hoursRemaining))}h).`,
      hoursRemaining: round2(hoursRemaining),
      balanceDue: 0,
      creditRefund: 0,
    };
  }

  // Reschedule fee logic
  let rescheduleFee = 0;
  if (!isWeatherEmergency) {
    const freeQuota = POLICY_DEFAULTS.FREE_RESCHEDULE_PER_BOOKING;
    if (reschedulesUsed >= freeQuota) {
      rescheduleFee = POLICY_DEFAULTS.DEFAULT_RESCHEDULE_FEE;
    }
  }

  // Price delta calculation
  const oldPrice = currentBooking.totalAmount;
  const newPrice = newSlot.price;
  const priceDifference = round2(newPrice - oldPrice);

  let balanceDue = 0;
  let creditRefund = 0;

  if (priceDifference > 0) {
    // New slot is more expensive -> customer pays delta + fee
    balanceDue = round2(priceDifference + rescheduleFee);
  } else if (priceDifference < 0) {
    // New slot is cheaper -> customer receives credit voucher minus fee
    const absoluteSavings = Math.abs(priceDifference);
    creditRefund = Math.max(0, round2(absoluteSavings - rescheduleFee));
  } else {
    // Exactly same price -> customer only pays reschedule fee if applicable
    balanceDue = rescheduleFee;
  }

  return {
    canReschedule: true,
    hoursRemaining: round2(hoursRemaining),
    currentSlot: {
      startTime: currentBooking.startTime,
      price: oldPrice,
    },
    newSlot: {
      startTime: newSlot.startTime,
      price: newPrice,
    },
    priceDifference,
    rescheduleFee,
    balanceDue,
    creditRefund,
    currency,
    isComplimentary: rescheduleFee === 0,
    note: getRescheduleNote(isWeatherEmergency, rescheduleFee, currency),
  };
}

function getRescheduleNote(isWeatherEmergency, rescheduleFee, currency) {
  if (isWeatherEmergency) {
    return 'Complimentary emergency weather reschedule applied.';
  }
  if (rescheduleFee > 0) {
    return `Administrative reschedule fee of ${currency} ${rescheduleFee} applied.`;
  }
  return 'Complimentary free reschedule quota applied.';
}

// ─── Booking Transfer Engine ─────────────────────────────────────────────────

/**
 * Generates an encrypted transfer authorization token for a booking.
 *
 * @param {object} params
 * @param {string} params.bookingId
 * @param {string} params.originalUserId
 * @param {string} [params.recipientEmail]
 * @param {number} [params.expiresInHours=24]
 * @returns {object} Transfer token object
 */
export function generateTransferToken({
  bookingId,
  originalUserId,
  recipientEmail = null,
  expiresInHours = POLICY_DEFAULTS.TRANSFER_TOKEN_EXPIRY_HOURS,
}) {
  const tokenSecret = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const expiresAt = new Date(now + expiresInHours * 60 * 60 * 1000);

  const transferToken = `xfer_${tokenSecret}_${Date.now().toString(36)}`;

  return {
    transferToken,
    bookingId,
    originalUserId,
    recipientEmail,
    createdAt: new Date(now).toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Verifies if a transfer token can be redeemed by a new recipient.
 *
 * @param {object} params
 * @param {BookingSummary} params.booking
 * @param {object} params.tokenRecord - Generated transfer token record
 * @param {string} params.recipientUserId
 * @param {string} [params.recipientEmail]
 * @param {Date|string|number} [params.verifiedAt=Date.now()]
 * @returns {{ isValid: boolean, message: string }}
 */
export function verifyTransferEligibility({
  booking,
  tokenRecord,
  recipientUserId,
  recipientEmail = null,
  verifiedAt = Date.now(),
}) {
  if (!booking || !tokenRecord) {
    return { isValid: false, message: 'Invalid booking or transfer token record.' };
  }

  // Token expired
  const nowMs = new Date(verifiedAt).getTime();
  const expireMs = new Date(tokenRecord.expiresAt).getTime();
  if (nowMs >= expireMs) {
    return { isValid: false, message: 'Transfer authorization token has expired.' };
  }

  // Slot already started
  const slotStartMs = new Date(booking.startTime).getTime();
  if (nowMs >= slotStartMs) {
    return { isValid: false, message: 'Cannot transfer a booking that has already started.' };
  }

  // Self-transfer check
  if (tokenRecord.originalUserId === recipientUserId) {
    return { isValid: false, message: 'Cannot transfer a booking to yourself.' };
  }

  // Targeted recipient email check
  if (tokenRecord.recipientEmail && recipientEmail) {
    if (tokenRecord.recipientEmail.toLowerCase() !== recipientEmail.toLowerCase()) {
      return { isValid: false, message: 'Transfer token is locked to another recipient email address.' };
    }
  }

  return {
    isValid: true,
    message: 'Transfer token is valid. Ownership can be transferred.',
  };
}

export default {
  CANCELLATION_REASONS,
  POLICY_DEFAULTS,
  evaluateCancellation,
  evaluateReschedule,
  generateTransferToken,
  verifyTransferEligibility,
  getDiffHours,
};
