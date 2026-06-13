/**
 * Data transformation and mapping utilities
 */

class DataTransformer {
  /**
   * Map object properties
   * @param {object} data - Source data
   * @param {object} mapping - Property mapping
   * @returns {object} Transformed data
   */
  static map(data, mapping) {
    const result = {};

    for (const [newKey, sourceKey] of Object.entries(mapping)) {
      const value = this.getNestedValue(data, sourceKey);
      if (value !== undefined) {
        result[newKey] = value;
      }
    }

    return result;
  }

  /**
   * Get nested value from object
   * @param {object} obj - Object
   * @param {string} path - Dot notation path
   * @returns {*} Value
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Flatten nested object
   * @param {object} obj - Object to flatten
   * @param {string} prefix - Key prefix
   * @returns {object} Flattened object
   */
  static flatten(obj, prefix = '') {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  /**
   * Transform array items
   * @param {array} items - Items to transform
   * @param {function} transform - Transform function
   * @returns {array} Transformed items
   */
  static mapArray(items, transform) {
    return items.map(transform);
  }

  /**
   * Filter and transform
   * @param {array} items - Items
   * @param {function} predicate - Filter function
   * @param {function} transform - Transform function
   * @returns {array} Filtered and transformed
   */
  static filterMap(items, predicate, transform) {
    return items.filter(predicate).map(transform);
  }

  /**
   * Group by property
   * @param {array} items - Items
   * @param {string} key - Group key
   * @returns {object} Grouped items
   */
  static groupBy(items, key) {
    const result = {};

    items.forEach(item => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
    });

    return result;
  }

  /**
   * Pick specific properties
   * @param {object} obj - Source object
   * @param {array} keys - Keys to pick
   * @returns {object} Picked object
   */
  static pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  /**
   * Omit specific properties
   * @param {object} obj - Source object
   * @param {array} keys - Keys to omit
   * @returns {object} Omitted object
   */
  static omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }

  /**
   * Transform case to camelCase
   * @param {string} str - String
   * @returns {string} camelCase string
   */
  static toCamelCase(str) {
    return str.replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase());
  }

  /**
   * Transform case to snake_case
   * @param {string} str - String
   * @returns {string} snake_case string
   */
  static toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  /**
   * Deep clone object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  static clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Merge objects recursively
   * @param {...object} objects - Objects to merge
   * @returns {object} Merged object
   */
  static merge(...objects) {
    return objects.reduce((result, obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (result[key] && typeof result[key] === 'object' && typeof value === 'object') {
          result[key] = this.merge(result[key], value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }, {});
  }
}

export { DataTransformer };

export default DataTransformer;
