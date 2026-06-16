import express from 'express';
import { protect, admin, manager } from '../middleware/authMiddleware.js';
import { generateRevenueReport, generateUserReport, generateOccupancyReport } from '../services/reportService.js';

const router = express.Router();

router.use(protect);

// GET /api/v1/reports/revenue?from=2025-01-01&to=2025-12-31
// Accepts bookings as query or pulls stub data when no DB integration
router.get('/revenue', manager, async (req, res) => {
  try {
    const { from, to } = req.query;
    // In production this would query the Booking model; here we return a stub
    const report = generateRevenueReport([], { from, to });
    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/reports/users
router.get('/users', manager, async (req, res) => {
  try {
    const report = generateUserReport([], []);
    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/reports/occupancy
router.get('/occupancy', manager, async (req, res) => {
  try {
    const report = generateOccupancyReport([], []);
    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/reports/summary — combined overview for dashboards
router.get('/summary', admin, async (req, res) => {
  try {
    const { from, to } = req.query;
    const revenue   = generateRevenueReport([], { from, to });
    const users     = generateUserReport([], []);
    const occupancy = generateOccupancyReport([], []);
    return res.json({
      success: true,
      data: {
        revenue:   { total: revenue.totalRevenue, bookings: revenue.totalBookings, avg: revenue.avgBookingValue },
        users:     { total: users.totalUsers, active: users.activeUsers, retention: users.retention },
        occupancy: { fields: occupancy.length },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
