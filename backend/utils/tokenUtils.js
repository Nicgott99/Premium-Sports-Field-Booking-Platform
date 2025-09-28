import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate JWT token
export const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRE || '30d',
    issuer: process.env.JWT_ISSUER || 'sports-platform',
    audience: process.env.JWT_AUDIENCE || 'sports-platform-users'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Generate access token
export const generateAccessToken = (userId) => {
  return generateToken({ userId }, { expiresIn: '15m' });
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return generateToken({ userId }, { expiresIn: '7d' });
};

// Generate email verification token
export const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate API key
export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate random string
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