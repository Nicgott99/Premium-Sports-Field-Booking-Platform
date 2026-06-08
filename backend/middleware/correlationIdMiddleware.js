import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * Correlation ID middleware
 * Tracks requests across distributed systems for debugging and monitoring
 */

/**
 * Generate unique correlation ID for request tracking
 * @returns {function} Express middleware
 */
export const correlationId = (req, res, next) => {
  // Check if correlation ID already exists (for forwarded requests)
  let corrId = req.headers['x-correlation-id'] || req.headers['x-request-id'];

  // Generate new if not provided
  if (!corrId) {
    corrId = `${Date.now()}-${uuidv4()}`;
  }

  // Store in request object
  req.id = corrId;
  req.correlationId = corrId;
  req.startTime = Date.now();

  // Add to response headers
  res.setHeader('x-correlation-id', corrId);
  res.setHeader('x-request-id', corrId);

  // Add to locals for templates/rendering
  res.locals.correlationId = corrId;

  // Log request with correlation ID
  const logData = {
    correlationId: corrId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  };

  logger.info(`[${corrId}] Incoming request: ${req.method} ${req.path}`, logData);

  // Track response completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;
    const logResponse = {
      correlationId: corrId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      method: req.method,
      path: req.path,
      size: Buffer.byteLength(data),
    };

    if (res.statusCode >= 400) {
      logger.warn(`[${corrId}] Request failed`, logResponse);
    } else {
      logger.info(`[${corrId}] Request completed: ${res.statusCode}`, logResponse);
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Extract correlation ID from various sources
 * @param {object} req - Express request
 * @returns {string} Correlation ID
 */
export const getCorrelationId = (req) => {
  return (
    req.id ||
    req.correlationId ||
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    'unknown'
  );
};

/**
 * Add correlation ID to all log messages
 * @returns {function} Express middleware
 */
export const addCorrelationIdToLogs = (req, res, next) => {
  const corrId = getCorrelationId(req);

  // Monkey-patch logger to include correlation ID
  const originalLog = logger.info;
  logger.info = function(message, ...args) {
    return originalLog.call(this, `[${corrId}] ${message}`, ...args);
  };

  res.on('finish', () => {
    // Restore original logger
    logger.info = originalLog;
  });

  next();
};

/**
 * Correlation ID tracking for async operations
 * @param {string} correlationId - Correlation ID
 * @param {function} fn - Async function
 * @returns {Promise} Function result
 */
export const withCorrelationId = async (correlationId, fn) => {
  try {
    logger.info(`[${correlationId}] Starting async operation`);
    const result = await fn();
    logger.info(`[${correlationId}] Async operation completed`);
    return result;
  } catch (error) {
    logger.error(`[${correlationId}] Async operation failed:`, error);
    throw error;
  }
};

/**
 * Create correlation ID context for function execution
 * @param {string} correlationId - Correlation ID
 * @param {function} fn - Function to execute
 * @returns {*} Function result
 */
export const withCorrelationContext = (correlationId, fn) => {
  const context = {
    correlationId,
    timestamp: new Date().toISOString(),
    logger: {
      info: (msg) => logger.info(`[${correlationId}] ${msg}`),
      warn: (msg) => logger.warn(`[${correlationId}] ${msg}`),
      error: (msg) => logger.error(`[${correlationId}] ${msg}`),
    },
  };
  return fn(context);
};

export default {
  correlationId,
  getCorrelationId,
  addCorrelationIdToLogs,
  withCorrelationId,
  withCorrelationContext,
};
