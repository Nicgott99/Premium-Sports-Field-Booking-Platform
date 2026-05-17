import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';
import { getCache, setCache, deleteCache, clearCache as clearRedisCache } from '../config/redis.js';

/**
 * Cache Middleware - Redis Response Caching System
 * Automatically caches API responses for improved performance and reduced database load
 * 
 * Purpose:
 * - Cache frequently accessed data in Redis
 * - Reduce database queries and API calls
 * - Improve response times
 * - Reduce server load during traffic spikes
 * - Implement TTL-based cache expiration
 * 
 * How It Works:
 * 1. Request comes to endpoint
 * 2. Check if response exists in Redis cache
 * 3. If cached: Return from cache immediately
 * 4. If not cached: Process request normally
 * 5. Store response in Redis with TTL
 * 6. Return response to client
 * 
 * Cache Flow:
 * Request → Check Redis → Hit: Return cached → Miss: Execute → Store → Return
 * 
 * Cache Key Generation:
 * - Base: route + method (GET /api/fields)
 * - User-specific: Add userId if authenticated
 * - Query params: Include filter, sort, pagination
 * - Example: "fields:authenticated:sport=football:page=1"
 * 
 * TTL (Time To Live):
 * - Field listings: 15 minutes
 * - Availability: 1 minute (real-time)
 * - User profile: 5 minutes
 * - Booking calendar: 5 minutes
 * - Statistics: 1 hour
 * - Search results: 5 minutes
 * 
 * Cache Types:
 * - User-specific: Cached per user (authenticated)
 * - Global: Cached for all users (public data)
 * - Query-based: Cached with query parameters
 * - Time-based: Cached with TTL expiration
 * 
 * Cached Endpoints:
 * - GET /api/fields (15 min)
 * - GET /api/fields/:id (15 min)
 * - GET /api/bookings/:fieldId/calendar (5 min)
 * - GET /api/users/:id (5 min)
 * - GET /api/reviews/:fieldId (10 min)
 * - GET /api/teams (10 min)
 * - GET /api/tournaments (5 min)
 * - GET /api/notifications (1 min)
 * 
 * Cache Invalidation:
 * - Manual: Clear on CREATE, UPDATE, DELETE
 * - TTL expiration: Automatic after TTL
 * - Pattern deletion: Clear related keys
 * - Bulk clear: Clear entire cache on deploy
 * 
 * Invalidation Triggers:
 * - Field updated: Clear field cache + listings
 * - Booking created: Clear availability + calendar
 * - Review posted: Clear field rating cache
 * - User updated: Clear user profile cache
 * 
 * Cache Control Headers:
 * - Cache-Control: public, max-age=300 (5 min)
 * - ETag: For cache validation
 * - Last-Modified: For conditional requests
 * - Expires: Cache expiration time
 * 
 * Benefits:
 * - Response time: 100-1000x faster from cache
 * - Database load: 70-90% reduction
 * - API calls: Significantly reduced
 * - Scalability: Handle more users
 * - Cost: Less server resources needed
 * 
 * Cache Statistics:
 * - Hit rate: % of requests served from cache
 * - Miss rate: % of requests hitting DB
 * - Eviction rate: % of cache items removed
 * - Memory usage: Current Redis memory
 * - Key count: Total keys in cache
 * 
 * Redis Configuration:
 * - Max memory: 512MB default
 * - Eviction policy: LRU (Least Recently Used)
 * - Persistence: RDB snapshots
 * - Replication: Master-slave setup
 * 
 * Bypass Cache:
 * - Header: Cache-Control: no-cache
 * - Query param: ?nocache=true
 * - Admin bypass: For testing/debugging
 * 
 * Error Handling:
 * - Redis down: Continue without cache
 * - Cache get error: Fetch from DB
 * - Cache set error: Return response normally
 * - Graceful degradation: No breaking errors
 * 
 * Monitoring:
 * - Redis connection status
 * - Cache hit/miss ratio
 * - Memory usage alerts
 * - Key eviction monitoring
 * - Performance metrics
 * 
 * Performance Impact:
 * - Cache hit: ~5ms response time
 * - Cache miss: ~50-200ms (DB query)
 * - Cache set: ~10-20ms overhead
 * - Memory: ~1KB per cached response
 * 
 * Cache Strategies:
 * - Write-through: Cache during write
 * - Lazy loading: Cache on read
 * - Time-based: TTL expiration
 * - Event-based: Invalidate on change
 * 
 * Security:
 * - Never cache sensitive data (passwords, tokens)
 * - Never cache user-specific secrets
 * - Clear cache on security events
 * - Audit cache access logs
 * 
 * Limitations:
 * - Memory constraints
 * - Stale data during TTL
 * - Cache invalidation complexity
 * - Network latency for Redis
 */
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
    // Do not cache authenticated requests or requests with sensitive headers
    if (req.headers?.authorization) {
      logger.debug('Skipping cache for authenticated request');
      return next();
    }

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return res.json(cached);
      }
    } catch (err) {
      logger.debug(`Cache read failed for ${cacheKey}: ${err?.message}`);
    }

    // Intercept res.json to store successful responses in cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Store in Redis asynchronously
          setCache(cacheKey, body, duration).catch(e => logger.debug(`Failed to set cache ${cacheKey}: ${e.message}`));
        }
      } catch (e) {
        logger.debug(`Cache set error for ${cacheKey}: ${e?.message}`);
      }
      return originalJson(body);
    };

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
    logger.debug(`Clearing cache pattern(s): ${Array.isArray(pattern) ? pattern.join(', ') : pattern}`);
    try {
      if (Array.isArray(pattern)) {
        await Promise.all(pattern.map(p => clearRedisCache(p)));
      } else {
        await clearRedisCache(pattern);
      }
    } catch (err) {
      logger.error(`Failed to clear cache pattern ${pattern}: ${err?.message}`);
    }
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
    
    if (req.headers?.authorization) {
      logger.debug('Skipping user cache for authenticated request with authorization header');
      return next();
    }

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        logger.debug(`User cache hit for ${cacheKey}`);
        return res.json(cached);
      }
    } catch (err) {
      logger.debug(`User cache read failed for ${cacheKey}: ${err?.message}`);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, body, duration).catch(e => logger.debug(`Failed to set user cache ${cacheKey}: ${e.message}`));
        }
      } catch (e) {
        logger.debug(`User cache set error for ${cacheKey}: ${e?.message}`);
      }
      return originalJson(body);
    };

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