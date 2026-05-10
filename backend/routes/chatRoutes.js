import express from 'express';
import {
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