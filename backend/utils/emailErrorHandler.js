import logger from './logger.js';

/**
 * Email Service Error Handler
 * Centralizes email error handling and retry logic
 * Prevents email failures from breaking application flow
 */

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

/**
 * Send email with error handling and retries
 * @param {Function} sendFn - Async function that sends email
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} { success: boolean, error?: string, attempt?: number }
 */
export const sendEmailWithRetry = async (sendFn, email, subject, options = {}) => {
  const maxAttempts = options.maxAttempts || RETRY_CONFIG.maxAttempts;
  const initialDelay = options.delayMs || RETRY_CONFIG.delayMs;
  const backoffMultiplier = options.backoffMultiplier || RETRY_CONFIG.backoffMultiplier;

  if (!email || !sendFn || typeof sendFn !== 'function') {
    logger.error('Invalid email parameters: missing email, sendFn, or sendFn is not a function');
    return { success: false, error: 'Invalid email parameters' };
  }

  let lastError = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info(`Sending email to ${email} - Attempt ${attempt}/${maxAttempts}`);
      const result = await sendFn();

      if (result && result.success !== false) {
        logger.info(`Email sent successfully to ${email} (${subject})`);
        return { success: true, attempt };
      }

      throw new Error(result?.error || 'Email send returned false');
    } catch (error) {
      lastError = error;
      logger.warn(`Email send attempt ${attempt} failed for ${email}: ${error.message}`);

      // Don't retry on last attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffMultiplier; // Exponential backoff
      }
    }
  }

  logger.error(`Failed to send email to ${email} after ${maxAttempts} attempts: ${lastError?.message}`);
  return {
    success: false,
    error: lastError?.message || 'Email delivery failed after retries',
    attempt: maxAttempts
  };
};

/**
 * Safe email send wrapper
 * Prevents email errors from crashing application
 * @param {Function} sendFn - Async function that sends email
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const sendEmailSafely = async (sendFn, email, subject) => {
  try {
    const result = await sendEmailWithRetry(sendFn, email, subject);
    return result;
  } catch (error) {
    logger.error(`Unexpected error in sendEmailSafely: ${error.message}`);
    return { success: false, error: 'Email service error' };
  }
};

/**
 * Queue email for later delivery
 * Useful for batch sending or when email service is temporarily unavailable
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {Object} data - Email template data
 * @param {string} type - Email type (verification, reset, notification, etc.)
 * @returns {Object} { queued: boolean, id?: string }
 */
const emailQueue = [];

export const queueEmail = (email, subject, data, type) => {
  if (!email || !subject || !type) {
    logger.warn('Cannot queue email: missing required fields');
    return { queued: false };
  }

  const queuedEmail = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    subject,
    data,
    type,
    timestamp: Date.now(),
    retries: 0,
    status: 'queued'
  };

  emailQueue.push(queuedEmail);
  logger.info(`Email queued: ${queuedEmail.id} (${type} to ${email})`);

  return { queued: true, id: queuedEmail.id };
};

/**
 * Get email queue status
 * @returns {Object} Queue statistics
 */
export const getEmailQueueStatus = () => {
  return {
    total: emailQueue.length,
    queued: emailQueue.filter(e => e.status === 'queued').length,
    failed: emailQueue.filter(e => e.status === 'failed').length,
    sent: emailQueue.filter(e => e.status === 'sent').length
  };
};

/**
 * Clear email queue (for testing/maintenance)
 */
export const clearEmailQueue = () => {
  emailQueue.length = 0;
  logger.warn('Email queue cleared');
};

/**
 * Handle email service errors gracefully
 * @param {Error} error - Email error
 * @param {Object} context - Error context (email, subject, etc.)
 * @returns {Object} { handled: boolean, fallback?: boolean }
 */
export const handleEmailError = (error, context = {}) => {
  const { email, subject, type } = context;

  // Network errors - queue for retry
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    logger.warn(`Email service temporarily unavailable, queueing email for ${email}`);
    queueEmail(email, subject, {}, type || 'unknown');
    return { handled: true, fallback: true, queued: true };
  }

  // Invalid email - log and skip
  if (error.message?.includes('Invalid email')) {
    logger.error(`Invalid email address: ${email}`);
    return { handled: true, fallback: false, skipped: true };
  }

  // Quota/rate limit exceeded - queue for later
  if (error.code === 'QUOTA_EXCEEDED' || error.status === 429) {
    logger.warn(`Email quota exceeded, queueing email for ${email}`);
    queueEmail(email, subject, {}, type || 'unknown');
    return { handled: true, fallback: true, queued: true };
  }

  // Unknown error - log for investigation
  logger.error(`Email service error: ${error.message}`);
  return { handled: false, fallback: false };
};

export default {
  sendEmailWithRetry,
  sendEmailSafely,
  queueEmail,
  getEmailQueueStatus,
  clearEmailQueue,
  handleEmailError
};
