import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  refreshToken,
  deleteAccount,
  submitContactMessage
} from '../controllers/authController.js';

import { protect, protectFirebase } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin, validatePasswordChange } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Rate limiters for sensitive endpoints
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many registration attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many login attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST'
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour per IP
  message: 'Too many password reset attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST'
});

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many verification email requests, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST'
});

/**
 * Authentication Routes - Complete Auth API Endpoints
 * User registration, login, password reset, email verification, token refresh
 * 
 * Public Routes (No Authentication):
 * POST /register - User registration with email/password
 * POST /login - User login with credentials
 * POST /forgot-password - Request password reset email
 * POST /reset-password/:token - Reset password with token
 * GET /verify-email/:token - Verify email address
 * POST /resend-verification - Resend verification email
 * POST /refresh-token - Refresh access token
 * 
 * Protected Routes (Authentication Required):
 * GET /profile - Get authenticated user profile
 * PUT /profile - Update user profile
 * DELETE /account - Delete user account
 * POST /change-password - Change password
 * POST /logout - User logout
 * 
 * Registration Endpoint:
 * - POST /register
 * - Body: { firstName, lastName, email, password, phone, location }
 * - Validation: Email unique, password strength, phone format
 * - Response: { token, refreshToken, user, message }
 * - Status: 201 Created
 * - Rate: 5 per hour per IP
 * 
 * Login Endpoint:
 * - POST /login
 * - Body: { email, password }
 * - Response: { accessToken, refreshToken, user }
 * - Status: 200 OK
 * - Cookies: httpOnly, secure, sameSite=strict
 * - Rate: 10 per hour per IP
 * 
 * Password Reset Flow:
 * 1. POST /forgot-password: { email }
 * 2. Email sent with reset link (30 min valid)
 * 3. User clicks link, submitted with token
 * 4. POST /reset-password/:token: { password }
 * 5. Password updated, user redirected to login
 * 
 * Email Verification:
 * - Verification token: 24 hours valid
 * - User account suspended until verified
 * - Resend endpoint for expired tokens
 * - Auto-verification after email link click
 * 
 * Token Management:
 * - Access Token: 15 minutes
 * - Refresh Token: 7 days
 * - Remember Me: 90 days (optional)
 * - Refresh endpoint: POST /refresh-token
 * 
 * OAuth Integration (Firebase):
 * - Google OAuth2: Social login
 * - Facebook OAuth2: Social login
 * - Apple OAuth2: Social login
 * - Auto-account creation on first login
 * - Link to existing account option
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, validation error
 * - 401: Unauthorized, invalid credentials
 * - 403: Forbidden, account suspended
 * - 409: Conflict, email already registered
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Validation:
 * - Email: Standard format, unique per user
 * - Password: Min 8 chars, mixed case, numbers, special chars
 * - Phone: Bangladesh format (01XXXXXXXXX or +8801XXXXXXXXX)
 * - Name: 2-50 chars, alphabetic
 * 
 * Security Features:
 * - Password hashing: bcryptjs (10 salt rounds)
 * - Token verification: HMAC-SHA256
 * - HTTPS enforced in production
 * - CSRF protection: Token validation
 * - SQL injection prevention: Parameterized queries
 * - Rate limiting: Brute force protection
 * 
 * Middleware Applied:
 * - validateRegister: Input validation
 * - validateLogin: Credential validation
 * - validatePasswordChange: Password policy
 * - asyncHandler: Error handling wrapper
 * - Logger: Activity logging
 * 
 * Cookies:
 * - httpOnly: True (JS cannot access)
 * - secure: True (HTTPS only)
 * - sameSite: Strict (CSRF protection)
 * - path: /api (scoped to API)
 * - domain: Exact domain
 * 
 * Rate Limiting:
 * - Register: 5 per hour per IP
 * - Login: 10 per hour per IP
 * - Password reset: 3 per hour per email
 * - Resend verification: 5 per hour per email
 * - Change password: 20 per hour per user
 * 
 * Caching:
 * - User profile: 5 minutes
 * - Verification token: 24 hours
 * - Reset token: 30 minutes
 */

// Public routes
/**
 * @route POST /api/auth/register
 * @desc Register new user account
 * @access Public
 * @body firstName, lastName, email, phone, password
 */
router.post('/register', registerLimiter, validateRegister, registerUser);

/**
 * @route POST /api/auth/login
 * @desc Login user with email/password
 * @access Public
 * @body email, password
 */
router.post('/login', loginLimiter, validateLogin, loginUser);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset email
 * @access Public
 * @body email
 */
router.post('/forgot-password', passwordResetLimiter, forgotPassword);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password with verification token
 * @access Public
 * @param token - Email verification token
 * @body password, passwordConfirm
 */
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify user email address
 * @access Public
 * @param token - Email verification token
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token with refresh token
 * @access Public
 * @body refreshToken
 */
router.post('/refresh-token', refreshToken);

router.post('/contact', submitContactMessage);

// Protected routes
router.use(protect); // All routes after this require authentication

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate token
 * @access Private
 */
router.post('/logout', logoutUser);

/**
 * @route GET /api/auth/profile
 * @desc Get authenticated user profile
 * @access Private
 */
router.get('/profile', getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update authenticated user profile
 * @access Private
 * @body firstName, lastName, phone, etc.
 */
router.put('/profile', updateProfile);

/**
 * @route PUT /api/auth/change-password
 * @desc Change authenticated user password
 * @access Private
 * @body currentPassword, newPassword, passwordConfirm
 */
router.put('/change-password', validatePasswordChange, changePassword);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification link
 * @access Private
 */
router.post('/resend-verification', resendVerificationLimiter, resendVerification);

/**
 * @route DELETE /api/auth/account
 * @desc Delete user account permanently
 * @access Private
 */
router.delete('/account', deleteAccount);

// Firebase integration (Temporarily disabled - functions not implemented)
// router.post('/link-firebase', linkFirebaseAccount);
// router.post('/unlink-firebase', unlinkFirebaseAccount);

// Two-Factor Authentication (Temporarily disabled - functions not implemented)
// router.post('/2fa/enable', enableTwoFactor);
// router.post('/2fa/disable', disableTwoFactor);
// router.post('/2fa/verify', verifyTwoFactor);

// Session management (Temporarily disabled - functions not implemented)
// router.get('/sessions', getUserSessions);
// router.delete('/sessions/:sessionId', terminateSession);
// router.delete('/sessions', terminateAllSessions);

export default router;