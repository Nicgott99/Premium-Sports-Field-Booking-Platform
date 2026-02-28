import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    // Rating and Review Content
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      maxlength: [2000, 'Review cannot exceed 2000 characters']
    },

    // Reviewer Information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required']
    },

    // Target (Field or other entity)
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },

    // Review Categories
    categories: {
      cleanliness: {
        type: Number,
        min: 1,
        max: 5
      },
      amenities: {
        type: Number,
        min: 1,
        max: 5
      },
      staff: {
        type: Number,
        min: 1,
        max: 5
      },
      pricing: {
        type: Number,
        min: 1,
        max: 5
      },
      location: {
        type: Number,
        min: 1,
        max: 5
      }
    },

    // Media
    images: [
      {
        public_id: String,
        url: String
      }
    ],

    // Review Metrics
    helpful: {
      type: Number,
      default: 0
    },
    notHelpful: {
      type: Number,
      default: 0
    },
    reported: {
      type: Boolean,
      default: false
    },

    // Status
    isApproved: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },

    // Metadata
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
reviewSchema.index({ user: 1 });
reviewSchema.index({ field: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ content: 'text', title: 'text' });

export default mongoose.model('Review', reviewSchema);
