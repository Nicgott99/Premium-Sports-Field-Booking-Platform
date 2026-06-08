/**
 * Standardized API response formatter
 * Ensures consistent response structure across all endpoints
 */

/**
 * Success response wrapper
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {object} meta - Optional metadata (pagination, etc)
 * @returns {object} Formatted response
 */
export const successResponse = (data, message = 'Success', meta = null) => {
  const response = {
    success: true,
    data,
    message,
  };
  if (meta) response.meta = meta;
  return response;
};

/**
 * Error response wrapper
 * @param {string} error - Error message
 * @param {number} code - HTTP status code
 * @param {array} details - Optional error details
 * @returns {object} Formatted error response
 */
export const errorResponse = (error, code = 500, details = null) => {
  const response = {
    success: false,
    error,
    code,
  };
  if (details) response.details = details;
  return response;
};

/**
 * Paginated response wrapper
 * @param {array} items - Array of items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Optional message
 * @returns {object} Paginated response
 */
export const paginatedResponse = (items, total, page, limit, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data: items,
    message,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Wrap Express response methods for consistent formatting
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next
 */
export const responseFormatterMiddleware = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to ensure proper formatting
  res.json = function(data) {
    // If data already has success field, return as-is
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }
    // Wrap in success response
    const wrapped = successResponse(data, 'Operation successful');
    return originalJson.call(this, wrapped);
  };

  // Helper method for error responses
  res.sendError = function(message, statusCode = 400, details = null) {
    this.status(statusCode);
    return this.json(errorResponse(message, statusCode, details));
  };

  // Helper method for paginated responses
  res.sendPaginated = function(items, total, page, limit, message = 'Data retrieved successfully') {
    return this.json(paginatedResponse(items, total, page, limit, message));
  };

  // Helper method for success responses
  res.sendSuccess = function(data, message = 'Success') {
    return this.json(successResponse(data, message));
  };

  next();
};

/**
 * Transform MongoDB documents to plain objects
 * @param {*} doc - Mongoose document or array
 * @returns {*} Plain JavaScript object(s)
 */
export const toPlainObject = (doc) => {
  if (Array.isArray(doc)) {
    return doc.map(item => item.toObject ? item.toObject() : item);
  }
  return doc && doc.toObject ? doc.toObject() : doc;
};

/**
 * Format response with timestamps
 * @param {*} data - Response data
 * @param {string} message - Message
 * @returns {object} Response with timestamps
 */
export const withTimestamp = (data, message = 'Success') => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    responseTime: Date.now(),
  };
};

/**
 * Add metadata to response
 * @param {*} data - Response data
 * @param {object} metadata - Custom metadata
 * @returns {object} Response with metadata
 */
export const withMetadata = (data, metadata) => {
  return {
    success: true,
    data,
    meta: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Batch multiple responses
 * @param {array} responses - Array of responses
 * @returns {object} Batched response
 */
export const batchResponse = (responses) => {
  const successful = responses.filter(r => r.success).length;
  return {
    success: successful === responses.length,
    batch: {
      total: responses.length,
      successful,
      failed: responses.length - successful,
    },
    results: responses,
  };
};

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  responseFormatterMiddleware,
  toPlainObject,
  withTimestamp,
  withMetadata,
  batchResponse,
};
