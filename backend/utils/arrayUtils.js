/**
 * arrayUtils.js
 * Common array manipulation helpers used across the backend.
 * Premium Sports Field Booking Platform
 */

/**
 * Split an array into chunks of a given size.
 * Useful for batch processing, pagination, and bulk inserts.
 * @param {Array}  arr
 * @param {number} size
 * @returns {Array[]}
 * @example chunk([1,2,3,4,5], 2) // [[1,2],[3,4],[5]]
 */
export const chunk = (arr, size) => {
  if (!Array.isArray(arr) || size < 1) return [];
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

/**
 * Remove duplicate values from an array (primitive or by key).
 * @param {Array}  arr
 * @param {string} [key] - Optional object key to deduplicate by.
 * @returns {Array}
 * @example uniqueBy(users, '_id')
 */
export const uniqueBy = (arr, key) => {
  if (!Array.isArray(arr)) return [];
  if (!key) return [...new Set(arr)];
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key]?.toString();
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

/**
 * Group an array of objects by a specific key.
 * @param {Array}  arr
 * @param {string} key
 * @returns {object} - Map of key → array of items.
 * @example groupBy(bookings, 'status') // { confirmed: [...], pending: [...] }
 */
export const groupBy = (arr, key) => {
  if (!Array.isArray(arr)) return {};
  return arr.reduce((groups, item) => {
    const group = String(item[key] ?? 'undefined');
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Flatten a nested array to any depth.
 * @param {Array}  arr
 * @param {number} [depth=Infinity]
 * @returns {Array}
 */
export const flattenDeep = (arr, depth = Infinity) => {
  if (!Array.isArray(arr)) return [];
  return arr.flat(depth);
};

/**
 * Return a random element from an array.
 * @param {Array} arr
 * @returns {any}
 */
export const randomItem = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Shuffle an array using the Fisher-Yates algorithm.
 * Returns a new array — does not mutate the original.
 * @param {Array} arr
 * @returns {Array}
 */
export const shuffle = (arr) => {
  if (!Array.isArray(arr)) return [];
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export default {
  chunk,
  uniqueBy,
  groupBy,
  flattenDeep,
  randomItem,
  shuffle,
};
