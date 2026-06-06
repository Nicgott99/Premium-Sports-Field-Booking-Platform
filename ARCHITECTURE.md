# System Architecture

## Project Structure

```
Premium-Sports-Field-Booking-Platform/
├── backend/                    # Node.js/Express API server
│   ├── config/                # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   ├── firebase.js        # Firebase initialization
│   │   ├── redis.js           # Redis client setup
│   │   └── seeder.js          # Database seeding
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── fieldController.js
│   │   └── ...
│   ├── middleware/            # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Field.js
│   │   ├── Booking.js
│   │   └── ...
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── ...
│   ├── utils/                 # Utility functions
│   │   ├── logger.js
│   │   ├── responseFormatter.js
│   │   └── ...
│   ├── .env.example           # Environment template
│   ├── .eslintrc.json         # ESLint config
│   ├── package.json           # Dependencies
│   └── server.js              # Entry point
│
├── frontend/                   # React/Vite application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   └── ...
│   │   ├── services/          # API services
│   │   │   ├── authService.js
│   │   │   ├── apiClient.js
│   │   │   └── ...
│   │   ├── store/             # Redux store
│   │   │   ├── slices/
│   │   │   └── store.js
│   │   ├── styles/            # Global styles
│   │   ├── utils/             # Utilities
│   │   ├── config/            # Configuration
│   │   └── App.jsx            # Root component
│   ├── .env.example           # Environment template
│   ├── .eslintrc.json         # ESLint config
│   ├── vite.config.js         # Vite configuration
│   ├── package.json           # Dependencies
│   └── index.html             # Entry HTML
│
├── docs/                       # Documentation
├── .github/                    # GitHub configuration
│   └── workflows/             # CI/CD workflows
├── docker-compose.yml         # Docker Compose config
├── CONTRIBUTING.md            # Contribution guide
├── DEPLOYMENT.md              # Deployment guide
├── TESTING.md                 # Testing guide
└── README.md                  # Project overview
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│                    React + Vite + Redux                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Frontend CDN / Web Server                        │
│            (Vercel / Netlify / S3+CloudFront)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway / Proxy                          │
│              (nginx / AWS ALB / Vercel)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/WebSocket
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            Backend API Server (Node.js)                      │
│                   Express.js                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Middleware Stack                     │   │
│  │  ├─ Helmet (Security headers)                       │   │
│  │  ├─ CORS (Cross-origin)                             │   │
│  │  ├─ Rate Limiter                                    │   │
│  │  ├─ Authentication                                  │   │
│  │  ├─ Compression                                     │   │
│  │  └─ Error Handling                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  API Routes                          │   │
│  │  ├─ /api/auth (Authentication)                      │   │
│  │  ├─ /api/users (User management)                    │   │
│  │  ├─ /api/fields (Field listings)                    │   │
│  │  ├─ /api/bookings (Booking system)                  │   │
│  │  ├─ /api/payments (Payments)                        │   │
│  │  ├─ /api/chat (Messaging)                           │   │
│  │  └─ /api/analytics (Statistics)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Socket.IO Namespaces                   │   │
│  │  ├─ /chat (Real-time messaging)                     │   │
│  │  ├─ /bookings (Booking updates)                     │   │
│  │  └─ /notifications (Real-time alerts)               │   │
│  └─────────────────────────────────────────────────────┘   │
└───┬─────────────────────────────────────────────┬──────────┘
    │                                             │
    ↓                                             ↓
┌────────────────────────┐              ┌──────────────────┐
│   MongoDB Atlas        │              │   Redis Cloud    │
│   (Main Database)      │              │   (Cache/Queue)  │
│  ├─ Users             │              │  ├─ Sessions     │
│  ├─ Fields            │              │  ├─ Cache        │
│  ├─ Bookings          │              │  └─ Real-time    │
│  ├─ Payments          │              └──────────────────┘
│  ├─ Messages          │
│  └─ Analytics         │
└────────────────────────┘

    ↓
┌────────────────────────────────────────────────────────────┐
│              External Services (APIs)                       │
│  ├─ Firebase (Auth + Push notifications)                  │
│  ├─ Stripe (Payment processing)                           │
│  ├─ Cloudinary (Image storage + optimization)             │
│  ├─ SendGrid/Gmail (Email service)                        │
│  └─ Google Maps (Geolocation)                             │
└────────────────────────────────────────────────────────────┘
```

## Data Flow

### User Registration Flow
```
1. User fills registration form (Frontend)
   ↓
2. Submit to POST /api/auth/register (Backend)
   ↓
3. Validate input (Backend middleware)
   ↓
4. Hash password with bcrypt (Backend)
   ↓
5. Create user in MongoDB (Database)
   ↓
6. Generate JWT token (Backend)
   ↓
7. Send verification email (Email service)
   ↓
8. Return token to Frontend
   ↓
9. Store token in localStorage (Frontend)
   ↓
10. Redirect to dashboard (Frontend)
```

### Booking Creation Flow
```
1. User selects field and time (Frontend)
   ↓
2. Check availability (POST /api/fields/:id/availability)
   ↓
3. Create booking (POST /api/bookings)
   ↓
4. Create payment intent (Stripe)
   ↓
5. Process payment (Frontend + Stripe)
   ↓
6. Confirm payment (POST /api/payments/confirm)
   ↓
7. Update booking status in MongoDB
   ↓
8. Send confirmation email
   ↓
9. Emit Socket.IO event to field owner
   ↓
10. Show success to user (Frontend)
```

## Technology Stack Details

### Backend

**Framework:** Express.js 4.18+
- Routing
- Middleware
- Error handling
- Request/response handling

**Database:** MongoDB 6.0+
- Document store
- Scalable
- Flexible schema
- ACID transactions

**Caching:** Redis
- Session management
- Data caching
- Real-time queues
- Pub/Sub for Socket.IO

**Authentication:**
- JWT tokens
- Firebase Auth
- 2FA support
- Refresh tokens

**File Storage:** Cloudinary
- Image optimization
- CDN integration
- URL-based delivery
- Transformation API

**Real-time:** Socket.IO
- WebSocket connection
- Multiple namespaces
- Room-based messaging
- Automatic reconnection

**Email:** Nodemailer + Gmail
- Account notifications
- Password resets
- Booking confirmations
- Newsletter

**Payments:** Stripe
- Payment processing
- Webhook handling
- Refund management
- Invoice generation

### Frontend

**Framework:** React 18+
- Component-based
- Hooks API
- JSX syntax
- Virtual DOM

**Build Tool:** Vite
- Fast HMR
- Optimized bundles
- ES modules
- Plugin system

**Styling:** Tailwind CSS
- Utility-first
- Responsive design
- Custom components
- Dark mode support

**State Management:** Redux Toolkit
- Global state
- RTK Query for data fetching
- DevTools integration
- Middleware support

**UI Components:**
- Radix UI (headless)
- Headless UI
- Custom component library
- Accessibility focus

**Forms:** React Hook Form
- Efficient validation
- Minimal re-renders
- Small bundle size
- Good UX

**HTTP Client:** Axios
- Request/response interceptors
- Global error handling
- Request cancellation
- Timeout configuration

**Real-time:** Socket.IO Client
- Event-based communication
- Automatic reconnection
- Room management
- Binary support

**Routing:** React Router v6
- Nested routes
- Dynamic segments
- Lazy loading
- Protected routes

## Security Architecture

### Authentication Flow
```
Login → Validate Credentials → Generate JWT → 
Return Access Token + Refresh Token → 
Store in localStorage → 
Include in API requests (Authorization header)
```

### Data Encryption
- HTTPS/TLS in transit
- Password hashing (bcrypt)
- Sensitive data sanitization
- Environment variable protection

### API Security
- Rate limiting
- CORS protection
- Helmet.js security headers
- CSRF protection
- Input validation
- Parameterized queries

### Infrastructure Security
- MongoDB Atlas IP whitelisting
- Firewall rules
- DDoS protection
- Regular security audits

## Scalability Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- MongoDB replication sets
- Redis cluster
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Database optimization
- Query caching
- Connection pooling

### Caching Strategy
- Redis for sessions and frequently accessed data
- HTTP caching headers
- Browser caching
- CDN edge caching

### Database Optimization
- Proper indexing
- Query optimization
- Connection pooling
- Read replicas for read-heavy operations

## Error Handling

### Error Types
- **Client Errors (4xx)** - Bad request, unauthorized, not found
- **Server Errors (5xx)** - Internal errors, service unavailable
- **Validation Errors** - Invalid input, constraint violations
- **Authentication Errors** - Invalid token, expired session

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": "Additional details if available"
  }
}
```

## Monitoring and Logging

### Logging Levels
- **ERROR** - Critical errors
- **WARN** - Warning conditions
- **INFO** - General information
- **DEBUG** - Debug information

### Metrics
- API response times
- Error rates
- Database query times
- Cache hit rates
- User activity

### Tools
- Winston (logging)
- Sentry (error tracking)
- New Relic (performance)
- DataDog (infrastructure)

## Deployment Strategy

### Development
- Local development with nodemon
- Hot module reload with Vite
- Console logging
- No minification

### Staging
- Docker containers
- Production-like configuration
- Database backups enabled
- SSL certificates

### Production
- Load balanced infrastructure
- Auto-scaling policies
- Database replication
- CDN for static assets
- Monitoring and alerts
- Automated backups

---

**Last Updated:** March 2024
**Version:** 1.0.0
