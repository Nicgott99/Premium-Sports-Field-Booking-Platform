/**
 * Query filtering utilities for advanced search and filtering
 */

/**
 * Build MongoDB filter from query parameters
 * @param {object} query - Query parameters
 * @param {object} schema - Filter schema definition
 * @returns {object} MongoDB filter
 */
export const buildFilter = (query, schema) => {
  const filter = {};

  Object.entries(schema).forEach(([field, config]) => {
    const value = query[field];
    if (value === undefined || value === null || value === '') return;

    switch (config.type) {
      case 'string':
        filter[field] = { $regex: value, $options: 'i' };
        break;
      case 'number':
        filter[field] = Number(value);
        break;
      case 'boolean':
        filter[field] = value === 'true' || value === true;
        break;
      case 'date':
        filter[field] = new Date(value);
        break;
      case 'array':
        filter[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'range':
        const [min, max] = value.split('-');
        filter[field] = {};
        if (min !== undefined) filter[field].$gte = Number(min);
        if (max !== undefined) filter[field].$lte = Number(max);
        break;
      case 'enum':
        filter[field] = { $in: config.values };
        break;
      case 'custom':
        if (config.builder) {
          Object.assign(filter, config.builder(field, value));
        }
        break;
    }
  });

  return filter;
};

/**
 * Build sort options from query
 * @param {string} sortBy - Sort field
 * @param {string} order - Sort order (asc/desc)
 * @param {array} allowedFields - Allowed sort fields
 * @returns {object} Sort options
 */
export const buildSort = (sortBy, order = 'asc', allowedFields = []) => {
  if (!sortBy || (allowedFields.length > 0 && !allowedFields.includes(sortBy))) {
    return {};
  }

  const sortOrder = order === 'desc' ? -1 : 1;
  return { [sortBy]: sortOrder };
};

/**
 * Apply filters to Mongoose query
 * @param {object} query - Mongoose query
 * @param {object} filters - Filters to apply
 * @returns {object} Modified query
 */
export const applyFilters = (query, filters) => {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.where(key).equals(value);
    }
  });
  return query;
};

/**
 * Apply sort to Mongoose query
 * @param {object} query - Mongoose query
 * @param {object} sort - Sort options
 * @returns {object} Modified query
 */
export const applySort = (query, sort) => {
  if (Object.keys(sort).length > 0) {
    query.sort(sort);
  }
  return query;
};

/**
 * Parse and build advanced filter from query
 * @param {object} queryParams - Query parameters
 * @returns {object} Advanced filter
 */
export const parseAdvancedFilters = (queryParams) => {
  const filters = {};

  // Handle range filters (e.g., price:100-500)
  Object.entries(queryParams).forEach(([key, value]) => {
    if (key.includes('_min')) {
      const field = key.replace('_min', '');
      if (!filters[field]) filters[field] = {};
      filters[field].$gte = Number(value);
    } else if (key.includes('_max')) {
      const field = key.replace('_max', '');
      if (!filters[field]) filters[field] = {};
      filters[field].$lte = Number(value);
    } else if (key.includes('_in')) {
      const field = key.replace('_in', '');
      filters[field] = { $in: Array.isArray(value) ? value : [value] };
    }
  });

  return filters;
};

/**
 * Apply text search
 * @param {object} query - Mongoose query
 * @param {string} searchTerm - Search term
 * @param {array} fields - Fields to search
 * @returns {object} Modified query
 */
export const applyTextSearch = (query, searchTerm, fields) => {
  if (!searchTerm) return query;

  const searchFilter = {
    $or: fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };

  return query.find(searchFilter);
};

/**
 * Create filter validation schema
 * @param {array} allowedFilters - Allowed filter fields
 * @returns {function} Middleware to validate filters
 */
export const filterValidationMiddleware = (allowedFilters) => {
  return (req, res, next) => {
    const queryKeys = Object.keys(req.query);
    const invalidFilters = queryKeys.filter(key => !allowedFilters.includes(key));

    if (invalidFilters.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filters',
        details: { invalidFilters, allowedFilters },
      });
    }

    next();
  };
};

/**
 * Combine multiple filters
 * @param {...object} filters - Filter objects to combine
 * @returns {object} Combined filter
 */
export const combineFilters = (...filters) => {
  return filters.reduce((combined, filter) => ({ ...combined, ...filter }), {});
};

/**
 * Negate a filter condition
 * @param {object} filter - Filter to negate
 * @returns {object} Negated filter
 */
export const negateFilter = (filter) => {
  const negated = {};
  Object.entries(filter).forEach(([key, value]) => {
    negated[key] = { $ne: value };
  });
  return negated;
};

export default {
  buildFilter,
  buildSort,
  applyFilters,
  applySort,
  parseAdvancedFilters,
  applyTextSearch,
  filterValidationMiddleware,
  combineFilters,
  negateFilter,
};
