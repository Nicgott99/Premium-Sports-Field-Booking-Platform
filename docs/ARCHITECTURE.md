# Architecture Overview
Premium Sports Field Booking Platform

This document outlines the high-level architecture of the Premium Sports Field Booking Platform.

## 1. System Architecture

The platform utilizes a decoupled MERN stack architecture (MongoDB, Express, React, Node.js).

### Frontend (Client-Side)
- **Framework**: React with Vite for fast HMR and optimized builds.
- **Styling**: Tailwind CSS for utility-first, responsive, and themeable designs (Kinetic Elite Design System).
- **State Management**: React Hooks (custom and built-in) and Context API for global state.
- **Routing**: React Router for client-side navigation.

### Backend (Server-Side)
- **Framework**: Node.js with Express.js.
- **API**: RESTful API design.
- **Security**: Helmet, CORS, standard XSS/NoSQL injection sanitization middlewares.
- **Authentication**: JWT (JSON Web Tokens) with short-lived access tokens and refresh tokens.

### Database
- **Primary Database**: MongoDB (via Mongoose ODM).
- **Hosting**: MongoDB Atlas (Cloud).

## 2. Directory Structure

### Backend
```
backend/
├── config/        # Environment and DB configuration
├── controllers/   # Request handling and business logic orchestration
├── middleware/    # Express middlewares (auth, validation, sanitization)
├── models/        # Mongoose schemas and database models
├── routes/        # API route definitions
├── services/      # Core business logic and external integrations (e.g., email, payments)
└── utils/         # Helper functions, formatters, and shared utilities
```

### Frontend
```
frontend/
├── public/        # Static assets
└── src/
    ├── assets/    # Images, global styles
    ├── components/# Reusable UI components (Buttons, Modals, Forms)
    ├── hooks/     # Custom React hooks
    ├── pages/     # Page-level components (Dashboard, Home, Login)
    ├── services/  # API client functions
    └── utils/     # Frontend helper functions and formatters
```

## 3. Key Design Patterns

- **Separation of Concerns**: Controllers handle HTTP specifics, Services handle business logic, Models handle data schemas.
- **Component Reusability**: Frontend UI relies heavily on highly reusable, configurable components (e.g., `Divider`, `Tabs`, `Avatar`, `EmptyState`).
- **Custom Hooks**: Encapsulation of complex frontend logic (e.g., `useCountUp`, `useHover`, `useKeyPress`) to keep components clean.
- **Utility Libraries**: Shared utilities for formatting, validation, and transformations to avoid code duplication across the stack.

## 4. Performance Considerations
(See `PERFORMANCE.md` for in-depth details)
- **Code Splitting**: Utilizing React.lazy and Suspense on the frontend.
- **Database Indexing**: Compound indexes on frequently queried fields in MongoDB.
- **Caching**: Preparation for Redis caching layer on heavy read endpoints.
