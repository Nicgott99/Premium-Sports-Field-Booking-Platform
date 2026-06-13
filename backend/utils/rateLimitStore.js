/**
 * Rate limit store for distributed rate limiting
 */

class RateLimitStore {
  /**
   * Record rate limit attempt
   * @param {string} key - Rate limit key
   * @param {number} limit - Limit
   * @param {number} windowMs - Time window
   * @returns {object} Rate limit status
   */
  async recordAttempt(key, limit, windowMs) {
    throw new Error('recordAttempt not implemented');
  }

  /**
   * Get current count
   * @param {string} key - Rate limit key
   * @returns {Promise}
   */
  async getCount(key) {
    throw new Error('getCount not implemented');
  }

  /**
   * Reset limit
   * @param {string} key - Rate limit key
   * @returns {Promise}
   */
  async reset(key) {
    throw new Error('reset not implemented');
  }
}

/**
 * In-memory rate limit store
 */
class MemoryRateLimitStore extends RateLimitStore {
  constructor() {
    super();
    this.store = new Map();
  }

  async recordAttempt(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.store.has(key)) {
      this.store.set(key, []);
    }

    const attempts = this.store.get(key);
    const validAttempts = attempts.filter(t => t > windowStart);

    const allowed = validAttempts.length < limit;
    if (allowed) {
      validAttempts.push(now);
    }

    this.store.set(key, validAttempts);

    return {
      allowed,
      remaining: Math.max(0, limit - validAttempts.length),
      resetTime: validAttempts[0] ? new Date(validAttempts[0] + windowMs) : new Date(now + windowMs),
    };
  }

  async getCount(key) {
    return this.store.get(key)?.length || 0;
  }

  async reset(key) {
    this.store.delete(key);
  }
}

/**
 * Redis rate limit store
 */
class RedisRateLimitStore extends RateLimitStore {
  constructor(redisClient) {
    super();
    this.redis = redisClient;
  }

  async recordAttempt(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await this.redis.zremrangebyscore(key, '-inf', windowStart);

    // Add current attempt
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);

    // Get current count
    const count = await this.redis.zcard(key);

    // Set expiration
    await this.redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count),
      resetTime: new Date(now + windowMs),
    };
  }

  async getCount(key) {
    return this.redis.zcard(key);
  }

  async reset(key) {
    return this.redis.del(key);
  }
}

export { RateLimitStore, MemoryRateLimitStore, RedisRateLimitStore };

export const createRateLimitStore = (type = 'memory', options = {}) => {
  switch (type) {
    case 'redis':
      return new RedisRateLimitStore(options.redisClient);
    case 'memory':
    default:
      return new MemoryRateLimitStore();
  }
};

export default RateLimitStore;
