import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  confirmBooking,
  checkInBooking,
  checkOutBooking,
  getUpcomingBookings,
  getPastBookings,
  getUserBookings,
  getFieldBookings,
  searchBookings,
  getBookingStats,
  addParticipant,
  removeParticipant,
  updateParticipantStatus,
  sendBookingReminder,
  rescheduleBooking,
  getBookingAnalytics,
  exportBookings,
  createRecurringBooking,
  updateRecurringBooking,
  cancelRecurringBooking,
  getAvailableSlots,
  getConflictingBookings,
  bulkCreateBookings,
  transferBooking,
  splitBooking,
  mergeBookings,
  getBookingHistory,
  downloadBookingReceipt,
  addBookingNote,
  updateBookingNote,
  deleteBookingNote,
  rateBooking,
  getBookingQRCode,
  verifyBookingQRCode
} from '../controllers/bookingController.js';

import { protect, admin, manager, fieldOwner, premiumUser } from '../middleware/authMiddleware.js';
import { validateBooking, validateBookingUpdate } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Main booking operations
router.post('/', validateBooking, createBooking);
router.get('/', getBookings);
router.get('/upcoming', getUpcomingBookings);
router.get('/past', getPastBookings);
router.get('/search', searchBookings);
router.get('/stats', getBookingStats);
router.get('/analytics', premiumUser, getBookingAnalytics);
router.get('/export', exportBookings);

// Booking availability and conflicts
router.get('/available-slots/:fieldId', getAvailableSlots);
router.get('/conflicts/:fieldId', getConflictingBookings);

// Individual booking operations
router.get('/:id', getBooking);
router.put('/:id', validateBookingUpdate, updateBooking);
router.delete('/:id', cancelBooking);
router.post('/:id/confirm', confirmBooking);
router.post('/:id/check-in', checkInBooking);
router.post('/:id/check-out', checkOutBooking);
router.post('/:id/reschedule', rescheduleBooking);
router.post('/:id/transfer', transferBooking);
router.post('/:id/rate', rateBooking);

// Booking participants
router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:participantId', removeParticipant);
router.put('/:id/participants/:participantId', updateParticipantStatus);

// Booking notes
router.post('/:id/notes', addBookingNote);
router.put('/:id/notes/:noteId', updateBookingNote);
router.delete('/:id/notes/:noteId', deleteBookingNote);

// Booking utilities
router.post('/:id/reminder', sendBookingReminder);
router.get('/:id/receipt', downloadBookingReceipt);
router.get('/:id/qr-code', getBookingQRCode);
router.post('/verify-qr', verifyBookingQRCode);
router.get('/:id/history', getBookingHistory);

// Recurring bookings (Premium feature)
router.post('/recurring', premiumUser, createRecurringBooking);
router.put('/recurring/:id', premiumUser, updateRecurringBooking);
router.delete('/recurring/:id', premiumUser, cancelRecurringBooking);

// Advanced booking operations (Premium features)
router.post('/bulk-create', premiumUser, bulkCreateBookings);
router.post('/:id/split', premiumUser, splitBooking);
router.post('/merge', premiumUser, mergeBookings);

// User-specific booking routes
router.get('/user/:userId', getUserBookings);

// Field-specific booking routes (for field owners)
router.get('/field/:fieldId', fieldOwner, getFieldBookings);

export default router;