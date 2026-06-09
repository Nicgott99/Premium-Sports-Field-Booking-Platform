import logger from './logger.js';

/**
 * Cache management utility for in-memory and distributed caching
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {*} value - Cache value
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = 3600) {
    this.cache.set(key, value);

    if (ttl) {
      const expiresAt = Date.now() + ttl * 1000;
      this.ttlMap.set(key, expiresAt);

      setTimeout(() => this.delete(key), ttl * 1000);
    }

    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Get cache value
   * @param {string} key - Cache key
   * @returns {*} Cache value or null
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.missCount++;
      return null;
    }

    const value = this.cache.get(key);
    this.hitCount++;
    logger.debug(`Cache hit: ${key}`);
    return value;
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {boolean} Exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete cache value
   * @param {string} key - Cache key
   * @returns {boolean} Success
   */
  delete(key) {
    this.ttlMap.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.ttlMap.clear();
  }

  /**
   * Get cache size
   * @returns {number} Size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {object} Statistics
   */
  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      total,
      hitRate: total > 0 ? ((this.hitCount / total) * 100).toFixed(2) + '%' : 'N/A',
      size: this.size(),
    };
  }

  /**
   * Set with pattern matching
   * @param {string} pattern - Key pattern
   * @param {function} callback - Callback to get value
   * @param {number} ttl - TTL in seconds
   * @returns {Promise} Cached value
   */
  async setPattern(pattern, callback, ttl = 3600) {
    const cached = this.get(pattern);
    if (cached) return cached;

    const value = await callback();
    this.set(pattern, value, ttl);
    return value;
  }

  /**
   * Delete pattern
   * @param {string} pattern - Key pattern (regex)
   * @returns {number} Deleted count
   */
  deletePattern(pattern) {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Increment value
   * @param {string} key - Cache key
   * @param {number} amount - Increment amount
   * @returns {number} New value
   */
  increment(key, amount = 1) {
    const current = this.get(key) || 0;
    const newValue = current + amount;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement value
   * @param {string} key - Cache key
   * @param {number} amount - Decrement amount
   * @returns {number} New value
   */
  decrement(key, amount = 1) {
    return this.increment(key, -amount);
  }

  /**
   * Get or set (lazy loading)
   * @param {string} key - Cache key
   * @param {function} fn - Function to call if not cached
   * @param {number} ttl - TTL in seconds
   * @returns {*} Cached or computed value
   */
  getOrSet(key, fn, ttl = 3600) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const value = fn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Clear expired entries
   * @returns {number} Cleared count
   */
  clearExpired() {
    const now = Date.now();
    let count = 0;

    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (expiresAt < now) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get all keys
   * @returns {array} Keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   * @returns {array} Values
   */
  values() {
    return Array.from(this.cache.values());
  }
}

export const cacheManager = new CacheManager();

/**
 * Cache middleware
 * @param {number} ttl - TTL in seconds
 * @returns {function} Express middleware
 */
export const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    const cacheKey = `${req.method}:${req.path}`;
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json;
    res.json = function(data) {
      cacheManager.set(cacheKey, data, ttl);
      return originalJson.call(this, data);
    };

    next();
  };
};

export default {
  cacheManager,
  cacheMiddleware,
};
