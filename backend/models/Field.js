import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true,
    maxlength: [100, 'Field name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Field description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Field owner is required']
  },
  
  // Sports and Field Type
  sports: [{
    type: String,
    enum: ['football', 'cricket', 'basketball', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'squash', 'swimming', 'golf', 'multi-sport'],
    required: true
  }],
  fieldType: {
    type: String,
    enum: ['indoor', 'outdoor', 'covered'],
    required: [true, 'Field type is required']
  },
  surface: {
    type: String,
    enum: ['grass', 'artificial-turf', 'concrete', 'wood', 'rubber', 'clay', 'synthetic'],
    required: [true, 'Surface type is required']
  },
  
  // Location
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      default: 'Dhaka Division'
    },
    country: {
      type: String,
      default: 'Bangladesh'
    },
    postalCode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required'],
      index: '2dsphere'
    },
    landmarks: [String]
  },
  
  // Images and Media
  images: [{
    public_id: String,
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  videos: [{
    public_id: String,
    url: String,
    thumbnail: String,
    duration: Number,
    title: String
  }],
  
  // Capacity and Dimensions
  capacity: {
    min: {
      type: Number,
      required: [true, 'Minimum capacity is required'],
      min: [1, 'Minimum capacity must be at least 1']
    },
    max: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      validate: {
        validator: function(v) {
          return v >= this.capacity.min;
        },
        message: 'Maximum capacity must be greater than or equal to minimum capacity'
      }
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['meters', 'feet'],
      default: 'meters'
    }
  },
  
  // Pricing
  pricing: {
    hourly: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Price cannot be negative']
    },
    daily: Number,
    weekly: Number,
    monthly: Number,
    currency: {
      type: String,
      default: 'BDT'
    },
    // Premium pricing for peak hours
    peakHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      rate: Number,
      timeSlots: [{
        start: String, // HH:mm format
        end: String,   // HH:mm format
        days: [{
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }]
      }]
    },
    // Seasonal pricing
    seasonalPricing: [{
      name: String,
      startDate: Date,
      endDate: Date,
      multiplier: {
        type: Number,
        min: 0.1,
        max: 5.0,
        default: 1.0
      }
    }],
    // Group discounts
    groupDiscounts: [{
      minPlayers: Number,
      discountPercentage: {
        type: Number,
        min: 0,
        max: 50
      }
    }]
  },
  
  // Availability
  availability: {
    // Weekly schedule
    schedule: {
      monday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '06:00' },
        closeTime: { type: String, default: '22:00' },
        breaks: [{
          start: String,
          end: String,
          reason: String
        }]
      },
      tuesday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '06:00' },
        closeTime: { type: String, default: '22:00' },
        breaks: [{
          start: String,
          end: String,
          reason: String
        }]
      },
      wednesday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '06:00' },
        closeTime: { type: String, default: '22:00' },
        breaks: [{
          start: String,
          end: String,
          reason: String
        }]
      },
      thursday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '06:00' },
        closeTime: { type: String, default: '22:00' },
        breaks: [{
          start: String,
          end: String,
          reason: String
        }]
      },
      friday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '06:00' },
        closeTime: { type: String, default: '22:00' },
        breaks: [{
          start: String,
          end: String,
          reason: String
        }]
      },
      saturday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '06:00' },
        closeTime: { type: String, default: '22:00' },
        breaks: [{
          start: String,
          end: String,
          reason: String
        }]
      },
      sunday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '06:00' },
        closeTime: { type: String, default: '22:00' },
        breaks: [{
          start: String,
          end: String,
          reason: String
        }]
      }
    },
    // Special dates (holidays, maintenance, etc.)
    specialDates: [{
      date: Date,
      isAvailable: Boolean,
      reason: String,
      customHours: {
        openTime: String,
        closeTime: String
      }
    }],
    // Advance booking limit
    advanceBookingDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    },
    // Minimum booking duration
    minBookingDuration: {
      type: Number,
      default: 1, // hours
      min: 0.5
    },
    // Maximum booking duration
    maxBookingDuration: {
      type: Number,
      default: 8, // hours
      min: 1
    }
  },
  
  // Amenities and Features
  amenities: [{
    name: {
      type: String,
      required: true
    },
    icon: String,
    isPremium: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  
  facilities: {
    parking: {
      available: { type: Boolean, default: false },
      capacity: Number,
      isFree: { type: Boolean, default: true }
    },
    restrooms: {
      available: { type: Boolean, default: false },
      count: Number,
      hasShowers: { type: Boolean, default: false }
    },
    lockerRooms: {
      available: { type: Boolean, default: false },
      count: Number,
      capacity: Number
    },
    cafeteria: {
      available: { type: Boolean, default: false },
      name: String,
      contact: String
    },
    firstAid: {
      available: { type: Boolean, default: false },
      trainedStaff: { type: Boolean, default: false }
    },
    equipment: {
      available: { type: Boolean, default: false },
      items: [String],
      rentalAvailable: { type: Boolean, default: false }
    },
    wifi: {
      available: { type: Boolean, default: false },
      isFree: { type: Boolean, default: true },
      password: String
    },
    lighting: {
      hasFloodlights: { type: Boolean, default: false },
      quality: {
        type: String,
        enum: ['poor', 'average', 'good', 'excellent']
      }
    },
    seating: {
      available: { type: Boolean, default: false },
      capacity: Number,
      isCovered: { type: Boolean, default: false }
    }
  },
  
  // Rules and Policies
  rules: [{
    title: String,
    description: String,
    isStrictlyEnforced: {
      type: Boolean,
      default: false
    }
  }],
  
  policies: {
    cancellation: {
      freeUntilHours: {
        type: Number,
        default: 24
      },
      partialRefundHours: {
        type: Number,
        default: 12
      },
      refundPercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      }
    },
    payment: {
      upfrontPercentage: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      },
      acceptedMethods: [{
        type: String,
        enum: ['cash', 'card', 'bkash', 'nagad', 'rocket', 'upay', 'bank-transfer']
      }]
    },
    noShow: {
      penaltyPercentage: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      }
    }
  },
  
  // Status and Verification
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'pending-approval', 'suspended'],
    default: 'pending-approval'
  },
  
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    documents: [{
      type: {
        type: String,
        enum: ['license', 'permit', 'insurance', 'ownership', 'other']
      },
      url: String,
      public_id: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }]
  },
  
  // Analytics and Performance
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    utilizationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    repeatCustomers: {
      type: Number,
      default: 0
    },
    cancellationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // SEO and Marketing
  seo: {
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  featured: {
    isFeatured: {
      type: Boolean,
      default: false
    },
    featuredUntil: Date,
    featuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Social Features
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Contact Information
  contact: {
    email: String,
    phone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  
  // Additional Settings
  settings: {
    instantBooking: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    allowWaitlist: {
      type: Boolean,
      default: true
    },
    sendNotifications: {
      type: Boolean,
      default: true
    },
    publiclyVisible: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
fieldSchema.index({ 'location.coordinates': '2dsphere' });
fieldSchema.index({ owner: 1 });
fieldSchema.index({ sports: 1 });
fieldSchema.index({ status: 1 });
fieldSchema.index({ 'pricing.hourly': 1 });
fieldSchema.index({ 'stats.averageRating': -1 });
fieldSchema.index({ createdAt: -1 });
fieldSchema.index({ 'seo.slug': 1 });
fieldSchema.index({ featured: 1, 'featured.featuredUntil': 1 });

// Text search index
fieldSchema.index({
  name: 'text',
  description: 'text',
  'location.address': 'text',
  'location.city': 'text',
  'seo.keywords': 'text'
});

// Virtual fields
fieldSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

fieldSchema.virtual('isOpen').get(function() {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().substring(0, 3) + 'day';
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todaySchedule = this.availability.schedule[currentDay];
  if (!todaySchedule || !todaySchedule.isOpen) return false;
  
  return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
});

fieldSchema.virtual('nextAvailableSlot').get(function() {
  // Logic to calculate next available time slot
  // This would be implemented based on existing bookings
  return null; // Placeholder
});

fieldSchema.virtual('priceRange').get(function() {
  const base = this.pricing.hourly;
  const peak = this.pricing.peakHours.enabled ? this.pricing.peakHours.rate : base;
  
  if (base === peak) {
    return `${base} ${this.pricing.currency}/hour`;
  }
  
  return `${base} - ${peak} ${this.pricing.currency}/hour`;
});

// Middleware
fieldSchema.pre('save', function(next) {
  // Generate slug from name
  if (this.isModified('name') || !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  
  // Set meta title and description if not provided
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = `${this.name} - ${this.sports.join(', ')} Field in ${this.location.city}`;
  }
  
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.description.length > 150 
      ? this.description.substring(0, 150) + '...'
      : this.description;
  }
  
  next();
});

fieldSchema.pre('save', function(next) {
  // Ensure at least one image is marked as primary
  if (this.images.length > 0 && !this.images.some(img => img.isPrimary)) {
    this.images[0].isPrimary = true;
  }
  
  next();
});

// Instance methods
fieldSchema.methods.updateStats = async function() {
  // This would be called after bookings to update statistics
  // Implementation would involve aggregating booking data
  return this.save();
};

fieldSchema.methods.isAvailableAt = function(dateTime, duration = 1) {
  // Check if field is available at specific date and time
  const day = dateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const time = dateTime.toTimeString().slice(0, 5);
  
  const schedule = this.availability.schedule[day];
  if (!schedule || !schedule.isOpen) return false;
  
  // Check if time is within operating hours
  if (time < schedule.openTime || time > schedule.closeTime) return false;
  
  // Check for breaks
  const isInBreak = schedule.breaks.some(breakTime => 
    time >= breakTime.start && time <= breakTime.end
  );
  
  if (isInBreak) return false;
  
  // Check special dates
  const dateString = dateTime.toISOString().split('T')[0];
  const specialDate = this.availability.specialDates.find(
    special => special.date.toISOString().split('T')[0] === dateString
  );
  
  if (specialDate && !specialDate.isAvailable) return false;
  
  // Additional logic would check existing bookings
  return true;
};

fieldSchema.methods.calculatePrice = function(startTime, endTime, playerCount = 1) {
  const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
  let basePrice = this.pricing.hourly * duration;
  
  // Apply peak hour pricing
  if (this.pricing.peakHours.enabled) {
    // Logic to check if booking falls in peak hours
    // For now, using base price
  }
  
  // Apply group discounts
  const discount = this.pricing.groupDiscounts.find(
    group => playerCount >= group.minPlayers
  );
  
  if (discount) {
    basePrice = basePrice * (1 - discount.discountPercentage / 100);
  }
  
  return Math.round(basePrice * 100) / 100; // Round to 2 decimal places
};

fieldSchema.methods.addFollower = function(userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

fieldSchema.methods.removeFollower = function(userId) {
  this.followers = this.followers.filter(
    follower => follower.toString() !== userId.toString()
  );
  return this.save();
};

// Static methods
fieldSchema.statics.findNearby = function(coordinates, maxDistance = 10000, filters = {}) {
  const query = {
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    ...filters
  };
  
  return this.find(query);
};

fieldSchema.statics.searchFields = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active',
    ...filters
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

fieldSchema.statics.getFeaturedFields = function(limit = 10) {
  return this.find({
    'featured.isFeatured': true,
    'featured.featuredUntil': { $gt: new Date() },
    status: 'active'
  }).limit(limit);
};

fieldSchema.statics.getTopRatedFields = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.averageRating': -1, 'stats.totalReviews': -1 })
    .limit(limit);
};

fieldSchema.statics.getFieldsByOwner = function(ownerId) {
  return this.find({ owner: ownerId });
};

const Field = mongoose.model('Field', fieldSchema);

export default Field;