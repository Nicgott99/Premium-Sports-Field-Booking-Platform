/**
 * Error recovery utility for handling and recovering from errors
 */

class ErrorRecovery {
  constructor(options = {}) {
    this.strategies = new Map();
    this.handlers = new Map();
    this.fallbacks = new Map();
    this.recovery = new Map();
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Register error strategy
   * @param {string} errorType - Error type
   * @param {function} strategy - Recovery strategy
   */
  registerStrategy(errorType, strategy) {
    this.strategies.set(errorType, strategy);
  }

  /**
   * Register error handler
   * @param {string} errorType - Error type
   * @param {function} handler - Error handler
   */
  registerHandler(errorType, handler) {
    this.handlers.set(errorType, handler);
  }

  /**
   * Register fallback
   * @param {string} operation - Operation name
   * @param {function} fallback - Fallback function
   */
  registerFallback(operation, fallback) {
    this.fallbacks.set(operation, fallback);
  }

  /**
   * Classify error
   * @param {error} error - Error object
   * @returns {string}
   */
  classifyError(error) {
    if (error instanceof TypeError) {
      return 'TypeError';
    }
    if (error instanceof SyntaxError) {
      return 'SyntaxError';
    }
    if (error instanceof ReferenceError) {
      return 'ReferenceError';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'ConnectionError';
    }
    if (error.code === 'ETIMEDOUT') {
      return 'TimeoutError';
    }
    if (error.message.includes('rate limit')) {
      return 'RateLimitError';
    }
    return 'GenericError';
  }

  /**
   * Recover from error
   * @param {error} error - Error object
   * @param {object} context - Recovery context
   * @returns {Promise}
   */
  async recover(error, context = {}) {
    const errorType = this.classifyError(error);

    // Run error handler
    const handler = this.handlers.get(errorType);
    if (handler) {
      try {
        await handler(error, context);
      } catch (e) {
        console.error('Error in handler:', e);
      }
    }

    // Run recovery strategy
    const strategy = this.strategies.get(errorType);
    if (strategy) {
      try {
        return await strategy(error, context);
      } catch (e) {
        console.error('Error recovery failed:', e);
      }
    }

    // Use fallback
    const fallback = this.fallbacks.get(context.operation);
    if (fallback) {
      try {
        return await fallback(context);
      } catch (e) {
        console.error('Fallback failed:', e);
      }
    }

    throw error;
  }

  /**
   * Retry operation
   * @param {function} operation - Operation to retry
   * @param {object} options - Retry options
   * @returns {Promise}
   */
  async retry(operation, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    const delayMs = options.delayMs || 1000;
    const backoff = options.backoff || 1.5;

    let lastError;
    let delay = delayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * backoff, 30000);
        }
      }
    }

    throw lastError;
  }

  /**
   * Safe execute
   * @param {function} operation - Operation to execute
   * @param {*} defaultValue - Default value on error
   * @returns {Promise}
   */
  async safeExecute(operation, defaultValue = null) {
    try {
      return await operation();
    } catch (error) {
      console.error('Safe execution error:', error);
      return defaultValue;
    }
  }

  /**
   * Execute with timeout
   * @param {function} operation - Operation
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise}
   */
  async executeWithTimeout(operation, timeoutMs) {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Circuit breaker wrapper
   * @param {string} name - Circuit name
   * @param {function} operation - Operation
   * @param {object} options - Options
   * @returns {Promise}
   */
  async circuitBreaker(name, operation, options = {}) {
    const key = `circuit_${name}`;
    const circuit = this.recovery.get(key) || {
      failures: 0,
      lastFailureTime: null,
      state: 'closed', // closed, open, half-open
    };

    const threshold = options.threshold || 5;
    const timeout = options.timeout || 60000;

    // Check circuit state
    if (circuit.state === 'open') {
      if (Date.now() - circuit.lastFailureTime > timeout) {
        circuit.state = 'half-open';
        circuit.failures = 0;
      } else {
        throw new Error(`Circuit breaker ${name} is open`);
      }
    }

    try {
      const result = await operation();
      circuit.state = 'closed';
      circuit.failures = 0;
      this.recovery.set(key, circuit);
      return result;
    } catch (error) {
      circuit.failures++;
      circuit.lastFailureTime = Date.now();

      if (circuit.failures >= threshold) {
        circuit.state = 'open';
      }

      this.recovery.set(key, circuit);
      throw error;
    }
  }

  /**
   * Get recovery stats
   * @returns {object}
   */
  getStats() {
    return {
      strategies: this.strategies.size,
      handlers: this.handlers.size,
      fallbacks: this.fallbacks.size,
      circuits: this.recovery.size,
    };
  }
}

export { ErrorRecovery };

export const errorRecovery = new ErrorRecovery();

export default ErrorRecovery;
