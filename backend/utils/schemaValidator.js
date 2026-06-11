/**
 * Schema-based data validation utility
 */

class SchemaValidator {
  constructor() {
    this.schemas = new Map();
    this.customValidators = new Map();
  }

  /**
   * Define schema
   * @param {string} name - Schema name
   * @param {object} definition - Schema definition
   */
  define(name, definition) {
    this.schemas.set(name, definition);
  }

  /**
   * Validate data against schema
   * @param {object} data - Data to validate
   * @param {string|object} schema - Schema name or definition
   * @returns {object} Validation result
   */
  validate(data, schema) {
    const schemaDef = typeof schema === 'string'
      ? this.schemas.get(schema)
      : schema;

    if (!schemaDef) {
      return { valid: false, errors: ['Schema not found'] };
    }

    const errors = this.validateObject(data, schemaDef);
    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : null,
    };
  }

  /**
   * Validate object against schema
   * @param {object} data - Data
   * @param {object} schema - Schema
   * @returns {array} Errors
   */
  validateObject(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rules);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  /**
   * Validate single field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {object} rules - Validation rules
   * @returns {array} Field errors
   */
  validateField(field, value, rules) {
    const errors = [];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return errors;
    }

    if (value === undefined || value === null) {
      return errors;
    }

    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
      return errors;
    }

    // String validations
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      if (rules.email && !this.isValidEmail(value)) {
        errors.push(`${field} must be a valid email`);
      }
      if (rules.url && !this.isValidUrl(value)) {
        errors.push(`${field} must be a valid URL`);
      }
    }

    // Number validations
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be at most ${rules.max}`);
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(`${field} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(`${field} must have at most ${rules.maxItems} items`);
      }
      if (rules.items) {
        value.forEach((item, index) => {
          const itemErrors = this.validateField(`${field}[${index}]`, item, rules.items);
          errors.push(...itemErrors);
        });
      }
    }

    // Enum check
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // Custom validator
    if (rules.custom) {
      const validatorName = rules.custom;
      if (this.customValidators.has(validatorName)) {
        const customValidator = this.customValidators.get(validatorName);
        const isValid = customValidator(value);
        if (!isValid) {
          errors.push(rules.message || `${field} failed custom validation`);
        }
      }
    }

    return errors;
  }

  /**
   * Register custom validator
   * @param {string} name - Validator name
   * @param {function} fn - Validator function
   */
  registerCustomValidator(name, fn) {
    this.customValidators.set(name, fn);
  }

  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize data based on schema
   * @param {object} data - Data to sanitize
   * @param {object} schema - Schema
   * @returns {object} Sanitized data
   */
  sanitize(data, schema) {
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      let value = data[field];

      if (value !== undefined && value !== null) {
        if (rules.type === 'string' && value) {
          value = String(value).trim();
        }
        if (rules.type === 'number') {
          value = Number(value);
        }
        if (rules.type === 'boolean') {
          value = Boolean(value);
        }
      }

      sanitized[field] = value;
    }

    return sanitized;
  }

  /**
   * Get all schemas
   * @returns {array} Schema names
   */
  getSchemas() {
    return Array.from(this.schemas.keys());
  }

  /**
   * Delete schema
   * @param {string} name - Schema name
   */
  deleteSchema(name) {
    this.schemas.delete(name);
  }
}

export const schemaValidator = new SchemaValidator();

/**
 * Validation middleware
 * @param {string|object} schema - Schema
 * @returns {function} Express middleware
 */
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const result = schemaValidator.validate(req.body, schema);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors,
      });
    }

    req.body = result.data;
    next();
  };
};

export default {
  schemaValidator,
  validateSchema,
};
