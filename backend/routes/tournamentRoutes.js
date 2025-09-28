import express from 'express';
import {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  joinTournament,
  leaveTournament,
  getTournamentParticipants,
  getTournamentMatches,
  createMatch,
  updateMatch,
  updateTournamentStandings,
  getTournamentStandings,
  generateTournamentBracket,
  getTournamentStats,
  searchTournaments,
  getUpcomingTournaments,
  getPastTournaments,
  getUserTournaments
} from '../controllers/tournamentController.js';

import { protect, admin, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getTournaments);
router.get('/upcoming', getUpcomingTournaments);
router.get('/past', getPastTournaments);
router.get('/search', searchTournaments);
router.get('/:id', getTournament);
router.get('/:id/participants', getTournamentParticipants);
router.get('/:id/matches', getTournamentMatches);
router.get('/:id/standings', getTournamentStandings);
router.get('/:id/bracket', generateTournamentBracket);

// Protected routes
router.use(protect);

// User tournament routes
router.get('/my/tournaments', getUserTournaments);
router.post('/:id/join', joinTournament);
router.delete('/:id/leave', leaveTournament);

// Tournament management (admin/manager)
router.post('/', manager, createTournament);
router.put('/:id', manager, updateTournament);
router.delete('/:id', manager, deleteTournament);

// Match management
router.post('/:id/matches', manager, createMatch);
router.put('/:id/matches/:matchId', manager, updateMatch);
router.put('/:id/standings', manager, updateTournamentStandings);

// Statistics
router.get('/:id/stats', manager, getTournamentStats);

export default router;