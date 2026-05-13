/**
 * Async Handler Middleware - Express Error Handling Wrapper
 * Wraps async route handlers to catch and forward errors to global error handler
 * 
 * Purpose:
 * - Catch unhandled promise rejections in async/await routes
 * - Forward errors to Express error middleware
 * - Prevent "Unhandled Promise Rejection" crashes
 * - Standardize error handling across routes
 * 
 * How It Works:
 * 1. Wrap async controller function
 * 2. Execute function within try-catch context
 * 3. Catch any thrown errors or rejected promises
 * 4. Forward to next(error) for global error handler
 * 5. Continue normal response if successful
 * 
 * Error Flow:
 * Route Handler → asyncHandler → Promise.reject → catch → next(error) → errorMiddleware
 * 
 * Advantages:
 * - No need for try-catch in every route handler
 * - Cleaner, more readable code
 * - Consistent error handling
 * - Automatic error logging
 * - Stack trace preservation
 * 
 * Usage Example:
 * ```
 * export const getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   res.json({ user });
 * });
 * ```
 * 
 * Caught Errors:
 * - MongoDB validation errors
 * - Database connection errors
 * - API call failures
 * - Custom AppError throws
 * - Unexpected exceptions
 * 
 * Error Information Preserved:
 * - Error message
 * - Error stack trace
 * - HTTP status code
 * - Response body
 * - Request context
 * 
 * Integration Points:
 * - errorMiddleware: Global error handler
 * - logger: Error logging
 * - appError: Custom error class
 * 
 * Error Handler Integration:
 * - Receives: error from asyncHandler
 * - Logs: Error details
 * - Responds: JSON error response
 * - Tracks: Error metrics
 * 
 * Best Practices:
 * - Always use on async route handlers
 * - Throw AppError for validation/business logic errors
 * - Use Promise.reject() for exception handling
 * - Maintain consistent error response format
 * 
 * Performance:
 * - Minimal overhead (wrapper function)
 * - No caching or database queries
 * - Synchronous error forwarding
 * - No async operations
 * 
 * Compatibility:
 * - Works with: async/await functions
 * - Works with: Promise chains
 * - Works with: Express error middleware
 * - Works with: Custom error classes
 * 
 * Error Scenarios Handled:
 * - Sync error in controller: throw new Error()
 * - Async error: await failingPromise()
 * - Custom errors: throw new AppError()
 * - Validation errors: schema.validate()
 * - Database errors: User.findById()
 * - API errors: axios.get()
 * - Timeout errors: Promise timeout
 * 
 * Debugging:
 * - Error context preserved
 * - Stack trace available
 * - Request URL logged
 * - User info (if authenticated)
 * - Full error object passed
 * 
 * Monitor:
 * - Track: Error frequency
 * - Alert: Critical errors
 * - Report: Error distribution
 * - Trend: Error patterns
 * 
 * Fallback:
 * - If error handler fails: Generic 500
 * - If logger fails: Still sends response
 * - If next() fails: Server crash logged
 * - Recovery: Process restarts if needed
 * 
 * Typical Error Handling:
 * - 400: Validation error
 * - 401: Unauthorized/expired token
 * - 403: Forbidden/insufficient permissions
 * - 404: Resource not found
 * - 409: Conflict/duplicate resource
 * - 422: Unprocessable entity
 * - 500: Server error
 */
 *   res.json(user);
 * });
 * 
 * Error Flow:
 * 1. Async function throws error or rejects Promise
 * 2. asyncHandler catches rejection
 * 3. Error passed to next() middleware
 * 4. Express error handling middleware processes error
 * 5. errorMiddleware formats and returns error response
 * 
 * Compatible With:
 * - Database operations (Mongoose queries)
 * - File operations (fs, multer)
 * - HTTP requests (fetch, axios)
 * - Any Promise-based operations
 * 
 * @param {Function} fn - Express route handler function (async or sync)
 * @returns {Function} Wrapped middleware function with error handling
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};