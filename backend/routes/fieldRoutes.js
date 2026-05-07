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
  updateFieldAvailability,
  getFieldBookings,
  getFieldStats,
  getFieldReviews,
  verifyField,
  reportField,
  addToWishlist,
  removeFromWishlist
} from '../controllers/fieldController.js';

import { protect, admin, manager, fieldOwner } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { cache } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes (with caching)
router.get('/', cache(300), getFields); // Cache for 5 minutes
router.get('/search', cache(300), searchFields);
router.get('/nearby', cache(300), getNearbyFields);
router.get('/featured', cache(600), getFeaturedFields); // Cache for 10 minutes
router.get('/top-rated', cache(600), getTopRatedFields);
router.get('/:id', cache(300), getField);
router.get('/:id/reviews', cache(300), getFieldReviews);

// Protected routes
router.use(protect);

// Field management (field owners and above)
router.post('/', fieldOwner, createField);
router.put('/:id', fieldOwner, updateField);
router.delete('/:id', fieldOwner, deleteField);

// Media management
router.post('/:id/images', fieldOwner, upload.array('images', 10), uploadFieldImages);
router.delete('/:id/images/:imageId', fieldOwner, deleteFieldImage);

// Availability
router.put('/:id/availability', fieldOwner, updateFieldAvailability);

// Field data
router.get('/:id/bookings', fieldOwner, getFieldBookings);
router.get('/:id/stats', fieldOwner, getFieldStats);

// Reporting
router.post('/:id/report', reportField);

// Wishlist
router.post('/:id/wishlist', addToWishlist);
router.delete('/:id/wishlist', removeFromWishlist);

// Owner-specific routes
router.get('/owner/fields', fieldOwner, getFieldsByOwner);

// Admin routes
router.put('/:id/verify', admin, verifyField);

export default router;