/**
 * Data validation pipeline for composable validation chains
 */

class ValidationPipeline {
  constructor(name = 'default') {
    this.name = name;
    this.validators = [];
    this.transformers = [];
    this.errors = [];
  }

  /**
   * Add validator
   * @param {function} validator - Validator function
   * @param {string} name - Validator name
   * @returns {this}
   */
  addValidator(validator, name = 'custom') {
    this.validators.push({
      fn: validator,
      name,
    });
    return this;
  }

  /**
   * Add transformer
   * @param {function} transformer - Transformer function
   * @param {string} name - Transformer name
   * @returns {this}
   */
  addTransformer(transformer, name = 'custom') {
    this.transformers.push({
      fn: transformer,
      name,
    });
    return this;
  }

  /**
   * Required field validator
   * @param {string} fieldName - Field name
   * @returns {this}
   */
  required(fieldName) {
    this.validators.push({
      fn: (data) => {
        if (!(fieldName in data) || data[fieldName] == null || data[fieldName] === '') {
          throw new Error(`${fieldName} is required`);
        }
      },
      name: `required:${fieldName}`,
    });
    return this;
  }

  /**
   * Min length validator
   * @param {string} fieldName - Field name
   * @param {number} length - Min length
   * @returns {this}
   */
  minLength(fieldName, length) {
    this.validators.push({
      fn: (data) => {
        if (data[fieldName] && data[fieldName].length < length) {
          throw new Error(`${fieldName} must be at least ${length} characters`);
        }
      },
      name: `minLength:${fieldName}`,
    });
    return this;
  }

  /**
   * Max length validator
   * @param {string} fieldName - Field name
   * @param {number} length - Max length
   * @returns {this}
   */
  maxLength(fieldName, length) {
    this.validators.push({
      fn: (data) => {
        if (data[fieldName] && data[fieldName].length > length) {
          throw new Error(`${fieldName} must not exceed ${length} characters`);
        }
      },
      name: `maxLength:${fieldName}`,
    });
    return this;
  }

  /**
   * Email validator
   * @param {string} fieldName - Field name
   * @returns {this}
   */
  email(fieldName) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.validators.push({
      fn: (data) => {
        if (data[fieldName] && !emailRegex.test(data[fieldName])) {
          throw new Error(`${fieldName} must be a valid email`);
        }
      },
      name: `email:${fieldName}`,
    });
    return this;
  }

  /**
   * Type validator
   * @param {string} fieldName - Field name
   * @param {string} type - Expected type
   * @returns {this}
   */
  type(fieldName, type) {
    this.validators.push({
      fn: (data) => {
        if (fieldName in data && typeof data[fieldName] !== type) {
          throw new Error(`${fieldName} must be of type ${type}`);
        }
      },
      name: `type:${fieldName}`,
    });
    return this;
  }

  /**
   * Trim transformer
   * @param {string} fieldName - Field name
   * @returns {this}
   */
  trim(fieldName) {
    this.transformers.push({
      fn: (data) => {
        if (typeof data[fieldName] === 'string') {
          data[fieldName] = data[fieldName].trim();
        }
        return data;
      },
      name: `trim:${fieldName}`,
    });
    return this;
  }

  /**
   * Lowercase transformer
   * @param {string} fieldName - Field name
   * @returns {this}
   */
  lowercase(fieldName) {
    this.transformers.push({
      fn: (data) => {
        if (typeof data[fieldName] === 'string') {
          data[fieldName] = data[fieldName].toLowerCase();
        }
        return data;
      },
      name: `lowercase:${fieldName}`,
    });
    return this;
  }

  /**
   * Execute pipeline
   * @param {object} data - Data to validate
   * @returns {object} Transformed data
   */
  execute(data) {
    this.errors = [];
    let result = { ...data };

    // Run transformers
    for (const transformer of this.transformers) {
      try {
        result = transformer.fn(result);
      } catch (error) {
        this.errors.push({
          step: transformer.name,
          message: error.message,
        });
      }
    }

    // Run validators
    for (const validator of this.validators) {
      try {
        validator.fn(result);
      } catch (error) {
        this.errors.push({
          step: validator.name,
          message: error.message,
        });
      }
    }

    return result;
  }

  /**
   * Check if valid
   * @param {object} data - Data to validate
   * @returns {boolean}
   */
  isValid(data) {
    this.execute(data);
    return this.errors.length === 0;
  }

  /**
   * Get errors
   * @returns {array}
   */
  getErrors() {
    return this.errors;
  }
}

export { ValidationPipeline };

export default ValidationPipeline;
