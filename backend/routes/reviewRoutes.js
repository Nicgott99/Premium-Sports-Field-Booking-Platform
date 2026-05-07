import express from 'express';
import {
  createReview,
  getFieldReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  likeReview,
  reportReview,
  getReviewStats
} from '../controllers/reviewController.js';

import { protect, admin, manager, fieldOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/field/:fieldId', getFieldReviews);

// Protected routes
router.use(protect);

// User review routes
router.get('/', getUserReviews);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// Review interactions
router.post('/:id/like', likeReview);
router.post('/:id/report', reportReview);

// Manager/Admin routes
router.get('/stats/:fieldId', manager, getReviewStats);

export default router;