import logger from './logger.js';

/**
 * Job queue system for background job processing
 */

class JobQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.workers = new Map();
    this.jobHistory = [];
    this.maxConcurrent = 3;
    this.activeJobs = 0;
  }

  /**
   * Register job handler
   * @param {string} jobType - Job type
   * @param {function} handler - Job handler function
   */
  registerHandler(jobType, handler) {
    this.workers.set(jobType, handler);
    logger.info(`Job handler registered: ${jobType}`);
  }

  /**
   * Add job to queue
   * @param {string} jobType - Job type
   * @param {object} data - Job data
   * @param {object} options - Job options
   * @returns {object} Job
   */
  addJob(jobType, data = {}, options = {}) {
    const job = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      data,
      status: 'pending',
      priority: options.priority || 0,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      retryDelay: options.retryDelay || 5000,
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);

    logger.info(`Job added to queue: ${jobType} (${job.id})`);
    this.process();

    return job;
  }

  /**
   * Process queue
   */
  async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const job = this.queue.shift();
      await this.executeJob(job);
    }

    this.processing = false;
  }

  /**
   * Execute job
   * @param {object} job - Job to execute
   */
  async executeJob(job) {
    this.activeJobs++;
    job.status = 'processing';
    job.startedAt = new Date();

    const handler = this.workers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler for job type: ${job.type}`;
      this.recordJob(job);
      this.activeJobs--;
      return;
    }

    try {
      await handler(job.data);
      job.status = 'completed';
      job.completedAt = new Date();
      logger.info(`Job completed: ${job.type} (${job.id})`);
    } catch (error) {
      job.attempts++;
      job.error = error.message;

      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        setTimeout(() => {
          this.queue.push(job);
          this.process();
        }, job.retryDelay);
        logger.warn(`Job retry scheduled: ${job.type} (attempt ${job.attempts})`);
      } else {
        job.status = 'failed';
        logger.error(`Job failed after ${job.attempts} attempts: ${job.type}`, error);
      }
    }

    this.recordJob(job);
    this.activeJobs--;
    this.process();
  }

  /**
   * Record job in history
   * @param {object} job - Job
   */
  recordJob(job) {
    this.jobHistory.push(job);

    // Keep only last 1000 jobs
    if (this.jobHistory.length > 1000) {
      this.jobHistory.shift();
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {object} Job status
   */
  getJobStatus(jobId) {
    const job = this.queue.find(j => j.id === jobId);
    if (job) return job;

    return this.jobHistory.find(j => j.id === jobId);
  }

  /**
   * Get queue stats
   * @returns {object} Statistics
   */
  getStats() {
    return {
      pending: this.queue.length,
      processing: this.activeJobs,
      completed: this.jobHistory.filter(j => j.status === 'completed').length,
      failed: this.jobHistory.filter(j => j.status === 'failed').length,
      totalProcessed: this.jobHistory.length,
      handlers: this.workers.size,
    };
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
  }

  /**
   * Pause queue
   */
  pause() {
    this.processing = true;
  }

  /**
   * Resume queue
   */
  resume() {
    this.processing = false;
    this.process();
  }

  /**
   * Wait for job completion
   * @param {string} jobId - Job ID
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Job result
   */
  async waitForJob(jobId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      const checkJob = () => {
        const job = this.getJobStatus(jobId);

        if (!job) {
          reject(new Error(`Job not found: ${jobId}`));
          return;
        }

        if (job.status === 'completed') {
          resolve(job);
        } else if (job.status === 'failed') {
          reject(new Error(`Job failed: ${job.error}`));
        } else if (Date.now() - start > timeout) {
          reject(new Error(`Job timeout: ${jobId}`));
        } else {
          setTimeout(checkJob, 100);
        }
      };

      checkJob();
    });
  }
}

export const jobQueue = new JobQueue();

export default jobQueue;
