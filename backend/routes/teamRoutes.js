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

/**
 * Team Routes API Documentation
 * 
 * Public Routes (no authentication required):
 * GET /:id - Get specific team details (cached)
 * GET /:id/members - Get team member list
 * 
 * Protected Routes (require authentication):
 * GET / - Get user's teams
 * POST / - Create new team
 * PUT /:id - Update team information
 * DELETE /:id - Delete team
 * POST /:id/join - Join existing team
 * POST /:id/leave - Leave team
 * POST /:id/invite - Invite user to team
 * POST /:id/accept-invite - Accept team invitation
 * 
 * Premium Routes (require premium subscription):
 * GET /:id/analytics - Get team analytics and statistics
 * GET /:id/export - Export team data
 * 
 * Team Roles:
 * - captain: Team owner, full permissions
 * - co-captain: Assistant manager
 * - player: Regular member
 * - substitute: Bench players
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { team: {...} } or { teams: [...] }
 * }
 * 
 * Error Responses:
 * 400 - Invalid team data
 * 401 - Unauthorized access
 * 403 - Forbidden (not team captain)
 * 404 - Team not found
 * 409 - Cannot perform action (duplicate, active tournaments, etc.)
 * 500 - Server error
 */

// Public routes - cached for performance
/**
 * @route GET /api/teams/:id
 * @desc Get team details with members and info
 * @access Public
 * @cache 300 seconds
 */
router.get('/:id', cache(300), getTeamById);

/**
 * @route GET /api/teams/:id/members
 * @desc Get list of team members with roles
 * @access Public
 */
router.get('/:id/members', getTeamMembers);

// Protected routes
router.use(protect);

/**
 * @route POST /api/teams
 * @desc Create new team
 * @access Private
 * @body name, description, sport, skillLevel
 */
router.post('/', createTeam);

/**
 * @route PUT /api/teams/:id
 * @desc Update team information
 * @access Private (captain only)
 * @param id - Team ID
 */
router.put('/:id', updateTeam);

/**
 * @route DELETE /api/teams/:id
 * @desc Delete team
 * @access Private (captain only)
 * @param id - Team ID
 */
router.delete('/:id', deleteTeam);

/**
 * @route POST /api/teams/:id/join
 * @desc Join existing team
 * @access Private
 * @param id - Team ID to join
 */
router.post('/:id/join', joinTeam);

/**
 * @route POST /api/teams/:id/leave
 * @desc Leave team
 * @access Private
 * @param id - Team ID to leave
 */
router.post('/:id/leave', leaveTeam);

/**
 * @route POST /api/teams/:id/invite
 * @desc Invite user to team
 * @access Private (captain only)
 * @param id - Team ID
 * @body userId - User to invite
 */
router.post('/:id/invite', inviteToTeam);

/**
 * @route POST /api/teams/:id/accept-invite
 * @desc Accept team invitation
 * @access Private
 * @param id - Team ID invitation
 */
router.post('/:id/accept-invite', acceptTeamInvite);

/**
 * @route GET /api/teams
 * @desc Get authenticated user's teams
 * @access Private
 */
router.get('/', getUserTeams);

/**
 * @route GET /api/teams/:id/analytics
 * @desc Get team analytics (premium only)
 * @access Private/Premium
 * @param id - Team ID
 */
router.get('/:id/analytics', premiumUser, getTeamById);

export default router;