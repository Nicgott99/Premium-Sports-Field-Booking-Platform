import logger from './logger.js';

/**
 * Webhook Idempotency Store
 * Prevents duplicate webhook processing for payment and event handlers
 * Stores webhook event IDs to detect replayed requests
 */

// In-memory store for webhook IDs (in production, use Redis for distributed caching)
const webhookStore = new Map();

// TTL for webhook events (24 hours - events older than this are ignored)
const WEBHOOK_TTL = 24 * 60 * 60 * 1000;

// Cleanup interval (run every hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000;

// Start cleanup timer
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of webhookStore.entries()) {
    if (now - value.timestamp > WEBHOOK_TTL) {
      webhookStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Webhook idempotency store cleanup: removed ${cleaned} expired entries`);
  }
}, CLEANUP_INTERVAL);

/**
 * Check if webhook has been processed before
 * @param {string} webhookId - Unique webhook ID (e.g., Stripe event ID)
 * @returns {boolean} True if webhook was already processed
 */
export const isWebhookProcessed = (webhookId) => {
  if (!webhookId) {
    logger.warn('Webhook ID is required for idempotency check');
    return false;
  }

  const processed = webhookStore.has(webhookId);
  if (processed) {
    logger.warn(`Duplicate webhook detected: ${webhookId}`);
  }
  return processed;
};

/**
 * Mark webhook as processed
 * Store the webhook ID to prevent reprocessing
 * @param {string} webhookId - Unique webhook ID
 * @param {Object} data - Optional webhook data to store
 * @returns {boolean} True if successfully stored
 */
export const markWebhookProcessed = (webhookId, data = {}) => {
  if (!webhookId) {
    logger.warn('Webhook ID is required to mark as processed');
    return false;
  }

  try {
    webhookStore.set(webhookId, {
      timestamp: Date.now(),
      data: data
    });
    logger.debug(`Webhook marked as processed: ${webhookId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to mark webhook as processed: ${error.message}`);
    return false;
  }
};

/**
 * Get stored webhook data
 * Retrieve data stored with a webhook
 * @param {string} webhookId - Unique webhook ID
 * @returns {Object|null} Stored webhook data or null
 */
export const getWebhookData = (webhookId) => {
  if (!webhookId) {
    return null;
  }

  const entry = webhookStore.get(webhookId);
  return entry ? entry.data : null;
};

/**
 * Clear a specific webhook entry
 * @param {string} webhookId - Unique webhook ID
 * @returns {boolean} True if entry was deleted
 */
export const clearWebhook = (webhookId) => {
  if (!webhookId) {
    return false;
  }
  return webhookStore.delete(webhookId);
};

/**
 * Clear all webhook entries
 * Use with caution - only for testing/debugging
 */
export const clearAllWebhooks = () => {
  logger.warn('Clearing all webhook idempotency entries');
  webhookStore.clear();
};

/**
 * Get store statistics
 * @returns {Object} Statistics about stored webhooks
 */
export const getWebhookStoreStats = () => {
  const now = Date.now();
  let expired = 0;

  for (const entry of webhookStore.values()) {
    if (now - entry.timestamp > WEBHOOK_TTL) {
      expired++;
    }
  }

  return {
    totalWebhooks: webhookStore.size,
    expiredWebhooks: expired,
    activeWebhooks: webhookStore.size - expired
  };
};

export default {
  isWebhookProcessed,
  markWebhookProcessed,
  getWebhookData,
  clearWebhook,
  clearAllWebhooks,
  getWebhookStoreStats
};
