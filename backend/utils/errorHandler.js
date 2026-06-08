import logger from './logger.js';

/**
 * Comprehensive error handling utilities
 * Standardizes error responses and logging
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

export class ExternalServiceError extends AppError {
  constructor(service = 'External Service', message = null) {
    super(message || `${service} is unavailable`, 503, 'SERVICE_UNAVAILABLE');
    this.service = service;
  }
}

/**
 * Handle errors and format response
 * @param {Error} error - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
export const handleError = (error, req, res) => {
  let appError = error;

  // Convert non-AppError to AppError
  if (!(error instanceof AppError)) {
    if (error.name === 'ValidationError') {
      appError = new ValidationError('Validation failed', error.details);
    } else if (error.name === 'CastError') {
      appError = new ValidationError('Invalid ID format');
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      appError = new ConflictError('Resource already exists');
    } else {
      appError = new AppError(error.message || 'An unexpected error occurred', 500, 'INTERNAL_ERROR');
    }
  }

  // Log error
  logError(appError, req);

  // Send response
  const response = {
    success: false,
    error: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
  };

  if (appError.details) {
    response.details = appError.details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(appError.statusCode).json(response);
};

/**
 * Log error with context
 * @param {AppError} error - Error to log
 * @param {object} req - Express request
 */
export const logError = (error, req) => {
  const logData = {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: error.timestamp,
  };

  if (error.statusCode >= 500) {
    logger.error(`[${error.code}] ${error.message}`, logData);
  } else {
    logger.warn(`[${error.code}] ${error.message}`, logData);
  }
};

/**
 * Catch async errors in route handlers
 * @param {function} fn - Async function
 * @returns {function} Express middleware
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate required fields
 * @param {object} data - Object to validate
 * @param {array} required - Required field names
 * @throws {ValidationError}
 */
export const validateRequired = (data, required) => {
  const missing = required.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new ValidationError('Missing required fields', { missing });
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @throws {ValidationError}
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @throws {ValidationError}
 */
export const validateObjectId = (id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ValidationError('Invalid ID format');
  }
};

/**
 * Create error response with custom details
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status
 * @param {string} code - Error code
 * @param {object} details - Additional details
 * @returns {AppError}
 */
export const createError = (message, statusCode = 500, code = 'ERROR', details = null) => {
  const error = new AppError(message, statusCode, code);
  if (details) error.details = details;
  return error;
};

export default {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  handleError,
  logError,
  catchAsync,
  validateRequired,
  validateEmail,
  validateObjectId,
  createError,
};
