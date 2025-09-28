import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  processRefund,
  getRefundHistory,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getSubscriptionHistory,
  webhookHandler,
  getPaymentStats,
  exportPaymentData,
  createWallet,
  getWalletBalance,
  addWalletFunds,
  transferWalletFunds,
  getWalletTransactions,
  createPaymentLink,
  verifyPayment,
  disputePayment,
  getDisputeHistory,
  setupAutoPay,
  cancelAutoPay,
  getInvoice,
  downloadInvoice,
  bulkPayments,
  getPaymentAnalytics
} from '../controllers/paymentController.js';

import { protect, admin, manager, premiumUser } from '../middleware/authMiddleware.js';
import { validatePayment } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Webhook route (public, no auth required)
router.post('/webhook', webhookHandler);

// All other routes require authentication
router.use(protect);

// Payment intents and processing
router.post('/create-intent', validatePayment, createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/stats', getPaymentStats);
router.get('/analytics', premiumUser, getPaymentAnalytics);

// Payment methods
router.get('/methods', getPaymentMethods);
router.post('/methods', addPaymentMethod);
router.delete('/methods/:methodId', removePaymentMethod);
router.put('/methods/:methodId/default', setDefaultPaymentMethod);

// Refunds
router.post('/refund', processRefund);
router.get('/refunds', getRefundHistory);

// Subscriptions
router.post('/subscription', createSubscription);
router.put('/subscription', updateSubscription);
router.delete('/subscription', cancelSubscription);
router.get('/subscription/history', getSubscriptionHistory);

// Wallet functionality (Premium feature)
router.post('/wallet/create', premiumUser, createWallet);
router.get('/wallet/balance', premiumUser, getWalletBalance);
router.post('/wallet/add-funds', premiumUser, addWalletFunds);
router.post('/wallet/transfer', premiumUser, transferWalletFunds);
router.get('/wallet/transactions', premiumUser, getWalletTransactions);

// Payment links and invoices
router.post('/create-link', createPaymentLink);
router.get('/invoice/:invoiceId', getInvoice);
router.get('/invoice/:invoiceId/download', downloadInvoice);

// Auto-pay setup
router.post('/auto-pay', setupAutoPay);
router.delete('/auto-pay', cancelAutoPay);

// Disputes
router.post('/dispute/:paymentId', disputePayment);
router.get('/disputes', getDisputeHistory);

// Bulk operations (Admin only)
router.post('/bulk-payments', admin, bulkPayments);

// Data export
router.get('/export', exportPaymentData);

export default router;