import asyncHandler from 'express-async-handler';
import Field from '../models/Field.js';
import logger from '../utils/logger.js';

/**
 * Field Owner Authorization Middleware
 * Verifies user is the field owner or admin before allowing operations
 */

/**
 * Verify user owns the field
 * @middleware
 * @param {Object} req - Express request (must have req.user and req.params.fieldId)
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 * @throws {Error} 403 - If user is not field owner
 * @throws {Error} 404 - If field not found
 */
export const verifyFieldOwner = asyncHandler(async (req, res, next) => {
  const { fieldId } = req.params;
  const userId = req.user?.id;

  // Validate parameters
  if (!fieldId) {
    res.status(400);
    throw new Error('Field ID is required in URL parameters');
  }

  if (!userId) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  try {
    // Fetch field
    const field = await Field.findById(fieldId).select('owner');

    if (!field) {
      res.status(404);
      throw new Error('Field not found');
    }

    // Convert owner ID to string for comparison (in case one is ObjectId, other is string)
    const ownerId = field.owner?.toString();
    const currentUserId = userId.toString();

    // Check if user is field owner or admin
    if (ownerId !== currentUserId && req.user?.role !== 'admin') {
      logger.warn(`Unauthorized field access attempt: user ${userId} tried to access field ${fieldId}`);
      res.status(403);
      throw new Error('Not authorized to manage this field');
    }

    // Attach field to request for use in controller
    req.field = field;

    next();
  } catch (error) {
    if (!res.headersSent) {
      logger.error(`Field owner verification error: ${error.message}`);
      if (!res.statusCode || res.statusCode === 200) {
        res.status(500);
      }
    }
    throw error;
  }
});

/**
 * Verify user can manage field bookings
 * Field owner, manager, or admin can manage
 * @middleware
 */
export const verifyFieldManager = asyncHandler(async (req, res, next) => {
  const { fieldId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!fieldId || !userId) {
    res.status(400);
    throw new Error('Field ID and authentication required');
  }

  // Admins can manage any field
  if (userRole === 'admin') {
    return next();
  }

  try {
    const field = await Field.findById(fieldId).select('owner managers');

    if (!field) {
      res.status(404);
      throw new Error('Field not found');
    }

    const ownerId = field.owner?.toString();
    const currentUserId = userId.toString();
    const isManager = field.managers?.some(m => m?.toString() === currentUserId);

    // Owner or manager
    if (ownerId === currentUserId || isManager) {
      req.field = field;
      return next();
    }

    res.status(403);
    throw new Error('Not authorized to manage this field');
  } catch (error) {
    if (!res.headersSent) {
      if (!res.statusCode || res.statusCode === 200) {
        res.status(500);
      }
    }
    throw error;
  }
});

/**
 * Optional field owner check (doesn't throw if not owner)
 * Useful for endpoints that serve different data based on ownership
 */
export const optionalFieldOwnerCheck = asyncHandler(async (req, res, next) => {
  const { fieldId } = req.params;
  const userId = req.user?.id;

  if (fieldId && userId) {
    try {
      const field = await Field.findById(fieldId).select('owner');
      if (field) {
        const ownerId = field.owner?.toString();
        const currentUserId = userId.toString();
        req.isFieldOwner = ownerId === currentUserId || req.user?.role === 'admin';
        req.field = field;
      }
    } catch (error) {
      logger.debug(`Optional field owner check failed: ${error.message}`);
      // Silently fail, continue with req.isFieldOwner = false
    }
  }

  next();
});

export default {
  verifyFieldOwner,
  verifyFieldManager,
  optionalFieldOwnerCheck
};
