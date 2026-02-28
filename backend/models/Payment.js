import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    // Payment Reference
    paymentId: {
      type: String,
      unique: true,
      required: [true, 'Payment ID is required']
    },
    transactionId: {
      type: String,
      unique: true
    },

    // User and Booking
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required']
    },

    // Payment Details
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'EUR', 'INR']
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'mobile_banking', 'wallet', 'bank_transfer', 'cash'],
      required: [true, 'Payment method is required']
    },
    paymentGateway: {
      type: String,
      enum: ['stripe', 'sslcommerz', 'paypal', 'nagad', 'bkash', 'rocket', 'cash'],
      required: [true, 'Payment gateway is required']
    },

    // Card Details (if applicable)
    cardDetails: {
      cardNumber: String, // Last 4 digits only
      cardholderName: String,
      expiryMonth: String,
      expiryYear: String,
      cardType: String // visa, mastercard, etc
    },

    // Status
    paymentStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },

    // Invoice
    invoiceNumber: {
      type: String,
      unique: true
    },
    invoiceUrl: String,

    // Pricing Breakdown
    pricing: {
      subtotal: Number,
      tax: Number,
      discount: Number,
      convenienceFee: Number,
      total: Number
    },

    // Refund Information
    refund: {
      isRefunded: {
        type: Boolean,
        default: false
      },
      refundAmount: Number,
      refundReason: String,
      refundDate: Date,
      refundStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    },

    // Payment Response Data
    paymentGatewayResponse: mongoose.Schema.Types.Mixed,

    // Metadata
    ip: String,
    userAgent: String,
    notes: String,

    // Timestamps
    paidAt: Date,
    failedAt: Date,
    attemptCount: {
      type: Number,
      default: 1
    },

    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ user: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

export default mongoose.model('Payment', paymentSchema);
