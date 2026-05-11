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
 * Comprehensive payment processing and subscription management API
 * 
 * Public Routes (No Authentication Required):
 * POST /webhook - Webhook handler for payment gateway events
 *   - Handles Stripe, SSLCommerz, PayPal events
 *   - Signature verification for security
 *   - Automatic payment status updates
 * 
 * Protected Routes (Authentication Required):
 * 
 * Payment Intent Creation:
 * POST /create-intent - Create payment intent before charging
 *   Request: { amount, currency, metadata }
 *   Response: { clientSecret, paymentIntentId, amount }
 * 
 * Process Payment:
 * POST /process - Process payment transaction
 *   Request: { amount, paymentMethod, description, bookingId }
 *   Response: { paymentId, transactionId, status, receipt }
 * 
 * Payment History:
 * GET /history - Retrieve user payment history with pagination
 *   Query: page, limit, status, startDate, endDate
 *   Response: { payments: [], total, page, totalPages }
 * 
 * Refund Payment:
 * POST /refund/:paymentId - Initiate refund for completed payment
 *   Request: { reason, amount (optional for partial refunds) }
 *   Response: { refundId, status, amount, refundedDate }
 * 
 * Subscription Plans:
 * GET /plans - Get available subscription plans
 *   Query: includeArchived (boolean, optional)
 *   Response: { plans: [{ id, name, price, features, duration }] }
 * 
 * Subscribe to Plan:
 * POST /subscription - Subscribe user to premium plan
 *   Request: { planId, paymentMethod }
 *   Response: { subscriptionId, status, nextBillingDate }
 * 
 * Cancel Subscription:
 * DELETE /subscription - Cancel current subscription
 *   Query: immediately (boolean, default: false)
 *   Response: { cancellationDate, refundAmount, status }
 * 
 * Response Format (Success):
 * {
 *   success: true,
 *   message: string,
 *   data: { /* specific response data */ },
 *   timestamp: ISO 8601 datetime,
 *   requestId: unique identifier
 * }
 * 
 * Error Response Format:
 * {
 *   success: false,
 *   status: 'fail' (client error) or 'error' (server error),
 *   message: string,
 *   errors: [ { field: string, message: string } ] (if validation)
 * }
 * 
 * HTTP Status Codes:
 * 200 - OK: Request successful
 * 201 - Created: Payment created successfully
 * 400 - Bad Request: Invalid input data or validation error
 * 401 - Unauthorized: Missing or invalid authentication token
 * 402 - Payment Required: Payment declined or processing failed
 * 404 - Not Found: Payment or subscription not found
 * 409 - Conflict: Duplicate or invalid state (e.g., already subscribed)
 * 422 - Unprocessable: Validation errors in request body
 * 500 - Internal Server Error: Server-side error
 * 503 - Service Unavailable: Payment gateway unavailable
 * 
 * Payment Methods:
 * - credit_card: Visa, Mastercard, American Express
 * - debit_card: Bank debit cards
 * - mobile_banking: Mobile banking apps
 * - wallet: Digital wallet balance
 * - bank_transfer: Direct bank transfer
 * - cash: Manual cash handling (POS)
 * 
 * Payment Gateways:
 * - stripe: International payments (Stripe API)
 * - sslcommerz: Bangladesh e-commerce (SSLCommerz API)
 * - paypal: Digital payments (PayPal API)
 * - bkash: Bangladesh mobile wallet (bKash API)
 * - nagad: Bangladesh mobile wallet (Nagad API)
 * - rocket: Bangladesh mobile wallet (Rocket API)
 * 
 * Supported Currencies:
 * - BDT (Bangladeshi Taka) - default currency
 * - USD (US Dollar)
 * - EUR (Euro)
 * - INR (Indian Rupee)
 * - GBP (British Pound)
 * 
 * Subscription Plans:
 * - free: No cost, basic features, unlimited duration
 * - premium: Monthly recurring, enhanced features, auto-renewal
 * - enterprise: Annual commitment, full features, dedicated support
 * 
 * Webhook Events:
 * - charge.succeeded: Payment completed successfully
 * - charge.failed: Payment declined or failed
 * - charge.refunded: Refund processed
 * - charge.disputed: Payment disputed by customer
 * - subscription.created: New subscription activated
 * - subscription.updated: Subscription modified
 * - subscription.deleted: Subscription cancelled
 * - invoice.payment_succeeded: Invoice paid
 * - invoice.payment_failed: Invoice payment failed
 * 
 * Security Features:
 * - PCI DSS Level 1 compliant
 * - Webhook signature verification
 * - HTTPS encryption required
 * - No raw card data stored
 * - Payment tokens for recurring charges
 * - Complete audit trail and logging
 * - Rate limiting: 10 requests/minute per user
 * 
 * Caching Strategy:
 * - Plans: 1-hour cache
 * - Payment history: 5-minute user-specific cache
 * - Active payments: No cache (always fresh)
 * - Webhook events: No cache
 * 
 * Refund Policy Integration:
 * - Automatic refunds on booking cancellation
 * - 24+ hours before booking: 100% refund
 * - 12-24 hours before booking: 50% refund
 * - Less than 12 hours: No refund
 * - Admin override with reason logging
 */"

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