// FIELD MANAGEMENT ROUTES

// Get All Fields (Public)
app.get('/api/fields', async (req, res) => {
  try {
    const fields = await Field.find({ isApproved: true, isActive: true })
      .populate('addedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Fields retrieved successfully',
      count: fields.length,
      fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get fields',
      error: error.message
    });
  }
});

// Add New Field (Authenticated Users)
app.post('/api/fields', verifyToken, async (req, res) => {
  try {
    const { name, type, location, description, pricePerHour, photo, amenities } = req.body;

    const field = new Field({
      name,
      type,
      location,
      description,
      pricePerHour,
      photo,
      amenities: amenities || [],
      addedBy: req.user._id,
      isApproved: false // Requires admin approval
    });

    await field.save();
    await field.populate('addedBy', 'firstName lastName');

    console.log(`\n🏟️ NEW FIELD ADDED (Pending Approval)`);
    console.log(`📝 Name: ${field.name}`);
    console.log(`🏆 Type: ${field.type}`);
    console.log(`📍 Location: ${field.location}`);
    console.log(`💰 Price: $${field.pricePerHour}/hour`);
    console.log(`👤 Added by: ${req.user.firstName} ${req.user.lastName}\n`);

    res.status(201).json({
      success: true,
      message: 'Field added successfully. Waiting for admin approval.',
      field
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add field',
      error: error.message
    });
  }
});

// Get Pending Fields (Admin Only)
app.get('/api/admin/fields/pending', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const fields = await Field.find({ isApproved: false })
      .populate('addedBy', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Pending fields retrieved',
      count: fields.length,
      fields
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pending fields',
      error: error.message
    });
  }
});

// Approve Field (Admin Only)
app.put('/api/admin/fields/:fieldId/approve', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const field = await Field.findById(req.params.fieldId);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    field.isApproved = true;
    field.approvedBy = req.user._id;
    field.updatedAt = new Date();
    await field.save();

    await field.populate('addedBy', 'firstName lastName');

    console.log(`\n✅ FIELD APPROVED by Admin`);
    console.log(`📝 Field: ${field.name}`);
    console.log(`👑 Approved by: ${req.user.firstName} ${req.user.lastName}\n`);

    res.status(200).json({
      success: true,
      message: 'Field approved successfully',
      field
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve field',
      error: error.message
    });
  }
});

// BOOKING ROUTES

// Get Available Time Slots for a Field
app.get('/api/fields/:fieldId/slots/:date', async (req, res) => {
  try {
    const { fieldId, date } = req.params;
    
    const field = await Field.findById(fieldId);
    if (!field || !field.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or not approved'
      });
    }

    // Get all bookings for this field on this date
    const bookings = await Booking.find({
      field: fieldId,
      date: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    // Generate all possible time slots
    const allSlots = generateTimeSlots();
    
    // Mark booked slots
    const availableSlots = allSlots.map(slot => {
      const isBooked = bookings.some(booking => 
        booking.startTime === slot.startTime && booking.endTime === slot.endTime
      );
      
      return {
        ...slot,
        isAvailable: !isBooked,
        price: field.pricePerHour * 2 // 2-hour slots
      };
    });

    res.status(200).json({
      success: true,
      message: 'Time slots retrieved',
      field: {
        id: field._id,
        name: field.name,
        type: field.type,
        pricePerHour: field.pricePerHour
      },
      date,
      slots: availableSlots
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get time slots',
      error: error.message
    });
  }
});

// Book a Field Slot
app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const { fieldId, date, startTime, endTime } = req.body;

    // Validate field
    const field = await Field.findById(fieldId);
    if (!field || !field.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Field not found or not approved'
      });
    }

    // Check if slot is already booked
    const existingBooking = await Booking.findOne({
      field: fieldId,
      date: new Date(date),
      startTime,
      endTime,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Calculate total amount (2-hour slot)
    const totalAmount = field.pricePerHour * 2;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      field: fieldId,
      date: new Date(date),
      startTime,
      endTime,
      totalAmount,
      status: 'confirmed'
    });

    await booking.save();
    await booking.populate('field', 'name type location');
    await booking.populate('user', 'firstName lastName email phone');

    console.log(`\n📅 NEW BOOKING CREATED`);
    console.log(`🏟️ Field: ${booking.field.name}`);
    console.log(`👤 User: ${req.user.firstName} ${req.user.lastName}`);
    console.log(`📅 Date: ${date}`);
    console.log(`⏰ Time: ${startTime} - ${endTime}`);
    console.log(`💰 Amount: $${totalAmount}\n`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// Get User Bookings
app.get('/api/bookings/my', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('field', 'name type location pricePerHour')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'User bookings retrieved',
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message
    });
  }
});

// Get All Bookings (Admin Only)
app.get('/api/admin/bookings', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'firstName lastName email phone')
      .populate('field', 'name type location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All bookings retrieved',
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message
    });
  }
});

// Cancel Booking (Admin Only)
app.put('/api/admin/bookings/:bookingId/cancel', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = reason || 'Cancelled by admin';
    booking.updatedAt = new Date();
    await booking.save();

    await booking.populate('user', 'firstName lastName email');
    await booking.populate('field', 'name type');

    console.log(`\n❌ BOOKING CANCELLED by Admin`);
    console.log(`📅 Booking ID: ${booking._id}`);
    console.log(`🏟️ Field: ${booking.field.name}`);
    console.log(`👤 User: ${booking.user.firstName} ${booking.user.lastName}`);
    console.log(`👑 Cancelled by: ${req.user.firstName} ${req.user.lastName}`);
    console.log(`📝 Reason: ${booking.cancellationReason}\n`);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

// DASHBOARD ROUTES

// User Dashboard
app.get('/api/dashboard/user', verifyToken, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ user: req.user._id });
    const activeBookings = await Booking.countDocuments({ 
      user: req.user._id, 
      status: 'confirmed',
      date: { $gte: new Date() }
    });
    const recentBookings = await Booking.find({ user: req.user._id })
      .populate('field', 'name type location')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'User dashboard data',
      stats: {
        totalBookings,
        activeBookings,
        completedBookings: totalBookings - activeBookings
      },
      recentBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// Admin Dashboard
app.get('/api/dashboard/admin', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalFields = await Field.countDocuments({ isApproved: true });
    const pendingFields = await Field.countDocuments({ isApproved: false });
    const totalBookings = await Booking.countDocuments();
    const todayBookings = await Booking.countDocuments({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    const recentUsers = await User.find({ isAdmin: false })
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBookings = await Booking.find()
      .populate('user', 'firstName lastName')
      .populate('field', 'name type')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: 'Admin dashboard data',
      stats: {
        totalUsers,
        totalFields,
        pendingFields,
        totalBookings,
        todayBookings
      },
      recentUsers,
      recentBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard data',
      error: error.message
    });
  }
});

// STATISTICS ROUTES (Updated)
app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalFields = await Field.countDocuments({ isApproved: true });
    const totalBookings = await Booking.countDocuments();
    const pendingFields = await Field.countDocuments({ isApproved: false });

    res.status(200).json({
      success: true,
      message: 'Database Statistics',
      stats: {
        totalUsers,
        totalFields,
        totalBookings,
        pendingFields
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// Health check and API info routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Premium Sports Platform API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Premium Sports Platform API v2.0.0',
    features: [
      'User Registration with Email/Phone Verification', 
      'Admin Panel with Approval System',
      'Field Management with Time Slots',
      'Advanced Booking System',
      'Real-time Availability Check'
    ],
    endpoints: {
      // Auth endpoints
      'POST /api/auth/register': 'Register new user',
      'POST /api/auth/verify': 'Verify email with code',
      'POST /api/auth/login': 'User login',
      'POST /api/auth/admin-verify': 'Admin login verification',
      
      // Field endpoints
      'GET /api/fields': 'Get approved fields',
      'POST /api/fields': 'Add new field (requires auth)',
      'GET /api/fields/:id/slots/:date': 'Get available time slots',
      
      // Booking endpoints
      'POST /api/bookings': 'Create booking (requires auth)',
      'GET /api/bookings/my': 'Get user bookings (requires auth)',
      
      // Admin endpoints
      'GET /api/admin/fields/pending': 'Get pending fields (admin)',
      'PUT /api/admin/fields/:id/approve': 'Approve field (admin)',
      'GET /api/admin/bookings': 'Get all bookings (admin)',
      'PUT /api/admin/bookings/:id/cancel': 'Cancel booking (admin)',
      
      // Dashboard
      'GET /api/dashboard/user': 'User dashboard (requires auth)',
      'GET /api/dashboard/admin': 'Admin dashboard (admin)',
      'GET /api/stats': 'Database statistics'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Premium Sports Platform Server Started`);
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api`);
      console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
      console.log(`👑 Admin Email: hasibullah.khan.alvie@g.bracu.ac.bd`);
      console.log(`🔐 Admin Password: admin1234`);
      console.log(`⚡ Ready for connections!\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();