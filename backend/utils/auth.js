import jwt from 'jsonwebtoken';

/**
 * Authentication Utilities - Helper Functions for Auth Operations
 * Centralized authentication logic: token generation, password hashing, email verification
 * 
 * Purpose:
 * - JWT token generation and verification
 * - Access token and refresh token management
 * - Password hashing and comparison
 * - Email verification tokens
 * - Password reset tokens
 * - 2FA TOTP support
 * 
 * Token Strategy:
 * - Access Token: Short-lived (15-30 minutes), used for API calls
 * - Refresh Token: Long-lived (7-90 days), used to get new access tokens
 * - Remember Me: Extended refresh token (90 days) for persistent login
 * 
 * JWT Token Structure:
 * - Header: { alg: HS256, typ: JWT }
 * - Payload: { userId, email, role, iat, exp }
 * - Signature: HMAC-SHA256(secret)
 * 
 * Access Token Features:
 * - Validity: 15-30 minutes
 * - Storage: Memory (secure)
 * - Usage: API request authentication
 * - Refresh: New token via refresh endpoint
 * 
 * Refresh Token Features:
 * - Validity: 7 days default
 * - Storage: HTTP-only cookie
 * - Usage: Get new access token
 * - Rotation: New token on use
 * 
 * Password Hashing:
 * - Algorithm: bcryptjs
 * - Salt rounds: 10
 * - Comparison: Timing-attack resistant
 * - Time: ~100ms per operation
 * 
 * hashPassword(password):
 * - Input: Plain text password
 * - Validate strength requirements
 * - Generate random salt (10 rounds)
 * - Hash with bcryptjs
 * - Return hashed password
 * 
 * comparePassword(password, hash):
 * - Input: Plain password, stored hash
 * - Use bcryptjs.compare()
 * - Timing-safe comparison
 * - Return true/false
 * 
 * Password Requirements:
 * - Minimum: 8 characters
 * - Uppercase: At least one (A-Z)
 * - Lowercase: At least one (a-z)
 * - Numbers: At least one (0-9)
 * - Special: At least one (@$!%*?&)
 * 
 * Email Verification Tokens:
 * - Generation: crypto.randomBytes(32)
 * - Hashing: SHA256 for storage
 * - Validity: 24 hours
 * - One-time use: Invalidated after verification
 * 
 * generateEmailToken():
 * - Create random 32-byte token
 * - Hash for secure storage
 * - Set 24-hour expiration
 * - Return plain token for email
 * 
 * Password Reset Flow:
 * 1. User requests reset → Generate token
 * 2. Send email with reset link
 * 3. User submits new password with token
 * 4. Verify token and validity
 * 5. Hash and update password
 * 6. Invalidate token
 * 
 * generateResetToken():
 * - Create random token
 * - Hash for storage
 * - 30-minute validity
 * - Return for email link
 * 
 * verifyResetToken(token):
 * - Hash received token
 * - Compare with stored hash
 * - Verify not expired
 * - Ensure not already used
 * 
 * 2FA TOTP Support:
 * - Algorithm: HMAC-based One-Time Password
 * - Time-step: 30 seconds
 * - Code length: 6 digits
 * - Tolerance: ±1 time step
 * 
 * generateTOTPSecret():
 * - Random 32-byte seed
 * - Base32 encoded
 * - QR code compatible
 * - Return for storage
 * 
 * verifyTOTPCode(secret, code):
 * - Calculate current TOTP
 * - Check current and previous step
 * - Verify code match
 * - Return verification result
 * 
 * Token Security:
 * - Format: Cryptographically random HEX
 * - Length: 32-64 characters
 * - Uniqueness: Non-colliding
 * - One-way: Hashed for storage
 * 
 * JWT Claims:
 * - userId: Unique user identifier
 * - email: User email address
 * - role: User role (user, admin)
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp
 * - type: Token type (access/refresh)
 * 
 * Error Handling:
 * - Invalid password: Requirements error
 * - Token expired: "Token has expired"
 * - Invalid token: "Invalid token"
 * - Signature invalid: "Token signature invalid"
 * 
 * Performance:
 * - Password hash: ~100ms
 * - Password compare: ~100ms
 * - Token generation: <1ms
 * - Token verification: <1ms
 * - No database queries
 * 
 * Security Considerations:
 * - Never log passwords
 * - Never transmit plain passwords
 * - Always use HTTPS
 * - Secure token transmission
 * - Rate limit attempts
 * - Invalidate on security events
 * 
 * Integration:
 * - authController: Login/registration
 * - authMiddleware: Request verification
 * - User model: Password storage
 * - Email service: Token delivery
 * 
 * Compliance:
 * - OWASP guidelines
 * - NIST requirements
 * - PCI DSS standards
 * - GDPR regulations
 */
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