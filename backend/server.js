import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { setupFirebase } from './config/firebase.js';
import { createRedisClient, getRedisClient, getRedisHealth, pingRedis } from './config/redis.js';
import { multerErrorHandler } from './middleware/uploadMiddleware.js';
import mongoose from 'mongoose';
import { createIndexes } from './models/index.js';
import { cleanupExpiredInvitations } from './utils/invitationManager.js';
import { responseMiddleware } from './utils/responseFormatter.js';
import logger from './utils/logger.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO with namespaces
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Chat namespace
const chatNamespace = io.of('/chat');
chatNamespace.on('connection', (socket) => {
  logger.info(`Chat user connected: ${socket.id}`);
  socket.on('joinChat', (chatId) => {
    try {
      if (!chatId) {
        socket.emit('error', { message: 'Chat ID is required' });
        return;
      }
      socket.join(`chat_${chatId}`);
      logger.info(`User ${socket.userId} joined chat ${chatId}`);
    } catch (error) {
      logger.error(`Join chat error: ${error.message}`);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });
  socket.on('sendMessage', async (data) => {
    try {
      if (!data?.chatId || !data?.message) {
        socket.emit('error', { message: 'Chat ID and message are required' });
        return;
      }
      chatNamespace.to(`chat_${data.chatId}`).emit('newMessage', data);
    } catch (error) {
      logger.error(`Chat error: ${error.message}`);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
});

// Booking namespace
const bookingNamespace = io.of('/bookings');
bookingNamespace.on('connection', (socket) => {
  logger.info(`Booking user connected: ${socket.id}`);
  socket.on('joinUserRoom', (userId) => {
    try {
      if (!userId) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }
      socket.join(userId);
      socket.userId = userId;
      logger.info(`User ${userId} joined booking room`);
    } catch (error) {
      logger.error(`Join booking room error: ${error.message}`);
      socket.emit('error', { message: 'Failed to join booking room' });
    }
  });
  socket.on('bookingUpdate', (data) => {
    try {
      if (!data?.userId) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }
      bookingNamespace.to(data.userId).emit('bookingStatusChanged', data);
    } catch (error) {
      logger.error(`Booking update error: ${error.message}`);
      socket.emit('error', { message: 'Failed to emit booking update' });
    }
  });
  socket.on('fieldAvailabilityUpdate', (data) => {
    try {
      if (!data?.fieldId) {
        socket.emit('error', { message: 'Field ID is required' });
        return;
      }
      bookingNamespace.emit('fieldAvailabilityChanged', data);
    } catch (error) {
      logger.error(`Field availability update error: ${error.message}`);
      socket.emit('error', { message: 'Failed to emit availability update' });
    }
  });
});

// Notifications namespace
const notificationNamespace = io.of('/notifications');
notificationNamespace.on('connection', (socket) => {
  logger.info(`Notification user connected: ${socket.id}`);
  socket.on('joinUserNotifications', (userId) => {
    try {
      if (!userId) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }
      socket.join(`user_${userId}`);
      socket.userId = userId;
      logger.info(`User ${userId} joined notifications room`);
    } catch (error) {
      logger.error(`Join notifications error: ${error.message}`);
      socket.emit('error', { message: 'Failed to join notifications' });
    }
  });
  socket.on('disconnect', () => {
    logger.info(`Notification user disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB
await connectDB();

// Create database indexes (non-fatal)
try {
  await createIndexes();
  logger.info('Database indexes created/verified');
} catch (idxErr) {
  logger.warn(`Database index creation failed (non-fatal): ${idxErr.message}`);
}

// Setup Firebase
await setupFirebase();

// Setup Redis
const redisClient = await createRedisClient();
app.set('redisClient', redisClient);

// Periodic cleanup for expired invitations (runs hourly)
try {
  setInterval(() => {
    try {
      cleanupExpiredInvitations();
      logger.debug('Expired invitations cleanup run completed');
    } catch (e) {
      logger.warn(`Invitation cleanup error: ${e.message}`);
    }
  }, 60 * 60 * 1000);
} catch (e) {
  logger.debug('Invitation cleanup scheduler not started');
}

// Trust proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Compression middleware
app.use(compression());

// CORS Configuration - Dynamic origin handling
const corsOrigins = new Set([
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(origin => origin.trim()).filter(Boolean)
    : []),
  'http://localhost:3000',
  'http://localhost:5173',
  'https://cse471-sports.vercel.app'
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Response formatter middleware - Makes res.success(), res.error() available
app.use(responseMiddleware);

// Rate Limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Only allow health checks to bypass rate limiting
    return req.path === '/api/health' || req.path === '/api/v1/health';
  }
});

app.use('/api', limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CSE471 Premium Sports Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    apiVersion: 'v1'
  });
});

// Extended health status endpoint - checks MongoDB and Redis connectivity
app.get('/api/health/status', async (req, res) => {
  try {
    const dbState = mongoose?.connection?.readyState ?? 0; // 0 = disconnected, 1 = connected
    const redisHealth = typeof getRedisHealth === 'function' ? getRedisHealth() : { connected: false };
    const redisPing = typeof pingRedis === 'function' ? await pingRedis(1500) : false;

    return res.status(200).json({
      success: true,
      message: 'Service health status',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        readyState: dbState,
        connected: dbState === 1
      },
      redis: redisHealth
    });
  } catch (err) {
    logger.error(`Health status check failed: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Health status check failed' });
  }
});

// API v1 Routes with version prefix
// Ensure Stripe/webhook raw body is available for webhook verification
app.use('/api/v1/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/fields', fieldRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/reports', reportRoutes);

// Backward compatibility - keep old routes without version prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);

// Make io accessible in routes
app.set('io', io);
app.set('chatNamespace', chatNamespace);
app.set('bookingNamespace', bookingNamespace);
app.set('notificationNamespace', notificationNamespace);

// Error Handling Middleware
app.use(notFound);
// Multer errors -> friendly JSON
app.use(multerErrorHandler);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 CSE471 Premium Sports Platform Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📊 Health check available at: http://localhost:${PORT}/api/health`);
  logger.info(`🔗 MongoDB connected successfully`);
  logger.info(`🔥 Firebase initialized successfully`);
  logger.info(`⚡ Socket.IO enabled for real-time features`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    // close mongoose connection
    try {
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed');
      });
    } catch (err) {
      logger.warn(`Error closing MongoDB connection: ${err.message}`);
    }

    // close redis client if present
    try {
      const redis = getRedisClient();
      if (redis) {
        redis.quit().catch(e => logger.warn(`Redis quit error: ${e.message}`));
      }
    } catch (e) {
      logger.debug('No redis client to close');
    }

    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    try {
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed');
      });
    } catch (err) {
      logger.warn(`Error closing MongoDB connection: ${err.message}`);
    }

    try {
      const redis = getRedisClient();
      if (redis) {
        redis.quit().catch(e => logger.warn(`Redis quit error: ${e.message}`));
      }
    } catch (e) {
      logger.debug('No redis client to close');
    }

    logger.info('Process terminated');
    process.exit(0);
  });
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  // Graceful shutdown on critical failures
  setTimeout(() => process.exit(1), 1000);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Attempt graceful shutdown
  try {
    server.close(() => {
      mongoose.connection.close(false, () => logger.info('MongoDB closed after uncaught exception'));
    });
  } catch (_) {
    // ignore
  }
  setTimeout(() => process.exit(1), 1000);
});

export default app;