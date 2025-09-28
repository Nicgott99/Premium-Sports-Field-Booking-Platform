import express from 'express';
import {
  getDashboardStats,
  getUserManagement,
  getFieldManagement,
  getBookingManagement,
  getPaymentManagement,
  getSystemHealth,
  getAnalytics,
  manageUsers,
  manageFields,
  manageBookings,
  managePayments,
  systemSettings,
  backupData,
  restoreData,
  sendBulkNotifications,
  generateReports,
  auditLogs,
  performanceMetrics,
  securityMonitoring
} from '../controllers/adminController.js';

import { protect, admin, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Dashboard and overview
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/system-health', getSystemHealth);
router.get('/performance', performanceMetrics);
router.get('/security', securityMonitoring);

// User management
router.get('/users', getUserManagement);
router.put('/users/:id', manageUsers);
router.delete('/users/:id', manageUsers);

// Field management
router.get('/fields', getFieldManagement);
router.put('/fields/:id', manageFields);
router.delete('/fields/:id', manageFields);

// Booking management
router.get('/bookings', getBookingManagement);
router.put('/bookings/:id', manageBookings);
router.delete('/bookings/:id', manageBookings);

// Payment management
router.get('/payments', getPaymentManagement);
router.put('/payments/:id', managePayments);

// System operations
router.get('/settings', systemSettings);
router.put('/settings', systemSettings);
router.post('/backup', backupData);
router.post('/restore', restoreData);

// Communication
router.post('/notifications/bulk', sendBulkNotifications);

// Reports and logs
router.get('/reports', generateReports);
router.post('/reports', generateReports);
router.get('/audit-logs', auditLogs);

export default router;