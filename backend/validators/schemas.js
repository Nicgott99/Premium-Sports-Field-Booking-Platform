import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation schemas for request body, params, and query parameters
 * Used across controllers for consistent input validation
 */

// Auth validation schemas
export const authSchemas = {
  register: [
    body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').matches(/^[+]?[\d\s()-]{10,}$/).withMessage('Valid phone number is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters').matches(/[A-Z]/).withMessage('Password must contain uppercase letter').matches(/[0-9]/).withMessage('Password must contain number'),
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
};

// Field validation schemas
export const fieldSchemas = {
  createField: [
    body('name').trim().notEmpty().withMessage('Field name is required').isLength({ max: 100 }).withMessage('Field name must be under 100 characters'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
    body('sport').trim().notEmpty().withMessage('Sport is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('coordinates.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('coordinates.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('pricing.hourlyRate').isFloat({ min: 0 }).withMessage('Hourly rate must be positive'),
  ],
  updateField: [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Field name must be 2-100 characters'),
    body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  ],
};

// Booking validation schemas
export const bookingSchemas = {
  createBooking: [
    body('fieldId').isMongoId().withMessage('Valid field ID is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('participants').isInt({ min: 1 }).withMessage('Participants must be at least 1'),
  ],
};

// Review validation schemas
export const reviewSchemas = {
  createReview: [
    body('fieldId').isMongoId().withMessage('Valid field ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').trim().isLength({ min: 10, max: 500 }).withMessage('Comment must be 10-500 characters'),
  ],
};

// Generic validation error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.param, message: e.msg })),
    });
  }
  next();
};
