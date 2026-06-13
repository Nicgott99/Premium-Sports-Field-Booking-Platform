import crypto from 'crypto';
import logger from './logger.js';

/**
 * Request signing and verification for API security
 */

class RequestSigner {
  constructor(secret) {
    this.secret = secret;
  }

  /**
   * Sign request
   * @param {object} req - Request object
   * @returns {string} Signature
   */
  signRequest(req) {
    const data = this.buildSignatureData(req);
    return this.sign(data);
  }

  /**
   * Build signature data
   * @param {object} req - Request object
   * @returns {string} Signature data
   */
  buildSignatureData(req) {
    const method = req.method || 'GET';
    const path = req.path || req.url || '';
    const timestamp = req.timestamp || Date.now();
    const nonce = req.nonce || crypto.randomBytes(16).toString('hex');
    const body = req.body ? JSON.stringify(req.body) : '';

    return `${method}\n${path}\n${timestamp}\n${nonce}\n${body}`;
  }

  /**
   * Sign data with HMAC
   * @param {string} data - Data to sign
   * @returns {string} Signature
   */
  sign(data) {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify request signature
   * @param {object} req - Request object
   * @param {string} signature - Signature to verify
   * @returns {boolean} Is valid
   */
  verifyRequest(req, signature) {
    try {
      const expectedSignature = this.signRequest(req);
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.warn('Request signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate API key
   * @returns {string} API key
   */
  generateApiKey() {
    return `api_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Hash API key
   * @param {string} apiKey - API key
   * @returns {string} Hashed key
   */
  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Create signature headers
   * @param {string} signature - Signature
   * @param {string} timestamp - Timestamp
   * @returns {object} Headers
   */
  createSignatureHeaders(signature, timestamp) {
    return {
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    };
  }
}

/**
 * Request signing middleware
 * @param {string} secret - Signing secret
 * @returns {function} Middleware
 */
export const requestSigningMiddleware = (secret) => {
  const signer = new RequestSigner(secret);

  return (req, res, next) => {
    req.signer = signer;
    req.signRequest = () => signer.signRequest(req);

    const originalJson = res.json;
    res.json = function(data) {
      const timestamp = Date.now().toString();
      const signature = signer.sign(`${JSON.stringify(data)}${timestamp}`);

      res.setHeader('X-Signature', signature);
      res.setHeader('X-Timestamp', timestamp);

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Request verification middleware
 * @param {string} secret - Signing secret
 * @returns {function} Middleware
 */
export const requestVerificationMiddleware = (secret) => {
  const signer = new RequestSigner(secret);

  return (req, res, next) => {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    if (!signature || !timestamp) {
      return res.status(401).json({
        success: false,
        error: 'Missing signature headers',
      });
    }

    // Check timestamp (prevent replay attacks)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (now - requestTime > maxAge) {
      logger.warn('Request signature expired');
      return res.status(401).json({
        success: false,
        error: 'Request signature expired',
      });
    }

    // Verify signature
    if (!signer.verifyRequest({ ...req, timestamp }, signature)) {
      logger.warn('Invalid request signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid request signature',
      });
    }

    next();
  };
};

export { RequestSigner };

export default RequestSigner;
