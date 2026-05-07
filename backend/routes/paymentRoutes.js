import express from 'express';
import {
  createPaymentIntent,
  processPayment,
  getPaymentHistory,
  refundPayment,
  getSubscriptionPlans,
  subscribeToPlan,
  cancelSubscription,
  handleWebhook
} from '../controllers/paymentController.js';

import { protect, admin, manager, premiumUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook route (public, no auth required)
router.post('/webhook', handleWebhook);

// All other routes require authentication
router.use(protect);

// Payment intents and processing
router.post('/create-intent', createPaymentIntent);
router.post('/process', processPayment);
router.get('/history', getPaymentHistory);

// Subscriptions
router.post('/subscription', subscribeToPlan);
router.delete('/subscription', cancelSubscription);
router.get('/plans', getSubscriptionPlans);

// Refunds
router.post('/refund/:paymentId', refundPayment);

export default router;