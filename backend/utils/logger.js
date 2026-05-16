import winston from 'winston';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Winston Logger Configuration Module
 * Provides centralized structured logging for application monitoring
 * 
 * Log Levels (Priority Order):
 * - error: Fatal errors requiring immediate attention
 * - warn: Warning conditions and non-fatal issues
 * - info: General informational messages
 * - http: HTTP request logging
 * - debug: Detailed debugging information (dev only)
 * 
 * Log File Configuration:
 * - error.log: Only error-level logs
 * - combined.log: All log levels
 * - Max file size: 5MB
 * - Rollover files: 5 files kept (25MB total)
 * - Directory: /logs/
 * 
 * Log Format:
 * - Timestamp: YYYY-MM-DD HH:mm:ss
 * - Level: error|warn|info|http|debug
 * - Service: cse471-sports-platform
 * - Message: Log message
 * - Stack trace: For errors
 * - Metadata: Additional context (userId, requestId, etc.)
 * 
 * Environment-Specific Behavior:
 * - Production: File-only, info level, JSON format
 * - Development: Console + file, debug level, colored output
 * - Test: Minimal logging, suppress most output
 * 
 * Console Output (Development):
 * - Colorized level indicators
 * - Simplified format for readability
 * - Stack traces for errors
 * - Real-time output
 * 
 * Common Log Messages:
 * - Info: Server start, connection established, operation success
 * - Warn: Deprecated API use, slow queries, resource limits
 * - Error: Database errors, auth failures, payment issues
 * - Debug: Request details, variable values, function flow
 * 
 * Performance Tracking:
 * - Request duration logging
 * - Slow query identification
 * - Error rate monitoring
 * - Cache hit/miss tracking
 * 
 * Integration Points:
 * - Express middleware for HTTP logging
 * - Database operations logging
 * - Authentication events
 * - Payment processing
 * - Email service operations
 * 
 * Monitoring & Analysis:
 * - Log aggregation (ELK stack)
 * - Error alerting
 * - Performance dashboards
 * - Audit trails
 * 
 * Best Practices:
 * - Use appropriate log levels
 * - Include relevant context
 * - Avoid logging sensitive data
 * - Structured logging format
 * - Timestamp every log entry
 * 
 * Winston logger configuration
 * Logs to file (error.log, combined.log) and console (development mode)
 * Log levels: error, warn, info, http, debug (in production: error, warn, info only)
 */

// Define comprehensive log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

/**
 * Create and configure logger instance
 * @returns {Object} Winston logger instance with file and console transports
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { service: 'cse471-sports-platform' },
  transports: [
    // Error log file - only error level and below
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB per file
      maxFiles: 5, // Keep 5 error log files
    }),
    // Combined log file - all log levels
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB per file
      maxFiles: 5, // Keep 5 combined log files
    }),
  ],
});

// Add console transport for development environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          const output = stack || (typeof message === 'string' ? message : JSON.stringify(message));
          return `${String(timestamp)} [${level}]: ${output}`;
        })
      ),
    })
  );
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;