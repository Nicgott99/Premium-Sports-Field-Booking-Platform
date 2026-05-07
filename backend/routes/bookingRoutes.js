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

// Public routes
router.get('/check-availability', checkAvailability);

// Protected routes (require authentication)
router.use(protect);

// User booking routes
router.post('/', createBooking);
router.get('/', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);

// Booking utilities
router.get('/:id/qr', getBookingQRCode);
router.post('/verify-qr', verifyBookingQR);
router.get('/:id/stats', getBookingStats);

// Field calendar (for owners)
router.get('/field/:fieldId/calendar', fieldOwner, getFieldCalendar);

export default router;