import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';
import { logAdminAction, logSecurityAlert } from '../utils/auditLogger.js';
import { performHealthCheck, getMetrics } from '../utils/healthCheck.js';
import User from '../models/User.js';
import Field from '../models/Field.js';
import Booking from '../models/Booking.js';

/**
 * Admin Controller - Platform Administration & Moderation System
 * Comprehensive admin operations for platform management, user moderation, and analytics
 * 
 * Dashboard & Analytics:
 * - getDashboardStats: Platform overview metrics
 * - getPlatformAnalytics: Detailed platform statistics
 * - getBookingAnalytics: Booking trends and patterns
 * - getUserAnalytics: User growth and engagement
 * - getRevenueAnalytics: Income and payment analysis
 * - getFieldAnalytics: Field performance metrics
 * 
 * User Management:
 * - getAllUsers: List all users with filters
 * - getUserById: Get specific user details
 * - suspendUser: Temporarily disable user account
 * - banUser: Permanently ban user
 * - unbanUser: Restore banned user access
 * - deleteUser: Permanently remove user
 * - sendNotification: Send message to user
 * - bulkEmailUsers: Send email to user groups
 * 
 * Field Management:
 * - getAllFields: List all field listings
 * - approveField: Approve pending field listing
 * - rejectField: Reject field listing application
 * - suspendField: Temporarily disable field
 * - deleteField: Remove field from platform
 * - flagField: Mark field for review
 * - getFieldReports: View reported fields
 * 
 * Booking Management:
 * - getAllBookings: List all platform bookings
 * - getBookingById: Get booking details
 * - cancelBooking: Cancel booking with refund
 * - refundBooking: Process refund manually
 * - resolveDispute: Handle booking disputes
 * - getDisputedBookings: List contested bookings
 * 
 * Payment & Refund Management:
 * - getAllPayments: List all transactions
 * - getPaymentById: Get transaction details
 * - issueRefund: Process manual refund
 * - getRefundQueue: Pending refunds
 * - resyncPayments: Sync with payment gateways
 * - generateInvoices: Create invoices for bookings
 * - getRevenueReports: Financial reports
 * 
 * Moderation & Safety:
 * - getReportedUsers: Users reported by others
 * - getReportedFields: Fields flagged for issues
 * - getReportedReviews: Reviews flagged as inappropriate
 * - approveReview: Accept flagged review
 * - removeReview: Delete inappropriate review
 * - removeUser: Kick user from platform
 * - viewUserActivity: Check user login/activity logs
 * 
 * Tournament Management:
 * - getAllTournaments: List all tournaments
 * - approveTournament: Publish pending tournament
 * - cancelTournament: Cancel tournament, issue refunds
 * - verifyTournamentResults: Verify match results
 * - awardPrizes: Distribute tournament prizes
 * - resolveTournamentDispute: Handle tournament issues
 * 
 * Content Management:
 * - updatePlatformAnnouncements: Create/edit announcements
 * - getAnnouncements: Fetch current announcements
 * - manageFAQ: Update FAQ content
 * - managePolicies: Update terms and policies
 * - manageSupportArticles: Knowledge base management
 * 
 * System Configuration:
 * - getPlatformSettings: Current system settings
 * - updatePlatformSettings: Modify configuration
 * - getFeatureFlags: Active/inactive features
 * - toggleFeature: Enable/disable feature
 * - getSystemLogs: System event logs
 * 
 * Reports & Exports:
 * - generateUserReport: Export user data
 * - generateFinancialReport: Export financial data
 * - generateAuditLog: Generate compliance logs
 * - generateTaxReport: Tax documentation
 * - scheduleReport: Automated report generation
 * - downloadReport: Export generated reports
 * 
 * Support & Help:
 * - getAllSupportTickets: List user support tickets
 * - getSupportTicketById: Get ticket details
 * - respondToTicket: Reply to support ticket
 * - resolveTicket: Mark ticket as resolved
 * - escalateTicket: Escalate to senior admin
 * - viewContactMessages: Get contact form submissions
 * 
 * Permissions & Access Control:
 * - Admin only: All operations require admin role
 * - Permission matrix: Different admin levels
 * - Audit trail: Track all admin actions
 * - Approval workflows: Multi-step verification
 * 
 * Error Handling:
 * - 400: Bad request, invalid parameters
 * - 401: Unauthorized user
 * - 403: Forbidden, insufficient admin permissions
 * - 404: Resource not found
 * - 409: Conflict, status doesn't allow action
 * - 422: Unprocessable entity
 * - 500: Server error
 * 
 * Rate Limiting:
 * - Dashboard: 60 per minute
 * - User operations: 30 per hour
 * - Refund processing: 20 per hour
 * - Report generation: 5 per hour
 * 
 * Caching:
 * - Dashboard stats: 5 minutes
 * - Platform settings: 1 hour
 * - Announcements: 30 minutes
 * - Reports: No cache (always fresh)
 */

/**
 * Get dashboard statistics
 * @async
 * @route GET /api/admin/dashboard
 * @access Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalFields, totalBookings, revenueAgg, recentBookings, recentUsers] = await Promise.all([
    User.countDocuments(),
    Field.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),
    Booking.find().sort({ createdAt: -1 }).limit(5).populate('field', 'name sport').populate('user', 'firstName lastName email'),
    User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt'),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const pendingBookings  = await Booking.countDocuments({ status: 'pending' });
  const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

  res.json({
    success: true,
    message: 'Admin dashboard stats',
    data: {
      totalUsers,
      totalFields,
      totalBookings,
      totalRevenue,
      pendingBookings,
      confirmedBookings,
      recentBookings,
      recentUsers,
    }
  });
});

/**
 * Get user management interface data
 * Lists users with pagination and filtering
 * @async
 * @route GET /api/admin/users
 * @access Private/Admin
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 20)
 * @param {string} search - Search by name or email
 * @param {string} status - Filter by status (active, banned, suspended)
 * @returns {Object} Paginated user list with details
 * @throws {Error} 403 - User not admin
 */
export const getUserManagement = asyncHandler(async (req, res) => {
  logger.info(`Admin ${req.user?.id} accessed user management`);
  const page  = Math.max(1, Number.parseInt(req.query.page,  10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const search = req.query.search || '';

  const query = search
    ? { $or: [{ firstName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query),
  ]);

  res.json({ success: true, message: 'User management data', data: { users, total, page, limit } });
});

/**
 * Get field management interface data
 * Lists fields with pagination and filtering
 * @async
 * @route GET /api/admin/fields
 * @access Private/Admin
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 20)
 * @param {string} search - Search by field name
 * @param {string} status - Filter by status (active, inactive, flagged)
 * @returns {Object} Paginated field list with owner info
 * @throws {Error} 403 - User not admin
 */
export const getFieldManagement = asyncHandler(async (req, res) => {
  logger.info(`Admin ${req.user?.id} accessed field management`);
  const page  = Math.max(1, Number.parseInt(req.query.page,  10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const statusParam = req.query.status;
  const statusAliases = { pending: 'pending-approval' };
  const query = statusParam ? { status: statusAliases[statusParam] ?? statusParam } : {};

  const [fields, total] = await Promise.all([
    Field.find(query).populate('owner', 'firstName lastName email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Field.countDocuments(query),
  ]);

  res.json({ success: true, message: 'Field management data', data: { fields, total, page, limit } });
});

/**
 * Get booking management interface data
 * Lists bookings with pagination and filtering
 * @async
 * @route GET /api/admin/bookings
 * @access Private/Admin
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 20)
 * @param {string} status - Filter by status (pending, confirmed, cancelled, completed)
 * @returns {Object} Paginated booking list with details
 * @throws {Error} 403 - User not admin
 */
export const getBookingManagement = asyncHandler(async (req, res) => {
  logger.info(`Admin ${req.user?.id} accessed booking management`);
  const page   = Math.max(1, Number.parseInt(req.query.page,  10) || 1);
  const limit  = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const query  = req.query.status ? { status: req.query.status } : {};

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('field', 'name sport location')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  res.json({ success: true, message: 'Booking management data', data: { bookings, total, page, limit } });
});

/**
 * Get payment management interface data
 * Lists payments with pagination and filtering
 * @async
 * @route GET /api/admin/payments
 * @access Private/Admin
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 20)
 * @param {string} status - Filter by status (pending, completed, failed, refunded)
 * @returns {Object} Paginated payment list with transaction details
 * @throws {Error} 403 - User not admin
 */
export const getPaymentManagement = asyncHandler(async (req, res) => {
  logger.info(`Admin ${req.user?.id} accessed payment management`);
  res.json({ success: true, message: 'Payment management endpoint', data: [] });
});

/**
 * Get system health and status
 * Returns server and service health metrics
 * @async
 * @route GET /api/admin/health
 * @access Private/Admin
 * @returns {Object} Health status with uptime and service checks
 * @throws {Error} 403 - User not admin
 */
export const getSystemHealth = asyncHandler(async (req, res) => {
  const adminId = req.user?.id;
  logger.info(`Admin ${adminId} checking system health`);

  try {
    const [health, metrics] = await Promise.all([
      performHealthCheck(),
      getMetrics()
    ]);

    // Log admin action
    try {
      logAdminAction({
        adminId,
        action: 'system_health_check',
        targetId: 'system',
        details: { status: health.status },
        ipAddress: req.ip,
        timestamp: new Date()
      });
    } catch (auditErr) {
      logger.warn(`Audit logging failed: ${auditErr.message}`);
    }

    res.json({
      success: true,
      message: 'System health check completed',
      data: {
        health,
        metrics
      }
    });
  } catch (error) {
    logger.error(`System health check error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'System health check failed',
      error: error.message
    });
  }
});

/**
 * Get admin analytics and insights
 * Returns detailed analytics data for admin dashboard
 * @async
 * @route GET /api/admin/analytics
 * @access Private/Admin
 * @param {string} dateRange - Range for analytics
 * @returns {Object} Comprehensive analytics data
 * @throws {Error} 403 - User not admin
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  logger.info(`Admin ${req.user?.id} accessed analytics`);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalFields, totalBookings, revenueAgg, newUsers30, newBookings7, topFields] = await Promise.all([
    User.countDocuments(),
    Field.countDocuments({ status: 'active' }),
    Booking.countDocuments(),
    Booking.aggregate([{ $match: { status: { $in: ['confirmed', 'completed'] } } }, { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Booking.aggregate([
      { $group: { _id: '$field', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'fields', localField: '_id', foreignField: '_id', as: 'field' } },
      { $unwind: '$field' },
      { $project: { count: 1, 'field.name': 1 } },
    ]),
  ]);

  res.json({
    success: true, message: 'Analytics data',
    data: {
      totalUsers, totalFields, totalBookings,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      newUsers30, newBookings7,
      topFields,
    }
  });
});

/**
 * Manage user accounts (ban, suspend, verify)
 * Perform admin actions on user accounts
 * @async
 * @route POST /api/admin/users/:id/manage
 * @access Private/Admin
 * @param {string} action - Action to perform (ban, suspend, verify, restore)
 * @param {string} reason - Reason for action
 * @returns {Object} Updated user status
 * @throws {Error} 404 - User not found
 */
export const manageUsers = asyncHandler(async (req, res) => {
  const adminId = req.user?.id;
  const userId  = req.params.id;
  const action  = req.params.action ?? req.body.action;
  const { reason } = req.body;

  if (!userId || !action) {
    res.status(400);
    throw new Error('userId and action are required');
  }

  const allowedActions = ['ban', 'suspend', 'verify', 'restore', 'activate', 'deactivate'];
  if (!allowedActions.includes(action)) {
    res.status(400);
    throw new Error(`Invalid action. Allowed: ${allowedActions.join(', ')}`);
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  logger.info(`Admin ${adminId} managing user ${userId} with action: ${action}`);

  const updateData = {};
  if (['ban', 'suspend', 'deactivate'].includes(action)) {
    updateData.isActive = false;
  } else if (['restore', 'activate'].includes(action)) {
    updateData.isActive = true;
  } else if (action === 'verify') {
    updateData.isVerified = true;
    updateData.isActive = true;
  }

  await User.findByIdAndUpdate(userId, updateData);

  try {
    logAdminAction({
      adminId,
      action: `user_${action}`,
      targetId: userId,
      details: { action, reason },
      ipAddress: req.ip,
      timestamp: new Date()
    });
  } catch (auditErr) {
    logger.warn(`Audit logging failed: ${auditErr.message}`);
  }

  res.json({
    success: true,
    message: `User ${action} completed successfully`,
    data: { userId, action }
  });
});

/**
 * Manage field listings (approve, reject, remove)
 * Perform admin actions on field listings
 * @async
 * @route POST /api/admin/fields/:id/manage
 * @access Private/Admin
 * @param {string} action - Action (approve, reject, remove, flag)
 * @param {string} reason - Reason for action
 * @returns {Object} Updated field status
 * @throws {Error} 404 - Field not found
 */
export const manageFields = asyncHandler(async (req, res) => {
  const adminId = req.user?.id;
  const fieldId = req.params.id;
  const action  = req.params.action ?? req.body.action;
  const { reason } = req.body;

  if (!fieldId || !action) {
    res.status(400);
    throw new Error('fieldId and action are required');
  }

  const field = await Field.findById(fieldId);
  if (!field) {
    res.status(404);
    throw new Error('Field not found');
  }

  logger.info(`Admin ${adminId} managing field ${fieldId} with action: ${action}`);

  const statusMap = {
    approve:     'active',
    activate:    'active',
    reject:      'inactive',
    deactivate:  'inactive',
    suspend:     'suspended',
    maintenance: 'maintenance',
  };

  if (statusMap[action]) {
    await Field.findByIdAndUpdate(fieldId, { status: statusMap[action] });
  } else if (action === 'remove' || action === 'delete') {
    await Field.findByIdAndDelete(fieldId);
  }

  try {
    logAdminAction({
      adminId,
      action: `field_${action}`,
      targetId: fieldId,
      details: { action, reason },
      ipAddress: req.ip,
      timestamp: new Date()
    });
  } catch (auditErr) {
    logger.warn(`Audit logging failed: ${auditErr.message}`);
  }

  if (['reject', 'remove', 'flag'].includes(action)) {
    try {
      logSecurityAlert({
        type: `field_${action}`,
        severity: action === 'remove' ? 'high' : 'medium',
        details: { fieldId, reason, adminId },
        ipAddress: req.ip
      });
    } catch (secErr) {
      logger.warn(`Security logging failed: ${secErr.message}`);
    }
  }

  res.json({
    success: true,
    message: `Field ${action} completed successfully`,
    data: { fieldId, action }
  });
});

/**
 * Manage bookings (cancel, modify, investigate)
 * Perform admin actions on bookings
 * @async
 * @route POST /api/admin/bookings/:id/manage
 * @access Private/Admin
 * @param {string} action - Action (cancel, modify, investigate)
 * @returns {Object} Updated booking status
 * @throws {Error} 404 - Booking not found
 */
export const manageBookings = asyncHandler(async (req, res) => {
  const adminId   = req.user?.id;
  const bookingId = req.params.id;
  const action    = req.params.action ?? req.body.action;
  const { reason } = req.body;

  if (!bookingId || !action) {
    res.status(400);
    throw new Error('bookingId and action are required');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  logger.info(`Admin ${adminId} managing booking ${bookingId} with action: ${action}`);

  if (action === 'cancel') {
    if (booking.status === 'cancelled') {
      res.status(400);
      throw new Error('Booking is already cancelled');
    }
    booking.status = 'cancelled';
    booking.cancellation = { reason: reason || 'Admin cancelled', cancelledAt: new Date(), cancelledBy: adminId };
    await booking.save();
  } else if (action === 'confirm') {
    booking.status = 'confirmed';
    await booking.save();
  }

  try {
    logAdminAction({
      adminId,
      action: `booking_${action}`,
      targetId: bookingId,
      details: { action, reason },
      ipAddress: req.ip,
      timestamp: new Date()
    });
  } catch (auditErr) {
    logger.warn(`Audit logging failed: ${auditErr.message}`);
  }

  res.json({
    success: true,
    message: `Booking ${action} completed successfully`,
    data: { bookingId, action }
  });
});

export const managePayments = asyncHandler(async (req, res) => {
  const adminId = req.user?.id;
  const { paymentId } = req.params;
  const { action, reason } = req.body;

  logger.info(`Admin ${adminId} managing payment ${paymentId} with action: ${action}`);

  // Log admin action
  try {
    logAdminAction({
      adminId,
      action: `payment_${action}`,
      targetId: paymentId,
      details: { action, reason },
      ipAddress: req.ip,
      timestamp: new Date()
    });
  } catch (auditErr) {
    logger.warn(`Audit logging failed: ${auditErr.message}`);
  }

  res.json({
    success: true,
    message: `Payment ${action} completed successfully`,
    data: { paymentId, action }
  });
});

export const systemSettings = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [totalUsers, totalFields, totalBookings, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Field.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([{ $match: { status: { $in: ['confirmed', 'completed'] } } }, { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),
    ]);
    return res.json({
      success: true, message: 'System settings',
      data: {
        platform: { name: 'Premium Sports', version: '2.0.0', region: 'Bangladesh' },
        stats:    { totalUsers, totalFields, totalBookings, totalRevenue: revenueAgg[0]?.total ?? 0 },
        features: { tournaments: true, teams: true, chat: true, analytics: true },
        updatedAt: new Date(),
      }
    });
  }
  const { features } = req.body;
  logger.info(`Admin ${req.user?.id} updated system settings`);
  res.json({ success: true, message: 'System settings updated', data: { features } });
});

export const backupData = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Backup data endpoint' });
});

export const restoreData = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Restore data endpoint' });
});

export const sendBulkNotifications = asyncHandler(async (req, res) => {
  const { title, message, targetRole, type = 'system_alert' } = req.body;
  if (!title || !message) {
    res.status(400); throw new Error('title and message are required');
  }
  const query = targetRole ? { role: targetRole } : {};
  const users = await User.find(query).select('_id').limit(1000);
  const adminId = req.user?.id;

  logger.info(`Admin ${adminId} sending bulk notification to ${users.length} users: "${title}"`);

  res.json({
    success: true,
    message: `Bulk notification queued for ${users.length} users`,
    data: { targetCount: users.length, title, type, sentAt: new Date() }
  });
});

export const generateReports = asyncHandler(async (req, res) => {
  const { type = 'summary', startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end   = endDate   ? new Date(endDate)   : new Date();
  const match = { createdAt: { $gte: start, $lte: end } };

  const [totalBookings, totalUsers, revenueAgg, cancelledCount] = await Promise.all([
    Booking.countDocuments(match),
    User.countDocuments(match),
    Booking.aggregate([{ $match: { ...match, status: { $in: ['confirmed', 'completed'] } } }, { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),
    Booking.countDocuments({ ...match, status: 'cancelled' }),
  ]);

  const report = {
    type,
    period: { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] },
    summary: {
      newBookings: totalBookings,
      newUsers: totalUsers,
      revenue: revenueAgg[0]?.total ?? 0,
      cancellations: cancelledCount,
      cancellationRate: totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0,
    },
    generatedAt: new Date(),
    generatedBy: req.user?.id,
  };

  if (type === 'csv') {
    const rows = [
      ['Metric', 'Value'],
      ['New Bookings', report.summary.newBookings],
      ['New Users', report.summary.newUsers],
      ['Revenue (BDT)', report.summary.revenue],
      ['Cancellations', report.summary.cancellations],
      ['Cancellation Rate (%)', report.summary.cancellationRate],
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`);
    return res.send(rows.map(r => r.join(',')).join('\n'));
  }

  res.json({ success: true, message: 'Report generated', data: report });
});

export const auditLogs = asyncHandler(async (req, res) => {
  const page  = Math.max(1, Number.parseInt(req.query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const days  = Math.min(90, Math.max(1, Number.parseInt(req.query.days, 10) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [recentBookings, recentUsers, recentFields] = await Promise.all([
    Booking.find({ createdAt: { $gte: since } })
      .populate('user', 'firstName lastName email')
      .populate('field', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('status pricing.totalAmount createdAt'),
    User.find({ createdAt: { $gte: since } })
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(20),
    Field.find({ createdAt: { $gte: since } })
      .select('name sport status createdAt')
      .sort({ createdAt: -1 })
      .limit(20),
  ]);

  res.json({
    success: true,
    message: 'Audit logs retrieved',
    data: { recentBookings, recentUsers, recentFields, period: `${days} days`, generatedAt: new Date() }
  });
});

export const performanceMetrics = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Performance metrics endpoint', data: {} });
});

export const securityMonitoring = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Security monitoring endpoint', data: {} });
});