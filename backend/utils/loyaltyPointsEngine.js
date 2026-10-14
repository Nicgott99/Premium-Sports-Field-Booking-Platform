/**
 * loyaltyPointsEngine.js — Loyalty Points Calculation Engine
 * Premium Sports Booking Platform
 *
 * Manages the full lifecycle of a sports-platform loyalty programme:
 *  - Point earning rules per booking type, sport, and time-of-day
 *  - Tier progression: Bronze → Silver → Gold → Platinum
 *  - Tier-based multipliers and perks
 *  - Point redemption with minimum thresholds and discount caps
 *  - Point expiry (rolling 12-month window by default)
 *  - Immutable transaction ledger helpers for audit trails
 *  - Bonus campaigns (double-points weekends, first-booking bonus, etc.)
 *
 * All functions are pure — they accept data objects and return new values.
 * Wire them into your Booking / User controllers for persistent storage.
 *
 * Usage:
 *   import { calculateEarnedPoints, applyRedemption, getUserTier } from './loyaltyPointsEngine.js';
 */

// ─── Tier Definitions ─────────────────────────────────────────────────────────

/**
 * Cumulative points thresholds to reach each tier.
 * "Cumulative" = total points ever earned (not current balance).
 */
export const TIERS = {
  bronze: {
    name: 'Bronze',
    minLifetimePoints: 0,
    multiplier: 1.0,
    perks: ['basic_support', 'birthday_bonus'],
    color: '#cd7f32',
    icon: '🥉',
  },
  silver: {
    name: 'Silver',
    minLifetimePoints: 1_000,
    multiplier: 1.25,
    perks: ['priority_support', 'birthday_bonus', 'monthly_bonus_slot'],
    color: '#c0c0c0',
    icon: '🥈',
  },
  gold: {
    name: 'Gold',
    minLifetimePoints: 5_000,
    multiplier: 1.5,
    perks: ['priority_support', 'birthday_bonus', 'monthly_bonus_slot', 'free_cancellation', 'early_access'],
    color: '#ffd700',
    icon: '🥇',
  },
  platinum: {
    name: 'Platinum',
    minLifetimePoints: 20_000,
    multiplier: 2.0,
    perks: ['vip_support', 'birthday_bonus', 'monthly_bonus_slot', 'free_cancellation', 'early_access', 'complimentary_upgrade'],
    color: '#e5e4e2',
    icon: '💎',
  },
};

// ─── Base Earn Rates ──────────────────────────────────────────────────────────

/** Points earned per BDT (or platform currency unit) spent. */
export const BASE_POINTS_PER_CURRENCY = 1; // 1 point per ৳1

/** Bonus multipliers by booking type. */
export const BOOKING_TYPE_MULTIPLIERS = {
  tournament: 3.0,
  league:     2.5,
  corporate:  2.0,
  recurring:  1.5,
  regular:    1.0,
  casual:     0.75,
};

/** Bonus multipliers by sport (encourages underused sports). */
export const SPORT_BONUS_MULTIPLIERS = {
  cricket:    1.2,
  football:   1.0,
  basketball: 1.1,
  tennis:     1.1,
  badminton:  1.15,
  volleyball: 1.1,
  rugby:      1.2,
  hockey:     1.2,
};

/** Off-peak hours earn a small bonus (encourage scheduling during quiet hours). */
export const OFF_PEAK_HOURS   = [6, 7, 8, 13, 14, 15]; // hour numbers (0–23)
export const OFF_PEAK_BONUS   = 0.15; // +15%

export const WEEKEND_BONUS    = 0.10; // +10% on Sat/Sun
export const FIRST_BOOKING_BONUS_POINTS = 500; // flat bonus on very first booking

// ─── Redemption Rules ─────────────────────────────────────────────────────────

/** Points needed to earn ৳1 of discount. */
export const POINTS_PER_CURRENCY_REDEMPTION = 10;

/** Minimum points a user must have before they can redeem anything. */
export const MIN_REDEMPTION_POINTS = 200;

/** Maximum discount as a fraction of booking value (50%). */
export const MAX_REDEMPTION_FRACTION = 0.50;

// ─── Expiry ───────────────────────────────────────────────────────────────────

/** Points expire if unused for this many months. */
export const EXPIRY_MONTHS = 12;

// ─── Tier Resolution ─────────────────────────────────────────────────────────

/**
 * Determine the current tier key for a user based on lifetime earned points.
 *
 * @param {number} lifetimePoints - Total points ever earned (not balance)
 * @returns {'bronze'|'silver'|'gold'|'platinum'}
 */
export function getTierKey(lifetimePoints) {
  if (lifetimePoints >= TIERS.platinum.minLifetimePoints) return 'platinum';
  if (lifetimePoints >= TIERS.gold.minLifetimePoints)     return 'gold';
  if (lifetimePoints >= TIERS.silver.minLifetimePoints)   return 'silver';
  return 'bronze';
}

/**
 * Return the full tier object for a user.
 *
 * @param {number} lifetimePoints
 * @returns {object} Tier definition from TIERS
 */
export function getUserTier(lifetimePoints) {
  return TIERS[getTierKey(lifetimePoints)];
}

/**
 * Return points needed to reach the next tier, or null if already Platinum.
 *
 * @param {number} lifetimePoints
 * @returns {{ nextTier: string, pointsNeeded: number } | null}
 */
export function getNextTierInfo(lifetimePoints) {
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const currentKey = getTierKey(lifetimePoints);
  const currentIndex = tierOrder.indexOf(currentKey);
  if (currentIndex === tierOrder.length - 1) return null; // already Platinum

  const nextKey = tierOrder[currentIndex + 1];
  const nextTier = TIERS[nextKey];
  return {
    nextTier: nextTier.name,
    nextTierKey: nextKey,
    pointsNeeded: nextTier.minLifetimePoints - lifetimePoints,
    currentTier: currentKey,
  };
}

// ─── Point Earning ────────────────────────────────────────────────────────────

/**
 * Calculate points earned for a booking.
 *
 * @param {object} params
 * @param {number}   params.amountPaid       - Amount paid in platform currency
 * @param {string}   [params.bookingType]    - e.g. 'tournament', 'regular', 'casual'
 * @param {string}   [params.sport]          - e.g. 'cricket', 'football'
 * @param {Date|string} [params.startTime]   - Booking start (for off-peak/weekend bonus)
 * @param {number}   [params.lifetimePoints] - User's current lifetime total (for tier multiplier)
 * @param {boolean}  [params.isFirstBooking] - Whether this is the user's very first booking
 * @param {object}   [params.campaign]       - Active bonus campaign (see applyCampaign)
 * @returns {PointEarnResult}
 *
 * @typedef {object} PointEarnResult
 * @property {number} basePoints
 * @property {number} tierMultiplier
 * @property {number} bookingTypeMultiplier
 * @property {number} sportMultiplier
 * @property {number} offPeakBonus
 * @property {number} weekendBonus
 * @property {number} campaignBonus
 * @property {number} firstBookingBonus
 * @property {number} totalPoints         - Final integer point value to credit
 * @property {string} tierKey
 * @property {string[]} appliedBonuses    - Human-readable list of bonuses applied
 */
export function calculateEarnedPoints(params) {
  const {
    amountPaid       = 0,
    bookingType      = 'regular',
    sport            = 'football',
    startTime,
    lifetimePoints   = 0,
    isFirstBooking   = false,
    campaign         = null,
  } = params;

  if (amountPaid <= 0) {
    return {
      basePoints: 0, tierMultiplier: 1, bookingTypeMultiplier: 1,
      sportMultiplier: 1, offPeakBonus: 0, weekendBonus: 0,
      campaignBonus: 0, firstBookingBonus: 0, totalPoints: 0,
      tierKey: getTierKey(lifetimePoints), appliedBonuses: [],
    };
  }

  const appliedBonuses = [];

  // 1. Base points
  const basePoints = amountPaid * BASE_POINTS_PER_CURRENCY;

  // 2. Tier multiplier
  const tierKey = getTierKey(lifetimePoints);
  const tierMultiplier = TIERS[tierKey].multiplier;
  if (tierMultiplier > 1) appliedBonuses.push(`${TIERS[tierKey].name} tier ×${tierMultiplier}`);

  // 3. Booking type multiplier
  const bookingTypeMultiplier = BOOKING_TYPE_MULTIPLIERS[bookingType?.toLowerCase()] ?? 1;
  if (bookingTypeMultiplier !== 1) appliedBonuses.push(`${bookingType} booking ×${bookingTypeMultiplier}`);

  // 4. Sport multiplier
  const sportMultiplier = SPORT_BONUS_MULTIPLIERS[sport?.toLowerCase()] ?? 1;
  if (sportMultiplier > 1) appliedBonuses.push(`${sport} sport ×${sportMultiplier}`);

  // 5. Time-based bonuses (off-peak / weekend)
  let offPeakBonus = 0;
  let weekendBonus = 0;
  if (startTime) {
    const dt = new Date(startTime);
    if (!isNaN(dt.getTime())) {
      const hour    = dt.getHours();
      const dayOfWeek = dt.getDay(); // 0=Sun, 6=Sat

      if (OFF_PEAK_HOURS.includes(hour)) {
        offPeakBonus = basePoints * OFF_PEAK_BONUS;
        appliedBonuses.push(`Off-peak bonus +${Math.round(OFF_PEAK_BONUS * 100)}%`);
      }
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendBonus = basePoints * WEEKEND_BONUS;
        appliedBonuses.push(`Weekend bonus +${Math.round(WEEKEND_BONUS * 100)}%`);
      }
    }
  }

  // 6. Campaign bonus
  let campaignBonus = 0;
  if (campaign?.active && campaign?.multiplier > 0) {
    campaignBonus = basePoints * (campaign.multiplier - 1);
    appliedBonuses.push(`${campaign.name ?? 'Campaign'} ×${campaign.multiplier}`);
  }

  // 7. First booking flat bonus
  const firstBookingBonus = isFirstBooking ? FIRST_BOOKING_BONUS_POINTS : 0;
  if (isFirstBooking) appliedBonuses.push(`First booking bonus +${FIRST_BOOKING_BONUS_POINTS} pts`);

  // 8. Aggregate
  const rawTotal =
    basePoints * tierMultiplier * bookingTypeMultiplier * sportMultiplier
    + offPeakBonus
    + weekendBonus
    + campaignBonus
    + firstBookingBonus;

  const totalPoints = Math.round(rawTotal);

  return {
    basePoints:             Math.round(basePoints),
    tierMultiplier,
    bookingTypeMultiplier,
    sportMultiplier,
    offPeakBonus:           Math.round(offPeakBonus),
    weekendBonus:           Math.round(weekendBonus),
    campaignBonus:          Math.round(campaignBonus),
    firstBookingBonus,
    totalPoints,
    tierKey,
    appliedBonuses,
  };
}

// ─── Redemption ───────────────────────────────────────────────────────────────

/**
 * Calculate how many points can be redeemed against a booking and the resulting discount.
 *
 * @param {object} params
 * @param {number}   params.currentBalance   - User's current point balance
 * @param {number}   params.bookingAmount     - Total booking cost
 * @param {number}   [params.pointsToRedeem] - Points user wants to redeem (default: max possible)
 * @returns {RedemptionResult}
 *
 * @typedef {object} RedemptionResult
 * @property {boolean} eligible
 * @property {string}  [ineligibilityReason]
 * @property {number}  pointsRedeemed
 * @property {number}  discountAmount      - Currency value of discount
 * @property {number}  finalAmount         - Booking cost after discount
 * @property {number}  remainingBalance    - Points left after redemption
 */
export function calculateRedemption(params) {
  const {
    currentBalance = 0,
    bookingAmount  = 0,
    pointsToRedeem,
  } = params;

  if (currentBalance < MIN_REDEMPTION_POINTS) {
    return {
      eligible: false,
      ineligibilityReason: `Minimum ${MIN_REDEMPTION_POINTS} points required to redeem (you have ${currentBalance}).`,
      pointsRedeemed: 0,
      discountAmount: 0,
      finalAmount: bookingAmount,
      remainingBalance: currentBalance,
    };
  }

  // Maximum discount allowed by policy
  const maxDiscountByCap    = bookingAmount * MAX_REDEMPTION_FRACTION;
  const maxDiscountByPoints = currentBalance / POINTS_PER_CURRENCY_REDEMPTION;
  const maxDiscount         = Math.min(maxDiscountByCap, maxDiscountByPoints);
  const maxPoints           = Math.floor(maxDiscount * POINTS_PER_CURRENCY_REDEMPTION);

  // How many points will actually be redeemed
  const requested = pointsToRedeem != null
    ? Math.min(Math.max(0, Math.floor(pointsToRedeem)), maxPoints)
    : maxPoints;

  const discountAmount   = +(requested / POINTS_PER_CURRENCY_REDEMPTION).toFixed(2);
  const finalAmount      = Math.max(0, +(bookingAmount - discountAmount).toFixed(2));
  const remainingBalance = currentBalance - requested;

  return {
    eligible: true,
    pointsRedeemed:  requested,
    discountAmount,
    finalAmount,
    remainingBalance,
    maxRedeemablePoints: maxPoints,
    maxDiscount: +maxDiscount.toFixed(2),
  };
}

// ─── Expiry Calculation ───────────────────────────────────────────────────────

/**
 * Calculate how many of a user's points have expired.
 * Points expire if their `earnedAt` date is older than EXPIRY_MONTHS months
 * AND they have not had any activity (earn or redeem) since then.
 *
 * @param {Transaction[]} ledger            - User's full transaction history
 * @param {Date|string}   [asOf]            - Reference date (default: now)
 * @returns {ExpiryReport}
 *
 * @typedef {object} Transaction
 * @property {'earn'|'redeem'|'expire'|'adjustment'} type
 * @property {number} points
 * @property {Date|string} createdAt
 *
 * @typedef {object} ExpiryReport
 * @property {number}        expiredPoints
 * @property {Transaction[]} expiryTransactions   - Transactions to write if committing expiry
 * @property {Date}          expiryThreshold
 */
export function calculateExpiredPoints(ledger = [], asOf) {
  const referenceDate = asOf ? new Date(asOf) : new Date();
  const threshold     = new Date(referenceDate);
  threshold.setMonth(threshold.getMonth() - EXPIRY_MONTHS);

  // Find earn transactions older than the threshold that haven't been "refreshed"
  // by any activity within the expiry window
  const lastActivityDate = ledger.reduce((latest, tx) => {
    const d = new Date(tx.createdAt);
    return d > latest ? d : latest;
  }, new Date(0));

  // If the user had any activity within the expiry window, no points expire
  if (lastActivityDate >= threshold) {
    return { expiredPoints: 0, expiryTransactions: [], expiryThreshold: threshold };
  }

  // Sum all earn transactions before the threshold
  const expiredPoints = ledger
    .filter((tx) => tx.type === 'earn' && new Date(tx.createdAt) < threshold)
    .reduce((sum, tx) => sum + (tx.points ?? 0), 0);

  const expiryTransactions = expiredPoints > 0
    ? [{
        type:      'expire',
        points:    -expiredPoints,
        reason:    `Points expired after ${EXPIRY_MONTHS} months of inactivity`,
        createdAt: referenceDate.toISOString(),
      }]
    : [];

  return { expiredPoints, expiryTransactions, expiryThreshold: threshold };
}

// ─── Ledger Helpers ───────────────────────────────────────────────────────────

/**
 * Build a new earn transaction record.
 *
 * @param {object} params
 * @param {string}   params.userId
 * @param {string}   params.bookingId
 * @param {number}   params.points
 * @param {object}   [params.meta]      - Additional context (sport, tier, etc.)
 * @returns {Transaction}
 */
export function buildEarnTransaction(params) {
  const { userId, bookingId, points, meta = {} } = params;
  return {
    type:      'earn',
    userId,
    bookingId,
    points:    Math.round(points),
    meta,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Build a redemption transaction record.
 *
 * @param {object} params
 * @param {string}   params.userId
 * @param {string}   params.bookingId
 * @param {number}   params.points      - Positive number of points redeemed
 * @param {number}   params.discountAmount
 * @returns {Transaction}
 */
export function buildRedeemTransaction(params) {
  const { userId, bookingId, points, discountAmount } = params;
  return {
    type:           'redeem',
    userId,
    bookingId,
    points:         -Math.abs(Math.round(points)),
    discountAmount: +discountAmount.toFixed(2),
    createdAt:      new Date().toISOString(),
  };
}

/**
 * Compute current point balance from a transaction ledger.
 * (sum of all point values — earns are positive, redeems/expires are negative)
 *
 * @param {Transaction[]} ledger
 * @returns {number}
 */
export function computeBalance(ledger = []) {
  return ledger.reduce((sum, tx) => sum + (tx.points ?? 0), 0);
}

/**
 * Compute total lifetime earned points (only 'earn' type transactions).
 *
 * @param {Transaction[]} ledger
 * @returns {number}
 */
export function computeLifetimePoints(ledger = []) {
  return ledger
    .filter((tx) => tx.type === 'earn')
    .reduce((sum, tx) => sum + (tx.points ?? 0), 0);
}

// ─── Campaign Builder ─────────────────────────────────────────────────────────

/**
 * Create a bonus campaign object for use in calculateEarnedPoints.
 *
 * @param {string}         name
 * @param {number}         multiplier   - e.g. 2.0 for double points
 * @param {Date|string}    startDate
 * @param {Date|string}    endDate
 * @param {string[]}       [sports]     - Restrict to specific sports (null = all)
 * @param {string[]}       [bookingTypes] - Restrict to booking types (null = all)
 * @returns {Campaign}
 */
export function createCampaign(name, multiplier, startDate, endDate, sports = null, bookingTypes = null) {
  return {
    name,
    multiplier: Math.max(1, multiplier),
    startDate:  new Date(startDate).toISOString(),
    endDate:    new Date(endDate).toISOString(),
    sports,
    bookingTypes,
    get active() {
      const now = Date.now();
      return now >= new Date(this.startDate).getTime() && now <= new Date(this.endDate).getTime();
    },
  };
}

/**
 * Check if a campaign applies to a given booking.
 *
 * @param {Campaign} campaign
 * @param {{ sport: string, bookingType: string }} booking
 * @returns {boolean}
 */
export function isCampaignApplicable(campaign, booking) {
  if (!campaign?.active) return false;
  if (campaign.sports && !campaign.sports.includes(booking.sport?.toLowerCase())) return false;
  if (campaign.bookingTypes && !campaign.bookingTypes.includes(booking.bookingType?.toLowerCase())) return false;
  return true;
}

// ─── Full Summary ─────────────────────────────────────────────────────────────

/**
 * Generate a complete loyalty summary for a user profile page.
 *
 * @param {object} user
 * @param {Transaction[]} ledger
 * @returns {LoyaltySummary}
 */
export function getUserLoyaltySummary(user, ledger = []) {
  const balance        = computeBalance(ledger);
  const lifetimePoints = computeLifetimePoints(ledger);
  const tierKey        = getTierKey(lifetimePoints);
  const tier           = TIERS[tierKey];
  const nextTierInfo   = getNextTierInfo(lifetimePoints);
  const redemptionInfo = calculateRedemption({ currentBalance: balance, bookingAmount: 1000 });

  // Progress to next tier (0–100%)
  let tierProgressPct = 100;
  if (nextTierInfo) {
    const currentMin = tier.minLifetimePoints;
    const nextMin    = TIERS[nextTierInfo.nextTierKey].minLifetimePoints;
    tierProgressPct  = Math.round(((lifetimePoints - currentMin) / (nextMin - currentMin)) * 100);
  }

  return {
    userId:            user._id ?? user.id,
    currentBalance:    balance,
    lifetimePoints,
    tier: {
      key:        tierKey,
      name:       tier.name,
      multiplier: tier.multiplier,
      perks:      tier.perks,
      icon:       tier.icon,
      color:      tier.color,
    },
    nextTier:           nextTierInfo,
    tierProgressPct,
    isEligibleToRedeem: balance >= MIN_REDEMPTION_POINTS,
    maxRedeemablePoints: redemptionInfo.eligible ? redemptionInfo.maxRedeemablePoints : 0,
    recentTransactions: ledger.slice(-10).reverse(),
    generatedAt:        new Date().toISOString(),
  };
}

export default {
  TIERS,
  BASE_POINTS_PER_CURRENCY,
  BOOKING_TYPE_MULTIPLIERS,
  SPORT_BONUS_MULTIPLIERS,
  POINTS_PER_CURRENCY_REDEMPTION,
  MIN_REDEMPTION_POINTS,
  MAX_REDEMPTION_FRACTION,
  EXPIRY_MONTHS,
  getTierKey,
  getUserTier,
  getNextTierInfo,
  calculateEarnedPoints,
  calculateRedemption,
  calculateExpiredPoints,
  buildEarnTransaction,
  buildRedeemTransaction,
  computeBalance,
  computeLifetimePoints,
  createCampaign,
  isCampaignApplicable,
  getUserLoyaltySummary,
};
