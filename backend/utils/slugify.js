/**
 * slugify.js — URL Slug Generator Utility
 * Premium Sports Booking Platform
 *
 * Converts arbitrary strings (field names, tournament titles, team names)
 * into clean, SEO-friendly URL slugs.
 *
 * Features:
 *  - Handles Unicode / Bengali / Arabic characters via transliteration map
 *  - Removes all unsafe URL characters
 *  - Appends a unique suffix to guarantee uniqueness when needed
 *  - Model-aware slug availability checker for Mongoose collections
 */

import mongoose from 'mongoose';

// ─── Core Slug Generator ───────────────────────────────────────────────────

/**
 * Basic transliteration map for common non-ASCII characters.
 * Extend as needed for additional language support.
 */
const CHAR_MAP = {
  // Latin accents
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ý: 'y', ÿ: 'y',
  ñ: 'n', ç: 'c', ß: 'ss',
  // Common symbols
  '&': 'and', '@': 'at', '%': 'percent',
};

/**
 * Convert a string to a URL-safe slug.
 * @param {string}  input               - Source string
 * @param {object}  [options]
 * @param {string}  [options.separator]  - Word separator (default: '-')
 * @param {boolean} [options.lower]      - Force lowercase (default: true)
 * @param {number}  [options.maxLength]  - Max slug length (default: 80)
 * @returns {string}                     - Clean URL slug
 */
export const slugify = (input, options = {}) => {
  const { separator = '-', lower = true, maxLength = 80 } = options;

  if (typeof input !== 'string' || input.trim().length === 0) return '';

  let slug = input.trim();

  // Apply char map transliterations
  slug = slug.replace(/[^\u0000-\u007E]/g, (char) => CHAR_MAP[char] || '');
  slug = slug.replace(/[&@%]/g, (char) => CHAR_MAP[char] || '');

  // Normalize to ASCII-safe characters
  slug = slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // keep alphanumeric, spaces, dashes, underscores
    .replace(/[\s_-]+/g, separator)   // collapse whitespace/underscores/dashes to separator
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), ''); // trim separators

  if (lower) slug = slug.toLowerCase();
  if (maxLength && slug.length > maxLength) slug = slug.slice(0, maxLength).replace(new RegExp(`${separator}+$`), '');

  return slug;
};

// ─── Unique Slug Generation ────────────────────────────────────────────────

/**
 * Generate a short random alphanumeric suffix.
 * @param {number} [length=6]
 * @returns {string}
 */
const randomSuffix = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

/**
 * Generate a unique slug for a Mongoose model by checking for existing slugs
 * and appending a suffix if there's a collision.
 *
 * @param {string}          baseInput    - The raw string to slugify
 * @param {mongoose.Model}  Model        - Mongoose model to check uniqueness against
 * @param {string}          [field]      - The field name to check (default: 'slug')
 * @param {string}          [excludeId]  - Document ID to exclude (for updates)
 * @returns {Promise<string>}            - A unique slug
 */
export const generateUniqueSlug = async (baseInput, Model, field = 'slug', excludeId = null) => {
  if (!baseInput || !Model) throw new Error('baseInput and Model are required');

  const base = slugify(baseInput);
  if (!base) throw new Error(`Could not create a slug from: "${baseInput}"`);

  let candidate = base;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const query = { [field]: candidate };
    if (excludeId) query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };

    const existing = await Model.exists(query);
    if (!existing) return candidate;

    // Collision — append a suffix
    candidate = `${base}-${randomSuffix()}`;
    attempts++;
  }

  // Fallback: timestamp-based unique slug
  return `${base}-${Date.now()}`;
};

// ─── Validation ────────────────────────────────────────────────────────────

/**
 * Check whether a string is a valid slug (already slugified).
 * @param {string} str
 * @returns {boolean}
 */
export const isValidSlug = (str) => {
  if (typeof str !== 'string' || str.length === 0) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str);
};

/**
 * Sanitize a slug that may be partially user-entered, without full regeneration.
 * @param {string} str
 * @returns {string}
 */
export const sanitizeSlug = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export default { slugify, generateUniqueSlug, isValidSlug, sanitizeSlug };
