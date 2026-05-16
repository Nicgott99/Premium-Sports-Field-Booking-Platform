/**
 * Input Sanitization Utility
 * Prevents XSS attacks and SQL injection through proper input cleaning
 * Sanitizes user inputs before storing or displaying
 */

import logger from './logger.js';

/**
 * Sanitize string input to prevent XSS attacks
 * Removes or escapes HTML/JavaScript code
 * 
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export const sanitizeStringInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove HTML tags and scripts
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on(load|error|click|mouseover|submit)\s*=/gi, '');
  
  // HTML escape special characters
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  sanitized = sanitized.replace(/[&<>"']/g, char => htmlEscapes[char]).replace(/\//g, htmlEscapes['/']);
  
  return sanitized.trim();
};

/**
 * Sanitize object properties recursively
 * Removes HTML tags and special characters from all string values
 * 
 * @param {Object} obj - Object to sanitize
 * @param {Array} excludeFields - Field names to skip sanitization
 * @returns {Object} Sanitized object
 */
export const sanitizeObject = (obj, excludeFields = []) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, excludeFields));
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (excludeFields.includes(key)) {
      // Skip sanitization for excluded fields (like IDs, timestamps)
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeStringInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeStringInput(item) : sanitizeObject(item, excludeFields)
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, excludeFields);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate email format and sanitize
 * Prevents email header injection attacks
 * 
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with sanitized email
 */
export const sanitizeEmail = (email) => {
  const result = {
    isValid: false,
    sanitized: '',
    error: null
  };
  
  if (!email || typeof email !== 'string') {
    result.error = 'Email is required and must be a string';
    return result;
  }
  
  // Remove leading/trailing whitespace
  const trimmed = email.trim().toLowerCase();
  
  // Check for email header injection
  if (/[\r\n]/.test(trimmed)) {
    result.error = 'Email contains invalid characters (newlines)';
    return result;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    result.error = 'Invalid email format';
    return result;
  }
  
  // Additional check for multiple @ symbols
  if ((trimmed.match(/@/g) || []).length > 1) {
    result.error = 'Email contains multiple @ symbols';
    return result;
  }
  
  result.isValid = true;
  result.sanitized = trimmed;
  
  return result;
};

/**
 * Validate and sanitize URL
 * Prevents malicious redirects and XSS through URLs
 * 
 * @param {string} url - URL to validate
 * @param {Array} allowedHosts - Allowed hostname list
 * @returns {Object} Validation result with sanitized URL
 */
export const sanitizeUrl = (url, allowedHosts = []) => {
  const result = {
    isValid: false,
    sanitized: '',
    error: null
  };
  
  if (!url || typeof url !== 'string') {
    result.error = 'URL is required and must be a string';
    return result;
  }
  
  // Check for javascript protocol
  if (/^javascript:/i.test(url) || /^data:/i.test(url)) {
    result.error = 'URL contains dangerous protocol';
    return result;
  }
  
  try {
    const parsedUrl = new URL(url, 'http://localhost');
    
    // Check against allowed hosts if provided
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsedUrl.hostname)) {
      result.error = `Host ${parsedUrl.hostname} is not allowed`;
      return result;
    }
    
    result.isValid = true;
    result.sanitized = parsedUrl.toString();
    
  } catch (error) {
    logger?.warn?.(`Invalid URL format: ${error.message}`);
    result.error = 'Invalid URL format';
  }
  
  return result;
};

/**
 * Sanitize phone number
 * Removes special characters except +, -, (), spaces
 * 
 * @param {string} phone - Phone number to sanitize
 * @returns {Object} Validation result with sanitized phone
 */
export const sanitizePhoneNumber = (phone) => {
  const result = {
    isValid: false,
    sanitized: '',
    error: null
  };
  
  if (!phone || typeof phone !== 'string') {
    result.error = 'Phone number is required and must be a string';
    return result;
  }
  
  // Remove all characters except digits and +
  const sanitized = phone.replace(/[^\d+]/g, '');
  
  // Check minimum length (at least 7 digits)
  if (sanitized.replace(/\D/g, '').length < 7) {
    result.error = 'Phone number must contain at least 7 digits';
    return result;
  }
  
  result.isValid = true;
  result.sanitized = sanitized;
  
  return result;
};

/**
 * Validate and sanitize numeric input
 * Prevents injection attacks on numeric fields
 * 
 * @param {any} value - Value to validate as number
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {Object} Validation result
 */
export const sanitizeNumericInput = (value, min = -Infinity, max = Infinity) => {
  const result = {
    isValid: false,
    sanitized: 0,
    error: null
  };
  
  // Try to convert to number
  const num = Number(value);
  
  if (Number.isNaN(num)) {
    result.error = 'Value must be a valid number';
    return result;
  }
  
  if (num < min || num > max) {
    result.error = `Value must be between ${min} and ${max}`;
    return result;
  }
  
  result.isValid = true;
  result.sanitized = num;
  
  return result;
};

/**
 * Create input sanitization middleware
 * Sanitizes all req.body and req.query inputs
 * 
 * @returns {Function} Express middleware
 */
export const sanitizationMiddleware = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body, ['_id', 'id', 'createdAt', 'updatedAt', '__v']);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};
