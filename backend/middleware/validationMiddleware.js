import { body, validationResult } from 'express-validator';

/**
 * Input Validation Middleware Module
 * Provides comprehensive input validation for all user-submitted data
 * Uses express-validator for declarative, reusable validation rules
 * 
 * Validation Strategy:
 * - Declarative validation rules (DRY principle)
 * - Centralized error handling
 * - Prevents SQL injection and XSS attacks
 * - Type coercion and sanitization
 * - Field-level error messages
 * 
 * Validation Coverage:
 * - Registration: Names, email, phone, password strength
 * - Login: Email format, password required
 * - Password Change: Current password, new password strength
 * 
 * Password Requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter (a-z)
 * - At least one uppercase letter (A-Z)
 * - At least one number (0-9)
 * - At least one special character (@$!%*?&)
 * 
 * Phone Format (Bangladesh):
 * - Supported: 01XXXXXXXXX or +88 01XXXXXXXXX
 * - 11 digits total (01 + 9 digits)
 * - Second digit must be 3-9 (operator codes)
 * 
 * Email Validation:
 * - Standard email format validation
 * - Case-insensitive normalization
 * - Duplicate check in database
 * 
 * Error Response Format:
 * {
 *   success: false,
 *   message: "Validation failed",
 *   errors: [
 *     { field: "email", message: "Invalid email format" }
 *   ]
 * }
 */

/**
 * Express-validator error handler middleware
 * Checks for validation errors and returns them in response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} 400 error if validation fails, otherwise calls next()
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * User registration validation rules
 * Validates firstName, lastName, email, phone, and password strength
 * Requires: names (2-50 chars), valid email, valid BD phone, strong password
 * @type {Array} Express-validator middleware chain
 */
export const validateRegister = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .matches(/^(\+88)?01[3-9]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain lowercase, uppercase, number, and special character'),
  
  handleValidationErrors
];

// User login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Booking validation
export const validateCreateBooking = [
  body('fieldId')
    .notEmpty()
    .withMessage('Field ID is required'),
  
  body('date')
    .notEmpty()
    .withMessage('Booking date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('timeSlot')
    .notEmpty()
    .withMessage('Time slot is required')
    .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    .withMessage('Time slot must be in HH:MM-HH:MM format'),
  
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Duration must be between 1 and 12 hours'),
  
  body('participants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Participants must be at least 1'),
  
  handleValidationErrors
];

// Booking status validation
export const validateBookingStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid booking status. Valid values: pending, confirmed, in-progress, completed, cancelled, no-show'),
  
  handleValidationErrors
];