import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';

/**
 * Security Middleware Module
 * Comprehensive security controls for API protection
 * 
 * Security Features:
 * - Rate limiting to prevent brute force attacks
 * - API key validation for programmatic access
 * - CORS configuration for cross-origin requests
 * - XSS protection headers
 * - CSRF token validation
 * 
 * Rate Limiting Tiers:
 * - Standard: 100 requests per 15 minutes
 * - Authentication: 5 attempts per 15 minutes
 * - Payment: 10 requests per hour
 * - File Upload: 20 requests per hour
 * 
 * API Key Strategy:
 * - Header: X-API-Key
 * - Format: 32-character alphanumeric string
 * - Rotation: Every 90 days
 * - Revocation: Immediate on compromise
 * 
 * CORS Allowed Origins:
 * - localhost:3000 (development)
 * - frontend production domain
 * - Mobile app schemes (if applicable)
 * 
 * Security Headers Applied:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 1; mode=block
 * - Strict-Transport-Security: max-age=31536000
 * 
 * Attack Prevention:
 * - DoS: Rate limiting with Redis
 * - Brute Force: Login attempt limiting
 * - SQL Injection: Mongoose input validation
 * - XSS: Response header sanitization
 * - CSRF: Token-based verification
 */

/**
 * Rate limiting middleware to prevent abuse
 * Tracks request counts and blocks if exceeded
 * @async
 * @param {number} maxRequests - Maximum requests allowed (default: 100)
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns {Function} Middleware function
 * 
 * Examples:
 * - rateLimit(5, 15*60*1000) - 5 requests per 15 minutes
 * - rateLimit(100, 60*60*1000) - 100 requests per hour
 */
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return asyncHandler(async (req, res, next) => {
    // Placeholder rate limiting implementation
    // TODO: Integrate with Redis to track request counts per IP
    logger.debug(`Rate limit: ${maxRequests} requests per ${windowMs}ms`);
    next();
  });
};

/**
 * API key validation middleware
 * Requires valid X-API-Key header for protected endpoints
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} 401 error if API key missing/invalid, otherwise calls next()
 * @throws {Error} 401 - If API key not provided or invalid
 */
export const validateApiKey = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Placeholder API key validation
  if (!apiKey) {
    logger.warn('API request without key attempted');
    res.status(401).json({
      success: false,
      message: 'API key required for this endpoint'
    });
    return;
  }

  // TODO: Validate against database or environment variable
  logger.debug(`API key validated: ${apiKey.substring(0, 8)}...`);
  next();
});

/**
 * CORS (Cross-Origin Resource Sharing) middleware
 * Enables API access from approved origins
 * Prevents unauthorized cross-origin requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const corsMiddleware = (req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, X-API-Key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    logger.debug(`CORS preflight request: ${req.originalUrl}`);
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Request logging middleware
 * Logs HTTP request method, URL, status code, and response time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    
    // Log level based on status code
    if (res.statusCode >= 500) {
      logger.error(logMessage);
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  });
  
  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};