/**
 * cacheInvalidator.js
 * Utility to clear specific Redis cache keys or patterns.
 * Premium Sports Field Booking Platform
 */

import { getRedisClient } from '../config/redis.js';

/**
 * Deletes a specific exact cache key.
 * @param {string} key - The precise Redis key to delete.
 * @returns {Promise<boolean>} True if deleted, false otherwise.
 */
export const invalidateKey = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) {
      console.warn('[CacheInvalidator] Redis client not initialized. Skipping invalidation.');
      return false;
    }
    await client.del(key);
    console.log(`[CacheInvalidator] Invalidated exact key: ${key}`);
    return true;
  } catch (error) {
    console.error(`[CacheInvalidator] Failed to invalidate key ${key}:`, error);
    return false;
  }
};

/**
 * Deletes all keys matching a specific pattern using SCAN.
 * Useful for invalidating lists (e.g., clearing 'fields:*' when a new field is added).
 *
 * @param {string} pattern - The match pattern (e.g., 'fields:*')
 * @returns {Promise<number>} The number of keys deleted.
 */
export const invalidatePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    if (!client) {
      console.warn('[CacheInvalidator] Redis client not initialized. Skipping pattern invalidation.');
      return 0;
    }

    let cursor = '0';
    let deletedCount = 0;

    do {
      // Use SCAN instead of KEYS to avoid blocking the Redis event loop
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];

      if (keys.length > 0) {
        await client.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');

    console.log(`[CacheInvalidator] Invalidated ${deletedCount} keys matching pattern: ${pattern}`);
    return deletedCount;
  } catch (error) {
    console.error(`[CacheInvalidator] Failed to invalidate pattern ${pattern}:`, error);
    return 0;
  }
};

export default {
  invalidateKey,
  invalidatePattern
};
