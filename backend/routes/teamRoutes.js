/**
 * Team Routes - Team Organization & Management API
 * Team creation, membership, statistics, and organizational features
 * 
 * Public Routes (No Auth):
 * GET / - Search teams
 * GET /:id - Get team details
 * GET /:id/members - Get team members
 * GET /:id/stats - Get team statistics
 * 
 * Protected Routes (Authentication):
 * POST / - Create new team
 * PUT /:id - Update team info (captain/admin)
 * DELETE /:id - Delete team (captain only)
 * POST /:id/invite - Invite player
 * POST /:id/members/:userId/accept - Accept invite
 * DELETE /:id/members/:userId - Remove member
 * PUT /:id/members/:userId/role - Update role
 * 
 * Create Team:
 * - POST /
 * - Body: { name, sport, skillLevel, description, logo, maxSize }
 * - Response: { teamId, createdAt, captain }
 * - Status: 201 Created
 * - Auth: Any user can create
 * - Creator: Auto-captain
 * 
 * Get Teams:
 * - GET /?sport=football&skill=intermediate&sort=members
 * - Response: { teams: [...], total, page }
 * - Status: 200 OK
 * - Filters: sport, skill level, size, joinable
 * - Sort: members, rating, activity, created
 * - Pagination: page, limit
 * 
 * Get Team Details:
 * - GET /:id
 * - Response: { team: { id, name, sport, members, stats, logo, captain } }
 * - Status: 200 OK
 * - Includes: Member list, statistics, upcoming bookings
 * - Cache: 10 minutes
 * 
 * Update Team:
 * - PUT /:id
 * - Body: { name, description, logo, maxSize, skillLevel }
 * - Response: { team: {...} }
 * - Status: 200 OK
 * - Auth: Captain or co-captain
 * 
 * Delete Team:
 * - DELETE /:id
 * - Response: { success: true, deleted }
 * - Status: 200 OK
 * - Auth: Captain only
 * - Notifications: Members notified
 * 
 * Member Management:
 * - POST /:id/invite: Send invitation
 * - Body: { userId or email, role: "player|substitute" }
 * - Response: { inviteId, status: "pending" }
 * - Status: 201 Created
 * - Notification: Invite email sent
 * 
 * Accept Invitation:
 * - POST /:id/members/:userId/accept
 * - Response: { member: {...}, joined: true }
 * - Status: 200 OK
 * - User added to team
 * - Notification: Captain notified
 * 
 * Remove Member:
 * - DELETE /:id/members/:userId
 * - Response: { removed: true, reason }
 * - Status: 200 OK
 * - Auth: Captain or user themselves
 * - Notification: Member notified
 * 
 * Update Member Role:
 * - PUT /:id/members/:userId/role
 * - Body: { role: "captain|co-captain|player|substitute" }
 * - Response: { member: {...}, roleUpdated }
 * - Status: 200 OK
 * - Auth: Captain only
 * 
 * Team Roles:
 * - Captain: Full permissions, team owner
 * - Co-captain: Admin permissions
 * - Player: Regular member
 * - Substitute: Backup player
 * 
 * Team Statistics:
 * - GET /:id/stats
 * - Response: { wins, losses, draws, points, ranking, memberCount }
 * - Status: 200 OK
 * - Performance metrics
 * - Engagement scores
 * 
 * Team Features:
 * - Membership levels: Free, premium membership
 * - Skill levels: Beginner, intermediate, advanced, professional
 * - Size: Small (5-10), medium (11-20), large (21+)
 * - Privacy: Public, private, hidden
 * - Joinable: Open to requests, invite only
 * 
 * Team Activities:
 * - Field bookings: Practice and match reservations
 * - Tournament participation: Enrollment and results
 * - Team chat: Communication and coordination
 * - Match scheduling: Calendar management
 * - Member profiles: Player information
 * 
 * Team Governance:
 * - Rules: Code of conduct
 * - Fees: Membership dues
 * - Discipline: Warnings, suspensions
 * - Disputes: Conflict resolution
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, team already exists
 * - 401: Unauthorized user
 * - 403: Forbidden, not captain
 * - 404: Team/member not found
 * - 409: Conflict, duplicate member
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Member Statuses:
 * - invited: Pending response
 * - active: Current member
 * - inactive: Inactive status
 * - left: Member departed
 * - removed: Kicked
 * - banned: Permanently excluded
 * 
 * Rate Limiting:
 * - Create team: 5 per day per user
 * - Invite member: 20 per hour
 * - Search teams: 100 per hour
 * - Updates: 50 per day
 * 
 * Caching:
 * - Team details: 10 minutes
 * - Member list: 5 minutes
 * - Statistics: 15 minutes
 */
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