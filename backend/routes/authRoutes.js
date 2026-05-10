import express from 'express';
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
  deleteAccount
} from '../controllers/authController.js';

import { protect, protectFirebase } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin, validatePasswordChange } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * Authentication Routes API Documentation
 * 
 * Public Routes (no authentication required):
 * POST /register - User registration with email/password
 * POST /login - User login with credentials
 * POST /forgot-password - Request password reset email
 * POST /reset-password/:token - Reset password with token
 * GET /verify-email/:token - Verify email address
 * POST /refresh-token - Refresh access token
 * 
 * Protected Routes (require authentication):
 * POST /logout - Logout user session
 * GET /profile - Get authenticated user profile
 * PUT /profile - Update user profile
 * PUT /change-password - Change password
 * POST /resend-verification - Resend verification email
 * DELETE /account - Delete user account
 * 
 * Validation:
 * - Register: Email format, password strength, phone format
 * - Login: Email/password validation
 * - Password Change: Current password verification
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { user: {...}, token: "..." }
 * }
 * 
 * Error Responses:
 * 400 - Invalid data or validation error
 * 401 - Invalid credentials or unauthorized
 * 404 - User not found
 * 409 - Email/phone already exists
 * 500 - Server error
 * 
 * Future Features (Currently Disabled):
 * - Firebase authentication integration
 * - Two-factor authentication (2FA)
 * - Session management
 * - OAuth integration
 */

// Public routes
/**
 * @route POST /api/auth/register
 * @desc Register new user account
 * @access Public
 * @body firstName, lastName, email, phone, password
 */
router.post('/register', validateRegister, registerUser);

/**
 * @route POST /api/auth/login
 * @desc Login user with email/password
 * @access Public
 * @body email, password
 */
router.post('/login', validateLogin, loginUser);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset email
 * @access Public
 * @body email
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password with verification token
 * @access Public
 * @param token - Email verification token
 * @body password, passwordConfirm
 */
router.post('/reset-password/:token', resetPassword);

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
router.post('/resend-verification', resendVerification);

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