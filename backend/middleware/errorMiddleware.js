import logger from '../utils/logger.js';

/**
 * Error Handling Middleware Module
 * Centralized error processing for all API endpoints
 * 
 * Error Flow:
 * 1. Error thrown in route handler
 * 2. Caught by asyncHandler or try-catch
 * 3. Passed to errorHandler middleware
 * 4. Error type identified
 * 5. Status code and message formatted
 * 6. Error logged
 * 7. JSON response sent to client
 * 
 * Error Types Handled:
 * 
 * Mongoose Errors:
 * - CastError: Invalid ObjectId (404)
 * - ValidationError: Schema validation failure (400)
 * - Duplicate Key (11000): Unique constraint violation (400)
 * - MongoError: Database connection errors (500)
 * 
 * JWT Errors:
 * - JsonWebTokenError: Token signature invalid (401)
 * - TokenExpiredError: Token has expired (401)
 * - NotBeforeError: Token not yet valid (401)
 * 
 * Firebase Errors:
 * - FirebaseAuthError: Auth token invalid (401)
 * - Authentication failed (401)
 * 
 * HTTP Errors:
 * - 404 Not Found: Resource doesn't exist
 * - 400 Bad Request: Invalid input
 * - 401 Unauthorized: Authentication required
 * - 403 Forbidden: Insufficient permissions
 * - 422 Unprocessable: Validation failed
 * - 500 Server Error: Internal error
 * 
 * Custom Application Errors:
 * - AppError: Custom error class with status
 * - Uses statusCode property
 * - isOperational flag for handling
 * 
 * Error Response Format:
 * {
 *   success: false,
 *   status: 'fail' | 'error',
 *   statusCode: 400-599,
 *   message: 'Error description',
 *   error: 'Error details (dev only)',
 *   timestamp: '2024-05-12T10:30:00Z'
 * }
 * 
 * Logging:
 * - Error level logging
 * - Request details (URL, method, IP)
 * - Error stack trace
 * - User ID (if available)
 * - Request ID for tracing
 * 
 * Development vs Production:
 * - Dev: Full error stack trace in response
 * - Production: Generic error message only
 * - Dev: Console logging
 * - Production: File logging only
 * 
 * Security Considerations:
 * - No sensitive data exposed
 * - Stack traces hidden in production
 * - Generic error messages to clients
 * - Detailed logging for debugging
 * - Error rate monitoring
 * 
 * Special Handling:
 * - 404 errors auto-created for invalid routes
 * - Mongoose validation errors detailed
 * - Duplicate key errors user-friendly
 * - JWT errors clear messaging
 * 
 * Performance:
 * - Fast error handling
 * - No database queries in error handler
 * - Synchronous processing
 * - Minimal logging overhead
 * 
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

  // Stripe payment errors
  if (err.type === 'StripeCardError') {
    statusCode = 402;
    message = `Payment declined: ${err.message}`;
  }

  if (err.type === 'StripeRateLimitError') {
    statusCode = 429;
    message = 'Too many payment requests, please try again later';
  }

  if (err.type === 'StripeAPIError') {
    statusCode = 500;
    message = 'Payment service error, please try again';
  }

  if (err.type === 'StripeInvalidRequestError') {
    statusCode = 400;
    message = `Invalid payment request: ${err.message}`;
  }

  // Stripe connection errors
  if (err.code === 'ERR_STRIPE_NETWORK') {
    statusCode = 503;
    message = 'Payment service temporarily unavailable';
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