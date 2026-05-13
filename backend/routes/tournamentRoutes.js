/**
 * Tournament Routes - Sports Tournament Management API
 * Tournament creation, registration, bracket generation, and results management
 * 
 * Public Routes (No Auth):
 * GET / - Search tournaments
 * GET /:id - Get tournament details
 * GET /:id/bracket - Get tournament bracket
 * GET /:id/standings - Get current standings
 * 
 * Protected Routes (Authentication):
 * POST / - Create tournament (organizer)
 * PUT /:id - Update tournament (organizer)
 * DELETE /:id - Cancel tournament (organizer)
 * POST /:id/teams - Register team
 * DELETE /:id/teams/:teamId - Unregister team
 * POST /:id/bracket - Generate bracket (organizer)
 * POST /:id/matches/:matchId/result - Record result (organizer)
 * 
 * Create Tournament:
 * - POST /
 * - Body: { name, sport, format, startDate, endDate, location, entryFee, maxTeams }
 * - Response: { tournamentId, status: "draft" }
 * - Status: 201 Created
 * - Auth: Any user (becomes organizer)
 * 
 * Get Tournaments:
 * - GET /?sport=football&status=active&sort=startDate&page=1
 * - Response: { tournaments: [...], total, page, limit }
 * - Status: 200 OK
 * - Filters: sport, status, date range, location
 * - Sort: startDate, endDate, participants, popularity
 * - Pagination: page, limit (max 50)
 * - Cache: 5 minutes
 * 
 * Get Tournament Details:
 * - GET /:id
 * - Response: { tournament: { id, name, sport, format, dates, location, teams, matches } }
 * - Status: 200 OK
 * - Includes: Registered teams, bracket, standings
 * - Cache: 10 minutes
 * 
 * Update Tournament:
 * - PUT /:id
 * - Body: { name, description, startDate, endDate, entryFee }
 * - Response: { tournament: {...} }
 * - Status: 200 OK
 * - Auth: Organizer only
 * - Constraints: Cannot modify after registration starts
 * 
 * Delete/Cancel Tournament:
 * - DELETE /:id
 * - Response: { canceled: true, refunds: {...} }
 * - Status: 200 OK
 * - Auth: Organizer or admin
 * - Refund: Full refund to all teams
 * 
 * Register Team:
 * - POST /:id/teams
 * - Body: { teamId, roster: [{userId, name, position}, ...] }
 * - Response: { registered: true, confirmationId }
 * - Status: 201 Created
 * - Validation: Team size check, fee payment
 * - Notification: Registration confirmation
 * 
 * Unregister Team:
 * - DELETE /:id/teams/:teamId
 * - Response: { unregistered: true, refund }
 * - Status: 200 OK
 * - Constraints: Before bracket generation
 * - Refund: Depends on policy
 * 
 * Tournament Formats:
 * - Round Robin: Each team plays every other team
 * - Knockout: Single elimination with seeding
 * - Group Stage: Groups + knockout finals
 * - League: Points-based seasonal tournament
 * 
 * Generate Bracket:
 * - POST /:id/bracket
 * - Body: { seeding: [teamId, ...] }
 * - Response: { bracket: {...}, matches: [...] }
 * - Status: 201 Created
 * - Auth: Organizer only
 * - Constraints: After registration closes
 * 
 * Get Bracket:
 * - GET /:id/bracket
 * - Response: { bracket: {...}, matches: [...], byeTeams: [...] }
 * - Status: 200 OK
 * - Visual representation of bracket
 * - Match schedule
 * 
 * Record Match Result:
 * - POST /:id/matches/:matchId/result
 * - Body: { team1Score, team2Score, winner, penalties }
 * - Response: { match: {...}, standings: [...] }
 * - Status: 200 OK
 * - Auth: Organizer only
 * - Updates: Standings, points, rankings
 * 
 * Get Standings:
 * - GET /:id/standings?sort=points
 * - Response: { standings: [{rank, team, points, wins, losses, gd}, ...] }
 * - Status: 200 OK
 * - Points: Win=3, Draw=1, Loss=0
 * - Tiebreaker rules applied
 * - Live updates
 * 
 * Tournament Status Lifecycle:
 * - draft: Initial setup
 * - registration_open: Teams registering
 * - registration_closed: Cutoff reached
 * - scheduled: Bracket ready
 * - in_progress: Matches underway
 * - completed: All done
 * - cancelled: Tournament cancelled
 * 
 * Tournament Details:
 * - Name, description, rules
 * - Sport type, format
 * - Dates: Start, end, registration deadline
 * - Location: City, venue
 * - Entry fee, prize pool
 * - Max/min teams, team size
 * 
 * Match Management:
 * - Schedule matches with date/time
 * - Assign venue/field
 * - Record scores
 * - Handle penalties
 * - Update standings
 * 
 * Awards & Prizes:
 * - Championship: 1st place
 * - Runner-up: 2nd place
 * - Third place: 3rd place
 * - Best offense, defense, MVP
 * - Prize distribution: % to places
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, invalid format
 * - 401: Unauthorized user
 * - 403: Forbidden, not organizer
 * - 404: Tournament/team not found
 * - 409: Conflict, tournament full, already registered
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Rate Limiting:
 * - Create tournament: 10 per day per user
 * - Register team: 50 per hour
 * - Record results: 100 per hour
 * - Get tournaments: 100 per hour
 * 
 * Caching:
 * - Tournament list: 5 minutes
 * - Bracket/standings: 2 minutes
 * - Tournament details: 10 minutes
 * - Match schedule: 10 minutes
 */
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  registerForTournament,
  getTournamentParticipants,
  generateTournamentBracket,
  updateMatchResult,
  getTournamentLeaderboard
} from '../controllers/tournamentController.js';

import { protect, admin, manager } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   GET /api/tournaments
 * @desc    Get all tournaments with pagination and filtering
 * @access  Public
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Results per page (default: 10)
 * @query   {string} status - Filter by tournament status (upcoming, ongoing, completed)
 * @query   {string} sport - Filter by sport type
 * @return  {Object} Paginated list of tournaments
 */
router.get('/', getTournaments);

/**
 * @route   GET /api/tournaments/:id
 * @desc    Get specific tournament details
 * @access  Public
 * @param   {string} id - Tournament ID
 * @return  {Object} Tournament details with full information
 */
router.get('/:id', getTournamentById);

/**
 * @route   GET /api/tournaments/:id/participants
 * @desc    Get list of registered participants
 * @access  Public
 * @param   {string} id - Tournament ID
 * @return  {Array} Array of registered teams/players
 */
router.get('/:id/participants', getTournamentParticipants);

/**
 * @route   GET /api/tournaments/:id/bracket
 * @desc    Generate and retrieve tournament bracket
 * @access  Public
 * @param   {string} id - Tournament ID
 * @return  {Object} Tournament bracket with matches and structure
 */
router.get('/:id/bracket', generateTournamentBracket);

/**
 * @route   GET /api/tournaments/:id/leaderboard
 * @desc    Get tournament leaderboard/standings
 * @access  Public
 * @param   {string} id - Tournament ID
 * @return  {Array} Sorted participants by points and performance
 */
router.get('/:id/leaderboard', getTournamentLeaderboard);

// Protected routes - require authentication
router.use(protect);

/**
 * @route   POST /api/tournaments/:id/register
 * @desc    Register team/player for tournament
 * @access  Private
 * @param   {string} id - Tournament ID
 * @body    {string} teamId - Team ID registering (if team participation)
 * @return  {Object} Registration confirmation
 */
router.post('/:id/register', registerForTournament);

/**
 * @route   PUT /api/tournaments/:id/match/:matchId
 * @desc    Update match result (score, winner)
 * @access  Private
 * @param   {string} id - Tournament ID
 * @param   {string} matchId - Match ID
 * @body    {Object} Match result data (score, winner, etc.)
 * @return  {Object} Updated match data
 */
router.put('/:id/match/:matchId', updateMatchResult);

// Tournament management routes - require manager/admin access
/**
 * @route   POST /api/tournaments
 * @desc    Create new tournament
 * @access  Private/Manager
 * @body    {Object} Tournament data (name, sport, format, dates, etc.)
 * @return  {Object} Created tournament with ID
 */
router.post('/', manager, createTournament);

/**
 * @route   PUT /api/tournaments/:id
 * @desc    Update tournament information
 * @access  Private/Manager
 * @param   {string} id - Tournament ID
 * @body    {Object} Updated tournament data
 * @return  {Object} Updated tournament
 */
router.put('/:id', manager, updateTournament);

/**
 * @route   DELETE /api/tournaments/:id
 * @desc    Delete tournament
 * @access  Private/Manager
 * @param   {string} id - Tournament ID
 * @return  {Object} Deletion confirmation
 */
router.delete('/:id', manager, deleteTournament);

// Match management by tournament managers
/**
 * @route   PUT /api/tournaments/match/:matchId
 * @desc    Update match result (legacy route)
 * @access  Private/Manager
 * @param   {string} matchId - Match ID
 * @body    {Object} Match result data
 * @return  {Object} Updated match
 */
router.put('/match/:matchId', manager, updateMatchResult);

export default router;