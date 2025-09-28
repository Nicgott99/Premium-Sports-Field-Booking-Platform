import express from 'express';
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  inviteToTeam,
  removeFromTeam,
  updateMemberRole,
  getTeamMembers,
  getTeamBookings,
  getTeamStats,
  searchTeams,
  getNearbyTeams,
  followTeam,
  unfollowTeam,
  getTeamFollowers,
  uploadTeamLogo,
  deleteTeamLogo,
  createTeamEvent,
  getTeamEvents,
  updateTeamEvent,
  deleteTeamEvent,
  getTeamAnalytics,
  exportTeamData,
  transferTeamOwnership,
  disbandTeam,
  reportTeam,
  getTeamInvitations,
  respondToInvitation,
  createTeamTournament,
  getTeamTournaments,
  getTeamAchievements,
  updateTeamPrivacy,
  bulkInviteMembers,
  getTeamLeaderboard,
  getTeamHistory
} from '../controllers/teamController.js';

import { protect, admin, manager, premiumUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware(300), getTeams);
router.get('/search', cacheMiddleware(300), searchTeams);
router.get('/nearby', cacheMiddleware(300), getNearbyTeams);
router.get('/leaderboard', cacheMiddleware(600), getTeamLeaderboard);
router.get('/:id', cacheMiddleware(300), getTeam);
router.get('/:id/members', getTeamMembers);
router.get('/:id/stats', getTeamStats);
router.get('/:id/achievements', getTeamAchievements);

// Protected routes
router.use(protect);

// Team management
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/disband', disbandTeam);
router.post('/:id/transfer-ownership', transferTeamOwnership);

// Team membership
router.post('/:id/join', joinTeam);
router.post('/:id/leave', leaveTeam);
router.post('/:id/invite', inviteToTeam);
router.post('/:id/remove/:memberId', removeFromTeam);
router.put('/:id/members/:memberId/role', updateMemberRole);
router.post('/:id/bulk-invite', premiumUser, bulkInviteMembers);

// Team invitations
router.get('/invitations/received', getTeamInvitations);
router.post('/invitations/:invitationId/respond', respondToInvitation);

// Team media
router.post('/:id/logo', upload.single('logo'), uploadTeamLogo);
router.delete('/:id/logo', deleteTeamLogo);

// Team activities
router.get('/:id/bookings', getTeamBookings);
router.get('/:id/history', getTeamHistory);

// Team events
router.post('/:id/events', createTeamEvent);
router.get('/:id/events', getTeamEvents);
router.put('/:id/events/:eventId', updateTeamEvent);
router.delete('/:id/events/:eventId', deleteTeamEvent);

// Team tournaments
router.post('/:id/tournaments', premiumUser, createTeamTournament);
router.get('/:id/tournaments', getTeamTournaments);

// Social features
router.post('/:id/follow', followTeam);
router.delete('/:id/follow', unfollowTeam);
router.get('/:id/followers', getTeamFollowers);

// Team analytics and data
router.get('/:id/analytics', premiumUser, getTeamAnalytics);
router.get('/:id/export', exportTeamData);

// Team settings
router.put('/:id/privacy', updateTeamPrivacy);

// Reporting
router.post('/:id/report', reportTeam);

export default router;