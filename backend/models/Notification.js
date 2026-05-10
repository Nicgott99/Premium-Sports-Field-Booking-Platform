import mongoose from 'mongoose';

/**
 * Notification Schema for user alerts and messages
 * Tracks all platform notifications with delivery status
 * 
 * Notification Types:
 * - booking_confirmed: Booking successfully created/confirmed
 * - booking_cancelled: Booking was cancelled
 * - payment_received: Payment processed successfully
 * - payment_failed: Payment processing failed
 * - booking_reminder: Upcoming booking reminder (24h before)
 * - new_message: New message received in chat
 * - team_invitation: User invited to team
 * - tournament_registration: Tournament registration updated
 * - tournament_start: Tournament is starting
 * - field_availability: Subscribed field becomes available
 * - review_posted: Someone reviewed your field
 * - follow_user: User started following you
 * - system_alert: System-wide alerts and maintenance
 * - other: Miscellaneous notifications
 * 
 * Priority Levels:
 * - low: Informational notifications
 * - normal: Standard notifications (default)
 * - high: Important notifications requiring attention
 * - urgent: Critical notifications
 * 
 * Delivery Channels:
 * - in_app: Display in app notifications
 * - email: Send via email
 * - sms: Send via SMS (if available)
 * - push: Send push notification
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
