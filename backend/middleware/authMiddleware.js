import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../config/firebase.js';
import logger from '../utils/logger.js';

// Protect routes - JWT Authentication
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('profile')
        .populate('subscription');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      if (!req.user.isActive) {
        res.status(401);
        throw new Error('Account is deactivated');
      }

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

// Firebase Authentication
export const protectFirebase = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(token);
      
      // Get user from database
      req.user = await User.findOne({ firebaseUid: decodedToken.uid })
        .select('-password')
        .populate('profile')
        .populate('subscription');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      if (!req.user.isActive) {
        res.status(401);
        throw new Error('Account is deactivated');
      }

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

// Admin authorization
export const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
});

// Manager authorization (admin or manager)
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