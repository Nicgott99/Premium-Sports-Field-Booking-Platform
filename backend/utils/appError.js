/**
 * Custom Application Error Class
 * Extends Error to include HTTP status codes and operational error tracking
 * Provides structured error handling for API responses
 * 
 * Purpose:
 * - Consistent error format across application
 * - Easy status code and message handling
 * - Operational vs programmatic error distinction
 * - Stack trace capture for debugging
 * 
 * Error Categories:
 * 
 * Client Errors (4xx):
 * - 400: Bad Request (invalid input)
 * - 401: Unauthorized (auth required)
 * - 403: Forbidden (insufficient permissions)
 * - 404: Not Found (resource missing)
 * - 409: Conflict (duplicate, constraint violation)
 * - 422: Unprocessable (validation failed)
 * 
 * Server Errors (5xx):
 * - 500: Internal Server Error
 * - 502: Bad Gateway
 * - 503: Service Unavailable
 * 
 * Error Status:
 * - 'fail': 4xx errors (client fault)
 * - 'error': 5xx errors (server fault)
 * 
 * Properties:
 * - message: Error description
 * - statusCode: HTTP status code
 * - status: 'fail' or 'error'
 * - isOperational: true (expected error)
 * 
 * Operational Errors:
 * - Known, expected errors
 * - Predictable conditions
 * - Safe to show to user
 * - Examples: invalid input, not found
 * 
 * Programming Errors:
 * - Bugs in code
 * - Unexpected conditions
 * - Not caught by AppError
 * - Should crash process
 * 
 * Usage Examples:
 * throw new AppError('User not found', 404)
 * throw new AppError('Invalid email format', 400)
 * throw new AppError('Insufficient permissions', 403)
 * throw new AppError('Database error', 500)
 * 
 * Catching AppError:
 * if (error.isOperational) {
 *   // Handle operational error
 *   res.status(error.statusCode).json({ error });
 * } else {
 *   // Handle programming error
 *   process.exit(1);
 * }
 * 
 * Integration with Express:
 * - Pass to error middleware via next(error)
 * - Caught by express-async-handler
 * - Formatted by errorHandler middleware
 * - Sent as JSON response
 * 
 * Stack Trace:
 * - Captured at error creation
 * - Excludes AppError constructor
 * - Useful for debugging
 * - Not exposed in production
 * 
 * Custom Application error class
 * Extends Error to include HTTP status codes and operational error tracking
 * Provides structured error handling for API responses
 * 
 * @class AppError
 * @extends {Error}
 * 
 * @example
 * throw new AppError('Invalid credentials', 401);
 * throw new AppError('Resource not found', 404);
 * throw new AppError('Internal server error', 500);
 */
export class AppError extends Error {
  /**
   * Create AppError instance
   * 
   * @constructor
   * @param {string} message - Error message to display
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 500, etc.)
   * 
   * @property {string} message - Error description
   * @property {number} statusCode - HTTP status code
   * @property {string} status - 'fail' for 4xx codes, 'error' for 5xx
   * @property {boolean} isOperational - Marks error as expected/operational
   * 
   * Status Categories:
   * - 400-499: Client errors (fail)
   * - 500-599: Server errors (error)
   * 
   * @returns {void}
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}