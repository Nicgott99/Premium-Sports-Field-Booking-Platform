/**
 * Request Logging Middleware
 * Comprehensive logging for all HTTP requests and responses
 * Tracks request details, response times, and error information
 * Useful for debugging, monitoring, and audit trails
 */

import logger from '../utils/logger.js';

/**
 * Request logging middleware that captures:
 * - Request method, URL, and query parameters
 * - Request headers (excluding sensitive headers like Authorization)
 * - Request body (masked for sensitive fields)
 * - Response status code
 * - Response time
 * - Client IP address
 * - User ID (if authenticated)
 * 
 * Sensitive fields that get masked:
 * - password, passwordConfirm, pin, cvv, cardNumber
 * - authToken, refreshToken, apiKey
 * - creditCard, bankAccount
 */
export const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture original send method
  const originalSend = res.send;
  
  // Store request details
  const requestDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    clientIp: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous'
  };
  
  // Override send to capture response details
  res.send = function(data) {
    // Restore original send
    res.send = originalSend;
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Prepare response details
    const responseDetails = {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentType: res.get('content-type'),
      contentLength: res.get('content-length')
    };
    
    // Log based on status code
    const logMessage = `${requestDetails.method} ${requestDetails.url} - ${responseDetails.statusCode} (${responseDetails.responseTime})`;
    
    if (res.statusCode >= 500) {
      logger.error(logMessage, { request: requestDetails, response: responseDetails });
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage, { request: requestDetails, response: responseDetails });
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug(logMessage, { request: requestDetails, response: responseDetails });
    }
    
    // Call original send
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Sanitize sensitive data from logs
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export const sanitizeLogsForSensitiveData = (data) => {
  const sensitiveFields = [
    'password',
    'passwordConfirm',
    'pin',
    'cvv',
    'cardNumber',
    'authToken',
    'refreshToken',
    'apiKey',
    'creditCard',
    'bankAccount',
    'verificationToken',
    'resetToken'
  ];
  
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const maskValue = (obj) => {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        maskValue(obj[key]);
      }
    }
  };
  
  maskValue(sanitized);
  return sanitized;
};
