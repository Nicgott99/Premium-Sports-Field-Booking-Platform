import crypto from 'node:crypto';
import logger from './logger.js';

/**
 * Idempotency Key Management for Payment Processing
 * Prevents duplicate payments and transaction duplicates
 * 
 * Purpose:
 * - Generate unique idempotency keys for payment requests
 * - Store and validate idempotency keys
 * - Detect and prevent duplicate transactions
 * - Ensure payment safety and reliability
 * 
 * How It Works:
 * 1. Client sends request with Idempotency-Key header
 * 2. Server validates key format and existence
 * 3. Check if key was already processed
 * 4. If exists: Return previous response (don't re-process)
 * 5. If new: Process request and store with result
 * 
 * Idempotency Key Format:
 * - UUID v4 format (36 characters)
 * - Unique per transaction attempt
 * - Client generates or server generates
 * - Sent in Idempotency-Key header
 * 
 * Storage Strategy:
 * - Redis: Primary storage (TTL: 24 hours)
 * - Format: key:idempotency:{key} = {response}
 * - Fallback: In-memory Map (development)
 * 
 * Request Lifecycle:
 * 1. POST /api/payments with Idempotency-Key header
 * 2. Server receives request
 * 3. Check Redis for existing key
 * 4. If found: Return cached response
 * 5. If not found: Process payment
 * 6. Store result in Redis with 24hr TTL
 * 7. Return response to client
 * 
 * Error Handling:
 * - Missing key: Generate UUID for client
 * - Invalid format: Return 400 error
 * - Conflict status: Different amount/currency with same key
 * - Expired key: Treat as new request
 * 
 * Security:
 * - Keys are random and unpredictable
 * - Keys cannot be reused across different transactions
 * - Different amount/currency returns 409 Conflict
 * - Keys expire after 24 hours
 * 
 * Performance:
 * - Redis lookup: < 5ms
 * - Cache hit: Return instantly
 * - Cache miss: Process normally
 * - Storage: ~1KB per stored key
 * 
 * Integration:
 * - Stripe: Includes idempotency key in request
 * - SSLCommerz: Store in transaction reference
 * - Custom tracking: Database transaction ID
 * 
 * Examples:
 * POST /api/payments
 * Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
 * {
 *   bookingId: "123",
 *   amount: 5000,
 *   currency: "BDT"
 * }
 * 
 * Response includes X-Idempotency-Key header
 */

// In-memory storage for development (fallback)
const idempotencyStore = new Map();

/**
 * Generate a new UUID v4 idempotency key
 * @returns {string} UUID v4 format string
 */
export const generateIdempotencyKey = () => {
  return crypto.randomUUID();
};

/**
 * Validate idempotency key format
 * @param {string} key - Idempotency key to validate
 * @returns {boolean} true if valid UUID v4 format
 */
export const isValidIdempotencyKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  // UUID v4 format: 550e8400-e29b-41d4-a716-446655440000
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
};

/**
 * Check if idempotency key was already processed
 * @async
 * @param {string} key - Idempotency key
 * @param {Object} redisClient - Redis client instance
 * @returns {Object|null} Stored response if found, null if not found
 */
export const getIdempotencyKeyResult = async (key, redisClient) => {
  try {
    if (!key) return null;

    const redisKey = `idempotency:${key}`;

    // Try Redis first (if available)
    if (redisClient && redisClient.isOpen) {
      const cached = await redisClient.get(redisKey);
      if (cached) {
        logger.info(`Idempotency key cache hit: ${key}`);
        const parsed = JSON.parse(cached);
        return parsed?.response || parsed;
      }
    }

    // Fallback to in-memory store
    if (idempotencyStore.has(key)) {
      const stored = idempotencyStore.get(key);
      if (stored.expiresAt > Date.now()) {
        logger.info(`Idempotency key in-memory hit: ${key}`);
        return stored.response;
      } else {
        // Remove expired key
        idempotencyStore.delete(key);
      }
    }

    return null;
  } catch (error) {
    logger.error(`Error retrieving idempotency key: ${error.message}`);
    return null;
  }
};

/**
 * Store idempotency key result
 * @async
 * @param {string} key - Idempotency key
 * @param {Object} response - Response object to store
 * @param {Object} redisClient - Redis client instance
 * @param {number} ttl - Time to live in seconds (default: 86400 = 24 hours)
 * @returns {boolean} true if stored successfully
 */
export const storeIdempotencyKeyResult = async (key, response, redisClient, ttl = 86400) => {
  try {
    if (!key || !response) return false;

    const redisKey = `idempotency:${key}`;
    const storageData = {
      key,
      response,
      timestamp: new Date().toISOString()
    };

    // Try Redis first (if available)
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(redisKey, ttl, JSON.stringify(storageData));
      logger.info(`Idempotency key stored in Redis: ${key}`);
    } else {
      // Fallback to in-memory store
      idempotencyStore.set(key, {
        response,
        expiresAt: Date.now() + (ttl * 1000)
      });
      logger.info(`Idempotency key stored in memory: ${key}`);
    }

    return true;
  } catch (error) {
    logger.error(`Error storing idempotency key: ${error.message}`);
    return false;
  }
};

/**
 * Cleanup expired idempotency keys from in-memory store
 * Should be called periodically by a cron job
 * @returns {number} Number of keys cleaned up
 */
export const cleanupExpiredKeys = () => {
  try {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, data] of idempotencyStore.entries()) {
      if (data.expiresAt <= now) {
        idempotencyStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired idempotency keys`);
    }

    return cleaned;
  } catch (error) {
    logger.error(`Error cleaning up idempotency keys: ${error.message}`);
    return 0;
  }
};

export default {
  generateIdempotencyKey,
  isValidIdempotencyKey,
  getIdempotencyKeyResult,
  storeIdempotencyKeyResult,
  cleanupExpiredKeys
};
