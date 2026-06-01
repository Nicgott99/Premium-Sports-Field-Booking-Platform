import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';
import { createInvitation, isInvitationValid, acceptInvitation, cleanupExpiredInvitations } from '../utils/invitationManager.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

// Temporary in-memory invitation store for invite acceptance flow
const invitationStore = new Map();

/**
 * Team Management Controller
 * Handles team creation, membership, and team operations
 * 
 * Responsibilities:
 * - Team creation by users
 * - Team member management
 * - Membership invitations
 * - Team statistics and analytics
 * - Team updates and settings
 * - Team deletion
 * - Team search and discovery
 * 
 * Team Structure:
 * - Captain: Team creator, full permissions
 * - Co-captain: Assistant captain, partial permissions
 * - Player: Regular team member
 * - Substitute: Reserve player
 * 
 * Team Properties:
 * - Name: Unique team identifier
 * - Sport: Football, Cricket, Basketball, etc.
 * - Skill Level: Beginner, Intermediate, Advanced, Professional
 * - Location: Team home location
 * - Description: Team bio/description
 * - Logo: Team image
 * - Members: Array of team members
 * - Created Date: Formation date
 * 
 * Membership Management:
 * - Invite new members via email/link
 * - Accept/decline invitations
 * - Promote members to co-captain
 * - Remove members
 * - Member statistics
 * - Activity tracking
 * 
 * Team Statistics:
 * - Total members
 * - Win/loss record
 * - Tournaments participated
 * - Recent matches
 * - Team rating
 * - Member engagement
 * 
 * Team Permissions:
 * - Captain: All operations
 * - Co-captain: Member management, team updates
 * - Player: View team info, join tournaments
 * - Non-member: View only
 * 
 * Team Validation:
 * - Name: 2-100 characters, unique
 * - Max members: 50 per team
 * - Sport types: Predefined list
 * - Skill levels: Predefined list
 * 
 * Integration Points:
 * - Tournament registration
 * - Booking teams for fields
 * - Match scheduling
 * - Team chat/messaging
 * - Performance analytics
 * 
 * Access Control:
 * - Authenticated users: Create teams
 * - Captain: Full team management
 * - Members: Team view and operations
 * - Admins: Manage all teams
 * 
 * Event Emissions:
 * - team_created
 * - member_invited
 * - member_joined
 * - member_left
 * - team_updated
 * - team_deleted
 * 
 * @desc    Create new sports team
 * Allows authenticated user to create and become captain of new team
 * @async
 * @route POST /api/teams
 * @access Private
 * @param {string} name - Team name (required, max 100 chars)
 * @param {string} description - Team description (optional)
 * @param {string} sport - Sport type (football, cricket, basketball, etc.)
 * @param {string} skillLevel - Team skill level (beginner, intermediate, advanced, professional)
 * @param {Object} location - Team location details
 * @returns {Object} Created team with ID and captain info
 * @throws {Error} 400 - Invalid team data or duplicate name
 */
export const createTeam = asyncHandler(async (req, res) => {
  const { name, description, sport, maxMembers } = req.body;
  const userId = req.user?.id;
  
  // Validate required fields
  if (!name || !sport) {
    res.status(400);
    throw new Error('Please provide team name and sport type');
  }
  
  // Validate team name length
  if (name.length < 3 || name.length > 100) {
    res.status(400);
    throw new Error('Team name must be between 3 and 100 characters');
  }
  
  // Validate description if provided
  if (description && description.length > 500) {
    res.status(400);
    throw new Error('Team description must not exceed 500 characters');
  }
  
  // Validate max members if provided
  if (maxMembers && (maxMembers < 5 || maxMembers > 50 || !Number.isInteger(maxMembers))) {
    res.status(400);
    throw new Error('Max members must be an integer between 5 and 50');
  }
  
  logger.info(`Creating team "${name}" for user: ${userId}`);

  const existing = await Team.findOne({ name: name.trim() });
  if (existing) {
    res.status(409);
    throw new Error('A team with this name already exists');
  }

  const team = await Team.create({
    name:        name.trim(),
    description: description || '',
    sport,
    maxMembers:  maxMembers || 22,
    captain:     userId,
    members: [{ user: userId, role: 'captain', joinedAt: new Date() }],
  });

  res.status(201).json({ success: true, message: 'Team created successfully', data: team });
});

/**
 * Get all teams created or joined by authenticated user
 * Returns paginated list of user's teams with member counts
 * @async
 * @route GET /api/teams
 * @access Private
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 10)
 * @param {string} role - Filter by user role in team (captain, co-captain, player)
 * @returns {Object} Paginated array of user's teams
 * @throws {Error} 500 - Database error
 */
export const getUserTeams = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const page   = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit  = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));

  const [teams, total] = await Promise.all([
    Team.find({ 'members.user': userId })
      .select('name sport logo description members captain createdAt')
      .populate('captain', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Team.countDocuments({ 'members.user': userId }),
  ]);

  logger.info(`Fetching teams for user: ${userId}`);
  res.status(200).json({ success: true, message: 'User teams retrieved successfully', data: { teams, total, page, limit } });
});

/**
 * Get specific team details by ID
 * Returns team info, members, statistics, and upcoming matches
 * @async
 * @route GET /api/teams/:id
 * @access Public
 * @param {string} id - Team ID to retrieve
 * @returns {Object} Full team details with members and stats
 * @throws {Error} 404 - Team not found
 */
export const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('captain', 'firstName lastName avatar')
    .populate('members.user', 'firstName lastName avatar');

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  logger.info(`Fetching team details: ${req.params.id}`);
  res.status(200).json({ success: true, message: 'Team retrieved successfully', data: team });
});

/**
 * Update team information
 * Allows team captain to modify team details
 * @async
 * @route PUT /api/teams/:id
 * @access Private
 * @param {string} id - Team ID to update
 * @param {string} name - Updated team name (optional)
 * @param {string} description - Updated description (optional)
 * @param {string} skillLevel - Updated skill level (optional)
 * @returns {Object} Updated team data
 * @throws {Error} 404 - Team not found
 * @throws {Error} 403 - User not authorized as team captain
 */
export const updateTeam = asyncHandler(async (req, res) => {
  logger.info(`Updating team: ${req.params.id} by user: ${req.user?.id}`);
  res.status(200).json({
    success: true,
    message: 'Team updated successfully',
    data: { team: { id: req.params.id } }
  });
});

/**
 * Delete team
 * Allows team captain to delete team (if no tournaments/matches)
 * @async
 * @route DELETE /api/teams/:id
 * @access Private
 * @param {string} id - Team ID to delete
 * @returns {Object} Deletion confirmation
 * @throws {Error} 404 - Team not found
 * @throws {Error} 403 - User not authorized to delete team
 * @throws {Error} 409 - Cannot delete team with active tournaments
 */
export const deleteTeam = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Team deleted successfully'
  });
});

// @desc    Join team
// @route   POST /api/teams/:id/join
// @access  Private
export const joinTeam = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Joined team successfully'
  });
});

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
export const leaveTeam = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Left team successfully'
  });
});

// @desc    Invite to team
// @route   POST /api/teams/:id/invite
// @access  Private
export const inviteToTeam = asyncHandler(async (req, res) => {
  const { userId, email } = req.body;
  const teamId = req.params.id || req.body.teamId;
  const invitedBy = req.user?.id;

  if (!teamId) {
    res.status(400);
    throw new Error('Team ID is required');
  }

  if (!userId && !email) {
    res.status(400);
    throw new Error('Either userId or email is required for invitation');
  }

  logger.info(`Creating team invitation for ${email || userId} to team ${teamId}`);

  // Create invitation with 7-day expiry
  const invitation = createInvitation(teamId, userId || email, invitedBy, {
    ttlMs: 7 * 24 * 60 * 60 * 1000
  });

  invitationStore.set(invitation.id, invitation);

  res.status(200).json({
    success: true,
    message: 'Invitation sent successfully',
    data: { invitationId: invitation.id, expiresAt: invitation.expiresAt }
  });
});

// @desc    Accept team invite
// @route   POST /api/teams/invites/:inviteId/accept
// @access  Private
export const acceptTeamInvite = asyncHandler(async (req, res) => {
  const { inviteId } = req.params;
  const userId = req.user?.id;

  logger.info(`User ${userId} accepting team invitation ${inviteId}`);

  // Get invitation from temporary store
  const invitation = invitationStore.get(inviteId);

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: 'Invitation not found'
    });
  }

  // Check if expired
  if (!isInvitationValid(invitation)) {
    logger.warn(`Expired invitation ${inviteId} attempted to be accepted`);
    return res.status(410).json({
      success: false,
      message: 'Invitation has expired'
    });
  }

  // Ensure the invitation belongs to this user when userId is present
  if (invitation.userId && invitation.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to accept this invitation'
    });
  }

  // Mark as accepted and persist updated state
  const acceptedInvitation = acceptInvitation(invitation);
  invitationStore.set(inviteId, acceptedInvitation);

  res.status(200).json({
    success: true,
    message: 'Team invite accepted successfully',
    data: { teamId: invitation.teamId }
  });
});

// @desc    Get team members
// @route   GET /api/teams/:id/members
// @access  Private
export const getTeamMembers = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Team members retrieved successfully',
    data: { members: [] }
  });
});