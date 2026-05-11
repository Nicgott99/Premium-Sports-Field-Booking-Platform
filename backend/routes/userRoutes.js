import express from 'express';

/**
 * User Routes API Documentation
 * 
 * All routes require authentication (protect middleware)
 * 
 * Profile Management Routes:
 * GET /profile - Get authenticated user's profile
 * PUT /profile - Update user profile (name, bio, preferences)
 * DELETE /profile - Delete user account and data
 * GET /stats - Get user statistics (bookings, teams, reviews, activity)
 * GET /analytics - Get user engagement analytics
 * 
 * User Content Routes:
 * GET /bookings - Get user's booking history
 * GET /fields - Get user's field listings
 * GET /teams - Get user's team memberships
 * 
 * Avatar Management:
 * POST /avatar - Upload user avatar
 * DELETE /avatar - Remove user avatar
 * 
 * Social Features:
 * POST /:id/follow - Follow a user
 * POST /:id/unfollow - Unfollow a user
 * GET /followers - Get user followers list
 * GET /following - Get users this user follows
 * GET /search - Search users by name or location
 * GET /nearby - Find nearby users
 * 
 * Preferences & Settings:
 * PUT /preferences - Update notification and privacy settings
 * PUT /location - Update user location
 * 
 * Safety & Moderation:
 * POST /:id/report - Report inappropriate user
 * POST /:id/block - Block user
 * POST /:id/unblock - Unblock user
 * GET /blocked - Get list of blocked users
 * 
 * Subscription Management:
 * PUT /subscription - Update user subscription tier
 * DELETE /subscription - Cancel subscription
 * 
 * Data Management:
 * GET /export - Export user data (GDPR)
 * POST /request-deletion - Request account deletion (30-day delay)
 * 
 * Query Parameters:
 * - page: Pagination page number
 * - limit: Results per page
 * - sort: Sort field (createdAt, name, rating)
 * - order: asc or desc
 * 
 * Access Control:
 * - Own profile: All operations
 * - Other profiles: Limited public data only
 * - Admin: Full access to all user data
 * 
 * Error Responses:
 * 401 - Unauthorized/token missing
 * 403 - Forbidden (insufficient permissions)
 * 404 - User not found
 * 409 - Conflict (duplicate block, already following, etc.)
 * 500 - Server error
 */

import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  getUserBookings,
  getUserFields,
  getUserTeams,
  updateUserPreferences,
  updateUserLocation,
  uploadAvatar,
  deleteAvatar,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getNearbyUsers,
  reportUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  updateSubscription,
  cancelSubscription,
  getUserAnalytics,
  exportUserData,
  requestDataDeletion
} from '../controllers/userController.js';

import { protect, admin, manager, premiumUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', getUser);
router.put('/profile', updateUser);
router.delete('/profile', deleteUser);
router.get('/stats', getUserStats);
router.get('/analytics', getUserAnalytics);

// User content routes
router.get('/bookings', getUserBookings);
router.get('/fields', getUserFields);
router.get('/teams', getUserTeams);

// User preferences and settings
router.put('/preferences', updateUserPreferences);
router.put('/location', updateUserLocation);

// Avatar management
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);

// Social features
router.post('/follow/:userId', followUser);
router.delete('/follow/:userId', unfollowUser);
router.get('/followers', getFollowers);
router.get('/following', getFollowing);

// Search and discovery
router.get('/search', searchUsers);
router.get('/nearby', getNearbyUsers);

// Safety and moderation
router.post('/report/:userId', reportUser);
router.post('/block/:userId', blockUser);
router.delete('/block/:userId', unblockUser);
router.get('/blocked', getBlockedUsers);

// Subscription management
router.put('/subscription', updateSubscription);
router.delete('/subscription', cancelSubscription);

// Data export and privacy
router.get('/export-data', exportUserData);
router.post('/request-deletion', requestDataDeletion);

// Admin routes
router.get('/', admin, getUsers);
router.get('/:id', admin, getUser);
router.put('/:id', admin, updateUser);
router.delete('/:id', admin, deleteUser);

export default router;