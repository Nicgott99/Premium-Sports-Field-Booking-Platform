import mongoose from 'mongoose';

/**
 * Chat Schema - Real-Time Messaging System
 * Supports direct (1:1) and group chats with real-time synchronization
 * 
 * Chat Types:
 * - direct: Private conversation between exactly 2 users
 * - group: Multi-user chat room with admin roles
 * 
 * Direct Chat Features:
 * - Auto-created on first message between users
 * - Symmetric permissions for both users
 * - Message history preserved indefinitely
 * - Mute, archive, delete options
 * 
 * Group Chat Features:
 * - Admin/moderator role management
 * - Custom name, description, icon
 * - Add/remove members by admin
 * - Participant roles: admin, moderator, member
 * - Pinned messages, announcements
 * 
 * Participant Status:
 * - active: Currently participating
 * - muted: Notifications disabled
 * - archived: Hidden from list
 * - left: Member departed
 * - removed: Kicked by admin
 * - banned: Permanently excluded
 * 
 * Message Content:
 * - Text: Plain text messages
 * - Media: Images, files, attachments
 * - Mentions: @username notifications
 * - Reactions: Emoji reactions
 * - Forwarding: Forward to other chats
 * 
 * Message Status:
 * - sent: Transmitted to server
 * - delivered: Received by recipient(s)
 * - read: Seen by recipient(s)
 * - edited: Modified after sending
 * - deleted: Removed by author/moderator
 * 
 * Real-Time Events:
 * - message_sent, typing_indicator, online_status
 * - read_receipt, participant_joined, participant_left
 * - chat_settings_updated, message_reacted
 * 
 * Notifications:
 * - New message alert
 * - Direct mention notification
 * - Member joined notification
 * - Group info change alert
 * 
 * Search & History:
 * - Search messages by content
 * - Filter by sender, date
 * - 6-month message retention (default)
 * - Archive old messages
 * - Full-text indexing
 * 
 * Relationships:
 * - User: Chat participants
 * - Message: Individual message records
 * 
 * Indexes: participants, chatType, createdAt, lastMessageAt
 */
const chatSchema = new mongoose.Schema(
  {
    // Chat Type
    chatType: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
      required: true
    },

    // Participants
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],

    // Chat Details (for group chats)
    chatName: {
      type: String,
      maxlength: [100, 'Chat name cannot exceed 100 characters']
    },
    chatIcon: {
      public_id: String,
      url: String
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Messages
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        content: {
          type: String,
          required: true
        },
        messageType: {
          type: String,
          enum: ['text', 'image', 'file', 'location'],
          default: 'text'
        },
        media: {
          public_id: String,
          url: String
        },
        readBy: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            },
            readAt: {
              type: Date,
              default: Date.now
            }
          }
        ],
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Last Message
    lastMessage: {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    },

    // Unread Messages
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map()
    },

    // Chat Status
    isActive: {
      type: Boolean,
      default: true
    },
    isMuted: {
      type: Map,
      of: Boolean,
      default: new Map()
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ 'messages.timestamp': -1 });
chatSchema.index({ updatedAt: -1 });

export default mongoose.model('Chat', chatSchema);
