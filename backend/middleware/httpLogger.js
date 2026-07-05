/**
 * httpLogger.js
 * Structured HTTP request/response logger middleware.
 * Premium Sports Field Booking Platform
 *
 * Logs every inbound request and its completed response with timing,
 * method, path, status code, and content length. Output is structured
 * JSON so it integrates cleanly with log aggregators (Datadog, Loki, etc.)
 *
 * Usage in server.js:
 *   import httpLogger from './middleware/httpLogger.js';
 *   app.use(httpLogger);
 */

// Paths to skip to avoid log noise (health-checks, static assets, etc.)
const SKIP_PATHS = ['/api/health', '/favicon.ico'];

/**
 * Returns a compact request-id string for log correlation.
 * Uses crypto.randomUUID if available, otherwise a simple hex string.
 */
const generateRequestId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(16).slice(2, 10);
};

/**
 * Maps HTTP status codes to a severity level for log aggregators.
 * @param {number} status
 * @returns {'info'|'warn'|'error'}
 */
const statusToLevel = (status) => {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
};

/**
 * Express middleware that logs structured HTTP request/response pairs.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const httpLogger = (req, res, next) => {
  if (SKIP_PATHS.includes(req.path)) return next();

  const startAt = process.hrtime.bigint();
  const requestId = generateRequestId();

  // Attach request-id so controllers can reference it in error logs
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startAt;
    const durationMs = Number(durationNs) / 1_000_000;

    const level = statusToLevel(res.statusCode);

    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: durationMs.toFixed(2),
      contentLength: res.getHeader('content-length') ?? '-',
      ip:
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] ?? '-',
    };

    // Print to stdout as newline-delimited JSON (NDJSON)
    process.stdout.write(JSON.stringify(logEntry) + '\n');
  });

  next();
};

export default httpLogger;
