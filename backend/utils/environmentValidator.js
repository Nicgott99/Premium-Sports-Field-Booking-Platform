import logger from './logger.js';

/**
 * Environment configuration validation
 */

class EnvironmentValidator {
  constructor() {
    this.schema = {};
    this.validated = false;
  }

  /**
   * Define validation schema
   * @param {object} schema - Validation schema
   */
  define(schema) {
    this.schema = schema;
  }

  /**
   * Add required variable
   * @param {string} name - Variable name
   * @param {string} type - Variable type
   */
  required(name, type = 'string') {
    this.schema[name] = { required: true, type };
  }

  /**
   * Add optional variable
   * @param {string} name - Variable name
   * @param {string} type - Variable type
   * @param {*} defaultValue - Default value
   */
  optional(name, type = 'string', defaultValue = null) {
    this.schema[name] = { required: false, type, defaultValue };
  }

  /**
   * Validate environment
   * @param {object} env - Environment object
   * @returns {object} Validation result
   */
  validate(env = process.env) {
    const errors = [];
    const variables = {};

    for (const [name, config] of Object.entries(this.schema)) {
      const value = env[name];

      if (!value && config.required) {
        errors.push(`Missing required variable: ${name}`);
        continue;
      }

      if (!value && config.defaultValue !== undefined) {
        variables[name] = config.defaultValue;
        continue;
      }

      if (value) {
        // Type conversion
        try {
          variables[name] = this.convertType(value, config.type);
        } catch (error) {
          errors.push(`Invalid type for ${name}: expected ${config.type}`);
        }
      }
    }

    if (errors.length > 0) {
      logger.error('Environment validation failed:', errors);
      return { valid: false, errors };
    }

    this.validated = true;
    logger.info('Environment validation successful');
    return { valid: true, variables };
  }

  /**
   * Convert value to type
   * @param {string} value - Value
   * @param {string} type - Type
   * @returns {*} Converted value
   */
  convertType(value, type) {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'array':
        return value.split(',').map(v => v.trim());
      case 'object':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  /**
   * Load environment variables
   * @returns {object} Environment variables
   */
  load() {
    const result = this.validate();
    if (!result.valid) {
      throw new Error('Environment validation failed');
    }
    return result.variables;
  }
}

export const environmentValidator = new EnvironmentValidator();

export { EnvironmentValidator };

export default EnvironmentValidator;
