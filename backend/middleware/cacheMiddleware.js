import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';

/**
 * Cache Middleware Module
 * Redis-based request caching for performance optimization
 * 
 * Caching Strategy:
 * - GET requests are cached by default
 * - Cache key includes HTTP method and full URL
 * - User-specific data cached with user ID prefix
 * - Pattern-based cache invalidation on updates
 * 
 * Cache Keys Format:
 * - General: `GET:http://localhost:3000/api/fields`
 * - User: `user:USER_ID:http://localhost:3000/api/user/profile`
 * - Field: `field:FIELD_ID:details`
 * - Booking: `booking:BOOKING_ID:details`
 * 
 * Cache Invalidation Triggers:
 * - POST requests clear related cache patterns
 * - PUT requests clear entity-specific cache
 * - DELETE requests clear entity and list cache
 * 
 * TTL (Time To Live) Strategy:
 * - List endpoints: 5 minutes (300s)
 * - Detail endpoints: 10 minutes (600s)
 * - User data: 15 minutes (900s)
 * - Search results: 5 minutes (300s)
 * 
 * Redis Integration:
 * - TODO: Connect to Redis client
 * - TODO: Implement cache hits/misses
 * - TODO: Add cache stats monitoring
 * 
 * Performance Benefits:
 * - Reduces database queries
 * - Faster response times
 * - Improved scalability
 * - Reduced server load
 */

/**
 * General-purpose cache middleware for Redis integration
 * Caches GET requests for specified duration
 * @async
 * @param {number} duration - Cache duration in seconds (default: 300)
 * @returns {Function} Middleware function
 */
export const cache = (duration = 300) => {
  return asyncHandler(async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from method and URL
    const cacheKey = `${req.method}:${req.originalUrl}`;
    
    // Placeholder cache implementation
    // TODO: Integrate with Redis client to check cache
    logger.debug(`Cache key: ${cacheKey}, duration: ${duration}s`);
    
    next();
  });
};

/**
 * Clear cache entries matching specific pattern
 * Useful for invalidating related cache entries on data updates
 * @async
 * @param {string|Array} pattern - Redis key pattern(s) to clear
 * @returns {Function} Middleware function
 * 
 * Examples:
 * - clearCache('field:*') - Clear all field caches
 * - clearCache(['user:123:*', 'booking:*']) - Clear user and booking caches
 */
export const clearCache = (pattern) => {
  return asyncHandler(async (req, res, next) => {
    // Placeholder cache clearing implementation
    // TODO: Integrate with Redis client to delete matching keys
    logger.debug(`Clearing cache pattern(s): ${Array.isArray(pattern) ? pattern.join(', ') : pattern}`);
    next();
  });
};

/**
 * Cache user-specific data and queries
 * Includes user ID in cache key for personalized caching
 * Prevents caching of sensitive user-specific content across users
 * @async
 * @param {number} duration - Cache duration in seconds (default: 300)
 * @returns {Function} Middleware function
 */
export const cacheUser = (duration = 300) => {
  return asyncHandler(async (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user?.id) {
      return next();
    }

    // Generate user-specific cache key
    const userId = req.user.id;
    const cacheKey = `user:${userId}:${req.originalUrl}`;
    
    // Placeholder user cache implementation
    // TODO: Integrate with Redis to store/retrieve user data
    logger.debug(`User cache key: ${cacheKey}`);
    
    next();
  });
};

/**
 * Cache field listing and detail responses
 * Prevents repeated database queries for field data
 * Invalidates on field updates or new bookings
 * @async
 * @returns {Function} Middleware function
 */
export const cacheFields = asyncHandler(async (req, res, next) => {
  // Placeholder field cache implementation
  // TODO: Implement specific caching logic for field endpoints
  logger.debug('Field caching middleware triggered');
  next();
});

/**
 * Cache booking data responses
 * Improves performance for frequently accessed booking info
 * @async
 * @returns {Function} Middleware function
 */
export const cacheBookings = asyncHandler(async (req, res, next) => {
  // Placeholder booking cache implementation
  // TODO: Implement specific caching logic for booking endpoints
  logger.debug('Booking caching middleware triggered');
  next();
});

/**
 * Invalidate cache on data modification
 * Called after POST, PUT, DELETE requests to clear related cache
 * @async
 * @param {string|Array} patterns - Redis key pattern(s) to invalidate
 * @returns {Function} Middleware function
 */
export const invalidateCache = (patterns) => {
  return asyncHandler(async (req, res, next) => {
    // Store patterns to invalidate after successful request
    req.cacheInvalidationPatterns = patterns;
    next();
  });
};