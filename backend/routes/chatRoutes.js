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

// All routes require authentication
router.use(protect);

// Chat rooms
router.get('/rooms', getChatRooms);
router.post('/rooms', createChatRoom);

// Messages
router.get('/rooms/:roomId/messages', getChatMessages);
router.post('/rooms/:roomId/messages', sendChatMessage);
router.delete('/messages/:messageId', deleteChatMessage);

// Room management
router.post('/rooms/:roomId/join', joinChatRoom);
router.post('/rooms/:roomId/leave', leaveChatRoom);

// Online status
router.get('/online', getOnlineUsers);

export default router;