import logger from './logger.js';

/**
 * Circuit breaker pattern for fault tolerance
 */

class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.successThreshold = options.successThreshold || 2;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Execute function with circuit breaker protection
   * @param {...*} args - Function arguments
   * @returns {Promise} Function result
   */
  async execute(...args) {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        logger.info('Circuit breaker closed');
      }
    }
  }

  /**
   * Handle failed execution
   */
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      logger.warn('Circuit breaker reopened');
    } else if (this.state === 'CLOSED') {
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.resetTimeout;
        logger.warn('Circuit breaker opened due to failures');
      }
    }
  }

  /**
   * Check if should attempt reset
   * @returns {boolean}
   */
  shouldAttemptReset() {
    return Date.now() >= this.nextAttemptTime;
  }

  /**
   * Get circuit breaker status
   * @returns {object} Status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    logger.info('Circuit breaker reset');
  }

  /**
   * Manually open circuit
   */
  open() {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + this.resetTimeout;
  }

  /**
   * Manually close circuit
   */
  close() {
    this.state = 'CLOSED';
    this.failureCount = 0;
  }
}

/**
 * Circuit breaker manager for multiple services
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * Create breaker
   * @param {string} name - Breaker name
   * @param {function} fn - Function to protect
   * @param {object} options - Options
   * @returns {CircuitBreaker}
   */
  create(name, fn, options = {}) {
    const breaker = new CircuitBreaker(fn, options);
    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get breaker
   * @param {string} name - Breaker name
   * @returns {CircuitBreaker}
   */
  get(name) {
    return this.breakers.get(name);
  }

  /**
   * Execute with breaker
   * @param {string} name - Breaker name
   * @param {...*} args - Arguments
   * @returns {Promise}
   */
  async execute(name, ...args) {
    const breaker = this.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker not found: ${name}`);
    }
    return breaker.execute(...args);
  }

  /**
   * Get all statuses
   * @returns {object} Statuses
   */
  getStatuses() {
    const statuses = {};
    for (const [name, breaker] of this.breakers) {
      statuses[name] = breaker.getStatus();
    }
    return statuses;
  }

  /**
   * Reset breaker
   * @param {string} name - Breaker name
   */
  reset(name) {
    const breaker = this.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

export { CircuitBreaker, CircuitBreakerManager };

export default CircuitBreaker;
