import express from 'express';
import {
  createTeam,
  getUserTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  inviteToTeam,
  acceptTeamInvite,
  getTeamMembers
} from '../controllers/teamController.js';

import { protect, admin, manager, premiumUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.get('/:id', cache(300), getTeamById);
router.get('/:id/members', getTeamMembers);

// Protected routes
router.use(protect);

// Team management
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

// Team membership
router.post('/:id/join', joinTeam);
router.post('/:id/leave', leaveTeam);
router.post('/:id/invite', inviteToTeam);
router.post('/:id/accept-invite', acceptTeamInvite);

// Get user's teams
router.get('/', getUserTeams);

export default router;

// Team analytics and data
router.get('/:id/analytics', premiumUser, getTeamAnalytics);
router.get('/:id/export', exportTeamData);

// Team settings
router.put('/:id/privacy', updateTeamPrivacy);

// Reporting
router.post('/:id/report', reportTeam);

export default router;