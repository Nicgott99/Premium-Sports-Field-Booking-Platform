import express from 'express';
import {
  getChatRooms,
  getChatRoom,
  createChatRoom,
  updateChatRoom,
  deleteChatRoom,
  joinChatRoom,
  leaveChatRoom,
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  getMessageReactions,
  searchMessages,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  reportMessage,
  getPrivateChat,
  createPrivateChat,
  getGroupChats,
  createGroupChat,
  addToGroupChat,
  removeFromGroupChat,
  updateGroupChatInfo,
  makeAdmin,
  removeAdmin,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  getChatAnalytics,
  exportChatData,
  getTypingIndicator,
  setTypingIndicator,
  getOnlineUsers,
  getUnreadCount,
  markAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  createChatInvite,
  getChatInvites,
  respondToChatInvite,
  uploadChatMedia,
  deleteChatMedia,
  getChatMedia,
  createPoll,
  voteInPoll,
  getPollResults,
  scheduleMeeting,
  getMeetings,
  joinMeeting,
  endMeeting
} from '../controllers/chatController.js';

import { protect, admin, manager, premiumUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Chat rooms
router.get('/rooms', getChatRooms);
router.post('/rooms', createChatRoom);
router.get('/rooms/:roomId', getChatRoom);
router.put('/rooms/:roomId', updateChatRoom);
router.delete('/rooms/:roomId', deleteChatRoom);
router.post('/rooms/:roomId/join', joinChatRoom);
router.post('/rooms/:roomId/leave', leaveChatRoom);

// Messages
router.get('/rooms/:roomId/messages', getChatMessages);
router.post('/rooms/:roomId/messages', sendMessage);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.post('/messages/:messageId/react', reactToMessage);
router.get('/messages/:messageId/reactions', getMessageReactions);
router.get('/messages/search', searchMessages);

// Message management
router.post('/messages/:messageId/pin', pinMessage);
router.delete('/messages/:messageId/pin', unpinMessage);
router.get('/rooms/:roomId/pinned', getPinnedMessages);
router.post('/messages/:messageId/report', reportMessage);

// Private chats
router.get('/private', getPrivateChat);
router.post('/private', createPrivateChat);

// Group chats
router.get('/groups', getGroupChats);
router.post('/groups', createGroupChat);
router.post('/groups/:groupId/members', addToGroupChat);
router.delete('/groups/:groupId/members/:userId', removeFromGroupChat);
router.put('/groups/:groupId', updateGroupChatInfo);

// Group chat moderation
router.post('/groups/:groupId/admins/:userId', makeAdmin);
router.delete('/groups/:groupId/admins/:userId', removeAdmin);
router.post('/groups/:groupId/mute/:userId', muteUser);
router.delete('/groups/:groupId/mute/:userId', unmuteUser);
router.post('/groups/:groupId/ban/:userId', banUser);
router.delete('/groups/:groupId/ban/:userId', unbanUser);

// Media sharing
router.post('/rooms/:roomId/media', upload.array('media', 10), uploadChatMedia);
router.delete('/media/:mediaId', deleteChatMedia);
router.get('/rooms/:roomId/media', getChatMedia);

// Real-time features
router.get('/typing/:roomId', getTypingIndicator);
router.post('/typing/:roomId', setTypingIndicator);
router.get('/online', getOnlineUsers);

// Notifications and read status
router.get('/unread', getUnreadCount);
router.post('/rooms/:roomId/read', markAsRead);
router.get('/notifications/settings', getNotificationSettings);
router.put('/notifications/settings', updateNotificationSettings);

// Chat invites
router.post('/invites', createChatInvite);
router.get('/invites', getChatInvites);
router.post('/invites/:inviteId/respond', respondToChatInvite);

// Premium features
router.post('/rooms/:roomId/polls', premiumUser, createPoll);
router.post('/polls/:pollId/vote', premiumUser, voteInPoll);
router.get('/polls/:pollId/results', premiumUser, getPollResults);

// Video meetings (Premium feature)
router.post('/meetings', premiumUser, scheduleMeeting);
router.get('/meetings', premiumUser, getMeetings);
router.post('/meetings/:meetingId/join', premiumUser, joinMeeting);
router.post('/meetings/:meetingId/end', premiumUser, endMeeting);

// Analytics and data export
router.get('/analytics', premiumUser, getChatAnalytics);
router.get('/export/:roomId', exportChatData);

export default router;