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

/**
 * Admin Routes API Documentation
 * 
 * All routes require admin authentication
 * Authorization: protect middleware + admin middleware
 * 
 * Dashboard Routes:
 * - GET /dashboard - Platform overview and statistics
 * - GET /analytics - Detailed analytics data
 * - GET /system-health - System status and health
 * - GET /performance - Performance metrics
 * - GET /security - Security monitoring data
 * 
 * Management Routes:
 * - User Management: GET/PUT/DELETE /users/:id
 * - Field Management: GET/PUT/DELETE /fields/:id
 * - Booking Management: GET/PUT/DELETE /bookings/:id
 * - Payment Management: GET/PUT /payments/:id
 * 
 * System Operations:
 * - Settings: GET/PUT /settings
 * - Backup/Restore: POST /backup, /restore
 * - Notifications: POST /bulk-notifications
 * - Reports: GET /reports
 * - Audit: GET /audit-logs
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { ... }
 * }
 * 
 * Error Responses:
 * 401 - Unauthorized, token required
 * 403 - Forbidden, admin access required
 * 404 - Resource not found
 * 500 - Server error
 */

// All routes require admin authentication
router.use(protect);
router.use(admin);

/**
 * @route GET /api/admin/dashboard
 * @desc Get dashboard statistics and overview
 * @access Admin
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route GET /api/admin/analytics
 * @desc Get detailed analytics and insights
 * @access Admin
 */
router.get('/analytics', getAnalytics);

/**
 * @route GET /api/admin/system-health
 * @desc Check system health and status
 * @access Admin
 */
router.get('/system-health', getSystemHealth);

/**
 * @route GET /api/admin/performance
 * @desc Get performance metrics
 * @access Admin
 */
router.get('/performance', performanceMetrics);

/**
 * @route GET /api/admin/security
 * @desc Get security monitoring data
 * @access Admin
 */
router.get('/security', securityMonitoring);

/**
 * @route GET /api/admin/users
 * @desc Get user list for management
 * @access Admin
 */
router.get('/users', getUserManagement);

/**
 * @route PUT /api/admin/users/:id
 * @desc Manage user account (ban, suspend, etc.)
 * @access Admin
 */
router.put('/users/:id', manageUsers);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user account
 * @access Admin
 */
router.delete('/users/:id', manageUsers);

/**
 * @route GET /api/admin/fields
 * @desc Get fields for management and approval
 * @access Admin
 */
router.get('/fields', getFieldManagement);

/**
 * @route PUT /api/admin/fields/:id
 * @desc Manage field (approve, reject, remove)
 * @access Admin
 */
router.put('/fields/:id', manageFields);

/**
 * @route DELETE /api/admin/fields/:id
 * @desc Delete field listing
 * @access Admin
 */
router.delete('/fields/:id', manageFields);

/**
 * @route GET /api/admin/bookings
 * @desc Get bookings for management
 * @access Admin
 */
router.get('/bookings', getBookingManagement);

/**
 * @route PUT /api/admin/bookings/:id
 * @desc Manage booking
 * @access Admin
 */
router.put('/bookings/:id', manageBookings);

/**
 * @route DELETE /api/admin/bookings/:id
 * @desc Cancel booking
 * @access Admin
 */
router.delete('/bookings/:id', manageBookings);

/**
 * @route GET /api/admin/payments
 * @desc Get payment transactions for management
 * @access Admin
 */
router.get('/payments', getPaymentManagement);

/**
 * @route PUT /api/admin/payments/:id
 * @desc Manage payment (refund, verify)
 * @access Admin
 */
router.put('/payments/:id', managePayments);

/**
 * @route GET /api/admin/settings
 * @desc Get system settings
 * @access Admin
 */
router.get('/settings', systemSettings);

/**
 * @route PUT /api/admin/settings
 * @desc Update system settings
 * @access Admin
 */
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