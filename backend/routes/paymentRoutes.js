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

/**
 * Payment Routes API Documentation
 * 
 * Public Routes:
 * POST /webhook - Webhook handler for payment gateway events (no auth)
 * 
 * Protected Routes (require authentication):
 * POST /create-intent - Create payment intent before processing
 * POST /process - Process payment transaction
 * GET /history - Get user payment history with filtering
 * POST /refund/:paymentId - Initiate refund for payment
 * 
 * Subscription Routes (require authentication):
 * POST /subscription - Subscribe to premium plan
 * DELETE /subscription - Cancel current subscription
 * GET /plans - Get available subscription plans
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: { ... }
 * }
 * 
 * Error Responses:
 * 400 - Invalid payment data or bad request
 * 401 - Unauthorized, token required
 * 402 - Payment failed or declined
 * 404 - Payment not found for refund
 * 500 - Server error
 */

// Webhook route (public, no auth required)
router.post('/webhook', handleWebhook);

// All other routes require authentication
router.use(protect);

/**
 * @route POST /api/payments/create-intent
 * @desc Create payment intent for Stripe/payment gateway
 * @access Private
 */
router.post('/create-intent', createPaymentIntent);

/**
 * @route POST /api/payments/process
 * @desc Process payment transaction
 * @access Private
 */
router.post('/process', processPayment);

/**
 * @route GET /api/payments/history
 * @desc Get user payment history with pagination
 * @access Private
 */
router.get('/history', getPaymentHistory);

/**
 * @route POST /api/payments/subscription
 * @desc Subscribe user to premium plan
 * @access Private
 */
router.post('/subscription', subscribeToPlan);

/**
 * @route DELETE /api/payments/subscription
 * @desc Cancel user subscription
 * @access Private
 */
router.delete('/subscription', cancelSubscription);

/**
 * @route GET /api/payments/plans
 * @desc Get available subscription plans
 * @access Private
 */
router.get('/plans', getSubscriptionPlans);

/**
 * @route POST /api/payments/refund/:paymentId
 * @desc Refund payment transaction
 * @access Private
 */
router.post('/refund/:paymentId', refundPayment);

export default router;