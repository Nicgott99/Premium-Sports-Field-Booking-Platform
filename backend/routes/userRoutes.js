import express from 'express';
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