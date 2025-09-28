import jwt from 'jsonwebtoken';

// Generate access and refresh tokens
export const generateTokens = (user, rememberMe = false) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    membershipType: user.membershipType
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  const refreshTokenExpiry = rememberMe ? '90d' : '30d';
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
};

// Verify JWT token
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

// Generate random secure token
export const generateSecureToken = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};