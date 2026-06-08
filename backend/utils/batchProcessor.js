import logger from './logger.js';

/**
 * Batch processing utility for large operations
 */

class BatchProcessor {
  constructor(batchSize = 100) {
    this.batchSize = batchSize;
    this.queues = new Map();
  }

  /**
   * Process items in batches
   * @param {array} items - Items to process
   * @param {function} processor - Processor function
   * @param {number} batchSize - Items per batch
   * @returns {Promise} Processing results
   */
  async processBatch(items, processor, batchSize = this.batchSize) {
    const results = [];
    const batches = this.createBatches(items, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);

      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );

      results.push(...batchResults);
    }

    return {
      total: items.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results,
    };
  }

  /**
   * Process with concurrency limit
   * @param {array} items - Items to process
   * @param {function} processor - Processor function
   * @param {number} concurrency - Max concurrent
   * @returns {Promise} Results
   */
  async processConcurrent(items, processor, concurrency = 5) {
    const results = [];
    const executing = [];

    for (let i = 0; i < items.length; i++) {
      const promise = Promise.resolve(items[i]).then(processor);
      results.push(promise);

      if (concurrency <= items.length - i) {
        executing.push(promise);

        const onComplete = () => {
          executing.splice(executing.indexOf(promise), 1);
        };

        promise.then(onComplete, onComplete);

        if (executing.length >= concurrency) {
          await Promise.race(executing);
        }
      }
    }

    return Promise.allSettled(results);
  }

  /**
   * Create batches from items
   * @param {array} items - Items
   * @param {number} batchSize - Batch size
   * @returns {array} Batches
   */
  createBatches(items, batchSize = this.batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Queue item for batch processing
   * @param {string} queueName - Queue name
   * @param {*} item - Item to queue
   */
  enqueue(queueName, item) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.queues.get(queueName).push(item);
  }

  /**
   * Process queue
   * @param {string} queueName - Queue name
   * @param {function} processor - Processor function
   * @returns {Promise} Results
   */
  async processQueue(queueName, processor) {
    const items = this.queues.get(queueName) || [];
    if (items.length === 0) return { total: 0, successful: 0, failed: 0 };

    logger.info(`Processing queue ${queueName} with ${items.length} items`);
    const result = await this.processBatch(items, processor);

    this.queues.delete(queueName);
    return result;
  }

  /**
   * Get queue size
   * @param {string} queueName - Queue name
   * @returns {number} Queue size
   */
  getQueueSize(queueName) {
    return this.queues.get(queueName)?.length || 0;
  }

  /**
   * Clear queue
   * @param {string} queueName - Queue name
   */
  clearQueue(queueName) {
    this.queues.delete(queueName);
  }

  /**
   * Map items with batch processing
   * @param {array} items - Items
   * @param {function} mapper - Mapper function
   * @returns {Promise} Mapped items
   */
  async map(items, mapper) {
    const results = await this.processConcurrent(items, mapper);
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
  }

  /**
   * Filter items with batch processing
   * @param {array} items - Items
   * @param {function} predicate - Predicate function
   * @returns {Promise} Filtered items
   */
  async filter(items, predicate) {
    const results = await this.processConcurrent(items, async item => ({
      item,
      pass: await predicate(item),
    }));

    return results
      .filter(r => r.status === 'fulfilled' && r.value.pass)
      .map(r => r.value.item);
  }

  /**
   * Reduce items with batch processing
   * @param {array} items - Items
   * @param {function} reducer - Reducer function
   * @param {*} initial - Initial value
   * @returns {Promise} Reduced value
   */
  async reduce(items, reducer, initial) {
    let accumulator = initial;
    const batches = this.createBatches(items);

    for (const batch of batches) {
      for (const item of batch) {
        accumulator = await reducer(accumulator, item);
      }
    }

    return accumulator;
  }

  /**
   * Get batch processor stats
   * @returns {object} Stats
   */
  getStats() {
    return {
      batchSize: this.batchSize,
      queues: Array.from(this.queues.entries()).map(([name, items]) => ({
        name,
        size: items.length,
      })),
    };
  }
}

export const batchProcessor = new BatchProcessor();

export default batchProcessor;
