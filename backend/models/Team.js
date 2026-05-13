import mongoose from 'mongoose';

/**
 * Team Schema - Sports Team Organization & Management
 * Complete team management with member roles, statistics, and organizational features
 * 
 * Team Structure:
 * - Captain: Founder with full permissions
 * - Co-captain: Assistants with limited permissions
 * - Player: Regular team members
 * - Substitute: Reserve players
 * 
 * Team Information:
 * - Name: Unique team identifier
 * - Sport: Single sport per team
 * - Skill Level: beginner | intermediate | advanced | professional
 * - Description: Team bio/about section
 * - Logo: Team badge/image
 * - Founded: Team creation date
 * - Status: active | inactive | disbanded
 * 
 * Member Management:
 * - Invitation system: Email-based or link-based
 * - Approval workflow: Accept/decline invitations
 * - Role assignments: Captain, co-captain, player, substitute
 * - Member removal: Captain removes members
 * - Participation tracking: Attendance, statistics
 * 
 * Team Statistics:
 * - Match record: Wins, losses, draws
 * - Tournament performance: Participations, placements
 * - Member metrics: Total, active, average tenure
 * - Team rating: User-based team reviews (1-5 stars)
 * - Engagement score: Activity level calculation
 * 
 * Team Activities:
 * - Field bookings: Practice and match reservations
 * - Tournament registration: Enrollment and results
 * - Team chat: Communication and coordination
 * - Match scheduling: Calendar management
 * - Performance analytics: Stats and trends
 * 
 * Governance:
 * - Team rules: Code of conduct
 * - Entry requirements: Skill, fees, etc.
 * - Discipline: Warnings, suspensions, appeals
 * - Finances: Dues, prize distribution, expenses
 * 
 * Privacy & Visibility:
 * - Public: Visible to all users
 * - Private: Members only
 * - Hidden: Unlisted/invitation only
 * - Joinable: Allow member requests
 * - Closed: Admin invitation only
 * 
 * Relationships:
 * - Bookings: Field reservations
 * - Tournaments: Tournament participations
 * - Matches: Match schedules and results
 * 
 * Indexes: captain, name, sport, createdAt
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
