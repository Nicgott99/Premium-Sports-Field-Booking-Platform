/**
 * auditLogger.js
 * Structured audit trail middleware for sensitive operations.
 * Premium Sports Field Booking Platform
 *
 * Records who did what and when for compliance, debugging, and security
 * forensics. Each audit event is a structured JSON line written to stdout
 * (captured by your log aggregator) and can optionally be persisted to DB.
 *
 * Usage:
 *   import { auditLog, auditMiddleware } from '../middleware/auditLogger.js';
 *
 *   // In a controller:
 *   auditLog(req, 'BOOKING_CANCELLED', { bookingId, refundAmount });
 *
 *   // As route middleware (logs every matched request):
 *   router.delete('/bookings/:id', auditMiddleware('BOOKING_DELETE_ATTEMPT'), controller);
 */

/**
 * Core audit event emitter.
 * @param {import('express').Request} req
 * @param {string} action       - Snake-case action name, e.g. 'BOOKING_CANCELLED'.
 * @param {object} [meta={}]    - Any additional structured data to include.
 */
export const auditLog = (req, action, meta = {}) => {
  const event = {
    level: 'audit',
    timestamp: new Date().toISOString(),
    action,
    requestId: req.requestId ?? null,
    userId: req.user?._id?.toString() ?? req.user?.id ?? 'anonymous',
    userEmail: req.user?.email ?? null,
    userRole: req.user?.role ?? null,
    ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress,
    method: req.method,
    path: req.originalUrl,
    userAgent: req.headers['user-agent'] ?? null,
    meta,
  };

  // Emit as NDJSON — captured by log aggregators (Datadog, Loki, CloudWatch)
  process.stdout.write(JSON.stringify(event) + '\n');
};

/**
 * Express middleware factory that automatically logs each request as an audit event.
 * @param {string} action - Action label to use in the audit log.
 * @returns {import('express').RequestHandler}
 */
export const auditMiddleware = (action) => (req, _res, next) => {
  auditLog(req, action, {
    params: req.params,
    query: req.query,
    // Never log passwords or tokens
    body: sanitizeBody(req.body),
  });
  next();
};

/**
 * Remove sensitive fields from a body before logging.
 * @param {object} body
 * @returns {object}
 */
const REDACTED_FIELDS = new Set([
  'password', 'confirmPassword', 'currentPassword', 'newPassword',
  'token', 'accessToken', 'refreshToken', 'secret', 'apiKey',
  'cardNumber', 'cvv', 'otp',
]);

const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  const clean = {};
  for (const [key, value] of Object.entries(body)) {
    clean[key] = REDACTED_FIELDS.has(key) ? '[REDACTED]' : value;
  }
  return clean;
};

export default { auditLog, auditMiddleware };
