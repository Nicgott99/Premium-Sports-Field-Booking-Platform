/**
 * Webhook Retry Manager
 * Provides retry logic for failed webhook processing with exponential backoff
 * Stores retry attempts in Redis with TTL
 */

import { getRedisClient } from '../config/redis.js';
import logger from './logger.js';

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000; // 1 second
const BACKOFF_MULTIPLIER = 2;
const MAX_DELAY_MS = 30000; // 30 seconds
const RETRY_TTL = 86400; // 24 hours

/**
 * Get retry count for a webhook
 * @param {string} webhookId - Unique webhook identifier
 * @returns {number} Current retry count
 */
export const getRetryCount = async (webhookId) => {
  try {
    const redis = getRedisClient();
    if (!redis || !redis.isOpen) {
      logger.warn('Redis not available for retry count');
      return 0;
    }

    const count = await redis.get(`webhook:retry:${webhookId}`);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    logger.error(`Error getting retry count for ${webhookId}: ${error.message}`);
    return 0;
  }
};

/**
 * Increment retry count for a webhook
 * @param {string} webhookId - Unique webhook identifier
 * @returns {number} New retry count
 */
export const incrementRetryCount = async (webhookId) => {
  try {
    const redis = getRedisClient();
    if (!redis || !redis.isOpen) {
      logger.warn('Redis not available to increment retry count');
      return 1;
    }

    const key = `webhook:retry:${webhookId}`;
    const newCount = await redis.incr(key);
    await redis.expire(key, RETRY_TTL);
    return newCount;
  } catch (error) {
    logger.error(`Error incrementing retry count for ${webhookId}: ${error.message}`);
    return 1;
  }
};

/**
 * Calculate delay for next retry attempt
 * @param {number} retryAttempt - Current retry attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
export const calculateRetryDelay = (retryAttempt) => {
  // Exponential backoff: delay = initialDelay * (backoffMultiplier ^ retryAttempt)
  const delay = INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, retryAttempt);
  
  // Add jitter (0-20% random variation)
  const jitter = delay * (Math.random() * 0.2);
  
  // Cap at max delay
  return Math.min(Math.round(delay + jitter), MAX_DELAY_MS);
};

/**
 * Check if webhook should be retried
 * @param {string} webhookId - Unique webhook identifier
 * @returns {Object} { shouldRetry: boolean, retryCount: number, delay: number }
 */
export const shouldRetryWebhook = async (webhookId) => {
  try {
    const retryCount = await getRetryCount(webhookId);

    if (retryCount >= MAX_RETRIES) {
      logger.warn(`Max retries (${MAX_RETRIES}) reached for webhook ${webhookId}`);
      return {
        shouldRetry: false,
        retryCount,
        reason: 'Max retries exceeded',
        delay: 0
      };
    }

    const delay = calculateRetryDelay(retryCount);
    return {
      shouldRetry: true,
      retryCount,
      delay,
      nextAttemptTime: new Date(Date.now() + delay)
    };
  } catch (error) {
    logger.error(`Error checking retry status for ${webhookId}: ${error.message}`);
    return {
      shouldRetry: false,
      retryCount: 0,
      reason: 'Error checking retry status',
      delay: 0
    };
  }
};

/**
 * Store webhook retry attempt
 * @param {string} webhookId - Unique webhook identifier
 * @param {Object} attempt - Retry attempt details
 */
export const storeRetryAttempt = async (webhookId, attempt) => {
  try {
    const redis = getRedisClient();
    if (!redis || !redis.isOpen) {
      logger.warn('Redis not available to store retry attempt');
      return;
    }

    const key = `webhook:attempts:${webhookId}`;
    const attempts = await redis.get(key);
    const attemptsList = attempts ? JSON.parse(attempts) : [];

    attemptsList.push({
      timestamp: new Date().toISOString(),
      error: attempt.error,
      statusCode: attempt.statusCode,
      nextRetryIn: attempt.nextRetryIn
    });

    // Keep only last 10 attempts
    if (attemptsList.length > 10) {
      attemptsList.shift();
    }

    await redis.setEx(key, RETRY_TTL, JSON.stringify(attemptsList));
  } catch (error) {
    logger.error(`Error storing retry attempt for ${webhookId}: ${error.message}`);
  }
};

/**
 * Get all retry attempts for a webhook
 * @param {string} webhookId - Unique webhook identifier
 * @returns {Array} Array of retry attempt objects
 */
export const getRetryAttempts = async (webhookId) => {
  try {
    const redis = getRedisClient();
    if (!redis || !redis.isOpen) {
      return [];
    }

    const key = `webhook:attempts:${webhookId}`;
    const attempts = await redis.get(key);
    return attempts ? JSON.parse(attempts) : [];
  } catch (error) {
    logger.error(`Error getting retry attempts for ${webhookId}: ${error.message}`);
    return [];
  }
};

/**
 * Clear retry data for a webhook
 * @param {string} webhookId - Unique webhook identifier
 */
export const clearWebhookRetryData = async (webhookId) => {
  try {
    const redis = getRedisClient();
    if (!redis || !redis.isOpen) {
      return;
    }

    await redis.del([
      `webhook:retry:${webhookId}`,
      `webhook:attempts:${webhookId}`
    ]);
  } catch (error) {
    logger.error(`Error clearing retry data for ${webhookId}: ${error.message}`);
  }
};

/**
 * Schedule webhook retry
 * @param {string} webhookId - Unique webhook identifier
 * @param {Function} retryFn - Function to call for retry
 * @param {Object} context - Additional context for retry
 */
export const scheduleWebhookRetry = async (webhookId, retryFn, context = {}) => {
  try {
    const { shouldRetry, retryCount, delay, nextAttemptTime } = await shouldRetryWebhook(webhookId);

    if (!shouldRetry) {
      logger.error(`Webhook ${webhookId} will not be retried - max attempts reached`);
      return {
        scheduled: false,
        reason: 'Max retries exceeded',
        totalAttempts: retryCount
      };
    }

    logger.info(`Scheduling retry for webhook ${webhookId} (attempt ${retryCount + 1}/${MAX_RETRIES}) in ${delay}ms`);

    // Store retry attempt
    await incrementRetryCount(webhookId);
    await storeRetryAttempt(webhookId, {
      error: context.error || 'Scheduled for retry',
      statusCode: context.statusCode,
      nextRetryIn: delay
    });

    // Schedule retry (in production, use a queue like Bull or RabbitMQ)
    setTimeout(async () => {
      try {
        logger.info(`Executing retry for webhook ${webhookId} (attempt ${retryCount + 1})`);
        await retryFn();
        logger.info(`Webhook ${webhookId} retry succeeded`);
        await clearWebhookRetryData(webhookId);
      } catch (retryError) {
        logger.error(`Webhook ${webhookId} retry failed: ${retryError.message}`);
        // Will be scheduled again next time shouldRetryWebhook is called
      }
    }, delay);

    return {
      scheduled: true,
      delay,
      nextAttemptTime,
      attempt: retryCount + 1,
      maxAttempts: MAX_RETRIES
    };
  } catch (error) {
    logger.error(`Error scheduling webhook retry for ${webhookId}: ${error.message}`);
    return {
      scheduled: false,
      reason: 'Error scheduling retry',
      error: error.message
    };
  }
};

export default {
  getRetryCount,
  incrementRetryCount,
  calculateRetryDelay,
  shouldRetryWebhook,
  storeRetryAttempt,
  getRetryAttempts,
  clearWebhookRetryData,
  scheduleWebhookRetry,
  MAX_RETRIES,
  INITIAL_DELAY_MS,
  BACKOFF_MULTIPLIER,
  MAX_DELAY_MS
};
