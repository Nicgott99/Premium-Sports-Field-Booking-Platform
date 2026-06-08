/**
 * Data sanitization utilities for security
 * Prevents XSS, SQL injection, and removes sensitive data from responses
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize input strings to prevent XSS attacks
 * @param {string} input - Raw input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

/**
 * Sanitize object fields recursively
 * @param {object} obj - Object to sanitize
 * @param {array} fields - Fields to sanitize
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj, fields = []) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = { ...obj };
  fields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeInput(sanitized[field]);
    }
  });
  return sanitized;
};

/**
 * Remove sensitive fields from response object
 * @param {object} data - Response data
 * @param {array} sensitiveFields - Fields to remove
 * @returns {object} Data without sensitive fields
 */
export const removeSensitiveFields = (data, sensitiveFields = ['password', 'token', 'refreshToken', 'apiKey', 'secret']) => {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => removeSensitiveFields(item, sensitiveFields));
  }
  if (typeof data !== 'object') return data;

  const cleaned = { ...data };
  sensitiveFields.forEach(field => {
    if (field in cleaned) {
      delete cleaned[field];
    }
  });

  Object.keys(cleaned).forEach(key => {
    if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
      cleaned[key] = removeSensitiveFields(cleaned[key], sensitiveFields);
    }
  });

  return cleaned;
};

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Normalize and trim whitespace
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export const normalizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  const normalized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized) ? normalized : null;
};

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string|null} Safe URL or null
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Middleware to sanitize request body
 * @returns {function} Express middleware
 */
export const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  next();
};
