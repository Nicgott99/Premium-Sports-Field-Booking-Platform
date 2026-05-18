/**
 * Request Queue & Batching Utility
 * Enables efficient batching of multiple requests into single operations
 * Reduces database queries and improves performance
 */

import logger from './logger.js';
import { getRedisClient } from '../config/redis.js';

/**
 * Request batch processor
 * Collects requests and processes them in batches
 */
export class RequestBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchTimeoutMs = options.batchTimeoutMs || 1000; // 1 second
    this.queue = [];
    this.timer = null;
  }

  /**
   * Add request to batch
   * @param {string} operation - Operation type
   * @param {any} data - Request data
   * @returns {Promise} Resolves when batch is processed
   */
  add(operation, data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, data, resolve, reject });

      // Process immediately if batch is full
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        // Start timer for batch timeout
        this.timer = setTimeout(() => this.flush(), this.batchTimeoutMs);
      }
    });
  }

  /**
   * Process pending batch
   */
  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0);
    logger.debug(`Processing batch of ${batch.length} requests`);

    // Group by operation
    const grouped = {};
    batch.forEach((item) => {
      if (!grouped[item.operation]) {
        grouped[item.operation] = [];
      }
      grouped[item.operation].push(item);
    });

    // Process each operation group
    for (const [operation, items] of Object.entries(grouped)) {
      try {
        // Simulate batch processing
        items.forEach(item => {
          item.resolve({ success: true, operation, batchSize: items.length });
        });
      } catch (error) {
        items.forEach(item => {
          item.reject(error);
        });
      }
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize() {
    return this.queue.length;
  }
}

/**
 * Request deduplication helper
 * Prevents duplicate requests from being processed multiple times
 */
export class RequestDeduplicator {
  constructor(ttlSeconds = 300) {
    this.ttlSeconds = ttlSeconds;
    this.cache = new Map();
  }

  /**
   * Generate request key from operation and data
   */
  generateKey(operation, data) {
    return `${operation}:${JSON.stringify(data).substring(0, 100)}`;
  }

  /**
   * Check if request is duplicate
   */
  isDuplicate(operation, data) {
    const key = this.generateKey(operation, data);
    return this.cache.has(key);
  }

  /**
   * Record request
   */
  recordRequest(operation, data, result) {
    const key = this.generateKey(operation, data);
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, this.ttlSeconds * 1000);
  }

  /**
   * Get cached result for duplicate request
   */
  getCachedResult(operation, data) {
    const key = this.generateKey(operation, data);
    const entry = this.cache.get(key);
    return entry ? entry.result : null;
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }
}

/**
 * Redis-backed request queue for distributed systems
 */
export class DistributedRequestQueue {
  constructor(queueName = 'request:queue', options = {}) {
    this.queueName = queueName;
    this.batchSize = options.batchSize || 20;
    this.processingKey = `${queueName}:processing`;
  }

  /**
   * Add request to queue
   */
  async enqueue(request) {
    try {
      const redis = getRedisClient();
      if (!redis || !redis.isOpen) {
        logger.warn('Redis not available, skipping queue');
        return null;
      }

      const requestId = `${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      await redis.lPush(this.queueName, JSON.stringify({ ...request, requestId }));
      logger.debug(`Request ${requestId} enqueued`);
      return requestId;
    } catch (error) {
      logger.error(`Error enqueuing request: ${error.message}`);
      return null;
    }
  }

  /**
   * Process pending requests in batch
   */
  async processBatch(processor) {
    try {
      const redis = getRedisClient();
      if (!redis || !redis.isOpen) {
        logger.warn('Redis not available');
        return [];
      }

      // Get batch from queue
      const batch = [];
      for (let i = 0; i < this.batchSize; i++) {
        const request = await redis.rPop(this.queueName);
        if (!request) break;
        batch.push(JSON.parse(request));
      }

      if (batch.length === 0) {
        return [];
      }

      logger.info(`Processing batch of ${batch.length} requests from queue`);

      // Process batch
      const results = [];
      for (const request of batch) {
        try {
          const result = await processor(request);
          results.push({ requestId: request.requestId, success: true, result });
        } catch (error) {
          logger.error(`Request processing failed: ${error.message}`);
          results.push({ requestId: request.requestId, success: false, error: error.message });
          // Optionally re-queue failed requests
        }
      }

      return results;
    } catch (error) {
      logger.error(`Error processing batch: ${error.message}`);
      return [];
    }
  }

  /**
   * Get queue length
   */
  async getQueueLength() {
    try {
      const redis = getRedisClient();
      if (!redis || !redis.isOpen) {
        return 0;
      }

      return await redis.lLen(this.queueName);
    } catch (error) {
      logger.error(`Error getting queue length: ${error.message}`);
      return 0;
    }
  }

  /**
   * Clear queue
   */
  async clearQueue() {
    try {
      const redis = getRedisClient();
      if (!redis || !redis.isOpen) {
        return;
      }

      await redis.del(this.queueName);
      logger.info(`Queue ${this.queueName} cleared`);
    } catch (error) {
      logger.error(`Error clearing queue: ${error.message}`);
    }
  }
}

export default {
  RequestBatcher,
  RequestDeduplicator,
  DistributedRequestQueue
};
