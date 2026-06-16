import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { calculateBookingPoints, redeemPoints, buildSummary, TIERS } from '../services/loyaltyService.js';

const router = express.Router();

router.use(protect);

// GET /api/v1/loyalty/tiers — list all tiers and their perks
router.get('/tiers', (_req, res) => {
  res.json({ success: true, data: TIERS });
});

// GET /api/v1/loyalty/summary?points=3500
router.get('/summary', (req, res) => {
  try {
    const points = parseInt(req.query.points ?? '0', 10);
    if (isNaN(points) || points < 0) {
      return res.status(400).json({ success: false, error: 'Valid non-negative points value required' });
    }
    return res.json({ success: true, data: buildSummary(points) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/loyalty/earn
// Body: { hours, startHour, isWeekend, isPremium }
router.post('/earn', (req, res) => {
  try {
    const { hours = 1, startHour = 10, isWeekend = false, isPremium = false } = req.body;
    const earned = calculateBookingPoints({ hours, startHour, isWeekend, isPremium });
    return res.json({ success: true, data: { pointsEarned: earned } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/loyalty/redeem
// Body: { currentPoints, pointsToRedeem }
router.post('/redeem', (req, res) => {
  try {
    const { currentPoints, pointsToRedeem } = req.body;
    if (currentPoints === undefined || pointsToRedeem === undefined) {
      return res.status(400).json({ success: false, error: 'currentPoints and pointsToRedeem are required' });
    }
    const result = redeemPoints(currentPoints, pointsToRedeem);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
