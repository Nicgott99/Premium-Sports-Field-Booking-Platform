/**
 * Async queue processor for managing task processing with concurrency control
 */

class AsyncQueueProcessor {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 5;
    this.timeout = options.timeout || 30000;
    this.queue = [];
    this.active = 0;
    this.completed = 0;
    this.failed = 0;
    this.paused = false;
    this.callbacks = new Map();
  }

  /**
   * Add task to queue
   * @param {function} task - Task function
   * @param {*} id - Task ID
   * @returns {Promise}
   */
  push(task, id = null) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        id,
        resolve,
        reject,
      });

      this.process();
    });
  }

  /**
   * Process queue
   */
  async process() {
    while (this.active < this.concurrency && this.queue.length > 0 && !this.paused) {
      const item = this.queue.shift();
      this.active++;

      this.executeTask(item);
    }
  }

  /**
   * Execute task with timeout
   * @param {object} item - Queue item
   */
  async executeTask(item) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Task timeout')), this.timeout);
    });

    try {
      const result = await Promise.race([item.task(), timeoutPromise]);
      this.completed++;
      item.resolve(result);
    } catch (error) {
      this.failed++;
      item.reject(error);
    } finally {
      this.active--;
      this.process();
    }
  }

  /**
   * Pause processing
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume processing
   */
  resume() {
    this.paused = false;
    this.process();
  }

  /**
   * Clear queue
   */
  clear() {
    const count = this.queue.length;
    this.queue = [];
    return count;
  }

  /**
   * Wait for all tasks to complete
   * @returns {Promise}
   */
  async drain() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.queue.length === 0 && this.active === 0) {
          resolve();
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  /**
   * Get queue statistics
   * @returns {object}
   */
  getStats() {
    return {
      queued: this.queue.length,
      active: this.active,
      completed: this.completed,
      failed: this.failed,
      total: this.completed + this.failed + this.queue.length + this.active,
    };
  }

  /**
   * Register callback
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const cbs = this.callbacks.get(event) || [];
    cbs.forEach(cb => cb(data));
  }

  /**
   * Set concurrency
   * @param {number} value - Concurrency level
   */
  setConcurrency(value) {
    this.concurrency = value;
    this.process();
  }

  /**
   * Get concurrency
   * @returns {number}
   */
  getConcurrency() {
    return this.concurrency;
  }
}

export { AsyncQueueProcessor };

export default AsyncQueueProcessor;
