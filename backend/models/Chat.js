import mongoose from 'mongoose';

/**
 * Chat Schema for messaging system
 * Supports both direct messages and group chats
 * 
 * Chat Types:
 * - direct: One-to-one private messaging between users
 * - group: Multi-user chat rooms with shared discussions
 * 
 * Group Chat Features:
 * - Multiple participants with different roles
 * - Group name and description
 * - Chat icon for visual identification
 * - Admin controls for chat management
 * 
 * Message Management:
 * - Individual message storage
 * - Message timestamps for ordering
 * - Message sender attribution
 * - Support for text, images, files
 * 
 * Use Cases:
 * - Direct messages for booking inquiries
 * - Group chats for team coordination
 * - Tournament/league discussions
 * - Field owner and renter communication
 * - Support/help channel communications
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
