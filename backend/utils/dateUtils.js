/**
 * dateUtils.js
 * Date and time helper utilities for the backend.
 * Premium Sports Field Booking Platform
 */

/**
 * Check if a date value is a valid Date object or parseable string.
 * @param {any} value
 * @returns {boolean}
 */
export const isValidDate = (value) => {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  return !isNaN(d.getTime());
};

/**
 * Get the start of a given day (00:00:00.000).
 * @param {Date|string} [date=new Date()]
 * @returns {Date}
 */
export const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of a given day (23:59:59.999).
 * @param {Date|string} [date=new Date()]
 * @returns {Date}
 */
export const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Add a number of minutes to a date.
 * @param {Date|string} date
 * @param {number} minutes
 * @returns {Date}
 */
export const addMinutes = (date, minutes) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

/**
 * Add a number of days to a date.
 * @param {Date|string} date
 * @param {number} days
 * @returns {Date}
 */
export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/**
 * Check if two date ranges overlap.
 * All four values must be Date objects or parseable date strings.
 * @param {Date|string} startA
 * @param {Date|string} endA
 * @param {Date|string} startB
 * @param {Date|string} endB
 * @returns {boolean}
 */
export const doRangesOverlap = (startA, endA, startB, endB) => {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
};

/**
 * Get the difference between two dates in minutes.
 * @param {Date|string} start
 * @param {Date|string} end
 * @returns {number} Positive if end > start.
 */
export const diffInMinutes = (start, end) => {
  return Math.round((new Date(end) - new Date(start)) / 60_000);
};

/**
 * Format a date to a human-readable string in a given locale.
 * @param {Date|string} date
 * @param {object}      [options={}] - Intl.DateTimeFormat options.
 * @param {string}      [locale='en-BD']
 * @returns {string}
 * @example formatDate(new Date(), { dateStyle: 'medium', timeStyle: 'short' })
 */
export const formatDate = (date, options = {}, locale = 'en-BD') => {
  if (!isValidDate(date)) return '';
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
};

export default {
  isValidDate,
  startOfDay,
  endOfDay,
  addMinutes,
  addDays,
  doRangesOverlap,
  diffInMinutes,
  formatDate,
};
