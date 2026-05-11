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
 * - Flagged reviews hidden until approval
 * - Prevents spam and inappropriate content
 * - Admin review queue
 * - Auto-flagging for low ratings
 * 
 * Helpful System:
 * - Users mark helpful reviews
 * - Helps rank quality feedback
 * - Display count of helpful votes
 * - Influence review sorting
 * 
 * Review Content:
 * - Title: Headline (max 100 chars)
 * - Content: Detailed feedback (max 2000 chars)
 * - Rating: 1-5 stars
 * - Images: Up to 5 photos
 * - Verified Purchase: Booking confirmation
 * 
 * Reviewer Info:
 * - User: Review author
 * - Anonymous: Option for anonymous reviews
 * - Date: Review submission date
 * - Last Updated: Edit timestamp
 * 
 * Review Constraints:
 * - One review per field per user
 * - Only verified booking users
 * - Booking must be completed
 * - 1-day delay after booking
 * - Edit window: 30 days
 * - Delete window: 60 days
 * 
 * Moderation Fields:
 * - Flagged: Flagged by moderators
 * - Flag Reason: Why flagged
 * - Approved: Admin approved
 * - Spam Score: AI spam detection
 * 
 * Helpful Tracking:
 * - Helpful count: User votes
 * - Reported count: Abuse reports
 * - Report reasons: Spam, offensive, fake
 * - Manual removal: Admin action
 * 
 * Analytics:
 * - Average rating per field
 * - Rating distribution
 * - Review frequency
 * - Helpful percentage
 * - Response rate
 * 
 * Relationships:
 * - Field: Reviews belong to field
 * - User: Author of review
 * - Booking: Evidence of participation
 * 
 * Indexes:
 * - fieldId: Field lookup
 * - userId: User reviews
 * - rating: Rating filtering
 * - helpful: Helpful sorting
 * - createdAt: Date queries
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
