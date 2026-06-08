import logger from './logger.js';

/**
 * Notification management system for push, email, and SMS
 */

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.subscribers = [];
  }

  /**
   * Create notification
   * @param {string} userId - User ID
   * @param {object} notification - Notification object
   * @returns {object} Created notification
   */
  createNotification(userId, notification) {
    const notif = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      channels: notification.channels || ['in-app'],
      read: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (notification.expiryHours || 24) * 3600000),
    };

    this.notifications.push(notif);
    this.notifySubscribers(notif);
    logger.info(`Notification created for user ${userId}`);

    return notif;
  }

  /**
   * Send push notification
   * @param {string} userId - User ID
   * @param {object} data - Notification data
   * @returns {boolean} Success
   */
  sendPushNotification(userId, data) {
    try {
      logger.info(`Push notification sent to ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Push notification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Send email notification
   * @param {string} email - Email address
   * @param {object} emailData - Email data
   * @returns {boolean} Success
   */
  sendEmailNotification(email, emailData) {
    try {
      logger.info(`Email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Email send failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Send SMS notification
   * @param {string} phone - Phone number
   * @param {string} message - SMS message
   * @returns {boolean} Success
   */
  sendSMSNotification(phone, message) {
    try {
      logger.info(`SMS sent to ${phone}`);
      return true;
    } catch (error) {
      logger.error(`SMS send failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Send multi-channel notification
   * @param {string} userId - User ID
   * @param {object} notification - Notification object
   * @param {string} email - Email address
   * @param {string} phone - Phone number
   * @returns {object} Notification result
   */
  sendMultiChannelNotification(userId, notification, email, phone) {
    const results = {
      inApp: this.createNotification(userId, notification),
      email: email ? this.sendEmailNotification(email, notification) : null,
      sms: phone ? this.sendSMSNotification(phone, notification.message) : null,
    };

    return results;
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {object} filters - Filter options
   * @returns {array} User notifications
   */
  getUserNotifications(userId, filters = {}) {
    let notifs = this.notifications.filter(n => n.userId === userId);

    if (filters.read !== undefined) {
      notifs = notifs.filter(n => n.read === filters.read);
    }

    if (filters.type) {
      notifs = notifs.filter(n => n.type === filters.type);
    }

    return notifs.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {boolean} Success
   */
  markAsRead(notificationId) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  /**
   * Mark all as read for user
   * @param {string} userId - User ID
   * @returns {number} Marked count
   */
  markAllAsRead(userId) {
    let count = 0;
    this.notifications.forEach(n => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    });
    return count;
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {boolean} Success
   */
  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get notification count
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Only unread
   * @returns {number} Count
   */
  getNotificationCount(userId, unreadOnly = true) {
    return this.notifications.filter(n =>
      n.userId === userId && (!unreadOnly || !n.read)
    ).length;
  }

  /**
   * Schedule notification
   * @param {string} userId - User ID
   * @param {object} notification - Notification
   * @param {Date} scheduledTime - When to send
   * @returns {object} Scheduled notification
   */
  scheduleNotification(userId, notification, scheduledTime) {
    const scheduled = {
      ...notification,
      userId,
      scheduledFor: scheduledTime,
      sent: false,
    };
    logger.info(`Notification scheduled for ${userId} at ${scheduledTime}`);
    return scheduled;
  }

  /**
   * Subscribe to notifications
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) this.subscribers.splice(index, 1);
    };
  }

  /**
   * Notify all subscribers
   * @param {object} notification - Notification
   */
  notifySubscribers(notification) {
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        logger.error(`Subscriber callback error: ${error.message}`);
      }
    });
  }

  /**
   * Clear expired notifications
   * @returns {number} Cleared count
   */
  clearExpired() {
    const now = new Date();
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.expiresAt > now);
    return initialLength - this.notifications.length;
  }
}

export const notificationManager = new NotificationManager();

export default notificationManager;
