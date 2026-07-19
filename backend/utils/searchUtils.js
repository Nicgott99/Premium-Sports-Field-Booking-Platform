/**
 * searchUtils.js
 * Full-text search and filtering helpers for MongoDB-backed queries.
 * Premium Sports Field Booking Platform
 *
 * Centralises query-building logic so controllers stay clean and
 * consistent search behaviour is easy to unit-test.
 */

/**
 * Build a MongoDB $regex filter object for a keyword search
 * across multiple string fields.
 *
 * @param {string}   keyword  - The search term (user input, will be escaped).
 * @param {string[]} fields   - Document fields to search across.
 * @returns {object}          - MongoDB query object ({$or: [...]}).
 *
 * @example
 * const query = buildTextSearch('premium football', ['name', 'description', 'location.city']);
 * Field.find({ ...query, isActive: true });
 */
export const buildTextSearch = (keyword, fields) => {
  if (!keyword || !fields?.length) return {};

  // Escape special regex characters to prevent injection
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
  if (!escaped) return {};

  const regex = { $regex: escaped, $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

/**
 * Build a MongoDB range filter for a numeric or date field.
 *
 * @param {string}  field  - The document field name.
 * @param {any}     [min]  - Minimum value (inclusive).
 * @param {any}     [max]  - Maximum value (inclusive).
 * @returns {object}       - MongoDB query object or {}.
 *
 * @example
 * // Price between 500 and 2000 BDT
 * const priceFilter = buildRangeFilter('hourlyRate', 500, 2000);
 */
export const buildRangeFilter = (field, min, max) => {
  const filter = {};
  if (min !== undefined && min !== null && min !== '') filter.$gte = Number(min);
  if (max !== undefined && max !== null && max !== '') filter.$lte = Number(max);
  return Object.keys(filter).length ? { [field]: filter } : {};
};

/**
 * Parse a comma-separated query param into a trimmed string array.
 * Useful for ?sports=football,cricket,basketball style filters.
 *
 * @param {string|string[]} param
 * @returns {string[]}
 */
export const parseMultiValueParam = (param) => {
  if (!param) return [];
  const arr = Array.isArray(param) ? param : param.split(',');
  return arr.map((v) => v.trim()).filter(Boolean);
};

/**
 * Build a safe MongoDB sort object from query string parameters.
 *
 * @param {string} [sortBy='createdAt'] - Field to sort by.
 * @param {string} [order='desc']        - 'asc' | 'desc'.
 * @param {string[]} [allowedFields]     - Whitelist. If omitted, any field is allowed.
 * @returns {object}                     - e.g. { createdAt: -1 }
 */
export const buildSortObject = (sortBy = 'createdAt', order = 'desc', allowedFields = []) => {
  const field = allowedFields.length
    ? (allowedFields.includes(sortBy) ? sortBy : 'createdAt')
    : sortBy;
  const direction = order === 'asc' ? 1 : -1;
  return { [field]: direction };
};

export default { buildTextSearch, buildRangeFilter, parseMultiValueParam, buildSortObject };
