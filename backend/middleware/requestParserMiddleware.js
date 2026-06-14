/**
 * Request parser middleware for parsing and normalizing requests
 */

/**
 * Parse JSON with error handling
 * @param {*} value - Value to parse
 * @returns {*}
 */
function parseJSON(value) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Normalize request data
 * @param {object} data - Data to normalize
 * @returns {object}
 */
function normalizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const normalized = {};

  for (const [key, value] of Object.entries(data)) {
    // Remove leading/trailing spaces from string values
    if (typeof value === 'string') {
      normalized[key] = value.trim();
    } else if (Array.isArray(value)) {
      normalized[key] = value.map(v => (typeof v === 'string' ? v.trim() : v));
    } else if (typeof value === 'object' && value !== null) {
      normalized[key] = normalizeData(value);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Parse query parameters
 * @param {object} query - Query object
 * @returns {object}
 */
function parseQuery(query) {
  const parsed = {};

  for (const [key, value] of Object.entries(query)) {
    // Parse numeric values
    if (value === 'true') {
      parsed[key] = true;
    } else if (value === 'false') {
      parsed[key] = false;
    } else if (value === 'null') {
      parsed[key] = null;
    } else if (!isNaN(value) && value !== '') {
      parsed[key] = Number(value);
    } else {
      parsed[key] = value;
    }
  }

  return parsed;
}

/**
 * Extract headers
 * @param {object} headers - Headers object
 * @returns {object}
 */
function extractHeaders(headers) {
  return {
    contentType: headers['content-type'],
    authorization: headers['authorization'],
    accept: headers['accept'],
    userAgent: headers['user-agent'],
    xForwardedFor: headers['x-forwarded-for'],
    xRequestId: headers['x-request-id'],
  };
}

/**
 * Request parser middleware
 * @returns {function}
 */
export const requestParserMiddleware = () => {
  return (req, res, next) => {
    try {
      // Normalize body
      if (req.body && typeof req.body === 'object') {
        req.body = normalizeData(req.body);

        // Parse JSON fields in body
        for (const [key, value] of Object.entries(req.body)) {
          if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            req.body[key] = parseJSON(value);
          }
        }
      }

      // Parse query parameters
      if (req.query && Object.keys(req.query).length > 0) {
        req.query = parseQuery(req.query);
      }

      // Extract important headers
      req.parsedHeaders = extractHeaders(req.headers);

      // Store parsed request
      req.parsed = {
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.parsedHeaders,
      };

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        message: error.message,
      });
    }
  };
};

/**
 * Get parsed data from request
 * @param {object} req - Request object
 * @param {string} source - Data source (body, query, params)
 * @returns {object}
 */
export const getParsedData = (req, source = 'body') => {
  if (!req.parsed) {
    return {};
  }

  return req.parsed[source] || {};
};

/**
 * Get parsed header
 * @param {object} req - Request object
 * @param {string} name - Header name
 * @returns {*}
 */
export const getParsedHeader = (req, name) => {
  if (!req.parsedHeaders) {
    return null;
  }

  return req.parsedHeaders[name] || null;
};

export default requestParserMiddleware;
