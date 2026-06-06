# API Documentation

This document provides comprehensive documentation for all API endpoints.

**Base URL:** `http://localhost:5000/api/v1`

## Authentication

Include JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Quick Reference

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/firebase-login` - Firebase authentication
- `POST /auth/logout` - Logout user
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/verify-email` - Verify email

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/bookings` - Get user bookings
- `GET /users/teams` - Get user teams
- `POST /users/avatar` - Upload avatar

### Field Management
- `GET /fields` - Get all fields
- `GET /fields/:id` - Get field details
- `POST /fields` - Create field (Owner+)
- `PUT /fields/:id` - Update field (Owner+)
- `DELETE /fields/:id` - Delete field (Owner+)
- `GET /fields/search` - Search fields
- `GET /fields/nearby` - Get nearby fields

### Booking System
- `GET /bookings` - Get user bookings
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking
- `POST /bookings/:id/checkin` - Check-in
- `POST /bookings/:id/checkout` - Check-out

### Payment Processing
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment
- `GET /payments/history` - Payment history
- `POST /payments/refund` - Process refund

### Chat System
- `GET /chat/rooms` - Get chat rooms
- `GET /chat/rooms/:roomId/messages` - Get messages
- `POST /chat/rooms/:roomId/messages` - Send message

### Admin Operations
- `GET /admin/users` - Get all users (Admin)
- `PUT /admin/users/:userId/role` - Update role (Admin)
- `GET /admin/analytics` - Platform analytics (Admin)

### Analytics
- `GET /analytics/user` - User analytics
- `GET /analytics/field/:fieldId` - Field analytics (Owner)

## Error Handling

All errors follow a standard format with status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes
- Payment endpoints: 10 requests per minute

For detailed documentation of each endpoint, see the full API documentation file in the repository documentation.

**Status:** Active
**Version:** 1.0.0
