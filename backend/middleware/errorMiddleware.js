import logger from '../utils/logger.js';

/**
 * Middleware to handle 404 Not Found errors
 * Creates error object and passes to error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Central error handling middleware
 * Catches all errors and formats responses with appropriate status codes
 * Handles Mongoose, JWT, Firebase, and custom errors
 * @async
 * @param {Error} err - Error object with name, message, code, etc.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Formatted error response JSON
 * 
 * Error Types Handled:
 * - CastError: Mongoose invalid ObjectId (404)
 * - ValidationError: Mongoose schema validation failure (400)
 * - Duplicate Key (11000): Unique field constraint violation (400)
 * - JsonWebTokenError: Invalid JWT token (401)
 * - TokenExpiredError: Expired JWT token (401)
 * - Firebase Auth Errors: Firebase token/auth issues (401)
 * - AppError: Custom application errors (uses statusCode)
 * - Default: Generic server error (500)
 * 
 * @throws {void}
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Log error with full context
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Mongoose bad ObjectId (invalid format)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key error (unique constraint violation)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose validation error (schema constraints)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // JWT errors - invalid or malformed token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // JWT errors - expired token
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Firebase Auth errors - expired or invalid token
  if (err.code === 'auth/id-token-expired') {
    statusCode = 401;
    message = 'Firebase token expired';
  }

  if (err.code === 'auth/argument-error') {
    statusCode = 401;
    message = 'Invalid Firebase token';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    }),
    timestamp: new Date().toISOString()
  });
};

export { notFound, errorHandler };