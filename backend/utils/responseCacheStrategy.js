/**
 * Response caching strategy for optimal cache performance
 */

class ResponseCacheStrategy {
  constructor() {
    this.strategies = new Map();
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Register caching strategy
   * @param {string} key - Strategy key
   * @param {object} config - Strategy config
   */
  registerStrategy(key, config = {}) {
    this.strategies.set(key, {
      key,
      ttl: config.ttl || 3600000, // 1 hour
      maxSize: config.maxSize || 104857600, // 100MB
      validationFn: config.validationFn || null,
      tags: config.tags || [],
      updateFrequency: config.updateFrequency || null,
    });
  }

  /**
   * Get cache key
   * @param {string} strategy - Strategy key
   * @param {*} params - Cache parameters
   * @returns {string}
   */
  getCacheKey(strategy, params) {
    return `${strategy}:${JSON.stringify(params)}`;
  }

  /**
   * Set cache
   * @param {string} strategy - Strategy key
   * @param {*} params - Parameters
   * @param {*} value - Value to cache
   */
  setCache(strategy, params, value) {
    const config = this.strategies.get(strategy);
    if (!config) {
      throw new Error(`Strategy not found: ${strategy}`);
    }

    const cacheKey = this.getCacheKey(strategy, params);
    const now = Date.now();

    this.cache.set(cacheKey, {
      value,
      createdAt: now,
      expiresAt: now + config.ttl,
      tags: config.tags,
      size: JSON.stringify(value).length,
    });
  }

  /**
   * Get cache
   * @param {string} strategy - Strategy key
   * @param {*} params - Parameters
   * @returns {*} Cached value or null
   */
  getCache(strategy, params) {
    const cacheKey = this.getCacheKey(strategy, params);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      this.misses++;
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(cacheKey);
      this.misses++;
      return null;
    }

    this.hits++;
    return cached.value;
  }

  /**
   * Check if cache is valid
   * @param {string} strategy - Strategy key
   * @param {*} params - Parameters
   * @returns {boolean}
   */
  isCacheValid(strategy, params) {
    const config = this.strategies.get(strategy);
    if (!config || !config.validationFn) {
      return true;
    }

    const cacheKey = this.getCacheKey(strategy, params);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return false;
    }

    return config.validationFn(cached.value);
  }

  /**
   * Invalidate cache by tag
   * @param {string} tag - Tag to invalidate
   */
  invalidateByTag(tag) {
    let count = 0;

    for (const [key, data] of this.cache.entries()) {
      if (data.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    return size;
  }

  /**
   * Get cache statistics
   * @returns {object}
   */
  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    const totalSize = Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0);

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
      entries: this.cache.size,
      totalSize: totalSize + ' bytes',
      strategies: this.strategies.size,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [key, data] of this.cache.entries()) {
      if (now > data.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache size
   * @returns {number} Size in bytes
   */
  getSize() {
    return Array.from(this.cache.values()).reduce((sum, item) => sum + item.size, 0);
  }
}

export { ResponseCacheStrategy };

export const responseCacheStrategy = new ResponseCacheStrategy();

export default ResponseCacheStrategy;
