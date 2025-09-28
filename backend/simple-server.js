import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Premium MERN Sports Platform API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'N/A'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Premium MERN Sports Platform API',
    version: '1.0.0',
    description: 'Advanced sports facility booking platform',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      fields: '/api/fields',
      bookings: '/api/bookings'
    }
  });
});

// Auth Routes (simplified)
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: 'user_' + Date.now(),
      email: req.body.email,
      token: 'jwt_token_' + Date.now()
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token: 'jwt_token_' + Date.now(),
      user: {
        id: 'user_' + Date.now(),
        email: req.body.email,
        role: 'user'
      }
    }
  });
});

// Fields Routes
app.get('/api/fields', (req, res) => {
  const fields = [
    {
      id: 'field_1',
      name: 'Premium Football Field A',
      type: 'Football',
      capacity: 22,
      pricePerHour: 150,
      amenities: ['Floodlights', 'Changing Rooms', 'Parking'],
      rating: 4.8,
      images: ['/images/field1.jpg'],
      availability: 'Available'
    },
    {
      id: 'field_2',
      name: 'Elite Basketball Court',
      type: 'Basketball',
      capacity: 12,
      pricePerHour: 100,
      amenities: ['Air Conditioning', 'Sound System'],
      rating: 4.9,
      images: ['/images/field2.jpg'],
      availability: 'Available'
    }
  ];
  
  res.status(200).json({
    success: true,
    message: 'Fields retrieved successfully',
    data: { fields, total: fields.length }
  });
});

// Bookings Routes
app.post('/api/bookings', (req, res) => {
  const booking = {
    id: 'booking_' + Date.now(),
    fieldId: req.body.fieldId,
    userId: req.body.userId,
    date: req.body.date,
    time: req.body.time,
    duration: req.body.duration,
    totalCost: req.body.totalCost,
    status: 'confirmed',
    qrCode: 'qr_' + Date.now(),
    created: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server and connect to database
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Premium MERN Sports Platform Server Started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✨ All systems operational');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();