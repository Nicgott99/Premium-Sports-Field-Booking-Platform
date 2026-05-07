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

const router = express.Router();

// Public routes
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.get('/:id/participants', getTournamentParticipants);
router.get('/:id/bracket', generateTournamentBracket);
router.get('/:id/leaderboard', getTournamentLeaderboard);

// Protected routes
router.use(protect);

// User tournament routes
router.post('/:id/register', registerForTournament);
router.put('/:id/match/:matchId', updateMatchResult);

// Tournament management (admin/manager)
router.post('/', manager, createTournament);
router.put('/:id', manager, updateTournament);
router.delete('/:id', manager, deleteTournament);

// Match management
router.put('/match/:matchId', manager, updateMatchResult);

export default router;