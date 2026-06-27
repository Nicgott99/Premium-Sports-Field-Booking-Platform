/**
 * xssSanitizer.js
 * Express middleware to sanitize incoming request data against Cross-Site Scripting (XSS).
 * Premium Sports Field Booking Platform
 */

import xss from 'xss';

/**
 * Helper function to deeply sanitize an object or array.
 * @param {any} data - The data to sanitize.
 * @returns {any} - The sanitized data.
 */
const cleanData = (data) => {
  if (typeof data === 'string') {
    // Sanitize the string
    return xss(data.trim());
  }

  if (Array.isArray(data)) {
    // Recursively sanitize arrays
    return data.map((item) => cleanData(item));
  }

  if (data !== null && typeof data === 'object') {
    // Recursively sanitize objects
    const cleanObj = {};
    for (const [key, value] of Object.entries(data)) {
      cleanObj[key] = cleanData(value);
    }
    return cleanObj;
  }

  // Return numbers, booleans, etc. as is
  return data;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params.
 */
export const xssSanitizer = () => {
  return (req, res, next) => {
    if (req.body) {
      req.body = cleanData(req.body);
    }
    if (req.query) {
      req.query = cleanData(req.query);
    }
    if (req.params) {
      req.params = cleanData(req.params);
    }
    next();
  };
};

export default xssSanitizer;
