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

/**
 * Review Routes API Documentation
 * 
 * Public Routes (no authentication required):
 * GET /field/:fieldId - Get all reviews for specific field
 * 
 * Protected Routes (require authentication):
 * GET / - Get reviews created by authenticated user
 * POST / - Create new review for field
 * PUT /:id - Update review created by user
 * DELETE /:id - Delete review created by user
 * POST /:id/like - Mark review as helpful/like it
 * POST /:id/report - Report inappropriate review
 * 
 * Manager Routes (require manager/admin auth):
 * GET /stats/:fieldId - Get review statistics for field
 * 
 * Review Structure:
 * {
 *   _id: ObjectId,
 *   user: ObjectId,
 *   field: ObjectId,
 *   rating: Number (1-5),
 *   title: String,
 *   content: String,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { reviews: [...] } or { review: {...} }
 * }
 * 
 * Error Responses:
 * 400 - Invalid review data
 * 401 - Unauthorized access
 * 404 - Review or field not found
 * 409 - Duplicate review (user already reviewed this field)
 * 500 - Server error
 */

// Public routes
/**
 * @route GET /api/reviews/field/:fieldId
 * @desc Get all reviews for specific field (paginated)
 * @access Public
 * @query page - Page number
 * @query limit - Results per page
 * @query sortBy - Sort by (recent, helpful, rating)
 */
router.get('/field/:fieldId', getFieldReviews);

// Protected routes
router.use(protect);

/**
 * @route GET /api/reviews
 * @desc Get reviews created by authenticated user
 * @access Private
 */
router.get('/', getUserReviews);

/**
 * @route POST /api/reviews
 * @desc Create new review for field
 * @access Private
 * @body rating, title, content, fieldId
 */
router.post('/', createReview);

/**
 * @route PUT /api/reviews/:id
 * @desc Update review created by user
 * @access Private
 * @param id - Review ID
 */
router.put('/:id', updateReview);

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete review created by user
 * @access Private
 * @param id - Review ID
 */
router.delete('/:id', deleteReview);

/**
 * @route POST /api/reviews/:id/like
 * @desc Mark review as helpful/like
 * @access Private
 * @param id - Review ID
 */
router.post('/:id/like', likeReview);

/**
 * @route POST /api/reviews/:id/report
 * @desc Report inappropriate review
 * @access Private
 * @param id - Review ID
 */
router.post('/:id/report', reportReview);

/**
 * @route GET /api/reviews/stats/:fieldId
 * @desc Get review statistics for field (admin only)
 * @access Private/Manager
 * @param fieldId - Field ID for statistics
 */
router.get('/stats/:fieldId', manager, getReviewStats);

export default router;