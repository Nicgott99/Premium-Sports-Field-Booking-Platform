import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from './config/database.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Enhanced User Schema
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  isAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Enhanced Field Schema
const FieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // cricket, football, tennis, etc.
  location: { type: String, required: true },
  description: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  photo: { type: String },
  amenities: [String],
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  operatingHours: {
    start: { type: String, default: '08:00' }, // 8 AM
    end: { type: String, default: '24:00' }    // 12 AM (midnight)
  },
  slotDuration: { type: Number, default: 2 }, // 2 hours per slot
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Enhanced Booking Schema
const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  field: { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "08:00"
  endTime: { type: String, required: true },   // "10:00"
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'confirmed' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', UserSchema);
const Field = mongoose.model('Field', FieldSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Helper function to generate time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 24; hour += 2) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
    slots.push({ startTime, endTime });
  }
  return slots;
};

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// AUTH ROUTES

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'phone number';
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      verificationCode,
      isAdmin: email === 'hasibullah.khan.alvie@g.bracu.ac.bd'
    });

    await user.save();

    // Log verification code to terminal (development mode)
    console.log(`\n🔐 VERIFICATION CODE for ${email}: ${verificationCode}`);
    console.log(`📱 User: ${firstName} ${lastName}`);
    console.log(`📧 Email: ${email}`);
    console.log(`📞 Phone: ${phone}`);
    console.log(`👤 Admin: ${user.isAdmin ? 'YES' : 'NO'}\n`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check terminal for verification code.',
      userId: user._id,
      isAdmin: user.isAdmin,
      needsVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Verify Email
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log(`✅ User verified: ${user.firstName} ${user.lastName} (${user.email})`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // If admin, generate verification code
    if (user.isAdmin) {
      const verificationCode = generateVerificationCode();
      user.verificationCode = verificationCode;
      await user.save();

      console.log(`\n🔐 ADMIN LOGIN VERIFICATION CODE: ${verificationCode}`);
      console.log(`👑 Admin: ${user.firstName} ${user.lastName}`);
      console.log(`📧 Email: ${user.email}\n`);

      return res.status(200).json({
        success: true,
        message: 'Admin verification code sent to terminal',
        userId: user._id,
        needsAdminVerification: true,
        isAdmin: true
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${user.firstName} ${user.lastName} (${user.email})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Admin Login Verification
app.post('/api/auth/admin-verify', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    const user = await User.findOne({ email, isAdmin: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    user.verificationCode = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log(`👑 Admin logged in: ${user.firstName} ${user.lastName} (${user.email})`);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin verification failed',
      error: error.message
    });
  }
});

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

// Get All Fields for Admin
app.get('/api/admin/fields', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const fields = await Field.find().populate('owner', 'firstName lastName email').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Fields retrieved successfully',
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

// Get Admin Stats
app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalFields = await Field.countDocuments();
    const pendingFields = await Field.countDocuments({ status: 'pending' });
    const totalBookings = await Booking.countDocuments();
    const todayBookings = await Booking.countDocuments({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    res.status(200).json({
      success: true,
      message: 'Admin stats retrieved',
      stats: {
        totalUsers,
        totalFields,
        pendingFields,
        totalBookings,
        todayBookings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get admin stats',
      error: error.message
    });
  }
});

// Get All Users for Admin
app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password -verificationCode').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
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
