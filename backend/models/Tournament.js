import mongoose from 'mongoose';

/**
 * Tournament Schema
 * Represents a sports tournament with scheduling, participants, and bracket management
 * Supports various formats (round-robin, knockout, group-stage, league)
 * Tracks matches, results, and leaderboard standings
 */
const tournamentSchema = new mongoose.Schema(
  {
    // Basic Tournament Information
    name: {
      type: String,
      required: [true, 'Tournament name is required'],
      trim: true,
      maxlength: [100, 'Tournament name cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    poster: {
      public_id: String,
      url: String
    },

    // Tournament Organization and Details
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required']
    },
    sport: {
      type: String,
      enum: ['football', 'cricket', 'basketball', 'tennis', 'badminton', 'volleyball', 'table-tennis', 'squash', 'swimming', 'golf', 'multi-sport'],
      required: [true, 'Sport is required']
    },
    /**
     * Tournament format determines bracket structure
     * round-robin: Each participant plays every other participant
     * knockout: Single elimination tournament
     * group-stage: Teams divided into groups, then playoff rounds
     * league: Points-based competition across multiple matches
     */
    format: {
      type: String,
      enum: ['round-robin', 'knockout', 'group-stage', 'league'],
      required: [true, 'Tournament format is required']
    },

    // Tournament Scheduling
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required']
    },
    /**
     * Tournament status lifecycle
     * upcoming: Registration open, tournament not started
     * ongoing: Tournament is currently happening
     * completed: Tournament has finished
     * cancelled: Tournament was cancelled
     */
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
    },

    // Location and Venue
    location: {
      address: String,
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: String,
      country: {
        type: String,
        default: 'Bangladesh'
      },
      coordinates: [Number]
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field'
    },

    // Participation
    maxTeams: {
      type: Number,
      required: [true, 'Maximum teams is required'],
      min: [2, 'Minimum 2 teams required']
    },
    registeredTeams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      }
    ],
    qualifiedTeams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      }
    ],

    // Prizes and Rewards
    prizes: {
      currency: {
        type: String,
        default: 'BDT'
      },
      firstPlace: Number,
      secondPlace: Number,
      thirdPlace: Number,
      totalPrizePool: Number
    },

    // Rules and Registration
    entryFee: {
      type: Number,
      default: 0
    },
    minTeamSize: {
      type: Number,
      default: 5
    },
    maxTeamSize: {
      type: Number,
      default: 11
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
      default: 'intermediate'
    },

    // Rules
    rules: {
      type: String,
      maxlength: [5000, 'Rules cannot exceed 5000 characters']
    },

    // Contact
    contactPerson: {
      name: String,
      phone: String,
      email: String
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
tournamentSchema.index({ organizer: 1 });
tournamentSchema.index({ sport: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Tournament', tournamentSchema);
