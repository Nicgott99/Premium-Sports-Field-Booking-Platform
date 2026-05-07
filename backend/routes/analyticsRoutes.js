import express from 'express';
import {
  getPlatformAnalytics,
  getBookingAnalytics,
  getUserAnalytics,
  getRevenueAnalytics,
  getFieldAnalytics,
  getDashboardData,
  exportAnalytics
} from '../controllers/analyticsController.js';

import { protect, admin, manager, fieldOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// General analytics (accessible to all authenticated users)
router.get('/dashboard', getDashboardData);
router.get('/platform', admin, getPlatformAnalytics);

// Analytics by type
router.get('/bookings', manager, getBookingAnalytics);
router.get('/users', manager, getUserAnalytics);
router.get('/revenue', manager, getRevenueAnalytics);
router.get('/fields/:fieldId', fieldOwner, getFieldAnalytics);

// Data export
router.get('/export', admin, exportAnalytics);

export default router;