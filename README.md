# 🏆 CSE471 Premium Sports Platform - MERN Stack

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/hasibullahkhanalvie/cse471-sports-platform)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-6.0+-green.svg)](https://www.mongodb.com/)

A comprehensive, premium sports booking and community platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring real-time communication, advanced analytics, payment processing, and AI-powered recommendations.

## 🌟 Features

### 🔐 Advanced Authentication & Security
- **Firebase Authentication** integration with email/password, Google, Facebook
- **JWT Token** management with refresh tokens and automatic renewal
- **Two-Factor Authentication** (2FA) support
- **Role-based Access Control** (RBAC) with multiple user roles
- **Account lockout** protection against brute force attacks
- **Email verification** and password reset functionality

### 🏟️ Premium Field Management
- **Comprehensive field listings** with advanced search and filtering
- **Real-time availability** checking and booking
- **Dynamic pricing** with peak hours, seasonal rates, and group discounts
- **Multi-media support** - images, videos, virtual tours
- **Geolocation services** for nearby field discovery
- **Field verification** system with document upload
- **Owner dashboard** with analytics and revenue tracking

### 📅 Advanced Booking System
- **Smart booking engine** with conflict detection
- **Recurring bookings** for regular sessions
- **Waitlist management** for fully booked slots
- **Group bookings** with participant management
- **QR code check-in/check-out** system
- **Automated reminders** via email, SMS, and push notifications
- **Flexible cancellation** policies with partial refunds

### 👥 Team & Community Features
- **Team creation and management** with role assignments
- **Tournament organization** with bracket generation
- **Player matching** based on skill level and location
- **Social features** - follow players, teams, and fields
- **Achievement system** with badges and leaderboards
- **Event scheduling** and calendar integration

### 💬 Real-time Communication
- **Socket.IO powered** instant messaging
- **Group chats** for teams and tournaments
- **Voice/Video calls** integration (Premium feature)
- **File sharing** with media gallery
- **Push notifications** via Firebase Cloud Messaging
- **Typing indicators** and read receipts

### 💳 Advanced Payment System
- **Stripe integration** for secure payments
- **Multiple payment methods** - cards, digital wallets, local payments
- **Subscription management** with automatic billing
- **Digital wallet** functionality (Premium feature)
- **Invoice generation** and payment history
- **Refund processing** with automatic calculations

### 📊 Analytics & Insights
- **Real-time dashboards** with interactive charts
- **Revenue analytics** for field owners
- **Usage statistics** and performance metrics
- **Predictive analytics** for demand forecasting
- **Custom reports** generation and export
- **Data visualization** with Chart.js and Recharts

### 🎨 Modern UI/UX
- **Responsive design** optimized for all devices
- **Dark mode** support with system preference detection
- **Progressive Web App** (PWA) capabilities
- **Smooth animations** with Framer Motion and GSAP
- **Accessibility** compliance (WCAG 2.1)
- **Tailwind CSS** with custom design system

## 🛠️ Technology Stack

### Backend
- **Node.js** v18+ - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Primary database with Mongoose ODM
- **Redis** - Caching and session management
- **Socket.IO** - Real-time communication
- **Firebase Admin SDK** - Push notifications and authentication
- **Stripe** - Payment processing
- **Cloudinary** - Media storage and optimization
- **Winston** - Logging system
- **Helmet** - Security middleware
- **Rate limiting** - DDoS protection

### Frontend
- **React.js** v18+ - UI framework
- **Redux Toolkit** - State management with RTK Query
- **React Router** v6 - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Advanced animations
- **Chart.js & Recharts** - Data visualization
- **React Hook Form** - Form management
- **React Query** - Server state management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time features

### DevOps & Tools
- **Vite** - Fast build tool and development server
- **ESLint & Prettier** - Code formatting and linting
- **Jest & Testing Library** - Testing framework
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Vercel/Netlify** - Frontend deployment
- **Railway/Heroku** - Backend deployment

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- MongoDB v6.0 or higher
- Redis server
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hasibullahkhanalvie/cse471-sports-platform.git
cd cse471-sports-platform
```

2. **Backend Setup**
```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install

# Start development server
npm run dev
```

4. **Database Setup**
```bash
# Make sure MongoDB is running
# The application will automatically create collections

# Optional: Seed database with sample data
cd backend
npm run seed
```

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://hasibullahkhanalvie_db_user:Hs3dWdziYhVhbIHw@cluster0.ugevzjs.mongodb.net/CSE471_Premium_Sports?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_SECRET=your-ultra-secure-jwt-secret
JWT_EXPIRE=30d

# Firebase
FIREBASE_PROJECT_ID=cse471-project-2dace
FIREBASE_WEB_API_KEY=AIzaSyANwdvikQfZxAXFlw_QVZgr7eJlqlWUMp0

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis
REDIS_URL=redis://localhost:6379
```

## 📱 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/firebase-login    - Firebase authentication
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh-token     - Refresh JWT token
POST   /api/auth/forgot-password   - Forgot password
POST   /api/auth/reset-password    - Reset password
GET    /api/auth/verify-email      - Verify email
```

### User Management
```
GET    /api/users/profile          - Get user profile
PUT    /api/users/profile          - Update profile
GET    /api/users/bookings         - Get user bookings
GET    /api/users/teams            - Get user teams
POST   /api/users/avatar           - Upload avatar
```

### Field Management
```
GET    /api/fields                 - Get all fields
GET    /api/fields/search          - Search fields
GET    /api/fields/nearby          - Get nearby fields
GET    /api/fields/:id             - Get field details
POST   /api/fields                 - Create field (Owner+)
PUT    /api/fields/:id             - Update field (Owner+)
DELETE /api/fields/:id             - Delete field (Owner+)
```

### Booking System
```
GET    /api/bookings               - Get user bookings
POST   /api/bookings               - Create booking
GET    /api/bookings/:id           - Get booking details
PUT    /api/bookings/:id           - Update booking
DELETE /api/bookings/:id           - Cancel booking
POST   /api/bookings/:id/checkin   - Check-in booking
POST   /api/bookings/:id/checkout  - Check-out booking
```

### Payment Processing
```
POST   /api/payments/create-intent - Create payment intent
POST   /api/payments/confirm       - Confirm payment
GET    /api/payments/history       - Payment history
POST   /api/payments/refund        - Process refund
```

## 🎯 User Roles & Permissions

### 👤 Regular User
- Browse and search fields
- Create and manage bookings
- Join teams and tournaments
- Basic chat functionality
- View personal analytics

### 🏟️ Field Owner
- All user permissions
- Create and manage fields
- View field analytics and revenue
- Manage field bookings
- Access to advanced pricing tools

### 👨‍💼 Manager
- All field owner permissions
- Verify and feature fields
- Moderate content and users
- Access to platform analytics
- Bulk operations

### 🔑 Admin
- Full system access
- User management
- System configuration
- Advanced analytics
- Platform maintenance

## 🔒 Security Features

- **Data encryption** at rest and in transit
- **HTTPS enforcement** with security headers
- **Input validation** and sanitization
- **SQL injection** prevention with parameterized queries
- **XSS protection** with content security policies
- **CSRF protection** with tokens
- **Rate limiting** to prevent abuse
- **Account lockout** after failed attempts
- **Session management** with secure cookies
- **Regular security audits** and updates

## 📊 Performance Optimizations

- **Database indexing** for fast queries
- **Redis caching** for frequently accessed data
- **Image optimization** with Cloudinary
- **Code splitting** and lazy loading
- **Bundle optimization** with Vite
- **CDN integration** for static assets
- **Gzip compression** for responses
- **Database connection pooling**
- **Memory leak prevention**
- **Performance monitoring**

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:watch
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual containers
docker build -t sports-platform-backend ./backend
docker build -t sports-platform-frontend ./frontend
```

### Production Deployment
1. **Backend**: Deploy to Railway, Heroku, or DigitalOcean
2. **Frontend**: Deploy to Vercel, Netlify, or AWS S3
3. **Database**: Use MongoDB Atlas
4. **Redis**: Use Redis Cloud or AWS ElastiCache

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Hasibullah Khan Alvie**
- GitHub: https://github.com/Nicgott99
- Email: hasibullah.kahn.alvie@g.bracu.ac.bd
- LinkedIn: MD. HASIB ULLAH KHAN ALVIE(https://www.linkedin.com/in/md-hasib-ullah-khan-alvie-7681aa27a/)

## 🙏 Acknowledgments

- Thanks to the MERN stack community
- Firebase team for excellent documentation
- Stripe for secure payment processing
- All contributors and testers

## 📈 Roadmap

- [ ] **AI-powered recommendations** for fields and players
- [ ] **Machine learning** for demand prediction
- [ ] **Blockchain integration** for transparent tournaments
- [ ] **IoT integration** for smart field management
- [ ] **Mobile app** development (React Native)
- [ ] **VR/AR features** for virtual field tours
- [ ] **Multi-language support** (i18n)
- [ ] **Advanced tournament management** with brackets
- [ ] **Live streaming** integration for matches
- [ ] **Gamification** with rewards and challenges

## 🔧 Troubleshooting Common Issues

### Server Not Starting

**Issue**: The server fails to start or doesn't respond to API calls.

**Solution**:
1. Check if MongoDB is properly connected before starting the server
2. Ensure the correct port is being used and is not already in use
3. Verify environment variables are correctly set
4. Check for firewall or antivirus blocking the connection

```javascript
// Correct way to start the server (in server.js)
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start server after successful connection
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

### MongoDB Connection Issues

**Issue**: Unable to connect to MongoDB.

**Solution**:
1. Verify the MongoDB connection string is correct
2. Check network connectivity to MongoDB Atlas
3. Ensure IP whitelist includes your current IP
4. Check MongoDB user credentials

```javascript
// Proper MongoDB connection with error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw new Error('Database connection failed');
  }
};
```

### API Endpoint Not Responding

**Issue**: API endpoints return 404 or don't respond.

**Solution**:
1. Verify routes are correctly defined and exported
2. Check if the server is listening on the expected port
3. Ensure CORS is properly configured
4. Use `0.0.0.0` as the listening address instead of `localhost`
5. Test with a simple endpoint first

```javascript
// Simple health check endpoint for testing
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});
```

### Server Running but Not Accessible

**Issue**: Server appears to be running but API calls fail with "Unable to connect to the remote server" error.

**Solution**:
1. Check if the server is listening on `0.0.0.0` instead of just `localhost`
2. Verify there are no binding issues (use `netstat -ano | findstr :5000`)
3. Try a simpler server implementation first for testing
4. Ensure database operations don't block the event loop
5. Check for any middleware that might be hanging

```javascript
// Simplified server for testing
import express from 'express';
const app = express();
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});
app.listen(5000, '0.0.0.0', () => console.log('Server running on port 5000'));
```

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [FAQ](docs/FAQ.md)
2. Search existing [Issues](https://github.com/hasibullahkhanalvie/cse471-sports-platform/issues)
3. Create a new issue with detailed information
4. Join our [Discord community](https://discord.gg/sports-platform)

---

Made with ❤️ by Md Hasib Ullah Khan Alvie(https://github.com/Nicgott99) for CSE471 Project
