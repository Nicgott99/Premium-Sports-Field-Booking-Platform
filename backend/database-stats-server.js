import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple schemas for checking data (you can replace these with your actual models later)
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const FieldSchema = new mongoose.Schema({
  name: String,
  type: String,
  location: String,
  price: Number,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'fields' });

const BookingSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  fieldId: mongoose.Schema.Types.ObjectId,
  date: Date,
  time: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'bookings' });

const User = mongoose.model('User', UserSchema);
const Field = mongoose.model('Field', FieldSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// Database Statistics Route
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments(),
      Field.countDocuments(),
      Booking.countDocuments(),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt'),
      Field.find({}).sort({ createdAt: -1 }).limit(5).select('name type location price createdAt'),
      Booking.find({}).sort({ createdAt: -1 }).limit(5).populate('userId', 'firstName lastName email').populate('fieldId', 'name type')
    ]);

    res.status(200).json({
      success: true,
      message: 'Database Statistics',
      totalUsers: stats[0],
      totalFields: stats[1],
      totalBookings: stats[2],
      recentUsers: stats[3],
      recentFields: stats[4],
      recentBookings: stats[5],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// All Users Route
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All Users',
      count: users.length,
      users: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// All Fields Route
app.get('/api/fields', async (req, res) => {
  try {
    const fields = await Field.find({})
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All Fields',
      count: fields.length,
      fields: fields,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get fields',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// All Bookings Route
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('userId', 'firstName lastName email')
      .populate('fieldId', 'name type location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All Bookings',
      count: bookings.length,
      bookings: bookings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database Collections Info
app.get('/api/collections', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const stats = await db.collection(collection.name).stats();
        return {
          name: collection.name,
          count: stats.count || 0,
          size: stats.size || 0,
          avgObjSize: stats.avgObjSize || 0
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Database Collections',
      database: mongoose.connection.name,
      totalCollections: collections.length,
      collections: collectionStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get collections info',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// MongoDB Connection Test
app.get('/api/db-test', async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.status(200).json({
      success: true,
      message: 'MongoDB Connection Test',
      status: states[connectionState] || 'unknown',
      host: mongoose.connection.host || 'Not connected',
      database: mongoose.connection.name || 'Not connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'MongoDB Connection Test Failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Root API route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'MERN Sports Platform API v1.0.0',
    endpoints: {
      health: '/api/health',
      'db-test': '/api/db-test',
      stats: '/api/stats - Get database statistics',
      users: '/api/users - Get all users',
      fields: '/api/fields - Get all fields',
      bookings: '/api/bookings - Get all bookings',
      collections: '/api/collections - Get database collections info'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log(`📊 Database Stats at http://localhost:${PORT}/api/stats`);
      console.log(`👥 Users at http://localhost:${PORT}/api/users`);
      console.log(`🏟️ Fields at http://localhost:${PORT}/api/fields`);
      console.log(`📅 Bookings at http://localhost:${PORT}/api/bookings`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();