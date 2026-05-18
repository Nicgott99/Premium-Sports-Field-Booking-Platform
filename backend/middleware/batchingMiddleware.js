/**
 * Request Batching Middleware
 * Enables efficient request batching for routes that support it
 * Accumulates multiple requests and processes them together
 */

import logger from '../utils/logger.js';
import { RequestBatcher, RequestDeduplicator } from '../utils/requestQueue.js';

// Global batch managers (in production, use Redis for distributed systems)
const batchManagers = new Map();
const deduplicators = new Map();

/**
 * Get or create batch manager for operation
 */
const getBatchManager = (operation, options = {}) => {
  if (!batchManagers.has(operation)) {
    batchManagers.set(operation, new RequestBatcher({
      batchSize: options.batchSize || 10,
      batchTimeoutMs: options.batchTimeoutMs || 1000
    }));
  }
  return batchManagers.get(operation);
};

/**
 * Get or create deduplicator for operation
 */
const getDeduplicator = (operation) => {
  if (!deduplicators.has(operation)) {
    deduplicators.set(operation, new RequestDeduplicator(300)); // 5 minute TTL
  }
  return deduplicators.get(operation);
};

/**
 * Request batching middleware
 * Accumulates requests and processes them in batches
 *
 * @param {Object} options - Configuration
 * @param {string} options.operation - Operation identifier
 * @param {number} options.batchSize - Size of batch (default: 10)
 * @param {number} options.batchTimeoutMs - Batch timeout in ms (default: 1000)
 * @param {boolean} options.deduplicateRequests - Enable deduplication (default: true)
 */
export const batchingMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const operation = options.operation || req.path;
    const deduplicator = getDeduplicator(operation);

    // Check for duplicate requests
    if (options.deduplicateRequests !== false) {
      const requestData = {
        method: req.method,
        path: req.path,
        body: req.body,
        user: req.user?.id
      };

      if (deduplicator.isDuplicate(operation, requestData)) {
        logger.debug(`Duplicate request detected for ${operation}`);
        const cachedResult = deduplicator.getCachedResult(operation, requestData);
        return res.json(cachedResult);
      }
    }

    // Add request to batch
    const batchManager = getBatchManager(operation, options);

    try {
      const result = await batchManager.add(operation, {
        method: req.method,
        path: req.path,
        body: req.body,
        user: req.user?.id,
        ip: req.ip
      });

      // Cache result for deduplication
      if (options.deduplicateRequests !== false) {
        deduplicator.recordRequest(operation, {
          method: req.method,
          path: req.path,
          body: req.body,
          user: req.user?.id
        }, result);
      }

      // Attach batch info to request for handler
      req.batchResult = result;
      next();
    } catch (error) {
      logger.error(`Batching middleware error: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Request batching failed',
        error: error.message
      });
    }
  };
};

/**
 * Force flush pending batch
 * Useful for graceful shutdown or explicit processing
 */
export const flushBatch = async (operation) => {
  const batchManager = batchManagers.get(operation);
  if (batchManager) {
    await batchManager.flush();
  }
};

/**
 * Get batch statistics
 */
export const getBatchStats = () => {
  const stats = {};
  for (const [operation, manager] of batchManagers.entries()) {
    stats[operation] = {
      queueSize: manager.getQueueSize(),
      batchSize: manager.batchSize,
      batchTimeoutMs: manager.batchTimeoutMs
    };
  }
  return stats;
};

/**
 * Clear all batches
 */
export const clearAllBatches = async () => {
  for (const [operation, manager] of batchManagers.entries()) {
    await manager.flush();
  }
  batchManagers.clear();
  deduplicators.clear();
};

export default {
  batchingMiddleware,
  flushBatch,
  getBatchStats,
  clearAllBatches
};
