/**
 * notificationService.js
 * Centralized Notification Service for the Premium Sports Platform
 *
 * Handles in-app notifications, email digests, and push notification dispatch.
 * Uses event-driven architecture to decouple notification logic from business logic.
 */

import Notification from '../models/Notification.js';

/**
 * Create and persist an in-app notification for a user.
 * @param {object} params
 * @param {string} params.userId       - Recipient user ID
 * @param {string} params.type         - Notification type (e.g. 'booking_confirmed')
 * @param {string} params.title        - Short notification title
 * @param {string} params.message      - Full notification message
 * @param {object} [params.data]       - Optional metadata payload
 * @returns {Promise<object>}          - Created notification document
 */
export const createNotification = async ({ userId, type, title, message, data = {} }) => {
  if (!userId || !type || !title || !message) {
    throw new Error('userId, type, title, and message are required to create a notification.');
  }

  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
    isRead: false,
    createdAt: new Date(),
  });

  return notification;
};

/**
 * Mark a single notification as read.
 * @param {string} notificationId - ID of the notification to mark as read
 * @param {string} userId         - ID of the user (ownership check)
 * @returns {Promise<object|null>} - Updated notification or null if not found
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  return notification;
};

/**
 * Mark all notifications for a user as read.
 * @param {string} userId - Target user ID
 * @returns {Promise<object>} - MongoDB update result
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result;
};

/**
 * Get unread notification count for a user.
 * @param {string} userId - Target user ID
 * @returns {Promise<number>} - Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ user: userId, isRead: false });
  return count;
};

/**
 * Get paginated notifications for a user.
 * @param {string} userId  - Target user ID
 * @param {number} page    - Page number (1-indexed)
 * @param {number} limit   - Items per page
 * @returns {Promise<object>} - { notifications, total, page, totalPages }
 */
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ user: userId }),
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Delete a notification by ID (user ownership enforced).
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<boolean>} - true if deleted, false if not found
 */
export const deleteNotification = async (notificationId, userId) => {
  const result = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  return result !== null;
};

/**
 * Delete all notifications for a user.
 * @param {string} userId
 * @returns {Promise<object>} - MongoDB delete result
 */
export const clearAllNotifications = async (userId) => {
  const result = await Notification.deleteMany({ user: userId });
  return result;
};

/**
 * Emit a booking-related notification.
 * Convenience wrapper for common booking notification scenarios.
 *
 * @param {string} userId   - Recipient user ID
 * @param {string} status   - Booking status ('confirmed' | 'cancelled' | 'reminder' | 'checkin')
 * @param {object} booking  - Booking document for context
 */
export const sendBookingNotification = async (userId, status, booking) => {
  const templates = {
    confirmed: {
      type: 'booking_confirmed',
      title: '✅ Booking Confirmed!',
      message: `Your booking for ${booking?.fieldName || 'the field'} has been confirmed.`,
    },
    cancelled: {
      type: 'booking_cancelled',
      title: '❌ Booking Cancelled',
      message: `Your booking for ${booking?.fieldName || 'the field'} has been cancelled.`,
    },
    reminder: {
      type: 'booking_reminder',
      title: '⏰ Booking Reminder',
      message: `Reminder: You have a booking for ${booking?.fieldName || 'the field'} coming up soon.`,
    },
    checkin: {
      type: 'booking_checkin',
      title: '📍 Check-In Available',
      message: `You can now check in for your booking at ${booking?.fieldName || 'the field'}.`,
    },
  };

  const template = templates[status];
  if (!template) throw new Error(`Unknown booking notification status: ${status}`);

  return createNotification({
    userId,
    ...template,
    data: { bookingId: booking?._id, fieldName: booking?.fieldName },
  });
};

export default {
  createNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserNotifications,
  deleteNotification,
  clearAllNotifications,
  sendBookingNotification,
};
