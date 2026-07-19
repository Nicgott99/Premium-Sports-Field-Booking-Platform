/**
 * csrfProtection.js
 * Double-Submit Cookie CSRF protection middleware.
 * Premium Sports Field Booking Platform
 *
 * Implements the "Double Submit Cookie" pattern:
 *  1. On GET requests, sets a random CSRF token in a cookie.
 *  2. On state-changing requests (POST/PUT/PATCH/DELETE), verifies that
 *     the token in the request header matches the cookie value.
 *
 * This approach is stateless (no server-side session needed) and works
 * well with JWT-based auth where traditional csurf patterns are awkward.
 *
 * Usage in server.js:
 *   import csrfProtection from './middleware/csrfProtection.js';
 *   app.use(csrfProtection());
 *
 * Frontend must send the cookie value in the X-CSRF-Token header:
 *   const csrf = document.cookie.match(/csrfToken=([^;]+)/)?.[1];
 *   fetch('/api/bookings', { headers: { 'X-CSRF-Token': csrf }, ... });
 */

import crypto from 'crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * @param {object}  [options]
 * @param {string}  [options.cookieName='csrfToken']   - Cookie name to set.
 * @param {string}  [options.headerName='x-csrf-token'] - Header to read the token from.
 * @param {number}  [options.tokenLength=32]            - Byte length of generated token.
 * @param {boolean} [options.secure=auto]               - Set Secure flag on cookie.
 * @returns {import('express').RequestHandler}
 */
const csrfProtection = (options = {}) => {
  const {
    cookieName = 'csrfToken',
    headerName = 'x-csrf-token',
    tokenLength = 32,
    secure = process.env.NODE_ENV === 'production',
  } = options;

  return (req, res, next) => {
    // On safe methods: issue a new CSRF token if not already set
    if (SAFE_METHODS.has(req.method)) {
      if (!req.cookies?.[cookieName]) {
        const token = crypto.randomBytes(tokenLength).toString('hex');
        res.cookie(cookieName, token, {
          httpOnly: false,    // Must be readable by JS on the client
          sameSite: 'strict',
          secure,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }
      return next();
    }

    // On state-changing methods: validate the token
    const cookieToken  = req.cookies?.[cookieName];
    const headerToken  = req.headers[headerName.toLowerCase()];

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token missing. Please refresh the page and try again.',
      });
    }

    const cookieBuf = Buffer.from(cookieToken,  'utf8');
    const headerBuf = Buffer.from(headerToken, 'utf8');

    if (
      cookieBuf.length !== headerBuf.length ||
      !crypto.timingSafeEqual(cookieBuf, headerBuf)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      });
    }

    next();
  };
};

export default csrfProtection;
