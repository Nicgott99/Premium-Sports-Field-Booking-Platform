/**
 * apiKeyAuth.js
 * Express middleware for API key-based authentication.
 * Premium Sports Field Booking Platform
 *
 * Validates the presence and correctness of an API key sent via a request
 * header (default: `x-api-key`). Useful for securing admin-only endpoints,
 * webhooks, or server-to-server integrations without requiring a user JWT.
 *
 * Usage in routes:
 *   import apiKeyAuth from '../middleware/apiKeyAuth.js';
 *   router.get('/admin/export', apiKeyAuth(), exportHandler);
 *
 * Environment variable:
 *   INTERNAL_API_KEY=<your-secret-key>
 */

/**
 * @param {object}  [options]
 * @param {string}  [options.headerName='x-api-key']  - Request header to read the key from.
 * @param {string}  [options.key]                      - Key to validate against. Falls back to process.env.INTERNAL_API_KEY.
 * @returns {import('express').RequestHandler}
 */
const apiKeyAuth = (options = {}) => {
  const {
    headerName = 'x-api-key',
    key = process.env.INTERNAL_API_KEY,
  } = options;

  if (!key) {
    throw new Error(
      '[apiKeyAuth] No API key configured. Set INTERNAL_API_KEY in your environment or pass options.key.'
    );
  }

  return (req, res, next) => {
    const providedKey = req.headers[headerName.toLowerCase()];

    if (!providedKey) {
      return res.status(401).json({
        success: false,
        message: `Missing required header: ${headerName}`,
      });
    }

    // Constant-time comparison to prevent timing attacks
    const expected = Buffer.from(key);
    const received = Buffer.from(providedKey);

    if (
      expected.length !== received.length ||
      !require('crypto').timingSafeEqual(expected, received)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Invalid API key.',
      });
    }

    next();
  };
};

export default apiKeyAuth;
