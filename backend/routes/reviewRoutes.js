import express from 'express';
import {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getFieldReviews,
  getUserReviews,
  likeReview,
  unlikeReview,
  reportReview,
  respondToReview,
  getReviewStats,
  moderateReview,
  getTopReviews,
  getReviewsByRating
} from '../controllers/reviewController.js';

import { protect, admin, manager, fieldOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/field/:fieldId', getFieldReviews);
router.get('/top', getTopReviews);
router.get('/rating/:rating', getReviewsByRating);

// Protected routes
router.use(protect);

// User review routes
router.get('/', getUserReviews);
router.post('/', createReview);
router.get('/:id', getReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// Review interactions
router.post('/:id/like', likeReview);
router.delete('/:id/like', unlikeReview);
router.post('/:id/report', reportReview);

// Field owner responses
router.post('/:id/respond', fieldOwner, respondToReview);

// Manager/Admin routes
router.get('/stats/field/:fieldId', manager, getReviewStats);
router.put('/:id/moderate', admin, moderateReview);

export default router;