import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { calculatePrice, getSurgeInfo, getBestTimeSlots } from '../services/pricingService.js';

const router = express.Router();

router.use(protect);

// POST /api/v1/pricing/calculate
// Body: { basePrice, sport, startHour, durationHours, isWeekend, occupancyRate, membershipDiscount, promoDiscount }
router.post('/calculate', (req, res) => {
  try {
    const { basePrice, sport, startHour, durationHours, isWeekend = false, occupancyRate = 0.5, membershipDiscount = 0, promoDiscount = 0 } = req.body;

    if (!basePrice || !sport || startHour === undefined || !durationHours) {
      return res.status(400).json({ success: false, error: 'basePrice, sport, startHour, and durationHours are required' });
    }

    const result = calculatePrice({ basePrice, sport, startHour, durationHours, isWeekend, occupancyRate, membershipDiscount, promoDiscount });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/pricing/surge?hour=18&isWeekend=true&occupancyRate=0.8
router.get('/surge', (req, res) => {
  try {
    const hour         = parseInt(req.query.hour, 10);
    const isWeekend    = req.query.isWeekend === 'true';
    const occupancyRate = parseFloat(req.query.occupancyRate ?? '0.5');

    if (isNaN(hour) || hour < 0 || hour > 23) {
      return res.status(400).json({ success: false, error: 'Valid hour (0-23) is required' });
    }

    const info = getSurgeInfo(hour, isWeekend, occupancyRate);
    return res.json({ success: true, data: info });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/pricing/best-slots?basePrice=1200&sport=Football&isWeekend=false&count=3
router.get('/best-slots', (req, res) => {
  try {
    const basePrice = parseFloat(req.query.basePrice);
    const sport     = req.query.sport;
    const isWeekend = req.query.isWeekend === 'true';
    const count     = parseInt(req.query.count ?? '3', 10);

    if (!basePrice || !sport) {
      return res.status(400).json({ success: false, error: 'basePrice and sport are required' });
    }

    const slots = getBestTimeSlots(basePrice, sport, isWeekend, count);
    return res.json({ success: true, data: slots });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
