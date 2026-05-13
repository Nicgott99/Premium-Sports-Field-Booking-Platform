/**
 * Booking Routes - Field Reservation API Endpoints
 * Complete booking operations from creation to completion with cancellation and refunds
 * 
 * Public Discovery Routes (No Auth):
 * GET /availability - Check field availability
 * GET /calendar/:fieldId - Field booking calendar
 * 
 * Protected Routes (Authentication Required):
 * POST / - Create new booking
 * GET / - Get user's booking history
 * GET /:id - Get specific booking details
 * PUT /:id - Update booking (dates, participants)
 * DELETE /:id - Cancel booking with refund
 * 
 * Create Booking:
 * - POST /
 * - Body: { fieldId, startTime, endTime, participants, paymentMethod }
 * - Response: { booking, paymentIntent, qrCode }
 * - Status: 201 Created
 * - Validation: Time slot available, capacity check, payment verified
 * - Notification: Confirmation email/SMS sent
 * 
 * Check Availability:
 * - GET /availability?fieldId=X&date=YYYY-MM-DD
 * - Response: { availableSlots: [{ start, end }, ...], bookedSlots: [...] }
 * - Status: 200 OK
 * - Cache: 1 minute
 * - Rate: 100 per hour
 * 
 * Get User Bookings:
 * - GET /?status=pending&sort=startTime&page=1&limit=10
 * - Response: { bookings: [...], total, page, limit }
 * - Status: 200 OK
 * - Filters: status (pending, confirmed, completed), dateRange
 * - Sort: startTime, createdAt, price
 * - Cache: 5 minutes
 * 
 * Get Booking Details:
 * - GET /:id
 * - Response: { booking: { id, field, startTime, endTime, pricing, status, ... } }
 * - Status: 200 OK
 * - Authorization: Booker, field owner, or admin only
 * 
 * Update Booking:
 * - PUT /:id
 * - Body: { startTime, endTime, participants }
 * - Response: { booking, priceChange }
 * - Status: 200 OK
 * - Constraints: Within 24 hours of booking only
 * - Validation: Availability check, price recalculation
 * - Notification: Change confirmation email
 * 
 * Cancel Booking:
 * - DELETE /:id
 * - Response: { message, refundAmount, refundStatus }
 * - Status: 200 OK
 * - Refund Policy:
 *   * 24+ hours: 100% refund
 *   * 12-24 hours: 50% refund
 *   * <12 hours: 0% refund
 * - Notification: Cancellation and refund details email
 * 
 * QR Code Operations:
 * - GET /:id/qr - Generate/retrieve QR code
 * - POST /:id/verify - Verify QR code at check-in
 * - Response: { verified: true/false, checkedInTime }
 * - Status: 200 OK
 * 
 * Booking Stats:
 * - GET /stats - User booking statistics
 * - Response: { total, completed, cancelled, spent, averageRating }
 * - Status: 200 OK
 * - Cache: 15 minutes
 * 
 * Field Calendar:
 * - GET /calendar/:fieldId?month=2024-05
 * - Response: { month, bookings: [...], available: [...] }
 * - Status: 200 OK
 * - Public route (no auth)
 * - Cache: 5 minutes
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request, invalid input
 * - 401: Unauthorized user
 * - 404: Booking/field not found
 * - 409: Time slot unavailable, conflict
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Pagination:
 * - page: Page number (default 1)
 * - limit: Items per page (default 10, max 50)
 * - Sort: Sort field and order (asc/desc)
 * 
 * Filtering:
 * - status: pending, confirmed, in-progress, completed, cancelled
 * - dateRange: startDate, endDate
 * - fieldId: Specific field
 * - minPrice, maxPrice: Price range
 * 
 * Rate Limiting:
 * - Create: 30 per hour per user
 * - Get bookings: 100 per hour
 * - Cancel: 100 per day
 * - Availability check: 300 per hour
 * 
 * Middleware Applied:
 * - protect: Authentication required
 * - fieldOwner: Field owner only (optional)
 * - asyncHandler: Error handling
 * - Logger: Activity tracking
 * - Validation: Input validation
 */

const router = express.Router();

/**
 * Booking Routes API Documentation
 * 
 * Public Routes (no authentication required):
 * GET /check-availability - Check field availability for date/time
 * 
 * Protected Routes (require authentication):
 * POST / - Create new booking
 * GET / - Get user's bookings
 * GET /:id - Get specific booking details
 * PUT /:id - Update booking
 * DELETE /:id - Cancel booking
 * GET /:id/qr - Get booking QR code
 * POST /verify-qr - Verify booking with QR
 * GET /:id/stats - Get booking statistics
 * 
 * Field Owner Routes:
 * GET /field/:fieldId/calendar - View field booking calendar
 * 
 * Query Parameters:
 * - page: Pagination page number
 * - limit: Results per page
 * - status: Filter by status
 * - date: Filter by date
 * - field: Filter by field ID
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { booking: {...} } or { bookings: [...] }
 * }
 * 
 * Error Responses:
 * 400 - Invalid booking data
 * 401 - Unauthorized access
 * 404 - Booking not found
 * 409 - Field unavailable or booking conflict
 * 500 - Server error
 */

// Public routes
/**
 * @route GET /api/bookings/check-availability
 * @desc Check field availability for specific time
 * @access Public
 * @query fieldId, startTime, endTime
 */
router.get('/check-availability', checkAvailability);

// Protected routes (require authentication)
router.use(protect);

/**
 * @route POST /api/bookings
 * @desc Create new booking
 * @access Private
 * @body fieldId, startTime, endTime, participants
 */
router.post('/', createBooking);

/**
 * @route GET /api/bookings
 * @desc Get user's bookings
 * @access Private
 * @query page, limit, status, dateRange
 */
router.get('/', getUserBookings);

/**
 * @route GET /api/bookings/:id
 * @desc Get specific booking details
 * @access Private
 * @param id - Booking ID
 */
router.get('/:id', getBookingById);

/**
 * @route PUT /api/bookings/:id
 * @desc Update booking
 * @access Private
 * @param id - Booking ID
 */
router.put('/:id', updateBooking);

/**
 * @route DELETE /api/bookings/:id
 * @desc Cancel booking
 * @access Private
 * @param id - Booking ID
 */
router.delete('/:id', cancelBooking);

/**
 * @route GET /api/bookings/:id/qr
 * @desc Generate booking QR code
 * @access Private
 * @param id - Booking ID
 */
router.get('/:id/qr', getBookingQRCode);

/**
 * @route POST /api/bookings/verify-qr
 * @desc Verify booking with QR code
 * @access Private
 * @body qrData
 */
router.post('/verify-qr', verifyBookingQR);

/**
 * @route GET /api/bookings/:id/stats
 * @desc Get booking statistics
 * @access Private
 * @param id - Booking ID
 */
router.get('/:id/stats', getBookingStats);

/**
 * @route GET /api/bookings/field/:fieldId/calendar
 * @desc Get field booking calendar (owner only)
 * @access Private/FieldOwner
 * @param fieldId - Field ID
 */
router.get('/field/:fieldId/calendar', fieldOwner, getFieldCalendar);

export default router;