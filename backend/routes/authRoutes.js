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

// Public routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
// router.post('/firebase-login', loginWithFirebase); // Temporarily disabled
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect); // All routes after this require authentication

router.post('/logout', logoutUser);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', validatePasswordChange, changePassword);
router.post('/resend-verification', resendVerification);
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