/**
 * Admin Routes - Platform Administration & Moderation API
 * Dashboard, user management, field moderation, payment handling, support tickets
 * 
 * Dashboard & Analytics:
 * GET /dashboard - Platform overview
 * GET /analytics/platform - Detailed platform stats
 * GET /analytics/bookings - Booking analytics
 * GET /analytics/users - User analytics
 * GET /analytics/revenue - Financial analytics
 * GET /analytics/fields - Field performance
 * 
 * User Management:
 * GET /users - List all users
 * GET /users/:id - Get user details
 * PUT /users/:id - Update user
 * DELETE /users/:id - Delete user
 * POST /users/:id/suspend - Suspend user
 * POST /users/:id/ban - Ban user
 * POST /users/:id/unban - Unban user
 * 
 * Field Management:
 * GET /fields - List fields
 * PUT /fields/:id/approve - Approve field
 * PUT /fields/:id/reject - Reject field
 * PUT /fields/:id/suspend - Suspend field
 * DELETE /fields/:id - Delete field
 * POST /fields/:id/flag - Flag for review
 * 
 * Booking Management:
 * GET /bookings - List bookings
 * POST /bookings/:id/cancel - Cancel booking
 * POST /bookings/:id/refund - Issue refund
 * GET /disputes - Get disputed bookings
 * 
 * Payment Management:
 * GET /payments - List payments
 * POST /payments/:id/refund - Process refund
 * GET /payments/queue - Pending refunds
 * 
 * Moderation:
 * GET /reports - Reported content
 * PUT /reports/:id/approve - Approve content
 * DELETE /reports/:id/remove - Remove content
 * 
 * Dashboard Endpoint:
 * - GET /dashboard?dateRange=month
 * - Response: { stats: { users, fields, bookings, revenue, ... } }
 * - Status: 200 OK
 * - Date filters: today, week, month, year, custom
 * - Cache: 5 minutes
 * 
 * User Management:
 * - GET /users?sort=created&page=1&limit=50
 * - Response: { users: [...], total, page }
 * - Status: 200 OK
 * - Filters: role, status, subscription
 * - Sort: created, lastLogin, bookings
 * 
 * Get User Details:
 * - GET /users/:id
 * - Response: { user: { id, email, phone, role, status, stats } }
 * - Status: 200 OK
 * - Includes: Activity, bookings, payments
 * 
 * Suspend User:
 * - POST /users/:id/suspend
 * - Body: { reason, duration }
 * - Response: { suspended: true, until }
 * - Status: 200 OK
 * - Notification: User notified
 * - Temp restriction: Set duration
 * 
 * Ban User:
 * - POST /users/:id/ban
 * - Body: { reason, permanent }
 * - Response: { banned: true }
 * - Status: 200 OK
 * - Permanent removal
 * - Notification: Ban reason sent
 * 
 * Field Approval:
 * - PUT /fields/:id/approve
 * - Response: { approved: true, listedAt }
 * - Status: 200 OK
 * - Field becomes public
 * - Notification: Owner notified
 * 
 * Refund Processing:
 * - POST /payments/:id/refund
 * - Body: { amount, reason }
 * - Response: { refund: {...}, status }
 * - Status: 200 OK
 * - Manual refund processing
 * - Audit trail created
 * 
 * Support Tickets:
 * GET /support/tickets - List tickets
 * GET /support/tickets/:id - Get ticket
 * POST /support/tickets/:id/response - Reply
 * PUT /support/tickets/:id/resolve - Resolve
 * 
 * Platform Reports:
 * GET /reports/dashboard - Report overview
 * GET /reports/users - Export user report
 * GET /reports/financial - Export financial
 * GET /reports/audit - Export audit log
 * 
 * Moderation Features:
 * - GET /reports?type=user|field|review
 * - Response: { reports: [...], total }
 * - Status: 200 OK
 * - Filters: type, status, severity
 * 
 * Authorization:
 * - Admin only: All operations
 * - Role verification: Admin role required
 * - Audit logging: Track all actions
 * 
 * Response Format:
 * - Success: { success: true, data: {...}, message: "..." }
 * - Error: { success: false, error: "...", code: HTTP_CODE }
 * 
 * Error Handling:
 * - 400: Bad request
 * - 401: Unauthorized
 * - 403: Forbidden, not admin
 * - 404: Resource not found
 * - 409: Conflict
 * - 500: Server error
 * 
 * Admin Permissions:
 * - Dashboard access
 * - User suspension/ban
 * - Field moderation
 * - Payment refunds
 * - Report management
 * - Support ticket handling
 * - System configuration
 * 
 * Rate Limiting:
 * - Dashboard: 60 per minute
 * - User operations: 30 per hour
 * - Refund processing: 20 per hour
 * - Report operations: 50 per hour
 * 
 * Caching:
 * - Dashboard stats: 5 minutes
 * - Platform settings: 1 hour
 * - Reports: No cache (always fresh)
 * 
 * Audit Trail:
 * - All admin actions logged
 * - User, timestamp, action, details
 * - Retention: 1 year
 * - Export: For compliance
 */

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
 * @route PUT /api/admin/users/:id/:action
 * @desc Manage user account with explicit action (ban, suspend, activate, verify, restore, deactivate)
 * @access Admin
 */
router.put('/users/:id/:action', manageUsers);

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
 * @route PUT /api/admin/fields/:id/:action
 * @desc Manage field with explicit action (approve, reject, suspend, deactivate, activate, remove)
 * @access Admin
 */
router.put('/fields/:id/:action', manageFields);

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
 * @route PUT /api/admin/bookings/:id/:action
 * @desc Manage booking with explicit action (cancel, confirm)
 * @access Admin
 */
router.put('/bookings/:id/:action', manageBookings);

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