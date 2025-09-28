import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
// import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
// Socket.IO will be added later
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection with Premium Configuration
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-platform';
    
    // Simplified options to avoid deprecated warnings
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true
    };
    
    await mongoose.connect(mongoURI, options);
    
    console.log('🍃 MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Database event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('📋 Unable to connect to MongoDB. Please check your connection string.');
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Socket.IO Configuration for Real-time Features (temporarily disabled)
// io.on('connection', (socket) => {
//   console.log(`👤 User connected: ${socket.id}`);
//   
//   // Join user to their room
//   socket.on('join-user-room', (userId) => {
//     socket.join(`user-${userId}`);
//     console.log(`👤 User ${userId} joined their room`);
//   });
//   
//   // Handle chat messages
//   socket.on('chat-message', (data) => {
//     io.to(data.roomId).emit('new-message', data);
//   });
//   
//   // Handle booking notifications
//   socket.on('booking-update', (data) => {
//     io.to(`user-${data.userId}`).emit('booking-notification', data);
//   });
//   
//   socket.on('disconnect', () => {
//     console.log(`👤 User disconnected: ${socket.id}`);
//   });
// });

// Premium API Routes

// Health Check with Comprehensive System Status
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      server: {
        status: 'healthy',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name || 'N/A',
        host: mongoose.connection.host || 'N/A'
      },
      realtime: {
        status: 'disabled',
        connections: 0
      }
    }
  };
  
  res.status(200).json(healthCheck);
});

// API Info Endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Premium MERN Sports Platform API',
    version: '1.0.0',
    description: 'Advanced sports facility booking platform with real-time features',
    author: 'CSE471 Team',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      fields: '/api/fields/*',
      bookings: '/api/bookings/*',
      payments: '/api/payments/*',
      analytics: '/api/analytics/*',
      realtime: 'WebSocket connection available'
    },
    features: [
      'JWT Authentication',
      'Real-time Notifications',
      'Advanced Analytics',
      'Payment Processing',
      'File Upload',
      'Rate Limiting',
      'Security Headers',
      'Database Integration'
    ]
  });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    // Premium registration logic will be implemented
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: 'user_' + Date.now(),
        email: req.body.email,
        created: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    // Premium login logic will be implemented
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: 'premium_jwt_token_' + Date.now(),
        user: {
          id: 'user_' + Date.now(),
          email: req.body.email,
          role: 'user'
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Fields Routes
app.get('/api/fields', async (req, res) => {
  try {
    const fields = [
      {
        id: 'field_1',
        name: 'Premium Football Field A',
        type: 'Football',
        capacity: 22,
        pricePerHour: 150,
        amenities: ['Floodlights', 'Changing Rooms', 'Parking', 'Refreshments'],
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
        amenities: ['Air Conditioning', 'Sound System', 'Lockers'],
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fields',
      error: error.message
    });
  }
});

// Bookings Routes
app.post('/api/bookings', async (req, res) => {
  try {
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
    
    // Real-time notification (temporarily disabled)
    // io.to(`user-${req.body.userId}`).emit('booking-confirmation', booking);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Booking failed',
      error: error.message
    });
  }
});

// Analytics Routes
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const analytics = {
      overview: {
        totalBookings: 1250,
        totalRevenue: 185000,
        activeUsers: 450,
        fieldUtilization: 78.5
      },
      chartData: {
        bookings: [65, 75, 85, 95, 105, 115, 125],
        revenue: [12000, 15000, 18000, 22000, 25000, 28000, 30000]
      },
      topFields: [
        { name: 'Premium Football Field A', bookings: 85 },
        { name: 'Elite Basketball Court', bookings: 72 }
      ]
    };
    
    res.status(200).json({
      success: true,
      message: 'Analytics data retrieved successfully',
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/health',
      '/api/auth/register',
      '/api/auth/login',
      '/api/fields',
      '/api/bookings',
      '/api/analytics/dashboard'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('📴 Process terminated');
    mongoose.connection.close();
  });
});

// Start server only after database connection is established
const startServer = async () => {
  try {
    // Initialize database connection first
    await connectDB();
    
    // Start server only after successful DB connection
    server.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Premium MERN Sports Platform Server Started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔥 Socket.IO temporarily disabled`);
      console.log('✨ All systems operational');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();

export default app;