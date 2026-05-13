/**
 * Field Routes - Sports Facility Listing & Discovery API
 * Comprehensive field search, filtering, booking calendar, and management endpoints
 * 
 * Public Discovery Routes (No Auth):
 * GET / - Search all fields with filters
 * GET /nearby - Find fields near coordinates
 * GET /search - Advanced full-text search
 * GET /popular - Trending/popular fields
 * GET /featured - Featured/promoted fields
 * GET /:id - Get field details
 * GET /:id/reviews - Get field reviews
 * GET /:id/calendar - Field booking calendar
 * GET /:id/availability - Check time slot availability
 * 
 * Protected Routes (Authentication):
 * POST / - Create new field (field owner)
 * PUT /:id - Update field (owner/admin)
 * DELETE /:id - Delete field (owner/admin)
 * GET /my-fields - Get user's fields (field owner)
 * POST /:id/images - Upload field images
 * DELETE /:id/images/:imageId - Delete image
 * 
 * Search Endpoint:
 * - GET /?q=cricket&lat=23.8&lon=90.4&distance=10&sport=cricket&minPrice=100&maxPrice=500
 * - Response: { fields: [...], total, page, limit }
 * - Status: 200 OK
 * - Filters: sport, price range, amenities, rating, distance
 * - Sort: distance, price, rating, popularity
 * - Pagination: page, limit (max 50)
 * - Cache: 5 minutes
 * 
 * Nearby Fields:
 * - GET /nearby?lat=23.8&lon=90.4&distance=10
 * - Response: { fields: [{id, name, distance, rating, price}, ...] }
 * - Status: 200 OK
 * - Geospatial search using coordinates
 * - Distance in kilometers
 * 
 * Get Field Details:
 * - GET /:id
 * - Response: { field: { id, name, type, surface, amenities, pricing, images, rating } }
 * - Status: 200 OK
 * - Includes: Gallery, availability, reviews, owner info
 * - Cache: 15 minutes
 * 
 * Create Field:
 * - POST /
 * - Body: { name, description, type, surface, sport, amenities, hourlyRate, ... }
 * - Response: { fieldId, status: "pending_approval" }
 * - Status: 201 Created
 * - Auth: Field owner only
 * - Verification: Admin review required
 * 
 * Update Field:
 * - PUT /:id
 * - Body: { name, description, hourlyRate, amenities, availability, ... }
 * - Response: { field, updated }
 * - Status: 200 OK
 * - Auth: Field owner or admin only
 * - Validation: Preserve existing bookings
 * 
 * Delete Field:
 * - DELETE /:id
 * - Response: { message, deletedAt }
 * - Status: 200 OK
 * - Auth: Field owner or admin
 * - Soft delete: Preserve booking history
 * 
 * Upload Images:
 * - POST /:id/images
 * - Body: FormData with images
 * - Response: { images: [{url, order}, ...] }
 * - Status: 201 Created
 * - Limits: 5MB per image, 10 images max
 * - Formats: jpg, png, gif, webp
 * 
 * Get Field Reviews:
 * - GET /:id/reviews?sort=helpful&filter=5-stars
 * - Response: { reviews: [...], averageRating, totalReviews }
 * - Status: 200 OK
 * - Pagination: page, limit
 * - Filters: Rating, verified, helpful votes
 * 
 * Field Availability:
 * - GET /:id/availability?date=2024-05-15
 * - Response: { availableSlots: [{start, end, price}, ...], bookedSlots: [...] }
 * - Status: 200 OK
 * - Date-based slot availability
 * - Real-time updates
 * 
 * Booking Calendar:
 * - GET /:id/calendar?month=2024-05
 * - Response: { bookings: [...], availableDates: [...] }
 * - Status: 200 OK
 * - Monthly calendar view
 * - Public access (no auth)
 * 
 * Field Filters Supported:
 * - Sport: football, cricket, basketball, tennis, etc.
 * - Price: minPrice, maxPrice
 * - Amenities: parking, lighting, equipment, etc.
 * - Rating: Minimum rating threshold
 * - Type: indoor, outdoor, covered
 * - Surface: grass, artificial, concrete, etc.
 * - Distance: Radius in km from coordinates
 * - Status: Active, inactive, pending
 * 
 * Search Options:
 * - Text search: Name, description, location
 * - Geospatial: Latitude, longitude, distance
 * - Filter: Multi-criteria filtering
 * - Sort: Distance, price, rating, popularity
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, invalid filters
 * - 401: Unauthorized user
 * - 404: Field not found
 * - 409: Field already exists
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Rate Limiting:
 * - Search: 300 per hour
 * - Get details: 500 per hour
 * - Create field: 5 per day
 * - Update field: 100 per day
 * - Upload images: 50 per day
 * 
 * Caching:
 * - Field details: 15 minutes
 * - Search results: 5 minutes
 * - Availability: 1 minute
 * - Images: 1 hour
 */
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