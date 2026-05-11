import express from 'express';

/**
 * Analytics Routes API Documentation
 * 
 * Base URL: /api/analytics
 * All routes require authentication
 * Most routes require admin or manager role
 * 
 * Dashboard Route:
 * GET /dashboard - Get general analytics dashboard
 * Access: Authenticated users (own data)
 * Response: Summary cards, charts, KPIs
 * 
 * Platform Analytics:
 * GET /platform - Get platform-wide statistics
 * Access: Admin only
 * Params: dateRange (today, week, month, year, custom)
 * Response: User growth, bookings, revenue totals
 * 
 * Booking Analytics:
 * GET /bookings - Get booking statistics
 * Access: Manager/Admin
 * Params: dateRange, fieldId (optional filter)
 * Response: Booking trends, occupancy, cancellations
 * 
 * User Analytics:
 * GET /users - Get user engagement metrics
 * Access: Manager/Admin
 * Params: dateRange
 * Response: User growth, retention, segments
 * 
 * Revenue Analytics:
 * GET /revenue - Get financial statistics
 * Access: Manager/Admin
 * Params: dateRange, paymentMethod (optional)
 * Response: Revenue totals, by method, trends
 * 
 * Field Analytics:
 * GET /fields/:fieldId - Get specific field stats
 * Access: Field Owner/Admin (own fields)
 * Params: dateRange
 * Response: Utilization, bookings, revenue per field
 * 
 * Data Export:
 * GET /export - Export analytics data
 * Access: Admin only
 * Params: format (csv, pdf, json), dateRange
 * Response: Exported file or stream
 * 
 * Query Parameters:
 * - dateRange: Time period (today, week, month, year, custom)
 * - startDate: Custom start date (YYYY-MM-DD)
 * - endDate: Custom end date (YYYY-MM-DD)
 * - groupBy: Aggregation period (day, week, month)
 * - format: Export format (csv, pdf, json)
 * - fields: Specific fields to include
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     analytics: { /* data */ },
 *     summary: { /* summary stats */ },
 *     trends: { /* trend data */ },
 *     comparison: { /* period comparison */ }
 *   },
 *   timestamp: ISO 8601 date
 * }
 * 
 * Error Responses:
 * 401 - Unauthorized/not authenticated
 * 403 - Forbidden (insufficient permissions)
 * 404 - Resource not found
 * 400 - Invalid query parameters
 * 500 - Server error
 * 
 * Caching:
 * - Dashboard: 5-minute cache
 * - Platform analytics: 1-hour cache
 * - Specific field: 30-minute cache
 * - Exports: No cache (always fresh)
 * 
 * Performance:
 * - Aggregation pipeline optimization
 * - Index usage on date fields
 * - Pagination for large datasets
 * - Async processing for exports
 * 
 * Metrics Tracked:
 * - Total counts (users, bookings, revenue)
 * - Rate metrics (growth, cancellation)
 * - Distribution metrics (by field, by method)
 * - Trend metrics (daily, weekly, monthly)
 * - Comparative metrics (period-over-period)
 */

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