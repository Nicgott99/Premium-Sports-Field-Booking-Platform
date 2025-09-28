import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample field data
const sampleFields = [
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
  },
  {
    id: '5',
    name: 'Badminton Center Elite',
    sport: 'Badminton',
    location: 'Khulna, Bangladesh',
    availableSlots: 8,
    rating: 4.5,
    minBookingSize: 2,
    pricePerHour: 800,
    currency: 'BDT',
    imageUrl: 'https://images.unsplash.com/photo-1544944194-965c4c77b7e3?w=800',
    amenities: ['AC Halls', 'Equipment Rental', 'Professional Courts', 'Parking'],
    reviews: 67,
    description: 'Multiple badminton courts with AC facility',
    operatingHours: '6:00 AM - 11:00 PM',
    surface: 'Synthetic Court'
  },
  {
    id: '6',
    name: 'Volleyball Arena',
    sport: 'Volleyball',
    location: 'Barisal, Bangladesh',
    availableSlots: 4,
    rating: 4.3,
    minBookingSize: 6,
    pricePerHour: 1500,
    currency: 'BDT',
    imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800',
    amenities: ['Indoor Court', 'Seating', 'Sound System', 'Parking'],
    reviews: 45,
    description: 'Professional volleyball court for tournaments',
    operatingHours: '7:00 AM - 10:00 PM',
    surface: 'Wooden Floor'
  }
];

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CSE471 Premium Sports Platform API',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running perfectly',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/fields', (req, res) => {
  res.json({
    success: true,
    message: 'Fields retrieved successfully',
    count: sampleFields.length,
    data: sampleFields
  });
});

app.get('/api/fields/:id', (req, res) => {
  const { id } = req.params;
  const field = sampleFields.find(f => f.id === id);
  
  if (!field) {
    return res.status(404).json({
      success: false,
      message: 'Field not found'
    });
  }

  res.json({
    success: true,
    message: 'Field retrieved successfully',
    data: field
  });
});

app.post('/api/bookings', (req, res) => {
  const { fieldId, date, timeSlot, duration, participants } = req.body;
  
  const booking = {
    id: 'booking_' + Date.now(),
    fieldId,
    date,
    timeSlot,
    duration,
    participants: participants || 1,
    status: 'confirmed',
    totalAmount: duration * 2000,
    currency: 'BDT',
    bookingReference: 'SPB' + Date.now(),
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking
  });
});

app.post('/api/auth/register', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { id: 'user_' + Date.now() }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    data: { token: 'jwt_token_' + Date.now() }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log('✅ Ready to accept connections!');
});

export default app;