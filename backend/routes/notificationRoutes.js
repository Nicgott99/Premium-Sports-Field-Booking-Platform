/**
 * Notification Routes - Alert & Message Management API
 * User notifications, preferences, delivery channels, and message handling
 * 
 * Notification Management:
 * GET / - Get user notifications
 * GET /:id - Get specific notification
 * PUT /:id/read - Mark as read
 * PUT /:id/unread - Mark as unread
 * DELETE /:id - Delete notification
 * POST /clear-all - Clear all notifications
 * 
 * Preference Management:
 * GET /preferences - Get notification preferences
 * PUT /preferences - Update preferences
 * PUT /preferences/quiet-hours - Set quiet hours
 * PUT /preferences/channels - Configure delivery channels
 * 
 * Subscribe/Unsubscribe:
 * POST /subscribe - Subscribe to notifications
 * DELETE /subscribe/:type - Unsubscribe from type
 * 
 * Get Notifications:
 * - GET /?type=booking&status=unread&sort=newest
 * - Response: { notifications: [...], total, unread, page }
 * - Status: 200 OK
 * - Filters: type, status, priority, date range
 * - Sort: newest, oldest, priority
 * - Pagination: page, limit (default 20)
 * - Cache: 1 minute
 * 
 * Notification Types:
 * - booking_confirmed: Booking success
 * - booking_cancelled: Cancellation notice
 * - payment_received: Payment confirmation
 * - payment_failed: Payment error
 * - booking_reminder: 24-hour pre-booking
 * - new_message: Direct message
 * - team_invitation: Team invite
 * - tournament_registration: Registration confirmed
 * - tournament_start: Tournament begins
 * - field_availability: Field available
 * - review_posted: New review
 * - follow_user: User followed you
 * - system_alert: Platform alerts
 * 
 * Mark Notifications:
 * - PUT /:id/read
 * - Response: { success: true, marked: "read" }
 * - Status: 200 OK
 * - Batch operation: POST /mark-read-batch: { ids: [...] }
 * 
 * Get Preferences:
 * - GET /preferences
 * - Response: { preferences: { perType: {...}, channels: {...}, quietHours: {...} } }
 * - Status: 200 OK
 * - Cache: 5 minutes
 * 
 * Update Preferences:
 * - PUT /preferences
 * - Body: { notificationTypes: {...}, deliveryChannels: {...}, frequency: "immediate" }
 * - Response: { preferences: {...} }
 * - Status: 200 OK
 * 
 * Notification Channels:
 * - in_app: Browser/app display (always on)
 * - email: Email delivery
 * - sms: Text message (optional)
 * - push: Mobile push notification
 * 
 * Priority Levels:
 * - low: Informational only
 * - normal: Standard
 * - high: Important
 * - urgent: Critical (all channels)
 * 
 * Preferences Per Type:
 * - Enable/disable for each notification type
 * - Channel selection: email, push, SMS
 * - Frequency: immediate, daily, weekly
 * - Time window: When to send
 * 
 * Quiet Hours:
 * - Set: POST /preferences/quiet-hours
 * - Body: { startTime: "21:00", endTime: "08:00", enabled: true }
 * - Response: { quietHours: {...} }
 * - Status: 200 OK
 * - No notifications during quiet hours
 * - Do not disturb override
 * 
 * Notification Filtering:
 * - By Type: Specific notification type
 * - By Status: Read, unread, dismissed
 * - By Priority: Low, normal, high, urgent
 * - By Date: Date range
 * - By Channel: Delivered via which channel
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, invalid parameters
 * - 401: Unauthorized user
 * - 404: Notification not found
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Notification States:
 * - created: Generated
 * - sent: Dispatched to channels
 * - delivered: Successfully delivered
 * - viewed: User opened
 * - read: User interacted
 * - dismissed: User closed
 * 
 * Real-Time Features:
 * - WebSocket push for new notifications
 * - Live typing indicators
 * - Online status updates
 * - Read receipts
 * 
 * Rate Limiting:
 * - Get notifications: 60 per minute
 * - Mark operations: 100 per minute
 * - Update preferences: 20 per hour
 * - Subscribe/unsubscribe: 30 per hour
 * 
 * Caching:
 * - Unread count: 1 minute
 * - Notification list: 2 minutes
 * - Preferences: 5 minutes
 * 
 * Retention:
 * - Standard: 30 days
 * - Important/system: Permanent
 * - Dismissed: 7 days
 * - Auto-delete: After read (configurable)
 */
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