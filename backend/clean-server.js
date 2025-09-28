import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  }
};

// Basic Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CSE471 Premium Sports Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      fields: '/api/fields',
      auth: '/api/auth',
      bookings: '/api/bookings'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running perfectly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Fields endpoint with sample data inspired by 471sports-main
app.get('/api/fields', (req, res) => {
  const fields = [
    {
      id: '1',
      name: 'Premium Stadium A',
      sport: 'Football',
      location: 'Dhaka, Bangladesh',
      availableSlots: 5,
      rating: 4.8,
      minBookingSize: 11,
      pricePerHour: 2500,
      currency: 'BDT',
      imageUrl: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
      amenities: ['Floodlights', 'Changing Rooms', 'Parking', 'Security', 'Refreshments'],
      reviews: 156,
      description: 'Professional football stadium with international standards',
      operatingHours: '6:00 AM - 11:00 PM',
      surface: 'Natural Grass'
    },
    {
      id: '2',
      name: 'Elite Basketball Arena',
      sport: 'Basketball',
      location: 'Chittagong, Bangladesh',
      availableSlots: 3,
      rating: 4.9,
      minBookingSize: 5,
      pricePerHour: 1800,
      currency: 'BDT',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
      amenities: ['Air Conditioning', 'Sound System', 'Scoreboard', 'Seating', 'Locker Rooms'],
      reviews: 98,
      description: 'Indoor basketball arena with professional court',
      operatingHours: '7:00 AM - 10:00 PM',
      surface: 'Wooden Floor'
    },
    {
      id: '3',
      name: 'Modern Tennis Complex',
      sport: 'Tennis',
      location: 'Sylhet, Bangladesh',
      availableSlots: 7,
      rating: 4.6,
      minBookingSize: 2,
      pricePerHour: 1200,
      currency: 'BDT',
      imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      amenities: ['Multiple Courts', 'Equipment Rental', 'Coaching', 'Parking'],
      reviews: 85,
      description: 'Multiple tennis courts with professional coaching available',
      operatingHours: '6:00 AM - 9:00 PM',
      surface: 'Hard Court'
    },
    {
      id: '4',
      name: 'Cricket Ground Pro',
      sport: 'Cricket',
      location: 'Rajshahi, Bangladesh',
      availableSlots: 2,
      rating: 4.7,
      minBookingSize: 11,
      pricePerHour: 3000,
      currency: 'BDT',
      imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
      amenities: ['Pavilion', 'Scoreboard', 'Ground Equipment', 'Parking', 'Cafeteria'],
      reviews: 134,
      description: 'Full-size cricket ground with pavilion and facilities',
      operatingHours: '8:00 AM - 6:00 PM',
      surface: 'Natural Grass'
    }
  ];

  res.json({
    success: true,
    message: 'Fields retrieved successfully',
    count: fields.length,
    data: fields
  });
});

// Get single field
app.get('/api/fields/:id', (req, res) => {
  const { id } = req.params;
  
  // Sample field data
  const field = {
    id: id,
    name: `Field ${id}`,
    sport: 'Football',
    location: 'Dhaka, Bangladesh',
    rating: 4.5,
    pricePerHour: 2000,
    currency: 'BDT',
    description: 'Professional sports field with modern amenities',
    images: [
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
    ],
    amenities: ['Floodlights', 'Changing Rooms', 'Parking'],
    operatingHours: '6:00 AM - 11:00 PM',
    bookingPolicy: 'Minimum 1 hour booking required'
  };

  res.json({
    success: true,
    message: 'Field retrieved successfully',
    data: field
  });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // In a real app, this would save to database
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: 'user_' + Date.now(),
      firstName,
      lastName,
      email,
      phone,
      role: 'user',
      createdAt: new Date().toISOString()
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // In a real app, this would verify against database
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        email: email,
        role: 'user'
      },
      token: 'jwt_token_' + Date.now()
    }
  });
});

// Bookings endpoint
app.post('/api/bookings', (req, res) => {
  const { fieldId, date, timeSlot, duration, participants } = req.body;
  
  if (!fieldId || !date || !timeSlot || !duration) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required booking details'
    });
  }

  const booking = {
    id: 'booking_' + Date.now(),
    fieldId,
    date,
    timeSlot,
    duration,
    participants: participants || 1,
    status: 'confirmed',
    totalAmount: duration * 2000, // Sample calculation
    currency: 'BDT',
    bookingReference: 'REF' + Date.now(),
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  });
});

// Get user bookings
app.get('/api/bookings', (req, res) => {
  const bookings = [
    {
      id: 'booking_1',
      fieldId: '1',
      fieldName: 'Premium Stadium A',
      date: '2025-10-01',
      timeSlot: '10:00 AM - 12:00 PM',
      duration: 2,
      status: 'confirmed',
      totalAmount: 5000,
      currency: 'BDT'
    },
    {
      id: 'booking_2',
      fieldId: '2',
      fieldName: 'Elite Basketball Arena',
      date: '2025-10-03',
      timeSlot: '6:00 PM - 8:00 PM',
      duration: 2,
      status: 'pending',
      totalAmount: 3600,
      currency: 'BDT'
    }
  ];

  res.json({
    success: true,
    message: 'Bookings retrieved successfully',
    count: bookings.length,
    data: bookings
  });
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const { q, sport, location } = req.query;
  
  res.json({
    success: true,
    message: 'Search completed',
    query: { q, sport, location },
    results: {
      fields: 2,
      players: 5,
      teams: 1
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/fields',
      'GET /api/fields/:id',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/bookings',
      'GET /api/bookings'
    ]
  });
});

// Start server with proper database connection
const startServer = async () => {
  try {
    console.log('🚀 Starting CSE471 Premium Sports Platform Server...');
    
    // Connect to database first
    await connectDB();
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Server started successfully!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🎯 Ready to accept connections!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;