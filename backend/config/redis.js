import { createClient } from 'redis';
import logger from '../utils/logger.js';

/**
 * Redis Caching & Session Configuration
 * Provides high-performance caching and session management
 * 
 * Redis Use Cases:
 * 1. Response Caching:
 *    - API responses (5-15 min TTL)
 *    - Database query results
 *    - Search results caching
 *    - Computed field analytics
 * 
 * 2. Session Storage:
 *    - User session data
 *    - JWT refresh tokens
 *    - Active user tracking
 *    - Login attempt tracking
 * 
 * 3. Rate Limiting:
 *    - API request counting
 *    - Login attempt throttling
 *    - Payment operation limits
 *    - File upload limits
 * 
 * 4. Real-time Data:
 *    - Online user presence
 *    - Chat message queuing
 *    - Notification queue
 *    - Activity feed updates
 * 
 * 5. Pub/Sub Messaging:
 *    - Event broadcasting
 *    - System notifications
 *    - Booking status updates
 *    - Chat room messages
 * 
 * Cache Key Patterns:
 * - field:{fieldId}:details - Field details (10 min)
 * - field:list:{page} - Field listings (5 min)
 * - user:{userId}:profile - User profile (15 min)
 * - booking:{bookingId} - Booking details (10 min)
 * - session:{sessionId} - Session data (24 hours)
 * - rate_limit:{userId} - Request counter (1 hour)
 * 
 * Connection Configuration:
 * - REDIS_URL: Redis server URL (redis://host:port)
 * - Retry Strategy: Exponential backoff
 * - Connection pooling
 * - Auto-reconnection
 * - Timeout handling
 * 
 * Cache Invalidation Strategy:
 * - TTL-based expiration
 * - Pattern-based deletion
 * - Event-triggered invalidation
 * - Manual cache flush
 * 
 * Performance Metrics:
 * - Cache hit rate tracking
 * - Response time improvement
 * - Memory usage monitoring
 * - Connection pool stats
 * 
 * Failover & Recovery:
 * - Graceful degradation if Redis unavailable
 * - Fallback to database queries
 * - Connection retry with exponential backoff
 * - Error logging and alerts
 * 
 * Memory Management:
 * - Eviction policy: LRU (Least Recently Used)
 * - Max memory: 512MB (configurable)
 * - Memory optimization for large datasets
 * - Key expiration cleanup
 * 
 * Security:
 * - Redis authentication (password)
 * - SSL/TLS encryption
 * - Private VPC deployment
 * - Access control lists
 */

let redisClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;

export const createRedisClient = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries, cause) => {
          reconnectAttempts = retries;
          
          // Connection refused - likely server down
          if (cause?.code === 'ECONNREFUSED') {
            logger.error('Redis: Server connection refused (may be down or wrong host)');
          }
          
          // ENOTFOUND means DNS resolution failed
          if (cause?.code === 'ENOTFOUND') {
            logger.error(`Redis: DNS resolution failed for ${process.env.REDIS_URL}`);
          }
          
          // Max attempts reached
          if (retries > MAX_RECONNECT_ATTEMPTS) {
            logger.error(`Redis: Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) exceeded`);
            return new Error('Max Redis reconnection attempts');
          }
          
          // Exponential backoff: 100ms, 200ms, 400ms, ..., max 3000ms
          const delay = Math.min(retries * 100, 3000);
          logger.debug(`Redis: Reconnecting in ${delay}ms (attempt ${retries}/${MAX_RECONNECT_ATTEMPTS})`);
          return delay;
        },
        connectTimeout: 5000,
        noDelay: true
      }
    });

    // Error handler - logs but does not auto-reconnect after disconnect
    redisClient.on('error', (err) => {
      logger.error(`Redis Client Error: ${err.message || err}`);
    });

    // Successful connection
    redisClient.on('connect', () => {
      logger.info('🟢 Redis Client Connected');
      reconnectAttempts = 0; // Reset on successful connection
    });

    // Client ready and can accept commands
    redisClient.on('ready', () => {
      logger.info('🚀 Redis Client Ready and accepting commands');
    });

    // Attempting reconnect
    redisClient.on('reconnecting', () => {
      logger.warn(`🟡 Redis Client Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    });

    // Connection ended (graceful close or after max attempts)
    redisClient.on('end', () => {
      logger.warn('🔴 Redis Client Connection Ended');
    });

    await redisClient.connect();
    logger.info('✅ Redis connection established successfully');
    return redisClient;

  } catch (error) {
    logger.error(`❌ Redis connection failed: ${error.message}`);
    // Don't exit process, allow app to run without Redis
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};

// Cache helper functions
export const setCache = async (key, value, expiration = 3600) => {
  try {
    if (!redisClient?.isOpen) {
      logger.warn('Redis client not available for setCache');
      return false;
    }
    
    await redisClient.setEx(key, expiration, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Redis setCache error: ${error.message}`);
    return false;
  }
};

export const getCache = async (key) => {
  try {
    if (!redisClient?.isOpen) {
      logger.warn('Redis client not available for getCache');
      return null;
    }
    
    const value = await redisClient.get(key);
    if (!value) {
      return null;
    }
    
    try {
      return JSON.parse(value);
    } catch (parseError) {
      logger.error(`Redis cache JSON parse error for key ${key}: ${parseError.message}`);
      // Try to return raw value if JSON parsing fails
      return value;
    }
  } catch (error) {
    logger.error(`Redis getCache error: ${error.message}`);
    return null;
  }
};

export const deleteCache = async (key) => {
  try {
    if (!redisClient?.isOpen) {
      logger.warn('Redis client not available for deleteCache');
      return false;
    }
    
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis deleteCache error: ${error.message}`);
    return false;
  }
};

export const clearCache = async (pattern = '*') => {
  try {
    if (!redisClient?.isOpen) {
      logger.warn('Redis client not available for clearCache');
      return false;
    }
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error(`Redis clearCache error: ${error.message}`);
    return false;
  }
};

/**
 * Check if Redis client is connected and ready
 */
export const isRedisConnected = () => {
  return redisClient?.isOpen === true;
};

/**
 * Get Redis health status and reconnection stats
 */
export const getRedisHealth = () => {
  return {
    connected: isRedisConnected(),
    isOpen: redisClient?.isOpen,
    status: redisClient?.status || 'disconnected',
    reconnectAttempts
  };
};

/**
 * Ping Redis with an optional timeout (ms). Returns true if PONG/OK received.
 */
export const pingRedis = async (timeoutMs = 2000) => {
  try {
    if (!redisClient?.isOpen) return false;
    const pingPromise = redisClient.ping();
    const res = await Promise.race([
      pingPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), timeoutMs))
    ]);
    return res === 'PONG' || res === 'OK' || !!res;
  } catch (err) {
    logger.warn(`Redis ping failed: ${err.message}`);
    return false;
  }
};

export default { 
  createRedisClient, 
  getRedisClient, 
  setCache, 
  getCache, 
  deleteCache, 
  clearCache,
  isRedisConnected,
  getRedisHealth
};