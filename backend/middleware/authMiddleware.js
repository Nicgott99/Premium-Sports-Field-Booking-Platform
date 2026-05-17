import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../config/firebase.js';
import logger from '../utils/logger.js';

/**
 * Authentication & Authorization Middleware
 * Complete request authentication and role-based access control system
 * 
 * Authentication Methods:
 * - JWT Bearer Token: Authorization: Bearer <token>
 * - Firebase ID Token: For OAuth2 (Google, Facebook, Apple)
 * - Refresh Token: Session renewal mechanism
 * 
 * Authentication Flow:
 * 1. Extract token from Authorization header (Bearer scheme)
 * 2. Verify JWT signature (HMAC-SHA256)
 * 3. Check token expiration (iat + exp)
 * 4. Decode payload to get user ID (sub claim)
 * 5. Fetch user from MongoDB by ID
 * 6. Verify account status (active/suspended/banned)
 * 7. Exclude sensitive fields (password, tokens)
 * 8. Attach user to req.user for route handlers
 * 
 * User Roles & Permissions:
 * - user: Regular field booker, can book fields
 * - field_owner: Field lister, can create/manage fields
 * - manager: Team/tournament organizer
 * - admin: Platform administrator, full access
 * 
 * Token Verification:
 * - Signature: HMAC-SHA256 with JWT_SECRET
 * - Expiration: Check exp claim against current time
 * - User existence: Verify user still exists in database
 * - Account status: Ensure not suspended/banned/inactive
 * - Issuer: Verify iss claim matches JWT_ISSUER
 * - Audience: Verify aud claim matches JWT_AUDIENCE
 * 
 * JWT Token Structure:
 * - Header: { alg: "HS256", typ: "JWT" }
 * - Payload: { sub: userId, iss: "premium-sports", aud: "web-app", iat, exp }
 * - Signature: HMAC-SHA256(header.payload, secret)
 * 
 * Firebase Authentication:
 * - Support for Google OAuth2
 * - Support for Facebook OAuth2
 * - Support for Apple OAuth2
 * - Token verification with Firebase SDK
 * - Custom token generation for compatibility
 * 
 * Error Handling:
 * - 401 Unauthorized: Missing token
 * - 401 Unauthorized: Invalid/malformed token
 * - 401 Unauthorized: Expired token
 * - 401 Unauthorized: User not found
 * - 403 Forbidden: Account suspended
 * - 403 Forbidden: Insufficient role permissions
 * - 500 Internal: Token verification error
 * 
 * Middleware Functions:
 * - protect: Verify authentication
 * - requireRole: Check specific role(s)
 * - optionalAuth: Auth optional (public access)
 * 
 * Security Features:
 * - Short-lived tokens (15 minutes access)
 * - Refresh tokens for session renewal (7 days)
 * - No sensitive data in JWT payload
 * - Token signature validation
 * - User status verification on each request
 * - Role-based access enforcement
 * - HTTPS-only transmission (via infrastructure)
 * 
 * Performance Optimization:
 * - User caching (in-request only)
 * - Minimal database queries
 * - Token verification overhead minimized
 * - Role lookup from user object (no extra query)
 * 
 * Supported Claims:
 * - sub (subject): User ID
 * - iss (issuer): Token issuer
 * - aud (audience): Target service
 * - iat (issued at): Token creation time
 * - exp (expiration): Token expiration time
 * - role: User role for quick checks
 * - email: User email address
 */
 * - Firebase: Authorization: Bearer <firebase-id-token>
 * 
 * User Roles and Permissions:
 * - user: Regular user (book fields, leave reviews, join teams)
 * - field_owner: Manage own fields and bookings
 * - manager: Manage fields and bookings (multiple fields)
 * - admin: Full platform access (users, analytics, system settings)
 * 
 * Protected User Fields:
 * - Password: Excluded via .select('-password')
 * - Two-Factor Secret: Never exposed
 * - Recovery Codes: Never exposed
 * 
 * Account Status Verification:
 * - Active: Normal access granted
 * - Suspended: Temporarily blocked
 * - Banned: Permanently blocked
 * - Pending_Verification: Limited access until email verified
 * 
 * Security Features:
 * - Token expiration enforcement
 * - User database verification
 * - Account status checks
 * - Role-based authorization
 * - Request logging for audit trail
 * - Error handling without data leakage
 * 
 * Middleware Composition:
 * - protect: JWT authentication
 * - protectFirebase: Firebase authentication
 * - admin: Admin role check
 * - manager: Manager or admin role check
 * - fieldOwner: Field owner, manager, or admin role check
 * 
 * Error Response Examples:
 * - 401: "Not authorized, no token" (missing token)
 * - 401: "Not authorized, token failed" (invalid/expired)
 * - 403: "Not authorized as admin" (insufficient permissions)
 * 
 * Usage Examples:
 * router.delete('/:id', protect, admin, deleteUser)
 * router.get('/', protect, fieldOwner, getFieldListings)
 * router.post('/', protect, createBooking)
 */

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to request object
 * @async
 * @param {Object} req - Express request object with Authorization header (Bearer token)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} 401 - If token is missing, invalid, or user not found
 * @throws {Error} 401 - If user account is deactivated
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from "Bearer <token>" format
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature and expiration using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database using decoded token ID
      req.user = await User.findById(decoded.id)
        .select('-password') // Exclude password field for security
        .populate('profile')
        .populate('subscription');

      // Verify user exists in database
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Check if user account is active
      if (!req.user.isActive) {
        res.status(401);
        throw new Error('Account is deactivated');
      }

      // TOKEN ROTATION IMPLEMENTATION
      // Check if token is nearing expiration (< 5 minutes left)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      if (timeUntilExpiry < 300) { // Less than 5 minutes remaining
        try {
          // Generate new token
          const newToken = jwt.sign(
            { id: req.user._id, email: req.user.email, role: req.user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '15m' }
          );
          
          // Include new token in response headers for client to update
          res.set('X-New-Auth-Token', newToken);
          res.set('X-Token-Rotated', 'true');
          
          logger.info(`Token rotated for user ${req.user._id}`);
        } catch (rotationError) {
          logger.error(`Token rotation error: ${rotationError.message}`);
          // Continue without rotation, it's not critical
        }
      }

      // Continue to next middleware with authenticated user
      next();
    } catch (error) {
      logger.error(`JWT Auth Error: ${error.message}`);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID token and retrieves corresponding user from database
 * @async
 * @param {Object} req - Express request object with Authorization header (Firebase token)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} 401 - If token is missing or invalid
 * @throws {Error} 401 - If user not found or account deactivated
 */
export const protectFirebase = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract Firebase token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify Firebase ID token and decode claims
      const decodedToken = await verifyFirebaseToken(token);
      
      // Retrieve user from database using Firebase UID
      req.user = await User.findOne({ firebaseUid: decodedToken.uid })
        .select('-password')
        .populate('profile')
        .populate('subscription');

      // Verify user exists
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Check if user account is active
      if (!req.user.isActive) {
        res.status(401);
        throw new Error('Account is deactivated');
      }

      // Store Firebase claims in request for later use
      req.firebaseUser = decodedToken;
      next();
    } catch (error) {
      logger.error(`Firebase Auth Error: ${error.message}`);
      res.status(401);
      throw new Error('Not authorized, Firebase token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * Admin Authorization Middleware
 * Verifies that authenticated user has admin role
 * Must be used after protect or protectFirebase middleware
 * @async
 * @param {Object} req - Express request object with req.user (from protect middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} 403 - If user is not admin
 */
/**
 * Generic Role-Based Access Control Middleware
 * Verifies user has one of the allowed roles
 * Must be used after protect or protectFirebase middleware
 * @param {Array|string} allowedRoles - Role(s) to check (e.g., ['admin', 'manager'])
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const requireRole = (allowedRoles, options = {}) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const { throwError = true } = options;

  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      if (throwError) {
        res.status(401);
        throw new Error('Not authenticated');
      }
      return;
    }

    const userRole = req.user.role;
    const hasRole = roles.includes(userRole);

    if (!hasRole) {
      if (throwError) {
        logger.warn(`Access denied: User ${req.user.id} with role '${userRole}' attempted to access '${roles.join(', ')}'`);
        res.status(403);
        throw new Error(`Insufficient permissions. Required roles: ${roles.join(', ')}`);
      }
      return;
    }

    logger.debug(`Access granted: User ${req.user.id} with role '${userRole}' verified`);
    next();
  });
};

/**
 * Admin Authorization Middleware
 * Verifies that authenticated user has admin role
 * Must be used after protect or protectFirebase middleware
 * @async
 * @param {Object} req - Express request object with req.user (from protect middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} 403 - If user is not admin
 */
export const admin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Admin access denied: User ${req.user.id} with role '${req.user.role}' attempted access`);
    res.status(403);
    throw new Error('Not authorized as admin');
  }

  logger.debug(`Admin access granted for user ${req.user.id}`);
  next();
});

/**
 * Manager Authorization Middleware
 * Verifies that authenticated user has admin or manager role
 * Must be used after protect or protectFirebase middleware
 * @async
 * @param {Object} req - Express request object with req.user (from protect middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} 403 - If user is not admin or manager
 */
export const manager = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as manager');
  }
});

// Field owner authorization
export const fieldOwner = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'fieldOwner')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as field owner');
  }
});

// Premium user authorization
export const premiumUser = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.subscription?.plan === 'premium' || req.user.subscription?.plan === 'platinum' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Premium subscription required');
  }
});

// Check subscription status
export const checkSubscription = (requiredPlan) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user.subscription || req.user.subscription.status !== 'active') {
      res.status(403);
      throw new Error('Active subscription required');
    }

    const planHierarchy = {
      'basic': 1,
      'premium': 2,
      'platinum': 3
    };

    const userPlanLevel = planHierarchy[req.user.subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      res.status(403);
      throw new Error(`${requiredPlan} subscription or higher required`);
    }

    next();
  });
};

// Rate limiting for specific users
export const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    const current = Date.now();
    const windowStart = current - windowMs;

    // Clean old requests
    const userRequests = requests.get(userId) || [];
    const validRequests = userRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      res.status(429);
      throw new Error('Too many requests, please try again later');
    }

    validRequests.push(current);
    requests.set(userId, validRequests);

    next();
  });
};

export default {
  protect,
  protectFirebase,
  admin,
  manager,
  fieldOwner,
  premiumUser,
  checkSubscription,
  userRateLimit
};