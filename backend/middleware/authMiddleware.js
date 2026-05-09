import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../config/firebase.js';
import logger from '../utils/logger.js';

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
export const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
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