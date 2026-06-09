import logger from './logger.js';

/**
 * Rate limiter implementation with sliding window algorithm
 */

class RateLimiter {
  constructor() {
    this.store = new Map();
  }

  /**
   * Check if request is allowed
   * @param {string} key - Rate limit key (user ID, IP, etc)
   * @param {number} limit - Max requests
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} Rate limit status
   */
  isAllowed(key, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.store.has(key)) {
      this.store.set(key, []);
    }

    const requests = this.store.get(key);

    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.store.set(key, validRequests);

    const allowed = validRequests.length < limit;

    if (allowed) {
      validRequests.push(now);
    }

    return {
      allowed,
      remaining: Math.max(0, limit - validRequests.length),
      limit,
      resetTime: validRequests.length > 0
        ? new Date(validRequests[0] + windowMs)
        : new Date(now + windowMs),
    };
  }

  /**
   * Get current rate limit status
   * @param {string} key - Rate limit key
   * @param {number} limit - Max requests
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} Status
   */
  getStatus(key, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.store.has(key)) {
      return {
        current: 0,
        limit,
        remaining: limit,
        resetTime: new Date(now + windowMs),
      };
    }

    const requests = this.store.get(key);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    return {
      current: validRequests.length,
      limit,
      remaining: Math.max(0, limit - validRequests.length),
      resetTime: validRequests.length > 0
        ? new Date(validRequests[0] + windowMs)
        : new Date(now + windowMs),
    };
  }

  /**
   * Reset rate limit for key
   * @param {string} key - Rate limit key
   */
  reset(key) {
    this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.store.clear();
  }

  /**
   * Get all rate limit data
   * @returns {object} Rate limits
   */
  getAll() {
    return Object.fromEntries(this.store);
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, requests] of this.store.entries()) {
      if (requests.length === 0 || requests[requests.length - 1] < now - 86400000) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} entries`);
    }
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware
 * @param {object} options - Options
 * @returns {function} Express middleware
 */
export const rateLimitMiddleware = (options = {}) => {
  const {
    limit = 100,
    windowMs = 60000,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later',
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = rateLimiter.isAllowed(key, limit, windowMs);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

    if (!result.allowed) {
      logger.warn(`Rate limit exceeded for ${key}`);
      res.status(429);
      return res.json({
        success: false,
        error: message,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
    }

    next();
  };
};

/**
 * Distributed rate limiter (for Redis)
 */
export class DistributedRateLimiter {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  /**
   * Check if request is allowed using Redis
   * @param {string} key - Rate limit key
   * @param {number} limit - Max requests
   * @param {number} windowSec - Time window in seconds
   * @returns {Promise} Rate limit status
   */
  async isAllowed(key, limit = 100, windowSec = 60) {
    const now = Date.now();
    const windowKey = `ratelimit:${key}`;

    // Remove old entries
    await this.redis.zremrangebyscore(windowKey, '-inf', now - windowSec * 1000);

    // Get current count
    const current = await this.redis.zcard(windowKey);

    if (current < limit) {
      await this.redis.zadd(windowKey, now, `${now}-${Math.random()}`);
      await this.redis.expire(windowKey, windowSec + 1);
      return {
        allowed: true,
        remaining: limit - current - 1,
        limit,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      limit,
    };
  }
}

export default {
  rateLimiter,
  rateLimitMiddleware,
  DistributedRateLimiter,
};
