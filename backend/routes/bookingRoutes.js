import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkAvailability,
  getBookingQRCode,
  verifyBookingQR,
  getBookingStats,
  getFieldCalendar
} from '../controllers/bookingController.js';

import { protect, fieldOwner } from '../middleware/authMiddleware.js';

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