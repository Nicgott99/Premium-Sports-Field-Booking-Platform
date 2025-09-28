import asyncHandler from 'express-async-handler';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = asyncHandler(async (req, res) => {
  try {
    const {
      fieldId,
      date,
      timeSlot,
      duration,
      participants,
      userNotes
    } = req.body;

    // Validate required fields
    if (!fieldId || !date || !timeSlot || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required booking details (fieldId, date, timeSlot, duration)'
      });
    }

    // Calculate pricing (sample calculation)
    const hourlyRate = 2000; // Sample rate
    const baseAmount = hourlyRate * duration;
    const totalAmount = baseAmount;

    // Create booking object
    const booking = {
      id: 'booking_' + Date.now(),
      fieldId,
      fieldName: 'Premium Stadium A', // Sample field name
      date,
      timeSlot,
      duration,
      participants: participants || 1,
      status: 'confirmed',
      paymentStatus: 'pending',
      pricing: {
        baseAmount,
        totalAmount,
        currency: 'BDT'
      },
      bookingReference: 'SPB' + Date.now(),
      userNotes: userNotes || '',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
export const getUserBookings = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      upcoming = false
    } = req.query;

    // Sample bookings data
    const sampleBookings = [
      {
        id: 'booking_1',
        fieldId: '1',
        fieldName: 'Premium Stadium A',
        fieldImage: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
        date: '2024-12-01',
        timeSlot: '10:00 AM - 12:00 PM',
        duration: 2,
        participants: 11,
        status: 'confirmed',
        paymentStatus: 'paid',
        totalAmount: 5000,
        currency: 'BDT',
        bookingReference: 'SPB202412011001',
        createdAt: '2024-11-20T10:00:00Z',
        field: {
          name: 'Premium Stadium A',
          location: 'Dhaka, Bangladesh',
          sport: 'Football'
        }
      },
      {
        id: 'booking_2',
        fieldId: '2',
        fieldName: 'Elite Basketball Arena',
        fieldImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        date: '2024-12-03',
        timeSlot: '6:00 PM - 8:00 PM',
        duration: 2,
        participants: 8,
        status: 'pending',
        paymentStatus: 'pending',
        totalAmount: 3600,
        currency: 'BDT',
        bookingReference: 'SPB202412031801',
        createdAt: '2024-11-21T14:30:00Z',
        field: {
          name: 'Elite Basketball Arena',
          location: 'Chittagong, Bangladesh',
          sport: 'Basketball'
        }
      },
      {
        id: 'booking_3',
        fieldId: '3',
        fieldName: 'Modern Tennis Complex',
        fieldImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
        date: '2024-11-25',
        timeSlot: '8:00 AM - 10:00 AM',
        duration: 2,
        participants: 4,
        status: 'completed',
        paymentStatus: 'paid',
        totalAmount: 2400,
        currency: 'BDT',
        bookingReference: 'SPB202411250801',
        createdAt: '2024-11-18T09:15:00Z',
        field: {
          name: 'Modern Tennis Complex',
          location: 'Sylhet, Bangladesh',
          sport: 'Tennis'
        }
      }
    ];

    // Apply filters
    let filteredBookings = sampleBookings;

    if (status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }

    if (upcoming === 'true') {
      const today = new Date();
      filteredBookings = filteredBookings.filter(booking => new Date(booking.date) >= today);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + Number(limit);
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

    res.json({
      success: true,
      message: 'User bookings retrieved successfully',
      data: paginatedBookings,
      count: paginatedBookings.length,
      total: filteredBookings.length,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(filteredBookings.length / limit),
        totalBookings: filteredBookings.length,
        hasNextPage: endIndex < filteredBookings.length,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sample detailed booking data
    const booking = {
      id: id,
      fieldId: '1',
      fieldName: 'Premium Stadium A',
      date: '2024-12-01',
      timeSlot: '10:00 AM - 12:00 PM',
      duration: 2,
      participants: 11,
      status: 'confirmed',
      paymentStatus: 'paid',
      bookingReference: 'SPB202412011001',
      pricing: {
        baseAmount: 5000,
        deposit: 0,
        totalAmount: 5000,
        currency: 'BDT'
      },
      userNotes: 'Corporate team building event',
      adminNotes: 'VIP treatment requested',
      createdAt: '2024-11-20T10:00:00Z',
      field: {
        name: 'Premium Stadium A',
        location: {
          address: 'Gulshan Circle 1',
          city: 'Dhaka',
          district: 'Dhaka'
        },
        sport: 'Football',
        images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800'],
        amenities: ['Floodlights', 'Changing Rooms', 'Parking', 'Security'],
        operatingHours: '6:00 AM - 11:00 PM',
        surface: 'Natural Grass',
        owner: {
          name: 'Stadium Management',
          phone: '+880123456789',
          email: 'info@stadium.com'
        }
      },
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+880987654321'
      }
    };

    res.json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
});

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
export const updateBooking = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Booking updated successfully',
    data: { booking: { id: req.params.id } }
  });
});

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const cancelBooking = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

// @desc    Check booking availability
// @route   POST /api/bookings/check-availability
// @access  Public
export const checkAvailability = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Availability checked successfully',
    data: { available: true }
  });
});

// @desc    Get booking QR code
// @route   GET /api/bookings/:id/qr-code
// @access  Private
export const getBookingQRCode = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'QR code generated successfully',
    data: { qrCode: 'placeholder-qr-code' }
  });
});

// @desc    Verify booking with QR code
// @route   POST /api/bookings/verify-qr
// @access  Private
export const verifyBookingQR = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Booking verified successfully',
    data: { verified: true }
  });
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private/Admin
export const getBookingStats = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Booking statistics retrieved successfully',
    data: { stats: {} }
  });
});

// @desc    Get field availability calendar
// @route   GET /api/bookings/calendar/:fieldId
// @access  Public
export const getFieldCalendar = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Field calendar retrieved successfully',
    data: { calendar: [] }
  });
});