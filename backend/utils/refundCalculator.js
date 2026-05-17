import logger from './logger.js';

/**
 * Booking Cancellation and Refund Calculator
 * Computes refund amounts based on cancellation timing and policies
 */

/**
 * Cancellation refund policy
 * Returns refund percentage based on hours until booking start
 */
const REFUND_POLICY = {
  '24+': { percentage: 100, label: '24+ hours before: 100% refund' },
  '12-24': { percentage: 50, label: '12-24 hours before: 50% refund' },
  '<12': { percentage: 0, label: '<12 hours before: 0% refund' },
  'after': { percentage: 0, label: 'After start time: 0% refund' }
};

/**
 * Calculate refund eligibility and amount
 * @param {Date} bookingStartTime - When the booking starts
 * @param {number} totalAmount - Total booking amount in major currency unit
 * @param {Object} options - Additional options
 * @returns {Object} { eligible: boolean, refundAmount: number, refundPercentage: number, reason: string, policy: string }
 */
export const calculateRefund = (bookingStartTime, totalAmount, options = {}) => {
  const { cancellationTime = new Date(), currency = 'BDT', includeFees = false } = options;

  // Validate inputs
  if (!bookingStartTime || typeof bookingStartTime !== 'object') {
    logger.error('Invalid booking start time');
    return { eligible: false, refundAmount: 0, refundPercentage: 0, reason: 'Invalid booking start time', policy: 'none' };
  }

  if (!totalAmount || totalAmount < 0) {
    logger.error('Invalid total amount');
    return { eligible: false, refundAmount: 0, refundPercentage: 0, reason: 'Invalid booking amount', policy: 'none' };
  }

  // Parse dates
  const startTime = new Date(bookingStartTime);
  const cancelTime = new Date(cancellationTime);

  // Calculate hours until booking
  const hoursUntilBooking = (startTime.getTime() - cancelTime.getTime()) / (1000 * 60 * 60);

  logger.debug(`Refund calculation: ${hoursUntilBooking.toFixed(2)} hours until booking start`);

  // Determine refund policy bucket
  let policyKey = '<12';
  let refundPercentage = 0;

  if (hoursUntilBooking >= 24) {
    policyKey = '24+';
    refundPercentage = 100;
  } else if (hoursUntilBooking >= 12) {
    policyKey = '12-24';
    refundPercentage = 50;
  } else if (hoursUntilBooking < 0) {
    policyKey = 'after';
    refundPercentage = 0;
  }

  const policyInfo = REFUND_POLICY[policyKey];

  // Calculate refund amount
  let refundAmount = (totalAmount * refundPercentage) / 100;

  // Optionally deduct fees
  if (includeFees && refundPercentage > 0) {
    const platformFeePercentage = 5; // 5% platform fee
    const platformFee = (totalAmount * platformFeePercentage) / 100;
    refundAmount = Math.max(0, refundAmount - platformFee);
  }

  // Round to 2 decimal places
  refundAmount = Math.round(refundAmount * 100) / 100;

  return {
    eligible: refundPercentage > 0,
    refundAmount,
    refundPercentage,
    hoursUntilBooking: parseFloat(hoursUntilBooking.toFixed(2)),
    reason: policyInfo.label,
    policy: policyKey
  };
};

/**
 * Get human-readable cancellation reason
 * @param {Object} refundCalculation - Result from calculateRefund
 * @returns {string} User-friendly message
 */
export const formatCancellationReason = (refundCalculation) => {
  if (!refundCalculation) {
    return 'Unable to determine refund policy';
  }

  const { refundPercentage, reason, hoursUntilBooking } = refundCalculation;

  if (hoursUntilBooking < 0) {
    return 'Booking has already started - no refund available';
  }

  return `${reason}\nRefund: ${refundPercentage}%`;
};

/**
 * Check if cancellation is within allowed grace period
 * Some platforms allow free cancellation within X hours
 * @param {Date} bookingStartTime - Booking start time
 * @param {number} gracePeriodHours - Grace period in hours (default: 1 hour)
 * @returns {boolean} True if within grace period
 */
export const isWithinGracePeriod = (bookingStartTime, gracePeriodHours = 1) => {
  const startTime = new Date(bookingStartTime);
  const now = new Date();
  const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  return hoursSinceStart >= 0 && hoursSinceStart <= gracePeriodHours;
};

/**
 * Apply platform fees to refund
 * @param {number} refundAmount - Refund amount before fees
 * @param {Object} options - Fee configuration
 * @returns {Object} { refundAmount: number, platformFee: number, netRefund: number }
 */
export const applyRefundFees = (refundAmount, options = {}) => {
  const { platformFeePercentage = 5, gatewayFeePercentage = 2 } = options;

  const platformFee = (refundAmount * platformFeePercentage) / 100;
  const gatewayFee = (refundAmount * gatewayFeePercentage) / 100;
  const totalFees = platformFee + gatewayFee;
  const netRefund = Math.max(0, refundAmount - totalFees);

  return {
    refundAmount,
    platformFee: Math.round(platformFee * 100) / 100,
    gatewayFee: Math.round(gatewayFee * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    netRefund: Math.round(netRefund * 100) / 100
  };
};

/**
 * Get list of all refund policies
 * @returns {Object} All refund policy tiers
 */
export const getAllRefundPolicies = () => {
  return REFUND_POLICY;
};

export default {
  calculateRefund,
  formatCancellationReason,
  isWithinGracePeriod,
  applyRefundFees,
  getAllRefundPolicies,
  REFUND_POLICY
};
