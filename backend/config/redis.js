import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;

export const createRedisClient = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Too many Redis retry attempts');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Client Error: ${err}`);
    });

    redisClient.on('connect', () => {
      logger.info('🟢 Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('🚀 Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.warn('🔴 Redis Client Connection Ended');
    });

    await redisClient.connect();
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
    if (!redisClient || !redisClient.isOpen) {
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
    if (!redisClient || !redisClient.isOpen) {
      logger.warn('Redis client not available for getCache');
      return null;
    }
    
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Redis getCache error: ${error.message}`);
    return null;
  }
};

export const deleteCache = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) {
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
    if (!redisClient || !redisClient.isOpen) {
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

export default { 
  createRedisClient, 
  getRedisClient, 
  setCache, 
  getCache, 
  deleteCache, 
  clearCache 
};