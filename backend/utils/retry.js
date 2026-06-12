import logger from './logger.js';

/**
 * Retry utility with exponential backoff and custom strategies
 */

class RetryStrategy {
  /**
   * Fixed delay strategy
   * @param {number} delay - Delay in milliseconds
   * @returns {function}
   */
  static fixed(delay) {
    return () => delay;
  }

  /**
   * Linear backoff strategy
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {function}
   */
  static linear(baseDelay = 1000) {
    return (attempt) => baseDelay * attempt;
  }

  /**
   * Exponential backoff strategy
   * @param {number} baseDelay - Base delay in milliseconds
   * @param {number} multiplier - Multiplier for each attempt
   * @returns {function}
   */
  static exponential(baseDelay = 1000, multiplier = 2) {
    return (attempt) => baseDelay * Math.pow(multiplier, attempt - 1);
  }

  /**
   * Exponential backoff with jitter
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {function}
   */
  static exponentialWithJitter(baseDelay = 1000) {
    return (attempt) => {
      const exponential = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * exponential;
      return exponential + jitter;
    };
  }
}

/**
 * Retry executor
 * @param {function} fn - Function to retry
 * @param {object} options - Retry options
 * @returns {Promise} Function result
 */
export async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delayStrategy = RetryStrategy.exponential(),
    onRetry = null,
    shouldRetry = (error) => true,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if should retry
      if (!shouldRetry(error)) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const delay = delayStrategy(attempt);
        logger.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`);

        if (onRetry) {
          await onRetry(error, attempt, delay);
        }

        await sleep(delay);
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
}

/**
 * Retry with immediate failure on specific errors
 * @param {function} fn - Function to retry
 * @param {array} failFastErrors - Errors that fail immediately
 * @param {object} options - Retry options
 * @returns {Promise}
 */
export async function retryWithFailFast(fn, failFastErrors = [], options = {}) {
  const shouldRetry = (error) => {
    return !failFastErrors.some(ErrorType =>
      error instanceof ErrorType || error.name === ErrorType.name
    );
  };

  return retry(fn, { ...options, shouldRetry });
}

/**
 * Retry with timeout
 * @param {function} fn - Function to retry
 * @param {number} timeout - Timeout in milliseconds
 * @param {object} options - Retry options
 * @returns {Promise}
 */
export async function retryWithTimeout(fn, timeout = 30000, options = {}) {
  return Promise.race([
    retry(fn, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Retry timeout')), timeout)
    ),
  ]);
}

/**
 * Async retry wrapper class
 */
export class RetryableFunction {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.options = {
      maxAttempts: 3,
      delayStrategy: RetryStrategy.exponential(),
      ...options,
    };
    this.history = [];
  }

  /**
   * Execute with retry
   * @param {...*} args - Function arguments
   * @returns {Promise}
   */
  async execute(...args) {
    return retry(
      () => this.fn(...args),
      this.options
    );
  }

  /**
   * Get execution history
   * @returns {array} History
   */
  getHistory() {
    return this.history;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  retry,
  retryWithFailFast,
  retryWithTimeout,
  RetryStrategy,
  RetryableFunction,
  sleep,
};
