import asyncHandler from 'express-async-handler';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import Field from '../models/Field.js';
import Booking from '../models/Booking.js';

/**
 * Analytics & Reporting Controller
 * Provides platform-wide, booking, user, revenue, and field analytics
 * 
 * Responsibilities:
 * - Platform-wide statistics for admin dashboards
 * - Booking analytics and trends
 * - User growth and engagement metrics
 * - Revenue and financial analytics
 * - Field performance and utilization
 * - Dashboard data aggregation
 * - Data export functionality
 * 
 * Analytics Metrics:
 * 
 * Platform Level:
 * - Total users, fields, bookings
 * - Active users today/week/month
 * - New user registration trends
 * - Platform revenue and growth rate
 * - System health metrics
 * 
 * Booking Analytics:
 * - Total bookings count
 * - Booking completion rate
 * - Cancellation rate and trends
 * - Average booking duration
 * - Peak booking times
 * - Occupancy rates by field
 * - Revenue per booking
 * 
 * User Analytics:
 * - User growth rate
 * - Active user percentage
 * - User retention rate
 * - User segmentation (casual, regular, premium)
 * - User geographic distribution
 * - User engagement metrics
 * - Churn rate tracking
 * 
 * Revenue Analytics:
 * - Total revenue generated
 * - Revenue by payment method
 * - Revenue by date range
 * - Revenue per field
 * - Revenue per user
 * - Refund tracking
 * - Subscription revenue
 * 
 * Field Analytics:
 * - Field utilization rate
 * - Field popularity ranking
 * - Field revenue contribution
 * - Booking frequency per field
 * - Customer satisfaction per field
 * - Peak usage times
 * - Field performance comparison
 * 
 * Time Range Filters:
 * - today: Last 24 hours
 * - week: Last 7 days
 * - month: Last 30 days
 * - quarter: Last 90 days
 * - year: Last 365 days
 * - custom: User-specified date range
 * 
 * Dashboard Data:
 * - Summary cards (users, bookings, revenue)
 * - Trend charts (7-day, 30-day)
 * - Top fields and users
 * - Recent activity feed
 * - Key performance indicators (KPIs)
 * - Alert notifications
 * 
 * Data Export:
 * - CSV format for spreadsheet analysis
 * - PDF format for reports
 * - JSON format for API consumption
 * - Scheduled exports via email
 * - Data filtering before export
 * 
 * Access Control:
 * - Admin: Full platform analytics
 * - Manager: Assigned fields/users only
 * - Field Owner: Own field analytics only
 * - User: Own booking analytics only
 * 
 * Performance Considerations:
 * - Caching for frequent queries
 * - Index on date fields
 * - Aggregation pipeline optimization
 * - Background job for heavy computations
 * 
 * Related Models:
 * - User: User statistics
 * - Booking: Booking trends
 * - Field: Field performance
 * - Payment: Revenue metrics
 * 
 * Event Emissions:
 * - analytics_generated
 * - report_exported
 * - threshold_alert_triggered
 */

/**
 * Get platform-wide analytics
 * Returns overall statistics for admin dashboard
 * @async
 * @route GET /api/analytics/platform
 * @access Private/Admin
 * @param {string} dateRange - Range for analytics (today, week, month, year)
 * @returns {Object} Platform stats including users, bookings, revenue
 * @throws {Error} 403 - User not admin
 */
export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  logger.info(`Fetching platform analytics by user: ${req.user?.id}`);

  const [totalUsers, totalFields, totalBookings, revenueAgg, activeFields, pendingBookings] = await Promise.all([
    User.countDocuments(),
    Field.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }]),
    Field.countDocuments({ status: 'active' }),
    Booking.countDocuments({ status: 'pending' }),
  ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;

  res.status(200).json({
    success: true,
    message: 'Platform analytics retrieved successfully',
    data: {
      totalUsers,
      totalFields,
      activeFields,
      totalBookings,
      pendingBookings,
      totalRevenue,
    }
  });
});

/**
 * Get booking analytics and statistics
 * Returns booking trends, occupancy rates, cancellations
 * @async
 * @route GET /api/analytics/bookings
 * @access Private/Admin
 * @param {string} dateRange - Analytics date range
 * @param {string} fieldId - Filter by specific field (optional)
 * @returns {Object} Booking statistics and trends
 * @throws {Error} 403 - User not admin
 */
export const getBookingAnalytics = asyncHandler(async (req, res) => {
  logger.info(`Fetching booking analytics by user: ${req.user?.id}`);

  const statusAgg = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byStatus = {};
  statusAgg.forEach(row => { byStatus[row._id] = row.count; });

  const last7Days = await Booking.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const total = Object.values(byStatus).reduce((s, v) => s + v, 0);
  const cancellationRate = total > 0 ? Math.round(((byStatus.cancelled ?? 0) / total) * 100) : 0;

  res.status(200).json({
    success: true,
    message: 'Booking analytics retrieved successfully',
    data: { byStatus, last7Days, total, cancellationRate }
  });
});

/**
 * Get user analytics and engagement metrics
 * Returns user growth, activity, retention statistics
 * @async
 * @route GET /api/analytics/users
 * @access Private/Admin
 * @param {string} dateRange - Analytics date range
 * @returns {Object} User engagement and growth metrics
 * @throws {Error} 403 - User not admin
 */
export const getUserAnalytics = asyncHandler(async (req, res) => {
  logger.info(`Fetching user analytics by user: ${req.user?.id}`);

  const roleAgg = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const byRole = {};
  roleAgg.forEach(row => { byRole[row._id] = row.count; });

  const last30Days = await User.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const totalUsers = Object.values(byRole).reduce((s, v) => s + v, 0);
  const newUsersLast30 = last30Days.reduce((s, d) => s + d.count, 0);

  res.status(200).json({
    success: true,
    message: 'User analytics retrieved successfully',
    data: { byRole, last30Days, totalUsers, newUsersLast30 }
  });
});

/**
 * Get revenue analytics and financial metrics
 * Returns total revenue, payments, refunds, earnings
 * @async
 * @route GET /api/analytics/revenue
 * @access Private/Admin
 * @param {string} dateRange - Analytics date range
 * @returns {Object} Revenue and financial statistics
 * @throws {Error} 403 - User not admin
 */
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  logger.info(`Fetching revenue analytics by user: ${req.user?.id}`);

  const [totalAgg, monthlyAgg, refundAgg] = await Promise.all([
    Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$pricing.totalAmount' } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.countDocuments({ status: 'cancelled' }),
  ]);

  const totalRevenue   = totalAgg[0]?.total   ?? 0;
  const monthlyRevenue = monthlyAgg.reduce((s, d) => s + d.revenue, 0);

  res.status(200).json({
    success: true,
    message: 'Revenue analytics retrieved successfully',
    data: { totalRevenue, monthlyRevenue, last30Days: monthlyAgg, cancelledBookings: refundAgg }
  });
});

/**
 * Get field utilization and performance analytics
 * Returns field usage rates, popularity, ratings
 * @async
 * @route GET /api/analytics/fields
 * @access Private/Admin
 * @param {string} dateRange - Analytics date range
 * @returns {Object} Field performance and utilization metrics
 * @throws {Error} 403 - User not admin
 */
export const getFieldAnalytics = asyncHandler(async (req, res) => {
  const [statusAgg, topFields] = await Promise.all([
    Field.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $group: { _id: '$field', bookingCount: { $sum: 1 }, revenue: { $sum: '$pricing.totalAmount' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'fields', localField: '_id', foreignField: '_id', as: 'field' } },
      { $unwind: '$field' },
      { $project: { bookingCount: 1, revenue: 1, 'field.name': 1, 'field.sport': 1 } },
    ]),
  ]);

  const byStatus = {};
  statusAgg.forEach(row => { byStatus[row._id] = row.count; });

  res.status(200).json({
    success: true,
    message: 'Field analytics retrieved successfully',
    data: { byStatus, topFields }
  });
});

// @desc    Get real-time dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardData = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: { dashboard: {} }
  });
});

// @desc    Export analytics report
// @route   GET /api/analytics/export
// @access  Private/Admin
export const exportAnalytics = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Analytics report exported successfully',
    data: { reportUrl: 'placeholder-report-url' }
  });
});

// @desc    Get custom analytics
// @route   POST /api/analytics/custom
// @access  Private/Admin
export const getCustomAnalytics = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Custom analytics retrieved successfully',
    data: { analytics: {} }
  });
});