import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  sendPushNotification,
  subscribeToPush
} from '../controllers/notificationController.js';

import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User notification routes
router.get('/', getUserNotifications);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

// Notification settings
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

// Push notification management
router.post('/subscribe', subscribeToPush);
router.post('/send', admin, sendPushNotification);

export default router;