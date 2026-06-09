import fs from 'fs';
import path from 'path';

/**
 * Logging configuration for different environments and transports
 */

const LOG_DIR = process.env.LOG_DIR || './logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export const loggingConfig = {
  development: {
    level: 'debug',
    format: 'combined',
    transports: [
      {
        type: 'console',
        level: 'debug',
        colorize: true,
      },
      {
        type: 'file',
        filename: path.join(LOG_DIR, 'debug.log'),
        level: 'debug',
        maxSize: '20m',
        maxFiles: 5,
      },
    ],
  },

  production: {
    level: 'info',
    format: 'json',
    transports: [
      {
        type: 'console',
        level: 'warn',
        colorize: false,
      },
      {
        type: 'file',
        filename: path.join(LOG_DIR, 'app.log'),
        level: 'info',
        maxSize: '100m',
        maxFiles: 10,
      },
      {
        type: 'file',
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        maxSize: '50m',
        maxFiles: 5,
      },
    ],
  },

  test: {
    level: 'error',
    format: 'json',
    transports: [
      {
        type: 'console',
        level: 'error',
        colorize: false,
      },
    ],
  },
};

/**
 * Get logging configuration for environment
 * @param {string} environment - Environment name
 * @returns {object} Logging config
 */
export const getLoggingConfig = (environment = process.env.NODE_ENV || 'development') => {
  return loggingConfig[environment] || loggingConfig.development;
};

/**
 * Log rotation configuration
 */
export const logRotationConfig = {
  dailyRotate: {
    dirname: LOG_DIR,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxDays: '14d',
  },
};

/**
 * Log format templates
 */
export const logFormats = {
  json: {
    timestamp: true,
    errors: {
      stack: true,
    },
  },
  combined: {
    // Apache combined log format
    format: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  },
  simple: {
    // Simple format
    format: ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  },
  dev: {
    // Development format with colors
    format: ':method :url :status :response-time ms - :res[content-length]',
    colorize: true,
  },
};

/**
 * Log levels configuration
 */
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  silly: 5,
};

/**
 * Log metadata keys to include
 */
export const logMetadataKeys = {
  request: [
    'method',
    'path',
    'query',
    'body',
    'ip',
    'userAgent',
    'userId',
  ],
  response: [
    'statusCode',
    'duration',
    'contentLength',
  ],
  system: [
    'timestamp',
    'environment',
    'processId',
    'memory',
    'uptime',
  ],
};

/**
 * Sensitive data patterns to redact
 */
export const sensitiveDataPatterns = [
  /password/i,
  /token/i,
  /secret/i,
  /apikey/i,
  /authorization/i,
  /creditcard/i,
  /ssn/i,
];

/**
 * Redact sensitive information from logs
 * @param {string} text - Text to redact
 * @returns {string} Redacted text
 */
export const redactSensitiveData = (text) => {
  if (typeof text !== 'string') return text;

  let redacted = text;
  sensitiveDataPatterns.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });

  return redacted;
};

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 * @returns {object} Log entry
 */
export const formatErrorLog = (error, context = {}) => {
  return {
    level: 'error',
    message: error.message,
    stack: error.stack,
    code: error.code,
    context,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log request with context
 * @param {object} req - Express request
 * @param {string} message - Log message
 * @returns {object} Log entry
 */
export const formatRequestLog = (req, message) => {
  return {
    level: 'http',
    message,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get log file path
 * @param {string} type - Log type (app, error, debug)
 * @returns {string} Log file path
 */
export const getLogFilePath = (type = 'app') => {
  return path.join(LOG_DIR, `${type}.log`);
};

export default {
  loggingConfig,
  getLoggingConfig,
  logRotationConfig,
  logFormats,
  logLevels,
  logMetadataKeys,
  sensitiveDataPatterns,
  redactSensitiveData,
  formatErrorLog,
  formatRequestLog,
  getLogFilePath,
};
