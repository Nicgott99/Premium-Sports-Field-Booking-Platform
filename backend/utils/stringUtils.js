/**
 * stringUtils.js
 * Common string manipulation helpers used across the backend.
 * Premium Sports Field Booking Platform
 */

/**
 * Capitalize the first letter of every word in a string (Title Case).
 * @param {string} str
 * @returns {string}
 * @example toTitleCase('premium sports field') // 'Premium Sports Field'
 */
export const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Truncate a string to a maximum length, appending an ellipsis if needed.
 * @param {string} str
 * @param {number} [maxLength=100]
 * @param {string} [suffix='...']
 * @returns {string}
 */
export const truncate = (str, maxLength = 100, suffix = '...') => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length).trimEnd() + suffix;
};

/**
 * Convert a camelCase or PascalCase string to human-readable form.
 * @param {string} str
 * @returns {string}
 * @example camelToWords('bookingStartTime') // 'Booking Start Time'
 */
export const camelToWords = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
};

/**
 * Strip all HTML tags from a string — useful for safely rendering user-supplied content.
 * @param {string} html
 * @returns {string}
 */
export const stripHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

/**
 * Mask a sensitive string, showing only the last N characters.
 * Useful for displaying partial phone numbers, card numbers, or API keys.
 * @param {string} str
 * @param {number} [visibleChars=4]
 * @param {string} [mask='*']
 * @returns {string}
 * @example maskString('4111111111111111', 4) // '************1111'
 */
export const maskString = (str, visibleChars = 4, mask = '*') => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= visibleChars) return str;
  const visible = str.slice(-visibleChars);
  const masked = mask.repeat(str.length - visibleChars);
  return masked + visible;
};

/**
 * Generate a random alphanumeric string of a given length.
 * Useful for generating invite codes or short reference IDs.
 * @param {number} [length=8]
 * @returns {string}
 */
export const randomAlphanumeric = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default {
  toTitleCase,
  truncate,
  camelToWords,
  stripHtml,
  maskString,
  randomAlphanumeric,
};
