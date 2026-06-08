/**
 * Rate limiting configuration for different endpoints
 * Prevents abuse and ensures fair resource usage
 */

export const rateLimitConfig = {
  // Authentication endpoints - stricter limits
  auth: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts
      message: 'Too many login attempts, please try again later',
      keyGenerator: (req) => req.body.email || req.ip,
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 attempts
      message: 'Too many registration attempts, please try again later',
      keyGenerator: (req) => req.body.email || req.ip,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 attempts
      message: 'Too many password reset attempts, please try again later',
      keyGenerator: (req) => req.body.email || req.ip,
    },
  },

  // API endpoints - moderate limits
  api: {
    createBooking: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 bookings per minute
      message: 'Too many booking requests, please wait before trying again',
      keyGenerator: (req) => req.user?.id || req.ip,
    },
    createField: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 fields per hour
      message: 'Too many field creations, please wait before adding more',
      keyGenerator: (req) => req.user?.id || req.ip,
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 searches per minute
      message: 'Too many search requests, please slow down',
      keyGenerator: (req) => req.user?.id || req.ip,
    },
    sendMessage: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 messages per minute
      message: 'Too many messages, please slow down',
      keyGenerator: (req) => req.user?.id || req.ip,
    },
  },

  // Admin endpoints - strict limits
  admin: {
    sendBulkNotification: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 bulk sends per hour
      message: 'Too many bulk notification sends',
      keyGenerator: (req) => req.user?.id,
    },
    generateReport: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 reports per hour
      message: 'Too many report generations',
      keyGenerator: (req) => req.user?.id,
    },
    exportData: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 1, // 1 export per day
      message: 'You can only export data once per day',
      keyGenerator: (req) => req.user?.id,
    },
  },

  // Public endpoints - generous limits
  public: {
    listFields: {
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: 'Too many requests, please try again later',
      keyGenerator: (req) => req.ip,
    },
    fieldDetails: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      message: 'Too many requests, please try again later',
      keyGenerator: (req) => req.ip,
    },
  },
};

/**
 * Get rate limit config for a specific endpoint
 * @param {string} category - Rate limit category (auth, api, admin, public)
 * @param {string} endpoint - Endpoint name
 * @returns {object} Rate limit configuration
 */
export const getRateLimit = (category, endpoint) => {
  return rateLimitConfig[category]?.[endpoint] || {
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests, please try again later',
  };
};

/**
 * Skip rate limiting for certain conditions
 * @param {object} req - Express request
 * @returns {boolean} Whether to skip rate limiting
 */
export const shouldSkipRateLimit = (req) => {
  // Skip for admin users
  if (req.user?.role === 'admin') return false;

  // Skip for certain IPs if needed
  const trustedIps = process.env.TRUSTED_IPS?.split(',') || [];
  if (trustedIps.includes(req.ip)) return true;

  return false;
};

export default rateLimitConfig;
