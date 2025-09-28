import express from 'express';
import {
  getFields,
  getField,
  createField,
  updateField,
  deleteField,
  searchFields,
  getNearbyFields,
  getFeaturedFields,
  getTopRatedFields,
  getFieldsByOwner,
  uploadFieldImages,
  deleteFieldImage,
  uploadFieldVideos,
  deleteFieldVideo,
  updateFieldAvailability,
  checkFieldAvailability,
  getFieldBookings,
  getFieldStats,
  getFieldAnalytics,
  followField,
  unfollowField,
  getFieldFollowers,
  reportField,
  verifyField,
  featureField,
  unfeatureField,
  updateFieldPricing,
  getFieldReviews,
  bulkUpdateFields,
  exportFieldData,
  duplicateField
} from '../controllers/fieldController.js';

import { protect, admin, manager, fieldOwner } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes (with caching)
router.get('/', cacheMiddleware(300), getFields); // Cache for 5 minutes
router.get('/search', cacheMiddleware(300), searchFields);
router.get('/nearby', cacheMiddleware(300), getNearbyFields);
router.get('/featured', cacheMiddleware(600), getFeaturedFields); // Cache for 10 minutes
router.get('/top-rated', cacheMiddleware(600), getTopRatedFields);
router.get('/:id', cacheMiddleware(300), getField);
router.get('/:id/reviews', cacheMiddleware(300), getFieldReviews);
router.get('/:id/availability', checkFieldAvailability);

// Protected routes
router.use(protect);

// Field management (field owners and above)
router.post('/', fieldOwner, createField);
router.put('/:id', fieldOwner, updateField);
router.delete('/:id', fieldOwner, deleteField);
router.post('/:id/duplicate', fieldOwner, duplicateField);

// Media management
router.post('/:id/images', fieldOwner, upload.array('images', 10), uploadFieldImages);
router.delete('/:id/images/:imageId', fieldOwner, deleteFieldImage);
router.post('/:id/videos', fieldOwner, upload.array('videos', 5), uploadFieldVideos);
router.delete('/:id/videos/:videoId', fieldOwner, deleteFieldVideo);

// Availability and pricing
router.put('/:id/availability', fieldOwner, updateFieldAvailability);
router.put('/:id/pricing', fieldOwner, updateFieldPricing);

// Field data and analytics
router.get('/:id/bookings', fieldOwner, getFieldBookings);
router.get('/:id/stats', fieldOwner, getFieldStats);
router.get('/:id/analytics', fieldOwner, getFieldAnalytics);
router.get('/:id/export', fieldOwner, exportFieldData);

// Social features
router.post('/:id/follow', followField);
router.delete('/:id/follow', unfollowField);
router.get('/:id/followers', getFieldFollowers);

// Reporting and moderation
router.post('/:id/report', reportField);

// Owner-specific routes
router.get('/owner/fields', fieldOwner, getFieldsByOwner);

// Admin routes
router.put('/:id/verify', admin, verifyField);
router.put('/:id/feature', admin, featureField);
router.delete('/:id/feature', admin, unfeatureField);
router.put('/bulk-update', admin, bulkUpdateFields);

export default router;