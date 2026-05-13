/**
 * Chat Routes - Real-Time Messaging API Endpoints
 * Direct messages, group chats, messaging features, and message management
 * 
 * Direct Messages (1:1):
 * POST / - Create direct message
 * GET / - Get user's direct chats
 * GET /:chatId - Get chat thread
 * POST /:chatId/messages - Send message to chat
 * 
 * Group Chats:
 * POST /group - Create group chat
 * GET /group - Get user's group chats
 * PUT /group/:groupId - Update group name/description
 * DELETE /group/:groupId - Delete group
 * 
 * Group Member Management:
 * POST /group/:groupId/members - Add member
 * DELETE /group/:groupId/members/:userId - Remove member
 * GET /group/:groupId/members - List group members
 * PUT /group/:groupId/members/:userId/role - Update member role
 * 
 * Message Operations:
 * GET /:chatId/messages - Get chat messages
 * POST /:chatId/messages - Send message
 * PUT /:chatId/messages/:messageId - Edit message
 * DELETE /:chatId/messages/:messageId - Delete message
 * POST /:chatId/messages/:messageId/reactions - React to message
 * 
 * Direct Message Endpoints:
 * - POST /
 * - Body: { recipientId, content, attachments }
 * - Response: { chatId, message }
 * - Status: 201 Created
 * - Notification: New message alert sent
 * 
 * Get Chats:
 * - GET /?type=all&sort=lastMessage
 * - Response: { chats: [{id, participants, lastMessage, lastMessageTime}, ...] }
 * - Status: 200 OK
 * - Filters: type (direct, group), status (active, archived)
 * - Sort: lastMessage, name, createdAt
 * - Pagination: page, limit
 * 
 * Get Chat Thread:
 * - GET /:chatId?page=1&limit=50
 * - Response: { chat, messages: [...], total }
 * - Status: 200 OK
 * - Pagination: Efficient message loading
 * - Cache: 2 minutes
 * 
 * Send Message:
 * - POST /:chatId/messages
 * - Body: { content, attachments: [], mentions: [@userId] }
 * - Response: { message: { id, content, sender, timestamp } }
 * - Status: 201 Created
 * - Features: Text, media, mentions, emojis
 * - Notification: Real-time push notification
 * 
 * Create Group Chat:
 * - POST /group
 * - Body: { name, description, members: [userId1, userId2], icon }
 * - Response: { groupId, createdAt }
 * - Status: 201 Created
 * - Admin: Creator is auto-admin
 * 
 * Message Status:
 * - sent: Message transmitted
 * - delivered: Recipient received
 * - read: Recipient viewed
 * - edited: Modified after send
 * - deleted: Removed
 * 
 * Message Features:
 * - Text: Plain text messaging
 * - Images: Upload images (5MB max)
 * - Files: Share documents
 * - Mentions: @mention users
 * - Reactions: Emoji reactions
 * - Forwarding: Forward to other chats
 * - Typing indicator: Live typing status
 * - Online status: User presence
 * - Read receipts: Delivery confirmation
 * 
 * Group Roles:
 * - Admin: Full permissions
 * - Moderator: Can remove members
 * - Member: Basic permissions
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, invalid input
 * - 401: Unauthorized user
 * - 403: Forbidden, permission denied
 * - 404: Chat/message not found
 * - 409: Conflict, already exists
 * - 500: Server error
 * 
 * Rate Limiting:
 * - Send message: 100 per hour per user
 * - Create chat: 50 per hour
 * - Get messages: 300 per hour
 * - Upload files: 20 per hour, 50MB total
 * 
 * Caching:
 * - Chat list: 5 minutes
 * - Messages: 2 minutes
 * - Group info: 10 minutes
 * - Typing status: Real-time only
 */
  getChatRooms,
  createChatRoom,
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
  joinChatRoom,
  leaveChatRoom,
  getOnlineUsers
} from '../controllers/chatController.js';

import { protect, admin, manager, premiumUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * Chat Routes API Documentation
 * 
 * All routes require authentication
 * Authorization: protect middleware
 * 
 * Chat Room Routes:
 * GET /rooms - Get user's chat rooms
 * POST /rooms - Create new chat room
 * POST /rooms/:roomId/join - Join chat room
 * POST /rooms/:roomId/leave - Leave chat room
 * 
 * Message Routes:
 * GET /rooms/:roomId/messages - Get chat messages
 * POST /rooms/:roomId/messages - Send message
 * DELETE /messages/:messageId - Delete message
 * 
 * Utility Routes:
 * GET /online - Get online users
 * 
 * Chat Types:
 * - direct: One-to-one messaging
 * - group: Multi-participant chat rooms
 * 
 * Query Parameters:
 * - page: Pagination page number
 * - limit: Messages per page
 * - search: Search chat rooms or users
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { rooms: [...] } or { messages: [...] }
 * }
 * 
 * Error Responses:
 * 400 - Invalid chat data
 * 401 - Unauthorized access
 * 403 - Forbidden (not room participant)
 * 404 - Room or message not found
 * 500 - Server error
 */

// All routes require authentication
router.use(protect);

/**
 * @route GET /api/chat/rooms
 * @desc Get user's chat rooms
 * @access Private
 * @query page, limit, search
 */
router.get('/rooms', getChatRooms);

/**
 * @route POST /api/chat/rooms
 * @desc Create new chat room
 * @access Private
 * @body participants, type, name (for group)
 */
router.post('/rooms', createChatRoom);

/**
 * @route GET /api/chat/rooms/:roomId/messages
 * @desc Get chat messages from room
 * @access Private
 * @param roomId - Chat room ID
 * @query page, limit
 */
router.get('/rooms/:roomId/messages', getChatMessages);

/**
 * @route POST /api/chat/rooms/:roomId/messages
 * @desc Send message to room
 * @access Private
 * @param roomId - Chat room ID
 * @body content, attachments (optional)
 */
router.post('/rooms/:roomId/messages', sendChatMessage);

/**
 * @route DELETE /api/chat/messages/:messageId
 * @desc Delete chat message
 * @access Private
 * @param messageId - Message ID
 */
router.delete('/messages/:messageId', deleteChatMessage);

/**
 * @route POST /api/chat/rooms/:roomId/join
 * @desc Join chat room
 * @access Private
 * @param roomId - Chat room ID
 */
router.post('/rooms/:roomId/join', joinChatRoom);

/**
 * @route POST /api/chat/rooms/:roomId/leave
 * @desc Leave chat room
 * @access Private
 * @param roomId - Chat room ID
 */
router.post('/rooms/:roomId/leave', leaveChatRoom);

/**
 * @route GET /api/chat/online
 * @desc Get list of online users
 * @access Private
 */
router.get('/online', getOnlineUsers);

export default router;