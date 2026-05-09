import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate JWT token with custom payload and options
 * @param {Object} payload - Data to encode in token (usually user ID)
 * @param {Object} options - JWT options (expiresIn, issuer, audience, etc.)
 * @returns {string} Signed JWT token
 * @throws {Error} If token generation fails
 */
export const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRE || '30d',
    issuer: process.env.JWT_ISSUER || 'sports-platform',
    audience: process.env.JWT_AUDIENCE || 'sports-platform-users'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate short-lived access token (15 minutes)
 * @param {string} userId - User ID to encode in token
 * @returns {string} Access token
 */
export const generateAccessToken = (userId) => {
  return generateToken({ userId }, { expiresIn: '15m' });
};

/**
 * Generate long-lived refresh token (7 days)
 * @param {string} userId - User ID to encode in token
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (userId) => {
  return generateToken({ userId }, { expiresIn: '7d' });
};

/**
 * Generate email verification token
 * Used for email confirmation during registration
 * @returns {string} Random hex token
 */
export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate password reset token
 * Used for forgot password functionality
 * @returns {string} Random hex token
 */
export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate API key for external integrations
 * @returns {string} Random hex API key
 */
export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate random string of specified length
 * @param {number} length - Desired string length (default: 32)
 * @returns {string} Random hex string
 */
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash token
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Compare token with hash
export const compareToken = (token, hash) => {
  const hashedToken = hashToken(token);
  return hashedToken === hash;
};

// Generate OTP
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Generate secure password
export const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};