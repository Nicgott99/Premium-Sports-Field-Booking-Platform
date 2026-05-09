import mongoose from 'mongoose';

/**
 * Team Schema
 * Represents a sports team with members, roles, and organizational information
 * Supports multiple sports and skill levels
 * Maintains team statistics and achievements
 */
const teamSchema = new mongoose.Schema(
  {
    // Basic Team Information
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    logo: {
      public_id: String,
      url: String
    },

    // Team Management - Members and Structure
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team captain is required']
    },
    /**
     * Team members array with role information
     * Roles: captain, co-captain, player, substitute
     */
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          enum: ['captain', 'co-captain', 'player', 'substitute'],
          default: 'player'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Sports and Competitive Level
    sport: {
      type: String,
      enum: ['football', 'cricket', 'basketball', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'squash', 'swimming', 'golf', 'multi-sport'],
      required: [true, 'Sport is required']
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'professional'],
      default: 'intermediate'
    },

    // Contact Information
    contactPerson: {
      name: String,
      phone: String,
      email: String
    },

    // Achievements and Stats
    tournaments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
      }
    ],
    stats: {
      totalMatches: {
        type: Number,
        default: 0
      },
      wins: {
        type: Number,
        default: 0
      },
      losses: {
        type: Number,
        default: 0
      },
      draws: {
        type: Number,
        default: 0
      }
    },

    // Team Status
    isActive: {
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
teamSchema.index({ captain: 1 });
teamSchema.index({ sport: 1 });
teamSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Team', teamSchema);
