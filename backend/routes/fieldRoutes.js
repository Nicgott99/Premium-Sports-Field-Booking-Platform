import express from 'express';
import {
  getFields,
  getField,
  createField,
  updateField,
  deleteField,
  searchFields,
  getNearbyFields,
  getFeaturedFields,
  getTopRatedFields,
  getFieldsByOwner,
  uploadFieldImages,
  deleteFieldImage,
  updateFieldAvailability,
  getFieldBookings,
  getFieldStats,
  getFieldReviews,
  verifyField,
  reportField,
  addToWishlist,
  removeFromWishlist
} from '../controllers/fieldController.js';

import { protect, admin, manager, fieldOwner } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

/**
 * Field Routes API Documentation
 * 
 * Public Routes (no authentication, cached):
 * GET / - Get all fields with pagination
 * GET /search - Search fields by criteria
 * GET /nearby - Find nearby fields
 * GET /featured - Get featured fields
 * GET /top-rated - Get top-rated fields
 * GET /:id - Get field details
 * GET /:id/reviews - Get field reviews
 * 
 * Protected Routes (require authentication):
 * POST / - Create new field (field owner)
 * PUT /:id - Update field (owner only)
 * DELETE /:id - Delete field (owner only)
 * POST /:id/images - Upload field images (owner only)
 * DELETE /:id/images/:imageId - Delete field image (owner only)
 * PUT /:id/availability - Update availability (owner only)
 * GET /:id/bookings - Get field bookings (owner only)
 * GET /:id/stats - Get field statistics (owner only)
 * POST /:id/report - Report field
 * POST /:id/wishlist - Add to wishlist
 * DELETE /:id/wishlist - Remove from wishlist
 * 
 * Query Parameters:
 * - page: Pagination page
 * - limit: Results per page
 * - sport: Filter by sport
 * - city: Filter by city
 * - priceMin/priceMax: Price range
 * - rating: Minimum rating
 * - search: Search term
 * - sort: Sort by (price, rating, distance)
 * 
 * Cache Duration:
 * - List endpoints: 5 minutes (300s)
 * - Featured/top-rated: 10 minutes (600s)
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { fields: [...] } or { field: {...} }
 * }
 * 
 * Error Responses:
 * 400 - Invalid field data
 * 401 - Unauthorized access
 * 403 - Forbidden (not field owner)
 * 404 - Field not found
 * 500 - Server error
 */

// Public routes (with caching)
/**
 * @route GET /api/fields
 * @desc Get all fields with pagination and filtering
 * @access Public
 * @cache 300 seconds
 * @query page, limit, sport, city, priceMin, priceMax, rating, sort
 */
router.get('/', cache(300), getFields);

/**
 * @route GET /api/fields/search
 * @desc Search fields by criteria
 * @access Public
 * @cache 300 seconds
 * @query q, sport, city, priceRange, rating
 */
router.get('/search', cache(300), searchFields);

/**
 * @route GET /api/fields/nearby
 * @desc Find nearby fields based on location
 * @access Public
 * @cache 300 seconds
 * @query lat, lng, radius
 */
router.get('/nearby', cache(300), getNearbyFields);

/**
 * @route GET /api/fields/featured
 * @desc Get featured/promoted fields
 * @access Public
 * @cache 600 seconds
 */
router.get('/featured', cache(600), getFeaturedFields);

/**
 * @route GET /api/fields/top-rated
 * @desc Get top-rated fields
 * @access Public
 * @cache 600 seconds
 */
router.get('/top-rated', cache(600), getTopRatedFields);

/**
 * @route GET /api/fields/:id
 * @desc Get specific field details
 * @access Public
 * @cache 300 seconds
 * @param id - Field ID
 */
router.get('/:id', cache(300), getField);

/**
 * @route GET /api/fields/:id/reviews
 * @desc Get field reviews
 * @access Public
 * @cache 300 seconds
 * @param id - Field ID
 */
router.get('/:id/reviews', cache(300), getFieldReviews);

// Protected routes
router.use(protect);

/**
 * @route POST /api/fields
 * @desc Create new field (field owner)
 * @access Private/FieldOwner
 * @body name, description, sports, location, hourlyRate, etc.
 */
router.post('/', fieldOwner, createField);

/**
 * @route PUT /api/fields/:id
 * @desc Update field information
 * @access Private/FieldOwner
 * @param id - Field ID
 */
router.put('/:id', fieldOwner, updateField);

/**
 * @route DELETE /api/fields/:id
 * @desc Delete field listing
 * @access Private/FieldOwner
 * @param id - Field ID
 */
router.delete('/:id', fieldOwner, deleteField);

/**
 * @route POST /api/fields/:id/images
 * @desc Upload field images
 * @access Private/FieldOwner
 * @param id - Field ID
 */
router.post('/:id/images', fieldOwner, upload.array('images', 10), uploadFieldImages);

/**
 * @route DELETE /api/fields/:id/images/:imageId
 * @desc Delete field image
 * @access Private/FieldOwner
 * @param id - Field ID
 * @param imageId - Image ID
 */
router.delete('/:id/images/:imageId', fieldOwner, deleteFieldImage);

// Availability
router.put('/:id/availability', fieldOwner, updateFieldAvailability);

// Field data
router.get('/:id/bookings', fieldOwner, getFieldBookings);
router.get('/:id/stats', fieldOwner, getFieldStats);

// Reporting
router.post('/:id/report', reportField);

// Wishlist
router.post('/:id/wishlist', addToWishlist);
router.delete('/:id/wishlist', removeFromWishlist);

// Owner-specific routes
router.get('/owner/fields', fieldOwner, getFieldsByOwner);

// Admin routes
router.put('/:id/verify', admin, verifyField);

export default router;