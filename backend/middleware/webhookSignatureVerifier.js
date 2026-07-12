/**
 * webhookSignatureVerifier.js
 * Express middleware to verify inbound webhook signatures.
 * Premium Sports Field Booking Platform
 *
 * Verifies that webhook payloads from external providers (Stripe, etc.)
 * are authentic by comparing the `X-Signature-256` header against an
 * HMAC-SHA256 digest of the raw request body.
 *
 * IMPORTANT: This middleware must be mounted BEFORE express.json() on the
 * routes it protects, because it needs the raw Buffer body.
 *
 * Usage:
 *   import webhookSignatureVerifier from '../middleware/webhookSignatureVerifier.js';
 *
 *   router.post(
 *     '/webhooks/stripe',
 *     express.raw({ type: 'application/json' }),   // <-- raw body
 *     webhookSignatureVerifier(process.env.STRIPE_WEBHOOK_SECRET),
 *     stripeWebhookController
 *   );
 */

import crypto from 'crypto';

/**
 * @param {string} secret          - The shared webhook secret from the provider.
 * @param {object} [options]
 * @param {string} [options.header='x-signature-256'] - Header containing the HMAC signature.
 * @param {string} [options.algorithm='sha256']        - HMAC digest algorithm.
 * @returns {import('express').RequestHandler}
 */
const webhookSignatureVerifier = (secret, options = {}) => {
  const {
    header = 'x-signature-256',
    algorithm = 'sha256',
  } = options;

  if (!secret) {
    throw new Error('[webhookSignatureVerifier] A webhook secret is required.');
  }

  return (req, res, next) => {
    const signature = req.headers[header.toLowerCase()];

    if (!signature) {
      return res.status(401).json({
        success: false,
        message: `Missing required signature header: ${header}`,
      });
    }

    // The body must be a Buffer (use express.raw() before this middleware)
    const body = req.body;
    if (!Buffer.isBuffer(body)) {
      return res.status(400).json({
        success: false,
        message: 'Webhook payload must be a raw Buffer. Ensure express.raw() is used.',
      });
    }

    const expected = crypto
      .createHmac(algorithm, secret)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'hex');

    // Normalize the provided signature — strip any "sha256=" prefix (Stripe format)
    const providedHex = signature.replace(/^sha\d+=/, '');
    const providedBuffer = Buffer.from(providedHex, 'hex');

    // Constant-time comparison to prevent timing attacks
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Webhook signature verification failed.',
      });
    }

    // Attach the parsed body as JSON for downstream controllers
    try {
      req.webhookPayload = JSON.parse(body.toString('utf8'));
    } catch {
      req.webhookPayload = null;
    }

    next();
  };
};

export default webhookSignatureVerifier;
