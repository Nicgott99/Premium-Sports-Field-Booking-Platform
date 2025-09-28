// Simple Express server with minimal configuration
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Premium MERN Sports Platform API',
    version: '1.0.0',
    description: 'Advanced sports facility booking platform',
    author: 'CSE471 Team'
  });
});

// Fields endpoint (sample data)
app.get('/api/fields', (req, res) => {
  const fields = [
    {
      id: 'field_1',
      name: 'Premium Football Field',
      type: 'Football',
      capacity: 22,
      pricePerHour: 150,
      amenities: ['Floodlights', 'Changing Rooms', 'Parking'],
      availability: 'Available'
    },
    {
      id: 'field_2',
      name: 'Elite Basketball Court',
      type: 'Basketball',
      capacity: 12,
      pricePerHour: 100,
      amenities: ['Air Conditioning', 'Sound System'],
      availability: 'Available'
    }
  ];
  
  res.json({
    success: true,
    data: { fields, total: fields.length }
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
});