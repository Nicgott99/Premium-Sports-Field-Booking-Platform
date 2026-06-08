import logger from '../utils/logger.js';

/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Timeout middleware factory
 * @param {number} timeout - Timeout in milliseconds
 * @returns {function} Express middleware
 */
export const requestTimeout = (timeout = DEFAULT_TIMEOUT) => {
  return (req, res, next) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(`Request timeout: ${req.method} ${req.path} (${timeout}ms)`);
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          message: 'The request took too long to process. Please try again.',
          code: 408,
        });
      }
    }, timeout);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

/**
 * Category-specific timeout middleware
 * Different timeouts for different operations
 */
export const categoryTimeouts = {
  // Fast endpoints - 10 seconds
  fast: requestTimeout(10000),

  // Standard endpoints - 30 seconds
  standard: requestTimeout(30000),

  // Slow endpoints - 60 seconds
  slow: requestTimeout(60000),

  // Very slow endpoints - 120 seconds
  verySlow: requestTimeout(120000),
};

/**
 * Long-running operation middleware (uploads, exports, etc)
 */
export const longOperationTimeout = requestTimeout(300000); // 5 minutes

/**
 * Apply timeout based on endpoint path
 * @returns {function} Express middleware
 */
export const adaptiveTimeout = (req, res, next) => {
  const path = req.path.toLowerCase();

  // Determine timeout based on endpoint
  let timeout = DEFAULT_TIMEOUT;

  if (path.includes('/export') || path.includes('/import') || path.includes('/upload')) {
    timeout = 300000; // 5 minutes for exports/uploads
  } else if (path.includes('/report') || path.includes('/analytics')) {
    timeout = 120000; // 2 minutes for reports
  } else if (path.includes('/search') || path.includes('/list')) {
    timeout = 20000; // 20 seconds for searches/lists
  } else if (path.includes('/bulk') || path.includes('/batch')) {
    timeout = 120000; // 2 minutes for bulk operations
  }

  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn(`Adaptive timeout triggered: ${req.method} ${path} (${timeout}ms)`);
      res.status(408).json({
        success: false,
        error: 'Request timeout',
        message: 'The request took too long to process.',
        code: 408,
      });
    }
  }, timeout);

  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));

  next();
};

/**
 * Handler for socket timeout
 * @param {object} socket - Node socket
 */
export const handleSocketTimeout = (socket) => {
  socket.setTimeout(300000); // 5 minutes socket timeout
  socket.on('timeout', () => {
    logger.warn('Socket timeout detected');
    socket.destroy();
  });
};

export default {
  requestTimeout,
  categoryTimeouts,
  longOperationTimeout,
  adaptiveTimeout,
  handleSocketTimeout,
};
