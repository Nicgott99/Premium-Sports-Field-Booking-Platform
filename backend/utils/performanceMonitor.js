import logger from './logger.js';

/**
 * Performance monitoring and profiling utility
 * Tracks response times, database queries, and resource usage
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: [],
      queries: [],
      cacheHits: 0,
      cacheMisses: 0,
      slowRequests: [],
    };
    this.thresholds = {
      slowRequest: 1000, // 1 second
      slowQuery: 500, // 500ms
    };
  }

  /**
   * Record request metrics
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {number} duration - Response time in ms
   * @param {number} statusCode - HTTP status code
   */
  recordRequest(method, path, duration, statusCode) {
    const metric = {
      method,
      path,
      duration,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    this.metrics.requests.push(metric);

    // Track slow requests
    if (duration > this.thresholds.slowRequest) {
      this.metrics.slowRequests.push(metric);
      logger.warn(`[SLOW REQUEST] ${method} ${path} took ${duration}ms`);
    }

    // Keep only last 1000 requests
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests.shift();
    }
  }

  /**
   * Record database query
   * @param {string} operation - Operation type (find, insert, etc)
   * @param {string} collection - Collection/table name
   * @param {number} duration - Query time in ms
   */
  recordQuery(operation, collection, duration) {
    const metric = {
      operation,
      collection,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.metrics.queries.push(metric);

    // Track slow queries
    if (duration > this.thresholds.slowQuery) {
      logger.warn(`[SLOW QUERY] ${operation} on ${collection} took ${duration}ms`);
    }

    // Keep only last 500 queries
    if (this.metrics.queries.length > 500) {
      this.metrics.queries.shift();
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  /**
   * Get cache hit rate
   * @returns {number} Hit rate percentage
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 0;
    return ((this.metrics.cacheHits / total) * 100).toFixed(2);
  }

  /**
   * Get average request time
   * @returns {number} Average time in ms
   */
  getAverageRequestTime() {
    if (this.metrics.requests.length === 0) return 0;
    const sum = this.metrics.requests.reduce((acc, m) => acc + m.duration, 0);
    return (sum / this.metrics.requests.length).toFixed(2);
  }

  /**
   * Get average query time
   * @returns {number} Average time in ms
   */
  getAverageQueryTime() {
    if (this.metrics.queries.length === 0) return 0;
    const sum = this.metrics.queries.reduce((acc, m) => acc + m.duration, 0);
    return (sum / this.metrics.queries.length).toFixed(2);
  }

  /**
   * Get slowest requests
   * @param {number} limit - Number of requests to return
   * @returns {array} Slowest requests
   */
  getSlowestRequests(limit = 10) {
    return this.metrics.requests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get slowest queries
   * @param {number} limit - Number of queries to return
   * @returns {array} Slowest queries
   */
  getSlowestQueries(limit = 10) {
    return this.metrics.queries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get performance summary
   * @returns {object} Performance metrics summary
   */
  getPerformanceSummary() {
    return {
      requests: {
        total: this.metrics.requests.length,
        average: this.getAverageRequestTime() + 'ms',
        slowCount: this.metrics.slowRequests.length,
      },
      queries: {
        total: this.metrics.queries.length,
        average: this.getAverageQueryTime() + 'ms',
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: this.getCacheHitRate() + '%',
      },
      slowRequests: this.metrics.slowRequests.slice(-5), // Last 5
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: [],
      queries: [],
      cacheHits: 0,
      cacheMisses: 0,
      slowRequests: [],
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware to track request performance
 * @returns {function} Express middleware
 */
export const performanceTrackingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - startTime;
    performanceMonitor.recordRequest(req.method, req.path, duration, res.statusCode);
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Wrapper for database queries to track performance
 * @param {string} operation - Operation name
 * @param {string} collection - Collection name
 * @param {function} queryFn - Async query function
 * @returns {Promise} Query result
 */
export const trackQuery = async (operation, collection, queryFn) => {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    performanceMonitor.recordQuery(operation, collection, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Query failed: ${operation} on ${collection} (${duration}ms)`, error);
    throw error;
  }
};

/**
 * Track cache operations
 * @param {boolean} hit - Whether it was a hit
 */
export const trackCache = (hit) => {
  if (hit) {
    performanceMonitor.recordCacheHit();
  } else {
    performanceMonitor.recordCacheMiss();
  }
};

export default performanceMonitor;
