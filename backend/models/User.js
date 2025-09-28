import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+88)?01[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number']
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid; // Password required only if not using Firebase auth
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  // Firebase Integration
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Profile Information
  avatar: {
    public_id: String,
    url: {
      type: String,
      default: 'https://res.cloudinary.com/cse471-sports/image/upload/v1234567890/avatars/default-avatar.png'
    }
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return v < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Location Information
  location: {
    address: String,
    city: {
      type: String,
      default: 'Dhaka'
    },
    state: {
      type: String,
      default: 'Dhaka Division'
    },
    country: {
      type: String,
      default: 'Bangladesh'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // Sports Preferences
  sportsInterests: [{
    sport: {
      type: String,
      enum: ['football', 'cricket', 'basketball', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'squash', 'swimming', 'golf', 'other']
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional'],
      default: 'beginner'
    },
    experience: {
      type: Number,
      min: 0,
      max: 50
    }
  }],
  
  // User Role and Permissions
  role: {
    type: String,
    enum: ['user', 'fieldOwner', 'manager', 'admin'],
    default: 'user'
  },
  permissions: [{
    type: String
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Subscription Information
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'platinum'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'cancelled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Social Links
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },
  
  // Preferences and Settings
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public'
      },
      showLocation: {
        type: Boolean,
        default: true
      },
      showSportsInterests: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Dhaka'
    }
  },
  
  // Statistics
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    favoriteFields: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    }],
    joinedTeams: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }],
    completedTournaments: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Device and Security
  devices: [{
    deviceId: String,
    deviceType: String,
    fcmToken: String,
    lastActive: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ role: 1 });
userSchema.index({ 'subscription.plan': 1, 'subscription.status': 1 });
userSchema.index({ createdAt: -1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

userSchema.virtual('isAccountLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('isPremiumUser').get(function() {
  return ['premium', 'platinum'].includes(this.subscription?.plan) && this.subscription?.status === 'active';
});

// Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.isVerified = false;
  }
  next();
});

// Instance methods
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // After 5 failed attempts, lock account for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.updateLastLogin = function() {
  return this.updateOne({ lastLogin: Date.now() });
};

userSchema.methods.addDevice = function(deviceInfo) {
  const existingDevice = this.devices.find(device => device.deviceId === deviceInfo.deviceId);
  
  if (existingDevice) {
    existingDevice.fcmToken = deviceInfo.fcmToken;
    existingDevice.lastActive = Date.now();
  } else {
    this.devices.push({
      ...deviceInfo,
      lastActive: Date.now()
    });
  }
  
  return this.save();
};

userSchema.methods.removeDevice = function(deviceId) {
  this.devices = this.devices.filter(device => device.deviceId !== deviceId);
  return this.save();
};

userSchema.methods.toProfileJSON = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    bio: this.bio,
    age: this.age,
    gender: this.gender,
    location: this.location,
    sportsInterests: this.sportsInterests,
    socialLinks: this.socialLinks,
    stats: this.stats,
    subscription: this.subscription,
    role: this.role,
    isVerified: this.isVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  });
};

userSchema.statics.getActiveUsersCount = function() {
  return this.countDocuments({ isActive: true });
};

userSchema.statics.getPremiumUsersCount = function() {
  return this.countDocuments({
    'subscription.plan': { $in: ['premium', 'platinum'] },
    'subscription.status': 'active'
  });
};

const User = mongoose.model('User', userSchema);

export default User;