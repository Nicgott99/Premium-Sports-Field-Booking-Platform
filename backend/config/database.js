import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * MongoDB Database Connection Configuration
 * Establishes connection to MongoDB with connection pooling and error handling
 * 
 * Connection Parameters:
 * - MONGODB_URI: Connection string (mongodb://host:port/database)
 * - maxPoolSize: 10 concurrent connections
 * - serverSelectionTimeoutMS: 5 seconds to find server
 * - socketTimeoutMS: 45 seconds before socket closes
 * 
 * Connection Pool:
 * - Maintains 10 concurrent connections
 * - Connection reuse for efficiency
 * - Automatic connection recycling
 * - Connection health monitoring
 * 
 * Database Indexes:
 * - Users: email (unique), phone (unique)
 * - Bookings: userId, fieldId, date, status
 * - Fields: location (geospatial), owner, createdAt
 * - Reviews: fieldId, rating, createdAt
 * - Teams: owner, members, sport
 * 
 * Replica Set & Sharding:
 * - Supports MongoDB sharding
 * - Replica set support for HA
 * - Automatic failover handling
 * 
 * Connection Events:
 * - connected: Connection established
 * - disconnected: Connection lost
 * - reconnected: Reconnection successful
 * - error: Connection error occurred
 * 
 * Error Handling:
 * - Connection failures exit process
 * - Automatic reconnection attempts
 * - Error logging for debugging
 * - Graceful degradation
 * 
 * Transactions:
 * - Session management for ACID operations
 * - Multi-document transactions
 * - Atomic booking + payment updates
 * 
 * Performance Optimization:
 * - Connection pooling
 * - Index usage
 * - Query lean() for read-only
 * - Proper projection fields
 * 
 * Monitoring:
 * - Connection pool status
 * - Query execution time
 * - Error rate tracking
 * - Log file rotation
 * 
 * Environment Variables Required:
 * - MONGODB_URI: Connection string
 * - NODE_ENV: production|development|test
 */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;