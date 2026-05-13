import mongoose from 'mongoose';

/**
 * Tournament Schema - Sports Tournament Management System
 * Complete tournament lifecycle from creation through results with bracket generation
 * 
 * Tournament Status Lifecycle:
 * - draft: Initial setup, not visible publicly
 * - registration_open: Teams can register, visible to public
 * - registration_closed: No new registrations after deadline
 * - scheduled: Bracket generated, matches scheduled
 * - in_progress: Matches underway, standings updated
 * - completed: All matches finished, winners crowned
 * - cancelled: Tournament cancelled, refunds issued
 * 
 * Tournament Formats:
 * - round_robin: Each team plays every other (n-1 rounds)
 * - knockout: Single elimination with seeding
 * - group_stage: Teams in groups + knockout phase
 * - league: Points-based seasonal competition
 * 
 * Basic Information:
 * - Name, description, poster/banner
 * - Organizer, sport type, format
 * - Skill level: beginner, intermediate, advanced, professional
 * - Min/max participants, entry fee
 * - Prize pool: Total prizes available
 * 
 * Dates & Venue:
 * - Start date: Tournament begins
 * - End date: Tournament concludes
 * - Location: Physical venue or virtual
 * - Match schedule: Generated after bracket creation
 * 
 * Registration:
 * - Registration start/end dates
 * - Auto-close when max reached
 * - Early bird discount option
 * - Late registration fee (optional)
 * 
 * Teams/Participants:
 * - Team registration with captain info
 * - Roster submission with player details
 * - Seeding: Ranking for bracket placement
 * - Status: registered, waitlisted, rejected, disqualified
 * 
 * Bracket & Matches:
 * - Generated bracket structure
 * - Match schedule with dates/times
 * - Venue assignment per match
 * - Match results and scoring
 * 
 * Standings:
 * - Points system: Win=3, Draw=1, Loss=0
 * - Tiebreaker: Goal diff, goals for, head-to-head
 * - Live leaderboard updates
 * - Performance metrics per team
 * 
 * Results & Awards:
 * - Final standings/rankings
 * - Championship winner
 * - Runner-up and third place
 * - Prize distribution to winners
 * - Awards: Best offense, best defense, MVP
 * 
 * Organizer Controls:
 * - Create/edit tournament
 * - Manage registrations
n * - Generate bracket
 * - Enter match results
 * - Manage teams/players
 * - Award prizes
 * 
 * Relationships:
 * - Organizer: User managing tournament
 * - Teams: Participating teams
 * - Matches: Individual match records
 * - Results: Score and outcome data
 * 
 * Indexes: organizer, sport, status, startDate, createdAt
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
