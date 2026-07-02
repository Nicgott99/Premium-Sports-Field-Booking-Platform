/**
 * maintenanceMode.js
 * Express middleware to put the platform into maintenance mode.
 * Premium Sports Field Booking Platform
 *
 * When enabled, all non-whitelisted IPs receive a 503 Service Unavailable
 * response so the admin can perform database migrations, deployments, or
 * other updates without exposing a broken state to real users.
 *
 * Usage in server.js:
 *   import { maintenanceMode } from './middleware/maintenanceMode.js';
 *   app.use(maintenanceMode({
 *     enabled: process.env.MAINTENANCE_MODE === 'true',
 *     allowedIps: ['127.0.0.1'],
 *     message: 'We are upgrading the platform. Back shortly!',
 *     estimatedReturnAt: '2026-07-03T10:00:00Z'
 *   }));
 */

/**
 * @typedef  {object} MaintenanceOptions
 * @property {boolean}  [enabled=false]          - Toggle maintenance mode on/off.
 * @property {string[]} [allowedIps=[]]           - IPs that bypass the block (e.g. admin).
 * @property {string}   [message]                 - Human-readable status message.
 * @property {string}   [estimatedReturnAt]        - ISO-8601 timestamp for expected restore.
 * @property {string}   [path='/api/health']       - Path that always passes through for uptime checks.
 */

/**
 * Creates an Express maintenance-mode middleware.
 * @param {MaintenanceOptions} options
 * @returns {import('express').RequestHandler}
 */
export const maintenanceMode = (options = {}) => {
  const {
    enabled = false,
    allowedIps = [],
    message = 'The platform is temporarily down for maintenance. Please try again later.',
    estimatedReturnAt = null,
    path: healthPath = '/api/health',
  } = options;

  return (req, res, next) => {
    // Always pass health-check endpoint through
    if (req.path === healthPath) return next();

    if (!enabled) return next();

    // Resolve actual client IP (handles proxies / load balancers)
    const clientIp =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress;

    if (allowedIps.includes(clientIp)) return next();

    const body = {
      success: false,
      maintenance: true,
      message,
      ...(estimatedReturnAt && { estimatedReturnAt }),
    };

    res
      .set('Retry-After', estimatedReturnAt ? new Date(estimatedReturnAt).toUTCString() : '3600')
      .status(503)
      .json(body);
  };
};

export default maintenanceMode;
