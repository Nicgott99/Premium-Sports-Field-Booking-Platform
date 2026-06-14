/**
 * Batch operation handler for processing multiple operations efficiently
 */

class BatchOperationHandler {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.timeout = options.timeout || 5000;
    this.queues = new Map();
    this.results = new Map();
    this.stats = new Map();
  }

  /**
   * Register batch operation
   * @param {string} operationKey - Operation key
   * @param {function} handler - Handler function
   */
  registerOperation(operationKey, handler) {
    this.queues.set(operationKey, {
      items: [],
      handler,
      processing: false,
      timerId: null,
    });

    this.stats.set(operationKey, {
      processed: 0,
      failed: 0,
      total: 0,
    });
  }

  /**
   * Add item to batch
   * @param {string} operationKey - Operation key
   * @param {*} item - Item to process
   * @returns {Promise} Result promise
   */
  addItem(operationKey, item) {
    const queue = this.queues.get(operationKey);
    if (!queue) {
      throw new Error(`Operation not found: ${operationKey}`);
    }

    return new Promise((resolve, reject) => {
      queue.items.push({
        item,
        resolve,
        reject,
      });

      const stats = this.stats.get(operationKey);
      stats.total++;

      if (queue.items.length >= this.batchSize) {
        this.processBatch(operationKey);
      } else if (!queue.timerId) {
        queue.timerId = setTimeout(() => {
          this.processBatch(operationKey);
        }, this.timeout);
      }
    });
  }

  /**
   * Process batch
   * @param {string} operationKey - Operation key
   */
  async processBatch(operationKey) {
    const queue = this.queues.get(operationKey);
    if (!queue || queue.items.length === 0 || queue.processing) {
      return;
    }

    queue.processing = true;

    if (queue.timerId) {
      clearTimeout(queue.timerId);
      queue.timerId = null;
    }

    const batch = queue.items.splice(0, this.batchSize);
    const items = batch.map(b => b.item);

    try {
      const results = await queue.handler(items);

      const stats = this.stats.get(operationKey);
      stats.processed += results.length;

      // Map results to promises
      for (let i = 0; i < batch.length; i++) {
        const result = results[i];
        if (result instanceof Error) {
          batch[i].reject(result);
          stats.failed++;
        } else {
          batch[i].resolve(result);
        }
      }
    } catch (error) {
      const stats = this.stats.get(operationKey);
      stats.failed += batch.length;

      // Reject all promises in batch
      batch.forEach(b => b.reject(error));
    } finally {
      queue.processing = false;

      // Process remaining items if any
      if (queue.items.length > 0) {
        this.processBatch(operationKey);
      }
    }
  }

  /**
   * Flush batch
   * @param {string} operationKey - Operation key
   * @returns {Promise}
   */
  async flush(operationKey) {
    const queue = this.queues.get(operationKey);
    if (!queue) {
      return;
    }

    while (queue.items.length > 0 || queue.processing) {
      await this.processBatch(operationKey);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (queue.timerId) {
      clearTimeout(queue.timerId);
      queue.timerId = null;
    }
  }

  /**
   * Get operation statistics
   * @param {string} operationKey - Operation key
   * @returns {object}
   */
  getStats(operationKey) {
    return this.stats.get(operationKey);
  }

  /**
   * Get all statistics
   * @returns {Map}
   */
  getAllStats() {
    return new Map(this.stats);
  }

  /**
   * Reset statistics
   * @param {string} operationKey - Operation key
   */
  resetStats(operationKey) {
    const stats = this.stats.get(operationKey);
    if (stats) {
      stats.processed = 0;
      stats.failed = 0;
      stats.total = 0;
    }
  }
}

export { BatchOperationHandler };

export default BatchOperationHandler;
