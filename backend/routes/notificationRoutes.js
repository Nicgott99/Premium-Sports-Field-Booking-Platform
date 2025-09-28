import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  updateNotificationSettings,
  getNotificationSettings,
  sendNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getNotificationHistory,
  bulkMarkAsRead,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/notificationController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User notification routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/history', getNotificationHistory);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.put('/bulk-read', bulkMarkAsRead);
router.delete('/:id', deleteNotification);
router.delete('/all', deleteAllNotifications);

// Notification settings
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);

// Subscription management
router.post('/subscribe', subscribeToNotifications);
router.post('/unsubscribe', unsubscribeFromNotifications);

// Admin routes
router.post('/send', admin, sendNotification);

export default router;