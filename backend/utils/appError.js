/**
 * Custom application error class
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