/**
 * tokenBucketRateLimiter.js
 * Token-bucket in-memory rate limiter middleware for fine-grained API control.
 * Premium Sports Field Booking Platform
 *
 * Unlike express-rate-limit (fixed window), the token-bucket algorithm allows
 * short bursts while still enforcing a long-term average rate. Each client IP
 * gets a bucket that refills at a constant rate.
 *
 * Usage:
 *   import tokenBucketRateLimiter from '../middleware/tokenBucketRateLimiter.js';
 *
 *   // Allow 10 requests/minute with a max burst of 15
 *   router.post('/api/auth/login',
 *     tokenBucketRateLimiter({ capacity: 15, refillRate: 10, windowMs: 60_000 }),
 *     loginController
 *   );
 */

/**
 * @param {object} options
 * @param {number} [options.capacity=20]        - Maximum tokens (burst ceiling).
 * @param {number} [options.refillRate=10]      - Tokens added per window.
 * @param {number} [options.windowMs=60000]     - Refill window in ms (default 1 min).
 * @param {string} [options.keyBy='ip']         - Identifier: 'ip' | custom fn(req).
 * @returns {import('express').RequestHandler}
 */
const tokenBucketRateLimiter = (options = {}) => {
  const {
    capacity = 20,
    refillRate = 10,
    windowMs = 60_000,
    keyBy = 'ip',
  } = options;

  // Buckets map: key → { tokens, lastRefill }
  const buckets = new Map();

  const getKey = (req) => {
    if (typeof keyBy === 'function') return keyBy(req);
    const forwarded = req.headers['x-forwarded-for'];
    return forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  };

  const refill = (bucket, now) => {
    const elapsed = now - bucket.lastRefill;
    const newTokens = (elapsed / windowMs) * refillRate;
    bucket.tokens = Math.min(capacity, bucket.tokens + newTokens);
    bucket.lastRefill = now;
  };

  return (req, res, next) => {
    const key = getKey(req);
    const now = Date.now();

    if (!buckets.has(key)) {
      buckets.set(key, { tokens: capacity, lastRefill: now });
    }

    const bucket = buckets.get(key);
    refill(bucket, now);

    if (bucket.tokens < 1) {
      const retryAfterMs = Math.ceil((1 - bucket.tokens) / refillRate * windowMs);
      res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000));
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.',
        retryAfterMs,
      });
    }

    bucket.tokens -= 1;
    res.setHeader('X-RateLimit-Limit', capacity);
    res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));

    next();
  };
};

export default tokenBucketRateLimiter;
