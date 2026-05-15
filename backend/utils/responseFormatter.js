/**
 * Standardized Response Format Utility
 * Ensures all API responses follow consistent structure
 * 
 * Purpose:
 * - Unified response format across all endpoints
 * - Consistent error handling
 * - Client-side predictability
 * - Easy error debugging
 * 
 * Response Structure:
 * {
 *   success: boolean,
 *   statusCode: number,
 *   message: string,
 *   data?: object,
 *   error?: string,
 *   timestamp: ISO8601,
 *   requestId?: string
 * }
 * 
 * Success Response (2xx):
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "Operation successful",
 *   data: { /* payload */ },
 *   timestamp: "2024-05-15T10:30:00Z"
 * }
 * 
 * Error Response (4xx/5xx):
 * {
 *   success: false,
 *   statusCode: 400,
 *   message: "Validation failed",
 *   error: "Email field is required",
 *   timestamp: "2024-05-15T10:30:00Z"
 * }
 * 
 * Implementation:
 * - Use in all controllers
 * - Express res.json() wrapper
 * - Automatic timestamp generation
 * - HTTP status code mapping
 */

import logger from './logger.js';

/**
 * Success Response Builder
 * @param {Object} data - Response data payload
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
export const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    ...(data && { data }),
    timestamp: new Date().toISOString()
  };
};

/**
 * Error Response Builder
 * @param {string} message - Error message
 * @param {string} error - Detailed error description
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {Object} Formatted error response
 */
export const errorResponse = (message = 'Error', error = null, statusCode = 500) => {
  return {
    success: false,
    statusCode,
    message,
    ...(error && { error: typeof error === 'string' ? error : error.message }),
    timestamp: new Date().toISOString()
  };
};

/**
 * Validation Error Response Builder
 * @param {Array} errors - Array of validation errors
 * @param {string} message - Error message (default: "Validation failed")
 * @returns {Object} Formatted validation error response
 */
export const validationErrorResponse = (errors = [], message = 'Validation failed') => {
  return {
    success: false,
    statusCode: 400,
    message,
    errors,
    timestamp: new Date().toISOString()
  };
};

/**
 * Paginated Response Builder
 * @param {Array} data - Array of items
 * @param {number} total - Total count of all items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
export const paginatedResponse = (data = [], total = 0, page = 1, limit = 10, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Response middleware for Express
 * Adds helper methods to res object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const responseMiddleware = (req, res, next) => {
  // Success response helper
  res.success = (data = null, message = 'Success', statusCode = 200) => {
    const response = successResponse(data, message, statusCode);
    return res.status(statusCode).json(response);
  };

  // Error response helper
  res.error = (message = 'Error', error = null, statusCode = 500) => {
    const response = errorResponse(message, error, statusCode);
    return res.status(statusCode).json(response);
  };

  // Validation error helper
  res.validationError = (errors = [], message = 'Validation failed') => {
    const response = validationErrorResponse(errors, message);
    return res.status(400).json(response);
  };

  // Paginated response helper
  res.paginated = (data = [], total = 0, page = 1, limit = 10, message = 'Success') => {
    const response = paginatedResponse(data, total, page, limit, message);
    return res.status(200).json(response);
  };

  // Not found helper
  res.notFound = (message = 'Resource not found') => {
    const response = errorResponse(message, null, 404);
    return res.status(404).json(response);
  };

  // Unauthorized helper
  res.unauthorized = (message = 'Not authorized') => {
    const response = errorResponse(message, null, 401);
    return res.status(401).json(response);
  };

  // Forbidden helper
  res.forbidden = (message = 'Forbidden') => {
    const response = errorResponse(message, null, 403);
    return res.status(403).json(response);
  };

  // Conflict helper
  res.conflict = (message = 'Conflict') => {
    const response = errorResponse(message, null, 409);
    return res.status(409).json(response);
  };

  // Bad request helper
  res.badRequest = (message = 'Bad request') => {
    const response = errorResponse(message, null, 400);
    return res.status(400).json(response);
  };

  // Server error helper
  res.serverError = (message = 'Internal server error', error = null) => {
    const response = errorResponse(message, error, 500);
    logger.error(`Server error: ${message}`, error);
    return res.status(500).json(response);
  };

  next();
};

export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
  responseMiddleware
};
