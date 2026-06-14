/**
 * Response formatter middleware for consistent API responses
 */

/**
 * Standard response envelope
 * @param {boolean} success - Success flag
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {object} meta - Metadata
 * @returns {object}
 */
function createResponse(success, data = null, message = null, meta = null) {
  const response = {
    success,
    timestamp: new Date().toISOString(),
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * Response formatter middleware
 * @returns {function}
 */
export const responseFormatterMiddleware = () => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function(data) {
      // If already formatted, don't re-format
      if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
        return originalJson(data);
      }

      // Format response
      const formatted = createResponse(true, data);
      return originalJson(formatted);
    };

    // Override send method for streaming
    const originalSend = res.send.bind(res);
    res.send = function(data) {
      if (typeof data === 'object') {
        return this.json(data);
      }
      return originalSend(data);
    };

    next();
  };
};

/**
 * Success response
 * @param {object} res - Response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  const response = createResponse(true, data, message);
  res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {object} res - Response object
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code
 * @param {object} details - Error details
 */
export const sendError = (res, error, statusCode = 400, details = null) => {
  const response = createResponse(false, null, error);

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {object} res - Response object
 * @param {array} items - Items
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Message
 */
export const sendPaginated = (res, items, total, page = 1, limit = 20, message = 'Success') => {
  const response = createResponse(true, items, message, {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  });

  res.json(response);
};

/**
 * Cached response
 * @param {object} res - Response object
 * @param {*} data - Response data
 * @param {string} cacheKey - Cache key
 * @param {string} message - Message
 */
export const sendCached = (res, data, cacheKey, message = 'Success') => {
  const response = createResponse(true, data, message);
  response.cached = true;
  response.cacheKey = cacheKey;
  res.json(response);
};

/**
 * Validation error response
 * @param {object} res - Response object
 * @param {array} errors - Validation errors
 */
export const sendValidationError = (res, errors) => {
  const response = createResponse(false, null, 'Validation failed');
  response.errors = errors;
  res.status(422).json(response);
};

/**
 * Redirect response
 * @param {object} res - Response object
 * @param {string} url - Redirect URL
 * @param {object} data - Response data
 */
export const sendRedirect = (res, url, data = null) => {
  const response = createResponse(true, data, 'Redirecting');
  response.redirect = url;
  res.status(302).json(response);
};

export default responseFormatterMiddleware;
