import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection Test
app.get('/api/db-test', async (req, res) => {
  try {
    // Test if MongoDB connection is working
    const mongoose = await import('mongoose');
    const connectionState = mongoose.default.connection.readyState;
    
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
      host: mongoose.default.connection.host || 'Not connected',
      database: mongoose.default.connection.name || 'Not connected',
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
      'db-test': '/api/db-test'
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
      console.log(`🔍 MongoDB test at http://localhost:${PORT}/api/db-test`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();