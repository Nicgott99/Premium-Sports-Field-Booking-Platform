/**
 * Pagination utilities for consistent data pagination
 */

/**
 * Parse pagination parameters from request
 * @param {object} query - Query parameters
 * @param {number} maxLimit - Maximum items per page
 * @returns {object} Pagination config
 */
export const parsePaginationParams = (query, maxLimit = 100) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 10;

  // Validate page
  if (page < 1) page = 1;

  // Validate limit
  if (limit < 1) limit = 10;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
export const calculatePaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  };
};

/**
 * Apply pagination to query
 * @param {object} query - Mongoose query
 * @param {number} skip - Skip count
 * @param {number} limit - Limit
 * @returns {object} Modified query
 */
export const applyPagination = (query, skip, limit) => {
  return query.skip(skip).limit(limit);
};

/**
 * Format paginated response
 * @param {array} items - Data items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Response message
 * @returns {object} Formatted response
 */
export const paginatedResult = (items, total, page, limit, message = 'Data retrieved successfully') => {
  return {
    success: true,
    data: items,
    message,
    meta: calculatePaginationMeta(total, page, limit),
  };
};

/**
 * Cursor-based pagination helper
 * @param {string} cursor - Cursor value (base64 encoded)
 * @param {number} limit - Items to fetch
 * @returns {object} Cursor pagination config
 */
export const parseCursorParams = (cursor, limit = 10) => {
  let decodedCursor = null;
  if (cursor) {
    try {
      decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
    } catch (e) {
      decodedCursor = null;
    }
  }
  return { cursor: decodedCursor, limit };
};

/**
 * Generate cursor for next page
 * @param {*} lastItem - Last item in current page
 * @param {string} cursorField - Field to use as cursor
 * @returns {string} Base64 encoded cursor
 */
export const generateCursor = (lastItem, cursorField = '_id') => {
  const cursorValue = lastItem[cursorField];
  return Buffer.from(cursorValue.toString()).toString('base64');
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {boolean} Is valid
 */
export const isValidPagination = (page, limit) => {
  return Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;
};

/**
 * Get page boundaries
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Start and end indexes
 */
export const getPageBoundaries = (page, limit) => {
  return {
    start: (page - 1) * limit + 1,
    end: page * limit,
  };
};

/**
 * Create pagination middleware
 * @param {number} maxLimit - Maximum limit
 * @returns {function} Express middleware
 */
export const paginationMiddleware = (maxLimit = 100) => {
  return (req, res, next) => {
    const pagination = parsePaginationParams(req.query, maxLimit);
    req.pagination = pagination;
    res.locals.pagination = pagination;
    next();
  };
};

export default {
  parsePaginationParams,
  calculatePaginationMeta,
  applyPagination,
  paginatedResult,
  parseCursorParams,
  generateCursor,
  isValidPagination,
  getPageBoundaries,
  paginationMiddleware,
};
