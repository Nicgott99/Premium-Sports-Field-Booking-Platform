import mongoose from 'mongoose';

/**
 * Review Schema for field ratings and user feedback
 * Allows users to rate and review sports facilities
 * 
 * Rating System:
 * 1 star: Poor - Would not recommend
 * 2 stars: Fair - Below average facility/experience
 * 3 stars: Good - Average facility/experience
 * 4 stars: Very Good - Above average facility/experience
 * 5 stars: Excellent - Would highly recommend
 * 
 * Review Categories:
 * - Facility Quality: Condition, maintenance, equipment
 * - Cleanliness: Overall cleanliness and hygiene
 * - Service: Staff behavior, responsiveness
 * - Value: Price-to-quality ratio
 * - Location: Accessibility, parking, transportation
 * 
 * Review Moderation:
 * Flagged reviews are hidden until admin approval
 * Helps prevent spam and inappropriate content
 * 
 * Helpful Count Tracking:
 * Users can mark reviews as helpful for ranking
 * Increases visibility of quality reviews
 */
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
