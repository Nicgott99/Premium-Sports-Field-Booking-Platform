/**
 * bookingUtils.js
 * Domain-specific booking helper utilities.
 * Premium Sports Field Booking Platform
 *
 * Pure functions used by booking controllers, availability checks,
 * cancellation policies, and reporting — keeping controllers thin.
 */

/**
 * @typedef {'pending'|'confirmed'|'cancelled'|'completed'|'no-show'} BookingStatus
 */

/**
 * Valid booking status transitions.
 * Maps each status to the set of statuses it can legally move to.
 */
const TRANSITIONS = {
  pending:   new Set(['confirmed', 'cancelled']),
  confirmed: new Set(['cancelled', 'completed', 'no-show']),
  cancelled: new Set([]),
  completed: new Set([]),
  'no-show': new Set([]),
};

/**
 * Check whether a booking status transition is valid.
 * @param {BookingStatus} from
 * @param {BookingStatus} to
 * @returns {boolean}
 * @example isValidTransition('pending', 'confirmed') // true
 * @example isValidTransition('completed', 'cancelled') // false
 */
export const isValidTransition = (from, to) => {
  return TRANSITIONS[from]?.has(to) ?? false;
};

/**
 * Determine whether a booking is still cancellable based on the
 * platform's cancellation policy (must be >24 hours before start).
 * @param {Date|string} startTime
 * @param {number} [hoursBeforeStart=24]
 * @returns {boolean}
 */
export const isCancellable = (startTime, hoursBeforeStart = 24) => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  return start - now > hoursBeforeStart * 60 * 60 * 1000;
};

/**
 * Calculate the refund amount based on how far in advance the cancellation occurs.
 * @param {number}      paidAmount       - Total amount paid.
 * @param {Date|string} startTime        - Scheduled start of the booking.
 * @param {Date|string} [cancelledAt]    - When cancellation is being requested (default: now).
 * @returns {{ refundAmount: number, refundPercent: number, reason: string }}
 */
export const calculateRefund = (paidAmount, startTime, cancelledAt = new Date()) => {
  const hoursUntilStart = (new Date(startTime) - new Date(cancelledAt)) / 3_600_000;

  let refundPercent;
  let reason;

  if (hoursUntilStart >= 48) {
    refundPercent = 100;
    reason = 'Full refund — cancelled more than 48 hours in advance.';
  } else if (hoursUntilStart >= 24) {
    refundPercent = 50;
    reason = 'Partial refund (50%) — cancelled between 24–48 hours in advance.';
  } else if (hoursUntilStart >= 0) {
    refundPercent = 0;
    reason = 'No refund — cancelled less than 24 hours before the booking.';
  } else {
    refundPercent = 0;
    reason = 'No refund — booking has already started or passed.';
  }

  const refundAmount = Math.round(paidAmount * (refundPercent / 100) * 100) / 100;
  return { refundAmount, refundPercent, reason };
};

/**
 * Generate a human-readable booking reference code.
 * Format: PSP-YYYYMMDD-XXXXXX (e.g. PSP-20260715-A3F9K2)
 * @returns {string}
 */
export const generateBookingReference = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 8);
  return `PSP-${date}-${suffix}`;
};

export default {
  isValidTransition,
  isCancellable,
  calculateRefund,
  generateBookingReference,
};
