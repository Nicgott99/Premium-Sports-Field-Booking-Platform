import mongoose from 'mongoose';

/**
 * Notification Schema - Alert & Message Management System
 * Comprehensive notification system with multiple delivery channels and priorities
 * 
 * Notification Types (14 types):
 * - booking_confirmed: Booking successfully approved
 * - booking_cancelled: Booking cancellation notification
 * - payment_received: Payment processed successfully
 * - payment_failed: Payment declined notification
 * - booking_reminder: 24-hour pre-booking reminder
 * - new_message: New direct message received
 * - team_invitation: Team join invitation
 * - tournament_registration: Tournament signup confirmed
 * - tournament_start: Tournament begins notification
 * - field_availability: Subscribed field became available
 * - review_posted: Someone reviewed your field
 * - follow_user: User started following you
 * - system_alert: Platform maintenance/policy updates
 * - other: Miscellaneous notifications
 * 
 * Priority Levels:
 * - low: Informational only (in-app)
 * - normal: Standard (in-app + email)
 * - high: Important (in-app + email + push)
 * - urgent: Critical (in-app + email + SMS + push)
 * 
 * Delivery Channels:
 * - in_app: Browser/app notification
 * - email: Email delivery with template
 * - sms: Text message (urgent only)
 * - push: Mobile push notification
 * 
 * Notification Status:
 * - created: Just created
 * - sent: Dispatched to channels
 * - delivered: Successfully delivered
 * - viewed: User opened notification
 * - read: User consumed notification
 * - dismissed: User ignored/closed
 * 
 * User Preferences:
 * - Per-notification-type control
 * - Channel selection (email, push, SMS)
 * - Quiet hours (9pm-8am)
 * - Do not disturb mode
 * - Email frequency (immediate, daily, weekly)
 * 
 * Analytics:
 * - Delivery rate per channel
 * - Open/click rate tracking
 * - Engagement metrics
 * - Dismissal patterns
 * 
 * Content:
 * - Title, message, description
 * - Image/icon, action URL
 * - Variable interpolation {{name}}, {{field}}
 * - Localization support
 * 
 * Relationships:
 * - Recipient: User receiving notification
 * - Sender: User triggering notification
 * - Related entity: Booking, field, team, etc.
 * 
 * Indexes: recipient, type, createdAt, status
 */
const notificationSchema = new mongoose.Schema(
  {
    // Recipient and Type
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notificationType: {
      type: String,
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'payment_received',
        'payment_failed',
        'booking_reminder',
        'new_message',
        'team_invitation',
        'tournament_registration',
        'tournament_start',
        'field_availability',
        'review_posted',
        'follow_user',
        'system_alert',
        'other'
      ],
      required: [true, 'Notification type is required']
    },

    // Notification Content
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    // Related Entity
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['booking', 'field', 'tournament', 'team', 'user', 'payment', 'message'],
        required: true
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      }
    },

    // Data
    data: mongoose.Schema.Types.Mixed,

    // Icons and Media
    icon: String,
    image: {
      public_id: String,
      url: String
    },

    // Status
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    isPinned: {
      type: Boolean,
      default: false
    },

    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    // Action
    action: {
      type: String,
      enum: ['view', 'confirm', 'cancel', 'reject', 'accept', 'none'],
      default: 'view'
    },
    actionUrl: String,

    // Expiration
    expiresAt: Date,

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, notificationType: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model('Notification', notificationSchema);
