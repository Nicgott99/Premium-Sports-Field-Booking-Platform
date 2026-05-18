/**
 * Refund Management Utility
 * Handles refund processing, status tracking, and verification
 */

import logger from './logger.js';
import { calculateRefund } from './refundCalculator.js';
import { logPaymentEvent } from './auditLogger.js';

/**
 * Process refund request
 */
export const processRefundRequest = async (bookingData, options = {}) => {
  try {
    const {
      cancellationTime = new Date(),
      reason = 'Customer requested',
      adminId = null
    } = options;

    // Calculate refund
    const refundInfo = calculateRefund(bookingData.startTime, bookingData.totalAmount, {
      cancellationTime,
      currency: bookingData.currency || 'BDT'
    });

    if (!refundInfo.eligible) {
      logger.info(`Refund not eligible: ${refundInfo.reason}`);
      return {
        eligible: false,
        reason: refundInfo.reason,
        amount: 0
      };
    }

    // Create refund record
    const refundId = `ref_${Date.now()}`;
    const refundRecord = {
      refundId,
      bookingId: bookingData._id,
      userId: bookingData.userId,
      originalAmount: bookingData.totalAmount,
      refundAmount: refundInfo.refundAmount,
      refundPercentage: refundInfo.refundPercentage,
      policy: refundInfo.policy,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedProcessingTime: '3-5 business days',
      currency: bookingData.currency || 'BDT',
      adminId
    };

    logger.info(`Refund processed: ${refundId} for booking ${bookingData._id}`);

    // Log refund event
    try {
      logPaymentEvent({
        type: 'refund_processed',
        userId: bookingData.userId,
        paymentId: bookingData.paymentId,
        amount: refundInfo.refundAmount,
        details: { refundId, reason, policy: refundInfo.policy },
        status: 'pending'
      });
    } catch (logErr) {
      logger.warn(`Failed to log refund event: ${logErr.message}`);
    }

    return {
      eligible: true,
      refundId,
      ...refundRecord
    };
  } catch (error) {
    logger.error(`Error processing refund: ${error.message}`);
    throw error;
  }
};

/**
 * Get refund status
 */
export const getRefundStatus = async (refundId) => {
  try {
    // In production, query refund database
    return {
      refundId,
      status: 'pending', // pending, processing, completed, failed
      amount: 0,
      currency: 'BDT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days
    };
  } catch (error) {
    logger.error(`Error getting refund status: ${error.message}`);
    throw error;
  }
};

/**
 * Verify refund eligibility
 */
export const verifyRefundEligibility = (bookingData, cancellationTime = new Date()) => {
  try {
    const refundInfo = calculateRefund(bookingData.startTime, bookingData.totalAmount, {
      cancellationTime
    });

    return {
      eligible: refundInfo.eligible,
      reason: refundInfo.reason,
      refundPercentage: refundInfo.refundPercentage,
      refundAmount: refundInfo.refundAmount,
      hoursUntilBooking: refundInfo.hoursUntilBooking,
      policy: refundInfo.policy
    };
  } catch (error) {
    logger.error(`Error verifying refund eligibility: ${error.message}`);
    return {
      eligible: false,
      reason: 'Error checking eligibility',
      error: error.message
    };
  }
};

export default {
  processRefundRequest,
  getRefundStatus,
  verifyRefundEligibility
};
