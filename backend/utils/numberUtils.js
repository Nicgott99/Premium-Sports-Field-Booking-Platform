/**
 * numberUtils.js
 * Common numeric helper utilities for the backend.
 * Premium Sports Field Booking Platform
 */

/**
 * Round a number to a given number of decimal places.
 * Uses the "round half away from zero" method to avoid floating-point drift.
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {number}
 * @example roundTo(1.005, 2) // 1.01
 */
export const roundTo = (value, decimals = 2) => {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Clamp a number between a minimum and maximum value.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @example clamp(150, 0, 100) // 100
 */
export const clamp = (value, min, max) => {
  if (typeof value !== 'number') return min;
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation between two values.
 * @param {number} start
 * @param {number} end
 * @param {number} t - Interpolation factor (0–1)
 * @returns {number}
 * @example lerp(0, 100, 0.5) // 50
 */
export const lerp = (start, end, t) => start + (end - start) * clamp(t, 0, 1);

/**
 * Calculate the percentage of a value relative to a total.
 * @param {number} value
 * @param {number} total
 * @param {number} [decimals=1]
 * @returns {number}
 * @example percentage(45, 200) // 22.5
 */
export const percentage = (value, total, decimals = 1) => {
  if (!total) return 0;
  return roundTo((value / total) * 100, decimals);
};

/**
 * Sum all numeric values in an array.
 * @param {number[]} arr
 * @returns {number}
 */
export const sum = (arr) => {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((acc, n) => acc + (Number(n) || 0), 0);
};

/**
 * Calculate the arithmetic mean (average) of an array.
 * @param {number[]} arr
 * @returns {number}
 */
export const average = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return roundTo(sum(arr) / arr.length, 4);
};

/**
 * Format a number as a compact string (1,200 → "1.2K", 1,500,000 → "1.5M").
 * @param {number} value
 * @returns {string}
 */
export const compactNumber = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  if (Math.abs(value) >= 1_000_000) return `${roundTo(value / 1_000_000, 1)}M`;
  if (Math.abs(value) >= 1_000) return `${roundTo(value / 1_000, 1)}K`;
  return String(value);
};

export default {
  roundTo,
  clamp,
  lerp,
  percentage,
  sum,
  average,
  compactNumber,
};
