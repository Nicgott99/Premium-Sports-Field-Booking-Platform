import logger from '../utils/logger.js';

/**
 * Input validation middleware
 * Validates request structure and data types
 */

/**
 * Validate request body structure
 * @param {object} schema - Validation schema
 * @returns {function} Express middleware
 */
export const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const errors = [];

    // Check required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (!(field in req.body)) {
          errors.push({
            field,
            message: `${field} is required`,
            code: 'REQUIRED_FIELD',
          });
        }
      });
    }

    // Validate field types
    if (schema.fields) {
      Object.entries(schema.fields).forEach(([field, rules]) => {
        const value = req.body[field];
        if (value !== undefined) {
          // Type validation
          if (rules.type && typeof value !== rules.type) {
            errors.push({
              field,
              message: `${field} must be ${rules.type}`,
              code: 'INVALID_TYPE',
            });
          }

          // Min/max validation
          if (rules.min && value.length < rules.min) {
            errors.push({
              field,
              message: `${field} must have minimum ${rules.min} characters`,
              code: 'MIN_LENGTH',
            });
          }

          if (rules.max && value.length > rules.max) {
            errors.push({
              field,
              message: `${field} must have maximum ${rules.max} characters`,
              code: 'MAX_LENGTH',
            });
          }

          // Enum validation
          if (rules.enum && !rules.enum.includes(value)) {
            errors.push({
              field,
              message: `${field} must be one of: ${rules.enum.join(', ')}`,
              code: 'INVALID_ENUM',
            });
          }

          // Custom validation function
          if (rules.validate && !rules.validate(value)) {
            errors.push({
              field,
              message: rules.validateMessage || `${field} is invalid`,
              code: 'CUSTOM_VALIDATION',
            });
          }
        }
      });
    }

    if (errors.length > 0) {
      logger.warn(`Validation failed for ${req.path}:`, errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    next();
  };
};

/**
 * Validate query parameters
 * @param {object} schema - Query schema
 * @returns {function} Express middleware
 */
export const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const errors = [];

    Object.entries(schema).forEach(([param, rules]) => {
      const value = req.query[param];

      if (rules.required && !value) {
        errors.push({
          param,
          message: `${param} is required`,
        });
        return;
      }

      if (value) {
        if (rules.type && typeof value !== rules.type) {
          errors.push({
            param,
            message: `${param} must be ${rules.type}`,
          });
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({
            param,
            message: `${param} must be one of: ${rules.enum.join(', ')}`,
          });
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errors,
      });
    }

    next();
  };
};

/**
 * Validate URL parameters
 * @param {object} schema - Params schema
 * @returns {function} Express middleware
 */
export const validateUrlParams = (schema) => {
  return (req, res, next) => {
    const errors = [];

    Object.entries(schema).forEach(([param, rules]) => {
      const value = req.params[param];

      if (rules.required && !value) {
        errors.push({
          param,
          message: `${param} is required`,
        });
        return;
      }

      if (value) {
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({
            param,
            message: `${param} format is invalid`,
          });
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Parameter validation failed',
        details: errors,
      });
    }

    next();
  };
};

/**
 * Sanitize request body
 * @returns {function} Express middleware
 */
export const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      if (typeof value === 'string') {
        // Remove extra whitespace
        req.body[key] = value.trim();
      }
    });
  }

  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      if (typeof value === 'string') {
        req.body[key] = value.trim();
      }
    });
  }

  next();
};

/**
 * Validate content type
 * @param {string} contentType - Expected content type
 * @returns {function} Express middleware
 */
export const validateContentType = (contentType = 'application/json') => {
  return (req, res, next) => {
    if (!req.is(contentType)) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Media Type',
        message: `Content-Type must be ${contentType}`,
      });
    }
    next();
  };
};

/**
 * Validate request size
 * @param {number} maxSize - Max size in bytes
 * @returns {function} Express middleware
 */
export const validateRequestSize = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const size = parseInt(req.headers['content-length'], 10);
    if (size && size > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Payload Too Large',
        message: `Request size exceeds ${maxSize / 1024 / 1024}MB limit`,
      });
    }
    next();
  };
};

export default {
  validateRequestBody,
  validateQueryParams,
  validateUrlParams,
  sanitizeRequest,
  validateContentType,
  validateRequestSize,
};
