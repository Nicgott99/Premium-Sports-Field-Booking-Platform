import express from 'express';
import {
  getAnalytics,
  getUserAnalytics,
  getFieldAnalytics,
  getBookingAnalytics,
  getRevenueAnalytics,
  getPerformanceMetrics,
  getTrafficAnalytics,
  getConversionAnalytics,
  getUserBehaviorAnalytics,
  getGeoAnalytics,
  getDeviceAnalytics,
  generateReport,
  exportAnalytics,
  getRealTimeStats,
  getDashboardData
} from '../controllers/analyticsController.js';

import { protect, admin, manager, fieldOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// General analytics (accessible to all authenticated users)
router.get('/dashboard', getDashboardData);
router.get('/real-time', getRealTimeStats);

// Field owner analytics
router.get('/field/:fieldId', fieldOwner, getFieldAnalytics);
router.get('/booking/:fieldId', fieldOwner, getBookingAnalytics);
router.get('/revenue/:fieldId', fieldOwner, getRevenueAnalytics);

// Manager and admin analytics
router.get('/users', manager, getUserAnalytics);
router.get('/performance', manager, getPerformanceMetrics);
router.get('/traffic', manager, getTrafficAnalytics);
router.get('/conversion', manager, getConversionAnalytics);
router.get('/user-behavior', manager, getUserBehaviorAnalytics);
router.get('/geo', manager, getGeoAnalytics);
router.get('/device', manager, getDeviceAnalytics);

// Admin only analytics
router.get('/overview', admin, getAnalytics);
router.post('/report', admin, generateReport);
router.get('/export', admin, exportAnalytics);

export default router;