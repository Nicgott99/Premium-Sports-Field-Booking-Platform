import logger from './logger.js';

/**
 * Field Availability Transaction Helper
 * Manages field slot reservations with conflict detection and optimistic locking
 */

/**
 * Lock type strategies
 */
export const LOCK_STRATEGY = {
  OPTIMISTIC: 'optimistic', // Check version before update
  PESSIMISTIC: 'pessimistic', // Lock during operation
  NONE: 'none' // No locking (default for single-server)
};

/**
 * Check if time slots conflict
 * @param {Object} slot1 - First booking slot { startTime, endTime }
 * @param {Object} slot2 - Second booking slot { startTime, endTime }
 * @returns {boolean} True if slots overlap
 */
export const hasSlotConflict = (slot1, slot2) => {
  const start1 = new Date(slot1.startTime).getTime();
  const end1 = new Date(slot1.endTime).getTime();
  const start2 = new Date(slot2.startTime).getTime();
  const end2 = new Date(slot2.endTime).getTime();

  // Check for overlap: slot1 starts before slot2 ends AND slot1 ends after slot2 starts
  return start1 < end2 && end1 > start2;
};

/**
 * Find conflicting bookings in field's existing reservations
 * @param {Array} existingBookings - Field's existing bookings
 * @param {Object} newSlot - New booking slot
 * @param {Object} options - Options (excludeBookingId)
 * @returns {Array} Conflicting bookings
 */
export const findConflictingBookings = (existingBookings = [], newSlot, options = {}) => {
  const { excludeBookingId = null } = options;

  if (!newSlot || !newSlot.startTime || !newSlot.endTime) {
    throw new Error('New slot must have startTime and endTime');
  }

  return existingBookings.filter(booking => {
    // Skip if this is the same booking being updated
    if (excludeBookingId && booking._id?.toString() === excludeBookingId.toString()) {
      return false;
    }

    // Skip cancelled bookings
    if (booking.status === 'cancelled') {
      return false;
    }

    // Check for slot conflict
    return hasSlotConflict(
      { startTime: booking.startTime, endTime: booking.endTime },
      newSlot
    );
  });
};

/**
 * Validate field availability with transaction-like semantics
 * @param {Object} field - Field document with bookings
 * @param {Object} newBooking - New booking to check
 * @param {Object} options - Options
 * @returns {Object} { available: boolean, conflicts: Array, recommendation: string }
 */
export const validateFieldAvailability = (field, newBooking, options = {}) => {
  const { strategy = LOCK_STRATEGY.OPTIMISTIC, allowOverbooking = false } = options;

  if (!field || !field._id) {
    return { available: false, conflicts: [], recommendation: 'Invalid field' };
  }

  if (!newBooking || !newBooking.startTime || !newBooking.endTime) {
    return { available: false, conflicts: [], recommendation: 'Invalid booking time range' };
  }

  // Get active bookings (confirmed or pending, not cancelled)
  const activeBookings = (field.bookings || []).filter(b =>
    b.status === 'confirmed' || b.status === 'pending'
  );

  // Find conflicts
  const conflicts = findConflictingBookings(activeBookings, {
    startTime: newBooking.startTime,
    endTime: newBooking.endTime
  });

  // Determine availability
  const available = conflicts.length === 0;

  return {
    available,
    conflicts: conflicts.map(c => ({
      bookingId: c._id,
      userId: c.userId,
      startTime: c.startTime,
      endTime: c.endTime
    })),
    recommendation: available ?
      'Field is available for this time slot' :
      `${conflicts.length} conflict(s) found. Try different time or date.`,
    checkTime: new Date(),
    strategy
  };
};

/**
 * Validate booking with version check (optimistic locking)
 * @param {Object} field - Field from database
 * @param {Object} newBooking - New booking
 * @param {number} expectedVersion - Expected field version
 * @returns {Object} { valid: boolean, error?: string, newVersion: number }
 */
export const validateWithVersionLock = (field, newBooking, expectedVersion) => {
  // Check version match (detect concurrent updates)
  if (field.__v !== expectedVersion) {
    return {
      valid: false,
      error: `Field was modified concurrently. Expected version ${expectedVersion}, got ${field.__v}`,
      newVersion: field.__v,
      suggestion: 'Retry booking with fresh field data'
    };
  }

  // Check availability
  const availability = validateFieldAvailability(field, newBooking);

  if (!availability.available) {
    return {
      valid: false,
      error: availability.recommendation,
      conflicts: availability.conflicts,
      newVersion: field.__v
    };
  }

  return {
    valid: true,
    newVersion: field.__v + 1
  };
};

/**
 * Prepare booking update for atomic operation
 * Returns update query that should be executed atomically
 * @param {string} fieldId - Field ID
 * @param {Object} newBooking - New booking object
 * @returns {Object} MongoDB update operation
 */
export const prepareAtomicBookingUpdate = (fieldId, newBooking) => {
  if (!fieldId || !newBooking) {
    throw new Error('fieldId and newBooking are required');
  }

  return {
    fieldId,
    updateOp: {
      $push: { bookings: newBooking },
      $inc: { __v: 1 }
    },
    conditions: {
      _id: fieldId
    }
  };
};

/**
 * Get available time slots for a date
 * @param {Object} field - Field document
 * @param {Date} date - Date to check
 * @param {Object} options - Options (slotDurationMinutes, operatingHours)
 * @returns {Array} Available time slots
 */
export const getAvailableSlots = (field, date, options = {}) => {
  const {
    slotDurationMinutes = 60,
    operatingHours = { start: '06:00', end: '22:00' }
  } = options;

  if (!field || !date) {
    return [];
  }

  const slots = [];
  const dayStart = new Date(date);
  dayStart.setHours(6, 0, 0, 0); // Start at 6 AM

  const dayEnd = new Date(date);
  dayEnd.setHours(22, 0, 0, 0); // End at 10 PM

  // Get bookings for this date
  const dateString = date.toISOString().split('T')[0];
  const bookingsForDate = (field.bookings || []).filter(b => {
    const bookingDate = new Date(b.startTime).toISOString().split('T')[0];
    return bookingDate === dateString && b.status !== 'cancelled';
  });

  // Generate slots
  let currentTime = new Date(dayStart);

  while (currentTime < dayEnd) {
    const slotEnd = new Date(currentTime.getTime() + slotDurationMinutes * 60 * 1000);

    // Check if slot conflicts with any booking
    const isAvailable = !hasSlotConflict(
      { startTime: currentTime, endTime: slotEnd },
      bookingsForDate
    );

    slots.push({
      startTime: new Date(currentTime),
      endTime: new Date(slotEnd),
      available: isAvailable
    });

    currentTime = slotEnd;
  }

  return slots;
};

/**
 * Get booking statistics for a field
 * @param {Object} field - Field document
 * @param {Object} options - Options (timeRange)
 * @returns {Object} Statistics
 */
export const getBookingStats = (field, options = {}) => {
  if (!field || !field.bookings) {
    return {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      occupancyRate: 0
    };
  }

  const bookings = field.bookings;
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  stats.occupancyRate = stats.confirmed / Math.max(1, stats.total);

  return stats;
};

export default {
  hasSlotConflict,
  findConflictingBookings,
  validateFieldAvailability,
  validateWithVersionLock,
  prepareAtomicBookingUpdate,
  getAvailableSlots,
  getBookingStats,
  LOCK_STRATEGY
};
