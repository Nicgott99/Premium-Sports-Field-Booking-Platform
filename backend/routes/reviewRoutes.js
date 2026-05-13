/**
 * Review Routes - Field Rating & Review API Endpoints
 * User reviews, ratings, moderation, and helpful voting system
 * 
 * Public Routes (No Auth):
 * GET / - Get field reviews
 * GET /:id - Get specific review
 * GET /stats/:fieldId - Field rating statistics
 * 
 * Protected Routes (Authentication):
 * POST / - Submit new review
 * PUT /:id - Edit review (30-day window)
 * DELETE /:id - Delete review (60-day window)
 * POST /:id/helpful - Mark as helpful
 * POST /:id/unhelpful - Mark as unhelpful
 * POST /:id/report - Report inappropriate review
 * POST /:id/response - Owner responds to review
 * 
 * Submit Review:
 * - POST /
 * - Body: { fieldId, rating: 4.5, title, content, images: [...] }
 * - Response: { reviewId, status: "pending_approval" }
 * - Status: 201 Created
 * - Validation: Verified booking, one per user per field
 * - Moderation: Admin approval workflow
 * 
 * Get Field Reviews:
 * - GET /?fieldId=X&sort=helpful&filter=rating&page=1
 * - Response: { reviews: [...], averageRating, distribution, total }
 * - Status: 200 OK
 * - Filters: Rating (1-5), verified only, helpful threshold
 * - Sort: newest, oldest, helpful, rating high/low
 * - Pagination: page, limit (max 50)
 * - Cache: 10 minutes
 * 
 * Get Review Details:
 * - GET /:id
 * - Response: { review: { id, user, rating, content, images, helpful, verified } }
 * - Status: 200 OK
 * - Includes: User info (limited), helpful count, responses
 * 
 * Update Review:
 * - PUT /:id
 * - Body: { rating, title, content, images }
 * - Response: { review, updated: true }
 * - Status: 200 OK
 * - Constraint: Within 30 days of posting
 * - History: Track changes
 * - Notification: Owner notified of edit
 * 
 * Delete Review:
 * - DELETE /:id
 * - Response: { success: true, deleted: true }
 * - Status: 200 OK
 * - Constraint: Within 60 days of posting
 * - After window: Cannot delete (stays visible)
 * - Soft delete: Preserve edit history
 * 
 * Helpful Voting:
 * - POST /:id/helpful
 * - Response: { helpful: totalCount, helpful%: percentage }
 * - Status: 200 OK
 * - One vote per user per review
 * - Vote counts tracked
 * 
 * Rating System:
 * - Stars: 1.0 to 5.0 (0.5 increments)
 * - Categories: quality, cleanliness, service, value, location
 * - Weighted average: Calculated from all reviews
 * - Distribution: 5-star breakdown
 * - Verified badge: Only verified bookers
 * 
 * Review Content:
 * - Title: Max 100 characters
 * - Body: Max 2000 characters
 * - Photos: Up to 5 images per review (5MB each)
 * - Anonymous: Option to hide name
 * - Edit window: 30 days after posting
 * - Delete window: 60 days after posting
 * 
 * Moderation:
 * - Flag reviews: Report inappropriate
 * - Spam detection: Auto-flagging
 * - Profanity filtering: Content check
 * - Manual approval: Admin review
 * - Removal: Delete flagged reviews
 * 
 * Report Review:
 * - POST /:id/report
 * - Body: { reason: "spam|offensive|irrelevant", details }
 * - Response: { reported: true, caseId }
 * - Status: 200 OK
 * - Notification: Sent to mods
 * 
 * Owner Response:
 * - POST /:id/response
 * - Body: { content, images: [] }
 * - Response: { response: {...} }
 * - Status: 201 Created
 * - Limit: Max 500 characters
 * - Edit window: 24 hours
 * - Visible to reviewers
 * 
 * Rating Statistics:
 * - GET /stats/:fieldId
 * - Response: { averageRating, total, distribution: {1: count, 2: count, ...}, trend }
 * - Status: 200 OK
 * - Time period analysis
 * - Badge eligibility
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, rating out of range
 * - 401: Unauthorized user
 * - 403: Forbidden, not verified booker
 * - 404: Review/field not found
 * - 409: Duplicate review, edit window expired
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Verification:
 * - Only verified bookers can review
 * - One review per field per user
 * - Booking must be completed
 * - Auto-verification after booking finish
 * 
 * Badges:
 * - Gold: 4.8+ rating, 50+ reviews
 * - Silver: 4.5+ rating, 20+ reviews
 * - Bronze: 4.0+ rating, 10+ reviews
 * 
 * Rate Limiting:
 * - Submit review: 10 per day per user
 * - Helpful votes: 50 per hour
 * - Reports: 5 per day per user
 * - Get reviews: 100 per hour
 * 
 * Caching:
 * - Field average rating: 1 hour
 * - Review list: 10 minutes
 * - Statistics: 1 hour
 */
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