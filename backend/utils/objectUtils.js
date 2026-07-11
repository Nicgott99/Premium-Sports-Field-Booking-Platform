/**
 * objectUtils.js
 * Common object manipulation helper utilities for the backend.
 * Premium Sports Field Booking Platform
 */

/**
 * Pick specific keys from an object, returning a new object.
 * Useful for filtering API response shapes before sending to the client.
 * @param {object}   obj
 * @param {string[]} keys
 * @returns {object}
 * @example pick(user, ['name', 'email', 'role'])
 */
export const pick = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Omit specific keys from an object, returning a new object.
 * Useful for removing sensitive fields (password, __v) before responding.
 * @param {object}   obj
 * @param {string[]} keys
 * @returns {object}
 * @example omit(user, ['password', '__v', 'refreshToken'])
 */
export const omit = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  const keySet = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keySet.has(k))
  );
};

/**
 * Deeply merge two objects. The second object's values take precedence.
 * Arrays are replaced, not merged.
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
export const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target;
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] ?? {}, value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Flatten a nested object into a single-level object with dot-notation keys.
 * @param {object} obj
 * @param {string} [prefix='']
 * @returns {object}
 * @example flattenObject({ a: { b: { c: 1 } } }) // { 'a.b.c': 1 }
 */
export const flattenObject = (obj, prefix = '') => {
  if (!obj || typeof obj !== 'object') return {};
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, fullKey));
    } else {
      acc[fullKey] = value;
    }
    return acc;
  }, {});
};

/**
 * Check if an object is empty (no own enumerable keys).
 * @param {object} obj
 * @returns {boolean}
 */
export const isEmpty = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  return Object.keys(obj).length === 0;
};

export default { pick, omit, deepMerge, flattenObject, isEmpty };
