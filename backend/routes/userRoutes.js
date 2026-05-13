import express from 'express';

/**
 * User Routes - Account, Profile & Social API Endpoints
 * Comprehensive user management with profiles, preferences, social features, analytics
 * 
 * Profile Management API:
 * - GET /profile: Authenticated user profile
 * - PUT /profile: Update name, bio, location, preferences
 * - DELETE /profile: Account deletion with data cleanup
 * - GET /stats: User statistics (bookings, teams, reviews, followers)
 * - GET /analytics: Engagement metrics, activity trends
 * 
 * Avatar Management:
 * - POST /avatar: Upload avatar (jpg, png, max 5MB)
 * - DELETE /avatar: Remove avatar, revert to default
 * 
 * Social Features:
 * - POST /:id/follow: Follow another user
 * - POST /:id/unfollow: Unfollow user
 * - GET /followers: List followers with pagination
 * - GET /following: List following list
 * - GET /search: Search users by name/location with filters
 * - GET /nearby: Find users within distance radius
 * 
 * Preferences & Settings:
 * - GET /preferences: User notification and display preferences
 * - PUT /preferences: Update preferences (emails, notifications, privacy)
 * - PUT /location: Update location for nearby discovery
 * - PUT /privacy: Control profile visibility/sharing
 * 
 * Safety & Moderation:
 * - POST /:id/report: Report user for violation
 * - POST /:id/block: Block user (hide from search, messages)
 * - POST /:id/unblock: Unblock previously blocked user
 * - GET /blocked: List blocked users
 * 
 * Subscription Management:
 * - GET /subscription: Current subscription tier
 * - PUT /subscription: Upgrade/downgrade plan
 * - DELETE /subscription: Cancel subscription
 * 
 * GDPR & Data Rights:
 * - GET /export: Export all user data as JSON/CSV
 * - POST /request-deletion: Request GDPR data deletion
 * - GET /export-status: Check export preparation status
 * 
 * Authentication:
 * - All routes protected with authMiddleware
 * - Verify JWT token, check account status
 * - Role-based access control (user, field_owner, admin)
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request / validation error
 * - 401: Unauthorized / token invalid
 * - 403: Forbidden / permission denied
 * - 404: User not found
 * - 500: Server error
 * 
 * Pagination:
 * - page: Page number (default 1)
 * - limit: Items per page (default 20, max 100)
 * - sort: Sort field (createdAt, followers, etc.)
 * - order: asc or desc
 * 
 * Rate Limiting:
 * - Avatar upload: 5 per hour per user
 * - Search: 100 per hour
 * - Block/unblock: 20 per hour
 * - Delete account: One per lifetime
 * 
 * Caching:
 * - Profile cache: 5 minutes
 * - Followers/following: 10 minutes
 * - Stats: 15 minutes
 */
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