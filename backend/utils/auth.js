import jwt from 'jsonwebtoken';

/**
 * Authentication Utilities Module
 * Provides token generation and verification functions
 * 
 * Token Strategy:
 * - Access Token: Short-lived (15-30 minutes), used for API calls
 * - Refresh Token: Long-lived (7-90 days), used to get new access tokens
 * - Remember Me: Extended refresh token (90 days) for persistent login
 * 
 * Token Payload Structure:
 * {
 *   id: userId,
 *   email: userEmail,
 *   role: 'user|field_owner|manager|admin',
 *   membershipType: 'free|premium|enterprise',
 *   iat: issuedAt,
 *   exp: expiresAt
 * }
 * 
 * JWT Secrets:
 * - JWT_SECRET: Short-lived token signing key
 * - JWT_REFRESH_SECRET: Long-lived token signing key (optional, defaults to JWT_SECRET)
 * 
 * Security Considerations:
 * - Tokens stored in HttpOnly cookies (not localStorage)
 * - CORS restriction for cookie access
 * - Token rotation on refresh
 * - Immediate token invalidation on logout
 * - No sensitive data in token payload
 * 
 * Token Rotation Flow:
 * 1. User logs in → Access token + Refresh token issued
 * 2. Access token expires → Use refresh token to get new access token
 * 3. Refresh token expires → Force re-login
 * 4. User logs out → Both tokens invalidated
 * 
 * Environment Variables Required:
 * - JWT_SECRET: Secret key for token signing
 * - JWT_EXPIRE: Token expiration (default: '30d')
 * - JWT_REFRESH_SECRET: Optional, separate refresh token secret
 */

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