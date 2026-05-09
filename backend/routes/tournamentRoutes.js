import express from 'express';
import {
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