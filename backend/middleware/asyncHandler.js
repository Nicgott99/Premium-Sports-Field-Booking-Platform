/**
 * Async Handler Middleware
 * Wraps async route handlers to eliminate need for try-catch blocks
 * Automatically catches and passes errors to Express error handler
 * 
 * Purpose:
 * - Eliminates repetitive try-catch blocks in async controllers
 * - Centralized error handling through Express middleware chain
 * - Cleaner, more readable controller code
 * - Ensures all Promise rejections are caught
 * 
 * Usage:
 * export const myController = asyncHandler(async (req, res) => {
 *   // No try-catch needed - errors automatically passed to error handler
 *   const user = await User.findById(req.user.id);
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