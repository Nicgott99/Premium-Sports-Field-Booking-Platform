import logger from './logger.js';

/**
 * Request Timeout Utilities
 * Ensures external API calls don't hang indefinitely
 */

// Default timeout configurations (in milliseconds)
export const TIMEOUT_PRESETS = {
  PAYMENT: 30000, // 30 seconds for payment APIs
  EMAIL: 20000, // 20 seconds for email service
  FIREBASE: 25000, // 25 seconds for Firebase
  UPLOAD: 60000, // 60 seconds for file uploads
  DATABASE: 15000, // 15 seconds for database queries
  DEFAULT: 10000 // 10 seconds default
};

/**
 * Create a timeout promise that rejects after specified time
 * @param {number} ms - Timeout in milliseconds
 * @param {string} reason - Reason for timeout
 * @returns {Promise} Promise that rejects after timeout
 */
export const createTimeoutPromise = (ms, reason = 'Request timeout') => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(reason);
      error.code = 'TIMEOUT';
      error.timeoutMs = ms;
      reject(error);
    }, ms);
  });
};

/**
 * Race a promise against a timeout
 * @param {Promise} promise - Promise to race
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} reason - Timeout error reason
 * @returns {Promise} Result of promise or timeout error
 */
export const promiseWithTimeout = (promise, timeoutMs, reason = 'Request timeout') => {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs, reason)
  ]);
};

/**
 * Wrap an async function with timeout
 * @param {Function} asyncFn - Async function to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {Object} options - Options (defaultReturn, throwOnTimeout)
 * @returns {Function} Wrapped function with timeout
 */
export const withTimeout = (asyncFn, timeoutMs, options = {}) => {
  const { throwOnTimeout = true, defaultReturn = null } = options;

  return async (...args) => {
    try {
      return await promiseWithTimeout(
        asyncFn(...args),
        timeoutMs,
        `Operation timeout after ${timeoutMs}ms`
      );
    } catch (error) {
      if (error.code === 'TIMEOUT') {
        logger.warn(`Operation timeout: ${asyncFn.name || 'anonymous'} (${timeoutMs}ms)`);
        
        if (throwOnTimeout) {
          throw error;
        }
        
        return defaultReturn;
      }
      
      throw error;
    }
  };
};

/**
 * Create abort controller with timeout
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {AbortController} Abort controller that aborts after timeout
 */
export const createTimeoutAbortController = (timeoutMs) => {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  // Expose timeout ID for cleanup
  controller._timeoutId = timeoutId;

  return controller;
};

/**
 * Fetch with automatic timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch response
 */
export const fetchWithTimeout = (url, options = {}) => {
  const { timeoutMs = TIMEOUT_PRESETS.DEFAULT, ...fetchOptions } = options;

  const controller = createTimeoutAbortController(timeoutMs);

  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal
  }).finally(() => {
    // Cleanup timeout
    if (controller._timeoutId) {
      clearTimeout(controller._timeoutId);
    }
  });
};

/**
 * Retry with exponential backoff and timeout
 * @param {Function} asyncFn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of function
 */
export const retryWithTimeout = async (asyncFn, options = {}) => {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    timeoutMs = TIMEOUT_PRESETS.DEFAULT,
    jitterMs = 0
  } = options;

  let lastError = null;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug(`Retry attempt ${attempt}/${maxAttempts}`);
      
      return await promiseWithTimeout(
        asyncFn(),
        timeoutMs,
        `Timeout on attempt ${attempt}`
      );
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxAttempts) {
        // Calculate backoff with optional jitter
        const jitter = jitterMs ? Math.random() * jitterMs : 0;
        const waitTime = delay + jitter;
        
        logger.debug(`Waiting ${waitTime.toFixed(0)}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError;
};

/**
 * Timeout error handler
 * Determines if error is timeout and returns appropriate message
 * @param {Error} error - Error to check
 * @returns {Object} { isTimeout: boolean, message: string }
 */
export const handleTimeoutError = (error) => {
  if (error?.code === 'TIMEOUT' || error?.name === 'AbortError') {
    return {
      isTimeout: true,
      message: `Request timeout: ${error.message}`
    };
  }

  return {
    isTimeout: false,
    message: error?.message || 'Unknown error'
  };
};

export default {
  createTimeoutPromise,
  promiseWithTimeout,
  withTimeout,
  createTimeoutAbortController,
  fetchWithTimeout,
  retryWithTimeout,
  handleTimeoutError,
  TIMEOUT_PRESETS
};
