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

/**
 * Notification Routes API Documentation
 * 
 * All routes require authentication
 * Authorization: protect middleware
 * 
 * Notification Routes:
 * GET / - Get user's notifications
 * PUT /:id/read - Mark notification as read
 * PUT /mark-all-read - Mark all notifications as read
 * DELETE /:id - Delete notification
 * 
 * Settings Routes:
 * GET /settings - Get notification preferences
 * PUT /settings - Update notification settings
 * 
 * Push Notification Routes:
 * POST /push/send - Send push notification (admin)
 * POST /push/subscribe - Subscribe to push notifications
 * 
 * Query Parameters:
 * - page: Pagination page number
 * - limit: Results per page (default: 20)
 * - type: Filter by notification type
 * - unreadOnly: Show only unread notifications
 * - dateRange: Filter by date range
 * 
 * Notification Types:
 * - booking_confirmed, booking_cancelled
 * - payment_received, payment_failed
 * - booking_reminder, new_message
 * - team_invitation, tournament_registration
 * - field_availability, review_posted
 * - follow_user, system_alert
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { notifications: [...] } or { settings: {...} }
 * }
 * 
 * Error Responses:
 * 401 - Unauthorized access
 * 404 - Notification not found
 * 500 - Server error
 */

// All routes require authentication
router.use(protect);

/**
 * @route GET /api/notifications
 * @desc Get user's notifications
 * @access Private
 * @query page, limit, type, unreadOnly, dateRange
 */
router.get('/', getUserNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark specific notification as read
 * @access Private
 * @param id - Notification ID
 */
router.put('/:id/read', markAsRead);

/**
 * @route PUT /api/notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/mark-all-read', markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Private
 * @param id - Notification ID
 */
router.delete('/:id', deleteNotification);

/**
 * @route GET /api/notifications/settings
 * @desc Get notification preferences
 * @access Private
 */
router.get('/settings', getNotificationSettings);

/**
 * @route PUT /api/notifications/settings
 * @desc Update notification settings
 * @access Private
 * @body email, sms, push, inApp settings
 */
router.put('/settings', updateNotificationSettings);

/**
 * @route POST /api/notifications/push/send
 * @desc Send push notification (admin only)
 * @access Private/Admin
 */
router.post('/push/send', admin, sendPushNotification);

/**
 * @route POST /api/notifications/push/subscribe
 * @desc Subscribe to push notifications
 * @access Private
 * @body pushToken, deviceId
 */
router.post('/push/subscribe', subscribeToPush);

export default router;
router.post('/subscribe', subscribeToPush);
router.post('/send', admin, sendPushNotification);

export default router;