import crypto from 'node:crypto';
import {
  generateIdempotencyKey,
  isValidIdempotencyKey,
  getIdempotencyKeyResult,
  storeIdempotencyKeyResult
} from '../utils/idempotencyKey.js';
import logger from '../utils/logger.js';

/**
 * Idempotency Middleware for Payment Processing
 * Ensures payment requests are processed only once, preventing duplicate charges
 * 
 * Functionality:
 * 1. Validates idempotency key format
 * 2. Checks if request was already processed
 * 3. Returns cached response if duplicate detected
 * 4. Adds key to response headers
 * 5. Stores response after processing
 * 
 * Implementation:
 * - Check Idempotency-Key header from client
 * - If missing: Generate UUID and return to client
 * - If present: Validate and check cache
 * - On response: Store with 24-hour TTL
 * 
 * Response Headers:
 * - X-Idempotency-Key: The idempotency key used
 * - X-Idempotency-Replayed: true if response is cached
 * - X-Idempotency-Expires: Expiration timestamp
 * 
 * Error Codes:
 * - 400: Invalid idempotency key format
 * - 409: Different request body with same key
 * 
 * Usage:
 * Apply to payment routes:
 * router.post('/payments', idempotencyMiddleware, createPayment);
 * 
 * Client Usage:
 * POST /api/payments
 * Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
 * 
 * If duplicate: Returns 200 with previous response
 * X-Idempotency-Replayed: true
 */

/**
 * Middleware to handle idempotency keys for payments
 * Prevents duplicate transaction processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {void}
 */
export const idempotencyMiddleware = async (req, res, next) => {
  try {
    // Only apply to POST requests (create operations)
    if (req.method !== 'POST') {
      return next();
    }

    let idempotencyKey = req.headers['idempotency-key'];

    // Generate key if not provided
    if (!idempotencyKey) {
      idempotencyKey = generateIdempotencyKey();
      logger.info(`Generated idempotency key: ${idempotencyKey}`);
    }

    // Validate key format
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Idempotency-Key format. Must be a valid UUID v4.'
      });
    }

    // Get Redis client from app
    const redisClient = req.app.get('redisClient');

    // Check if already processed
    const cachedResponse = await getIdempotencyKeyResult(idempotencyKey, redisClient);

    if (cachedResponse) {
      // Check if request body matches
      const storedBodyHash = cachedResponse.requestHash;
      const currentBodyHash = generateRequestHash(req.body);

      if (storedBodyHash !== currentBodyHash) {
        return res.status(409).json({
          success: false,
          message: 'Conflict: Different request body with same Idempotency-Key'
        });
      }

      // Return cached response
      res.set('X-Idempotency-Key', idempotencyKey);
      res.set('X-Idempotency-Replayed', 'true');

      logger.info(`Returning cached response for idempotency key: ${idempotencyKey}`);
      return res.status(cachedResponse.statusCode).json(cachedResponse.body);
    }

    // Store key in request for use in controller
    req.idempotencyKey = idempotencyKey;

    // Intercept res.json to store response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Store the response for idempotency
      const requestHash = generateRequestHash(req.body);
      storeIdempotencyKeyResult(
        idempotencyKey,
        {
          statusCode: res.statusCode,
          body: data,
          requestHash
        },
        redisClient
      ).catch((storeError) => {
        logger.error(`Failed to persist idempotency response: ${storeError.message}`);
      });

      // Set idempotency headers
      res.set('X-Idempotency-Key', idempotencyKey);
      res.set('X-Idempotency-Replayed', 'false');
      res.set('X-Idempotency-Expires', new Date(Date.now() + 86400000).toISOString());

      return originalJson(data);
    };

    next();
  } catch (error) {
    logger.error(`Idempotency middleware error: ${error.message}`);
    // Don't fail the request, continue without idempotency
    next();
  }
};

/**
 * Generate hash of request body for duplicate detection
 * @param {Object} body - Request body
 * @returns {string} SHA256 hash of body
 */
function generateRequestHash(body) {
  try {
    const bodyString = JSON.stringify(body);
    return crypto
      .createHash('sha256')
      .update(bodyString)
      .digest('hex');
  } catch (error) {
    logger.error(`Error generating request hash: ${error.message}`);
    return '';
  }
}

export default idempotencyMiddleware;
