import crypto from 'crypto';

/**
 * Request deduplication to prevent duplicate operations
 */

class RequestDeduplicator {
  constructor(ttl = 3600000) {
    this.requests = new Map();
    this.ttl = ttl;
  }

  /**
   * Generate request fingerprint
   * @param {object} req - Request
   * @returns {string} Fingerprint
   */
  generateFingerprint(req) {
    const data = {
      method: req.method,
      path: req.path,
      body: req.body,
      userId: req.user?.id,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Check if request is duplicate
   * @param {string} fingerprint - Request fingerprint
   * @returns {boolean}
   */
  isDuplicate(fingerprint) {
    const request = this.requests.get(fingerprint);
    if (!request) return false;

    const age = Date.now() - request.timestamp;
    if (age > this.ttl) {
      this.requests.delete(fingerprint);
      return false;
    }

    return true;
  }

  /**
   * Mark request as processed
   * @param {string} fingerprint - Request fingerprint
   * @param {*} result - Request result
   */
  markProcessed(fingerprint, result) {
    this.requests.set(fingerprint, {
      timestamp: Date.now(),
      result,
    });
  }

  /**
   * Get cached result
   * @param {string} fingerprint - Request fingerprint
   * @returns {*} Cached result
   */
  getCachedResult(fingerprint) {
    const request = this.requests.get(fingerprint);
    return request?.result;
  }

  /**
   * Clear old entries
   */
  cleanup() {
    const now = Date.now();
    for (const [fingerprint, request] of this.requests) {
      if (now - request.timestamp > this.ttl) {
        this.requests.delete(fingerprint);
      }
    }
  }
}

/**
 * Deduplication middleware
 * @param {RequestDeduplicator} deduplicator - Deduplicator instance
 * @returns {function} Middleware
 */
export const deduplicationMiddleware = (deduplicator) => {
  return (req, res, next) => {
    // Only deduplicate idempotent operations
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    const fingerprint = deduplicator.generateFingerprint(req);

    if (deduplicator.isDuplicate(fingerprint)) {
      const result = deduplicator.getCachedResult(fingerprint);
      res.setHeader('X-Duplicate-Request', 'true');
      return res.json(result);
    }

    const originalJson = res.json;
    res.json = function(data) {
      deduplicator.markProcessed(fingerprint, data);
      return originalJson.call(this, data);
    };

    next();
  };
};

export { RequestDeduplicator };

export default RequestDeduplicator;
