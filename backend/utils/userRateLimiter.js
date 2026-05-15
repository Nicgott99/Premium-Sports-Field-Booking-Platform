/**
 * Rate Limiting Per User Utility
 * Implements per-user rate limiting for specific operations
 * Prevents abuse of resource-intensive endpoints per user
 */

import { getRedisClient, setCache, getCache, deleteCache } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Rate limit configuration for different operations
 */
export const RATE_LIMIT_CONFIG = {
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  EMAIL_VERIFICATION: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  PAYMENT_ATTEMPT: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  BOOKING_CREATION: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  API_CALL: {
    maxAttempts: 100,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  CHAT_MESSAGE: {
    maxAttempts: 100,
    windowMs: 60 * 1000 // 1 minute
  },
  FILE_UPLOAD: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  LOGIN_ATTEMPT: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  }
};

/**
 * Check if user has exceeded rate limit for an operation
 * Uses Redis for distributed rate limiting
 * 
 * @param {string} userId - User ID
 * @param {string} operation - Operation name
 * @param {Object} customConfig - Override default config
 * @returns {Promise<Object>} Rate limit status
 */
export const checkUserRateLimit = async (userId, operation, customConfig = null) => {
  const config = customConfig || RATE_LIMIT_CONFIG[operation];
  
  if (!config) {
    logger.warn(`Rate limit config not found for operation: ${operation}`);
    return { allowed: true, remaining: -1, resetTime: null };
  }
  
  const redisKey = `ratelimit:${operation}:${userId}`;
  
  try {
    const redisClient = getRedisClient();
    
    // If Redis not available, allow request (fail open)
    if (!redisClient || !redisClient.isOpen) {
      logger.warn(`Redis unavailable for rate limiting, allowing request for ${userId}:${operation}`);
      return { allowed: true, remaining: -1, resetTime: null };
    }
    
    // Get current attempt count
    const attempts = await getCache(redisKey);
    const currentAttempts = parseInt(attempts || 0);
    
    if (currentAttempts >= config.maxAttempts) {
      // Rate limit exceeded
      const remainingTime = await redisClient.ttl(redisKey);
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + remainingTime * 1000),
        waitSeconds: remainingTime,
        message: `Too many ${operation} attempts. Please try again after ${remainingTime} seconds.`
      };
    }
    
    // Increment counter
    const newAttempts = currentAttempts + 1;
    await setCache(redisKey, newAttempts.toString(), config.windowMs / 1000);
    
    return {
      allowed: true,
      remaining: config.maxAttempts - newAttempts,
      resetTime: new Date(Date.now() + config.windowMs),
      message: null
    };
    
  } catch (error) {
    logger.error(`Rate limit check error: ${error.message}`);
    // Fail open - allow request if there's an error
    return { allowed: true, remaining: -1, resetTime: null };
  }
};

/**
 * Reset rate limit for a user operation
 * Called after successful password reset, etc.
 * 
 * @param {string} userId - User ID
 * @param {string} operation - Operation name
 * @returns {Promise<boolean>} Success status
 */
export const resetUserRateLimit = async (userId, operation) => {
  const redisKey = `ratelimit:${operation}:${userId}`;
  
  try {
    await deleteCache(redisKey);
    logger.info(`Rate limit reset for ${userId}:${operation}`);
    return true;
  } catch (error) {
    logger.error(`Rate limit reset error: ${error.message}`);
    return false;
  }
};

/**
 * Increment rate limit counter manually
 * Useful for accumulating multiple failed attempts
 * 
 * @param {string} userId - User ID
 * @param {string} operation - Operation name
 * @param {number} incrementBy - Amount to increment
 * @returns {Promise<number>} New attempt count
 */
export const incrementUserRateLimit = async (userId, operation, incrementBy = 1) => {
  const redisKey = `ratelimit:${operation}:${userId}`;
  const config = RATE_LIMIT_CONFIG[operation];
  
  if (!config) {
    logger.warn(`Rate limit config not found for operation: ${operation}`);
    return 0;
  }
  
  try {
    const redisClient = getRedisClient();
    
    if (!redisClient || !redisClient.isOpen) {
      logger.warn(`Redis unavailable for rate limiting`);
      return 0;
    }
    
    const attempts = await getCache(redisKey);
    const currentAttempts = parseInt(attempts || 0);
    const newAttempts = currentAttempts + incrementBy;
    
    await setCache(redisKey, newAttempts.toString(), config.windowMs / 1000);
    
    return newAttempts;
    
  } catch (error) {
    logger.error(`Increment rate limit error: ${error.message}`);
    return 0;
  }
};

/**
 * Get current rate limit status for a user
 * Useful for returning remaining attempts to frontend
 * 
 * @param {string} userId - User ID
 * @param {string} operation - Operation name
 * @returns {Promise<Object>} Current status
 */
export const getUserRateLimitStatus = async (userId, operation) => {
  const redisKey = `ratelimit:${operation}:${userId}`;
  const config = RATE_LIMIT_CONFIG[operation];
  
  if (!config) {
    logger.warn(`Rate limit config not found for operation: ${operation}`);
    return { attempts: 0, remaining: -1, maxAttempts: 0, resetTime: null };
  }
  
  try {
    const redisClient = getRedisClient();
    
    if (!redisClient || !redisClient.isOpen) {
      return { attempts: 0, remaining: -1, maxAttempts: config.maxAttempts, resetTime: null };
    }
    
    const attempts = await getCache(redisKey);
    const currentAttempts = parseInt(attempts || 0);
    const ttl = await redisClient.ttl(redisKey);
    
    return {
      attempts: currentAttempts,
      remaining: Math.max(0, config.maxAttempts - currentAttempts),
      maxAttempts: config.maxAttempts,
      resetTime: ttl > 0 ? new Date(Date.now() + ttl * 1000) : null,
      resetSeconds: ttl > 0 ? ttl : 0
    };
    
  } catch (error) {
    logger.error(`Get rate limit status error: ${error.message}`);
    return { attempts: 0, remaining: -1, maxAttempts: config.maxAttempts, resetTime: null };
  }
};

/**
 * Create middleware for rate limiting specific operations
 * 
 * @param {string} operation - Operation name from RATE_LIMIT_CONFIG
 * @param {Object} customConfig - Override config
 * @returns {Function} Express middleware
 */
export const createOperationRateLimitMiddleware = (operation, customConfig = null) => {
  return async (req, res, next) => {
    const userId = req.user?.id || req.ip;
    
    const rateLimitStatus = await checkUserRateLimit(userId, operation, customConfig);
    
    if (!rateLimitStatus.allowed) {
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: rateLimitStatus.message,
        retryAfter: rateLimitStatus.waitSeconds
      });
    }
    
    // Attach rate limit info to request for later use
    req.rateLimit = rateLimitStatus;
    
    next();
  };
};

/**
 * Utility to create custom rate limit config
 * 
 * @param {number} maxAttempts - Maximum attempts
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit configuration
 */
export const createRateLimitConfig = (maxAttempts, windowMs) => {
  return {
    maxAttempts,
    windowMs
  };
};
