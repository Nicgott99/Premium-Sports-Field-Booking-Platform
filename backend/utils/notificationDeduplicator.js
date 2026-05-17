import logger from './logger.js';
import { setCache, getCache } from '../config/redis.js';

/**
 * Notification Deduplication Service
 * Prevents sending duplicate notifications within a time window
 */

// In-memory cache for deduplication (with TTL-based cleanup)
const notificationCache = new Map();

// Deduplication window (e.g., don't send same notification twice within 5 minutes)
const DEFAULT_DEDUP_WINDOW_MS = 5 * 60 * 1000;

/**
 * Generate unique notification key
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type (booking_confirmed, payment_received, etc.)
 * @param {string} relatedEntityId - ID of entity related to notification (bookingId, fieldId, etc.)
 * @returns {string} Unique notification key
 */
export const generateNotificationKey = (userId, type, relatedEntityId) => {
  if (!userId || !type) {
    throw new Error('userId and type are required for notification key');
  }

  return `notif:${userId}:${type}:${relatedEntityId || 'global'}`;
};

/**
 * Check if notification is a duplicate
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} relatedEntityId - Related entity ID
 * @param {Object} options - Options (dedupWindowMs, useRedis)
 * @returns {Promise<boolean>} True if notification was sent recently
 */
export const isDuplicateNotification = async (userId, type, relatedEntityId, options = {}) => {
  const { dedupWindowMs = DEFAULT_DEDUP_WINDOW_MS, useRedis = true } = options;

  const key = generateNotificationKey(userId, type, relatedEntityId);

  try {
    if (useRedis) {
      // Try Redis first
      const cached = await getCache(key);
      if (cached) {
        logger.debug(`Duplicate notification detected (Redis): ${key}`);
        return true;
      }
    } else {
      // Use in-memory cache
      if (notificationCache.has(key)) {
        const timestamp = notificationCache.get(key);
        if (Date.now() - timestamp < dedupWindowMs) {
          logger.debug(`Duplicate notification detected (memory): ${key}`);
          return true;
        }
        notificationCache.delete(key);
      }
    }

    return false;
  } catch (error) {
    logger.error(`Error checking duplicate notification: ${error.message}`);
    // Assume not duplicate on error to avoid blocking notifications
    return false;
  }
};

/**
 * Mark notification as sent
 * Store in cache to prevent duplicates
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} relatedEntityId - Related entity ID
 * @param {Object} options - Options (dedupWindowMs, useRedis, metadata)
 * @returns {Promise<boolean>} True if successfully cached
 */
export const markNotificationSent = async (userId, type, relatedEntityId, options = {}) => {
  const { dedupWindowMs = DEFAULT_DEDUP_WINDOW_MS, useRedis = true, metadata = {} } = options;

  const key = generateNotificationKey(userId, type, relatedEntityId);

  try {
    if (useRedis) {
      // Store in Redis with TTL
      const expirySeconds = Math.ceil(dedupWindowMs / 1000);
      await setCache(key, { timestamp: Date.now(), ...metadata }, expirySeconds);
    } else {
      // Store in memory with manual cleanup
      notificationCache.set(key, Date.now());

      // Schedule cleanup after dedup window
      setTimeout(() => {
        notificationCache.delete(key);
      }, dedupWindowMs);
    }

    logger.debug(`Notification marked as sent: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Error marking notification as sent: ${error.message}`);
    return false;
  }
};

/**
 * Safe notification check and mark
 * Combines isDuplicateNotification and markNotificationSent
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} relatedEntityId - Related entity ID
 * @param {Object} options - Options
 * @returns {Promise<Object>} { isDuplicate: boolean, shouldSend: boolean }
 */
export const checkAndMarkNotification = async (userId, type, relatedEntityId, options = {}) => {
  try {
    const isDuplicate = await isDuplicateNotification(userId, type, relatedEntityId, options);

    if (!isDuplicate) {
      await markNotificationSent(userId, type, relatedEntityId, options);
      return { isDuplicate: false, shouldSend: true };
    }

    return { isDuplicate: true, shouldSend: false };
  } catch (error) {
    logger.error(`Error in notification check and mark: ${error.message}`);
    // Default to sending if error occurs
    return { isDuplicate: false, shouldSend: true };
  }
};

/**
 * Clear notification from deduplication cache
 * Use when notification is no longer applicable
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {string} relatedEntityId - Related entity ID
 * @returns {Promise<boolean>} True if cleared
 */
export const clearNotificationCache = async (userId, type, relatedEntityId) => {
  const key = generateNotificationKey(userId, type, relatedEntityId);

  try {
    notificationCache.delete(key);
    logger.debug(`Notification cache cleared: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Error clearing notification cache: ${error.message}`);
    return false;
  }
};

/**
 * Get deduplication cache statistics
 * @returns {Object} Statistics about cached notifications
 */
export const getDeduplicationStats = () => {
  return {
    cachedNotifications: notificationCache.size,
    dedupWindowMs: DEFAULT_DEDUP_WINDOW_MS
  };
};

/**
 * Clear all deduplication cache (for testing/maintenance)
 */
export const clearAllDeduplicationCache = () => {
  notificationCache.clear();
  logger.warn('All notification deduplication cache cleared');
};

export default {
  generateNotificationKey,
  isDuplicateNotification,
  markNotificationSent,
  checkAndMarkNotification,
  clearNotificationCache,
  getDeduplicationStats,
  clearAllDeduplicationCache,
  DEFAULT_DEDUP_WINDOW_MS
};
