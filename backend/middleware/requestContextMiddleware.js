import { v4 as uuidv4 } from 'uuid';

/**
 * Request context middleware for tracking request information
 */

const requestContextStorage = new Map();

/**
 * Generate request context
 * @returns {object} Context
 */
function generateContext() {
  return {
    id: uuidv4(),
    timestamp: Date.now(),
    startTime: process.hrtime.bigint(),
  };
}

/**
 * Request context middleware
 * @returns {function} Middleware
 */
export const requestContextMiddleware = (req, res, next) => {
  const context = generateContext();

  req.context = context;
  requestContextStorage.set(context.id, {
    context,
    req: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - context.startTime) / 1000000; // Convert to milliseconds

    const stored = requestContextStorage.get(context.id);
    if (stored) {
      stored.res = {
        statusCode: res.statusCode,
        duration,
      };

      // Keep context for 1 minute after response
      setTimeout(() => {
        requestContextStorage.delete(context.id);
      }, 60000);
    }
  });

  next();
};

/**
 * Get request context
 * @param {string} contextId - Context ID
 * @returns {object|null} Context info or null
 */
export const getRequestContext = (contextId) => {
  return requestContextStorage.get(contextId) || null;
};

/**
 * Get all active contexts
 * @returns {array} All contexts
 */
export const getAllContexts = () => {
  return Array.from(requestContextStorage.values());
};

/**
 * Clear old contexts manually
 */
export const cleanupContexts = () => {
  const now = Date.now();
  let count = 0;

  for (const [id, data] of requestContextStorage.entries()) {
    if (now - data.context.timestamp > 60000) {
      requestContextStorage.delete(id);
      count++;
    }
  }

  return count;
};

export default requestContextMiddleware;
