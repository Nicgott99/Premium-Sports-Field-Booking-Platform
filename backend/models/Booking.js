import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // Basic Information
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties Involved
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: [true, 'Field is required']
  },
  
  // Booking Details
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function(v) {
        return v > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  
  // Participants
  participants: {
    primary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    players: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String,
      phone: String,
      status: {
        type: String,
        enum: ['invited', 'confirmed', 'declined', 'pending'],
        default: 'confirmed'
      },
      invitedAt: {
        type: Date,
        default: Date.now
      },
      respondedAt: Date
    }],
    expectedCount: {
      type: Number,
      required: [true, 'Expected player count is required'],
      min: 1
    },
    actualCount: {
      type: Number,
      default: 0
    }
  },
  
  // Team/Group Information
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  isTeamBooking: {
    type: Boolean,
    default: false
  },
  
  // Booking Type
  bookingType: {
    type: String,
    enum: ['individual', 'group', 'team', 'tournament', 'training', 'match', 'event'],
    default: 'individual'
  },
  
  // Sports Information
  sport: {
    type: String,
    enum: ['football', 'cricket', 'basketball', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'squash', 'swimming', 'golf', 'other'],
    required: [true, 'Sport is required']
  },
  gameType: {
    type: String,
    enum: ['casual', 'competitive', 'training', 'tournament', 'friendly'],
    default: 'casual'
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'mixed', 'professional'],
    default: 'mixed'
  },
  
  // Pricing and Payment
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    discounts: [{
      type: {
        type: String,
        enum: ['group', 'early-bird', 'loyalty', 'seasonal', 'promotional']
      },
      amount: Number,
      percentage: Number,
      description: String
    }],
    taxes: [{
      type: String,
      amount: Number,
      percentage: Number
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'BDT'
    }
  },
  
  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bkash', 'nagad', 'rocket', 'upay', 'bank-transfer', 'wallet']
    },
    transactionId: String,
    stripePaymentIntentId: String,
    paidAmount: {
      type: Number,
      default: 0
    },
    paidAt: Date,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundedAt: Date,
    refundReason: String
  },
  
  // Booking Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show', 'in-progress'],
    default: 'pending'
  },
  
  // Confirmation and Approval
  confirmation: {
    isConfirmed: {
      type: Boolean,
      default: false
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    confirmedAt: Date,
    confirmationCode: String
  },
  
  // Cancellation Information
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: String,
    refundEligible: {
      type: Boolean,
      default: false
    },
    refundAmount: Number
  },
  
  // Special Requests and Notes
  specialRequests: [{
    type: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending'
    }
  }],
  notes: {
    user: String,
    admin: String,
    fieldOwner: String
  },
  
  // Equipment and Services
  equipment: [{
    item: String,
    quantity: Number,
    cost: Number,
    provided: {
      type: String,
      enum: ['field', 'user', 'rental'],
      default: 'user'
    }
  }],
  
  additionalServices: [{
    service: String,
    cost: Number,
    provider: String,
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'provided'],
      default: 'requested'
    }
  }],
  
  // Check-in/Check-out
  checkIn: {
    time: Date,
    method: {
      type: String,
      enum: ['qr-code', 'manual', 'automated']
    },
    location: {
      type: [Number] // [longitude, latitude]
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  checkOut: {
    time: Date,
    method: {
      type: String,
      enum: ['qr-code', 'manual', 'automated']
    },
    condition: {
      type: String,
      enum: ['good', 'minor-damage', 'major-damage'],
      default: 'good'
    },
    notes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Weather Information (for outdoor fields)
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    precipitation: Number,
    forecast: String
  },
  
  // Reviews and Ratings
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    reviewedAt: Date,
    fieldOwnerResponse: {
      comment: String,
      respondedAt: Date
    }
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  
  // Notifications
  notifications: {
    reminderSent: {
      type: Boolean,
      default: false
    },
    confirmationSent: {
      type: Boolean,
      default: false
    },
    cancellationSent: {
      type: Boolean,
      default: false
    }
  },
  
  // Analytics and Tracking
  analytics: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'phone', 'walk-in'],
      default: 'web'
    },
    device: String,
    browser: String,
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  },
  
  // Recurring Booking Information
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: Number, // every N days/weeks/months
    endDate: Date,
    parentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    occurrenceNumber: Number
  },
  
  // Emergency Information
  emergency: {
    contact: {
      name: String,
      phone: String,
      relationship: String
    },
    medicalInfo: String,
    allergies: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ field: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ sport: 1 });
bookingSchema.index({ bookingType: 1 });

// Compound indexes
bookingSchema.index({ field: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ field: 1, status: 1 });

// Virtual fields
bookingSchema.virtual('isActive').get(function() {
  const now = new Date();
  return now >= this.startTime && now <= this.endTime && this.status === 'confirmed';
});

bookingSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.startTime && ['confirmed', 'pending'].includes(this.status);
});

bookingSchema.virtual('isPast').get(function() {
  return new Date() > this.endTime;
});

bookingSchema.virtual('canCancel').get(function() {
  if (this.status !== 'confirmed' && this.status !== 'pending') return false;
  
  const now = new Date();
  const hoursUntilStart = (this.startTime - now) / (1000 * 60 * 60);
  
  // Can cancel at least 2 hours before start time
  return hoursUntilStart >= 2;
});

bookingSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'confirmed') return null;
  
  const now = new Date();
  if (now > this.endTime) return 0;
  if (now < this.startTime) return this.endTime - this.startTime;
  
  return this.endTime - now;
});

bookingSchema.virtual('qrCode').get(function() {
  // Generate QR code data for check-in
  return {
    bookingId: this.bookingId,
    fieldId: this.field,
    startTime: this.startTime,
    endTime: this.endTime
  };
});

// Middleware
bookingSchema.pre('save', function(next) {
  // Generate booking ID if not exists
  if (!this.bookingId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingId = `BK${timestamp.slice(-8)}${random}`;
  }
  
  // Calculate duration
  if (this.startTime && this.endTime) {
    this.duration = (this.endTime - this.startTime) / (1000 * 60 * 60);
  }
  
  // Set primary participant
  if (!this.participants.primary) {
    this.participants.primary = this.user;
  }
  
  next();
});

bookingSchema.pre('save', function(next) {
  // Auto-complete booking if end time has passed
  if (this.status === 'confirmed' && new Date() > this.endTime) {
    this.status = 'completed';
  }
  
  next();
});

// Instance methods
bookingSchema.methods.confirmBooking = function(confirmedBy) {
  this.status = 'confirmed';
  this.confirmation.isConfirmed = true;
  this.confirmation.confirmedBy = confirmedBy;
  this.confirmation.confirmedAt = new Date();
  this.confirmation.confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  return this.save();
};

bookingSchema.methods.cancelBooking = function(cancelledBy, reason, refundAmount = 0) {
  this.status = 'cancelled';
  this.cancellation.isCancelled = true;
  this.cancellation.cancelledBy = cancelledBy;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.reason = reason;
  this.cancellation.refundAmount = refundAmount;
  this.cancellation.refundEligible = refundAmount > 0;
  
  return this.save();
};

bookingSchema.methods.checkIn = function(method = 'manual', location = null, verifiedBy = null) {
  this.checkIn.time = new Date();
  this.checkIn.method = method;
  this.checkIn.location = location;
  this.checkIn.verifiedBy = verifiedBy;
  this.status = 'in-progress';
  
  return this.save();
};

bookingSchema.methods.checkOut = function(condition = 'good', notes = '', verifiedBy = null) {
  this.checkOut.time = new Date();
  this.checkOut.condition = condition;
  this.checkOut.notes = notes;
  this.checkOut.verifiedBy = verifiedBy;
  this.status = 'completed';
  
  return this.save();
};

bookingSchema.methods.addParticipant = function(participant) {
  this.participants.players.push({
    ...participant,
    status: 'invited',
    invitedAt: new Date()
  });
  
  return this.save();
};

bookingSchema.methods.updateParticipantStatus = function(participantId, status) {
  const participant = this.participants.players.id(participantId);
  if (participant) {
    participant.status = status;
    participant.respondedAt = new Date();
  }
  
  return this.save();
};

bookingSchema.methods.addMessage = function(sender, message) {
  this.messages.push({
    sender,
    message,
    timestamp: new Date()
  });
  
  return this.save();
};

bookingSchema.methods.calculateRefund = function() {
  const now = new Date();
  const hoursUntilStart = (this.startTime - now) / (1000 * 60 * 60);
  
  // Full refund if cancelled 24+ hours before
  if (hoursUntilStart >= 24) {
    return this.pricing.totalAmount;
  }
  
  // 50% refund if cancelled 12-24 hours before
  if (hoursUntilStart >= 12) {
    return this.pricing.totalAmount * 0.5;
  }
  
  // No refund if cancelled less than 12 hours before
  return 0;
};

bookingSchema.methods.isConflictWith = function(otherBooking) {
  return (
    this.field.toString() === otherBooking.field.toString() &&
    this.startTime < otherBooking.endTime &&
    this.endTime > otherBooking.startTime
  );
};

// Static methods
bookingSchema.statics.findConflicts = function(fieldId, startTime, endTime, excludeBookingId = null) {
  const query = {
    field: fieldId,
    status: { $in: ['confirmed', 'pending', 'in-progress'] },
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  return this.find(query);
};

bookingSchema.statics.getUserBookings = function(userId, status = null) {
  const query = { user: userId };
  if (status) {
    if (Array.isArray(status)) {
      query.status = { $in: status };
    } else {
      query.status = status;
    }
  }
  
  return this.find(query)
    .populate('field', 'name location images')
    .sort({ startTime: -1 });
};

bookingSchema.statics.getFieldBookings = function(fieldId, startDate = null, endDate = null) {
  const query = { field: fieldId };
  
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = startDate;
    if (endDate) query.startTime.$lte = endDate;
  }
  
  return this.find(query)
    .populate('user', 'firstName lastName email phone')
    .sort({ startTime: 1 });
};

bookingSchema.statics.getUpcomingBookings = function(userId, limit = 10) {
  return this.find({
    user: userId,
    startTime: { $gt: new Date() },
    status: { $in: ['confirmed', 'pending'] }
  })
    .populate('field', 'name location images')
    .sort({ startTime: 1 })
    .limit(limit);
};

bookingSchema.statics.getBookingStats = function(fieldId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        field: mongoose.Types.ObjectId(fieldId),
        startTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;