/**
 * dynamicPricingEngine.js — Algorithmic Dynamic Pricing & Yield Management Engine
 * Premium Sports Field Booking Platform
 *
 * Implements real-time demand-driven yield management for sports fields, factoring:
 *  - Real-time venue / slot occupancy rate (surge vs. off-peak discount)
 *  - Time-of-day & day-of-week multipliers (weekday evening, weekend prime)
 *  - Lead-time elasticity (last-minute flash sale vs. early-bird booking bonus)
 *  - Duration volume discounts (longer sessions enjoy percentage savings)
 *  - VIP / Membership tier discounts (Bronze, Silver, Gold, Platinum)
 *  - Weather-aware adjustments (outdoor turf discounts during rain, indoor premiums)
 *  - Safety bounds (configurable min floor price & max ceiling cap)
 *  - Transparent itemized invoice breakdown & 24-hour rate schedule simulation
 *
 * All functions are pure and testable — zero database or network dependencies.
 *
 * Usage:
 *   import {
 *     calculateDynamicPrice,
 *     simulateDailyRateSchedule,
 *     calculateSurgeLevel,
 *     estimateGroupSplit,
 *   } from './dynamicPricingEngine.js';
 *
 *   const breakdown = calculateDynamicPrice({
 *     baseHourlyRate: 50,
 *     durationHours: 2,
 *     startTime: new Date('2026-10-17T18:00:00Z'),
 *     occupancyRate: 0.85,
 *     weather: { condition: 'CLEAR', isOutdoor: true },
 *     membershipTier: 'GOLD',
 *     taxRate: 0.15,
 *   });
 */

// ─── Default Configuration Constants ─────────────────────────────────────────

export const DYNAMIC_PRICING_DEFAULTS = {
  // Occupancy thresholds & surge multipliers
  OCCUPANCY_TIERS: [
    { maxOccupancy: 0.25, multiplier: 0.85, label: 'OFF_PEAK_DISCOUNT' },
    { maxOccupancy: 0.50, multiplier: 1.00, label: 'STANDARD' },
    { maxOccupancy: 0.75, multiplier: 1.15, label: 'ELEVATED_DEMAND' },
    { maxOccupancy: 0.90, multiplier: 1.30, label: 'HIGH_DEMAND' },
    { maxOccupancy: 1.00, multiplier: 1.50, label: 'CRITICAL_SURGE' },
  ],

  // Lead-time elasticity (hours ahead of game start)
  LEAD_TIME_RULES: {
    FLASH_SALE_HOURS: 3,         // Within 3h of slot start
    FLASH_SALE_DISCOUNT: 0.15,    // 15% off to fill idle capacity (if occupancy < 60%)
    EARLY_BIRD_DAYS: 14,         // Booked 14+ days in advance
    EARLY_BIRD_DISCOUNT: 0.10,   // 10% early bird reward
  },

  // Peak time slots (local 24h format)
  TIME_MULTIPLIERS: {
    WEEKDAY_EVENING_START: 17,    // 5:00 PM
    WEEKDAY_EVENING_END: 22,      // 10:00 PM
    WEEKDAY_EVENING_MULT: 1.25,
    WEEKEND_DAY_MULT: 1.20,       // Saturday & Sunday daytime
    WEEKEND_PRIME_MULT: 1.35,     // Saturday & Sunday evening (17:00-22:00)
    LATE_NIGHT_MULT: 0.90,        // After 22:00
    EARLY_MORNING_MULT: 0.85,     // Before 08:00
  },

  // Duration volume discounts (hours booked)
  DURATION_DISCOUNTS: [
    { minHours: 4, discountPercent: 15 },
    { minHours: 3, discountPercent: 10 },
    { minHours: 2, discountPercent: 5 },
  ],

  // Membership tier discounts
  MEMBERSHIP_DISCOUNTS: {
    NONE: 0,
    BRONZE: 0.05,
    SILVER: 0.10,
    GOLD: 0.15,
    PLATINUM: 0.20,
  },

  // Weather modifiers
  WEATHER_MODIFIERS: {
    RAIN_OUTDOOR_DISCOUNT: 0.20,   // 20% discount during rain on outdoor unroofed fields
    RAIN_INDOOR_SURGE: 0.08,       // 8% surge for covered/indoor venues during bad weather
  },

  // Safety boundaries (prevents runaway pricing)
  SAFETY_LIMITS: {
    MIN_PRICE_FLOOR_RATIO: 0.60,   // Rate cannot drop below 60% of base rate
    MAX_PRICE_CEILING_RATIO: 2.20, // Rate cannot exceed 220% of base rate
  },

  DEFAULT_TAX_RATE: 0.15,          // 15% standard VAT / sales tax
  DEFAULT_SERVICE_FEE_PERCENT: 0.03, // 3% platform technology fee
  DEFAULT_CURRENCY: 'BDT',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Clamp a number between min and max bounds.
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Round to 2 decimal places.
 */
export function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate the occupancy surge multiplier based on field fill rate.
 *
 * @param {number} occupancyRate - Float between 0.0 and 1.0
 * @param {Array}  [tiers]       - Custom occupancy tier table
 * @returns {{ multiplier: number, label: string }}
 */
export function getOccupancyMultiplier(
  occupancyRate = 0,
  tiers = DYNAMIC_PRICING_DEFAULTS.OCCUPANCY_TIERS
) {
  const rate = clamp(occupancyRate, 0, 1);
  for (const tier of tiers) {
    if (rate <= tier.maxOccupancy) {
      return { multiplier: tier.multiplier, label: tier.label };
    }
  }
  return { multiplier: 1.0, label: 'STANDARD' };
}

/**
 * Calculate time-of-day and day-of-week multiplier.
 *
 * @param {Date|string|number} datetime
 * @param {object} [config]
 * @returns {{ multiplier: number, reason: string }}
 */
export function getTimeMultiplier(
  datetime,
  config = DYNAMIC_PRICING_DEFAULTS.TIME_MULTIPLIERS
) {
  const d = new Date(datetime);
  if (Number.isNaN(d.getTime())) {
    return { multiplier: 1.0, reason: 'STANDARD_SLOT' };
  }

  const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = d.getHours();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    if (hour >= config.WEEKDAY_EVENING_START && hour < config.WEEKDAY_EVENING_END) {
      return { multiplier: config.WEEKEND_PRIME_MULT, reason: 'WEEKEND_PRIME_EVENING' };
    }
    return { multiplier: config.WEEKEND_DAY_MULT, reason: 'WEEKEND_DAYTIME' };
  }

  // Weekdays (Mon-Fri)
  if (hour >= config.WEEKDAY_EVENING_START && hour < config.WEEKDAY_EVENING_END) {
    return { multiplier: config.WEEKDAY_EVENING_MULT, reason: 'WEEKDAY_PEAK_EVENING' };
  }
  if (hour < 8) {
    return { multiplier: config.EARLY_MORNING_MULT, reason: 'EARLY_BIRD_MORNING' };
  }
  if (hour >= 22) {
    return { multiplier: config.LATE_NIGHT_MULT, reason: 'LATE_NIGHT_SAVINGS' };
  }

  return { multiplier: 1.0, reason: 'STANDARD_WEEKDAY' };
}

/**
 * Calculate lead-time adjustment (flash sale vs early bird).
 *
 * @param {Date|string|number} slotStartTime
 * @param {Date|string|number} [bookingCreatedAt=Date.now()]
 * @param {number}             [occupancyRate=0]
 * @param {object}             [rules]
 * @returns {{ multiplier: number, discountAmountPercent: number, label: string }}
 */
export function getLeadTimeAdjustment(
  slotStartTime,
  bookingCreatedAt = Date.now(),
  occupancyRate = 0,
  rules = DYNAMIC_PRICING_DEFAULTS.LEAD_TIME_RULES
) {
  const startMs = new Date(slotStartTime).getTime();
  const nowMs = new Date(bookingCreatedAt).getTime();
  const diffHours = (startMs - nowMs) / (1000 * 60 * 60);

  // Last-minute flash sale: Slot is soon and capacity remains high
  if (diffHours >= 0 && diffHours <= rules.FLASH_SALE_HOURS && occupancyRate < 0.60) {
    return {
      multiplier: 1 - rules.FLASH_SALE_DISCOUNT,
      discountAmountPercent: rules.FLASH_SALE_DISCOUNT * 100,
      label: 'FLASH_LAST_MINUTE_SAVINGS',
    };
  }

  // Early-bird bonus: Booked weeks ahead
  const diffDays = diffHours / 24;
  if (diffDays >= rules.EARLY_BIRD_DAYS) {
    return {
      multiplier: 1 - rules.EARLY_BIRD_DISCOUNT,
      discountAmountPercent: rules.EARLY_BIRD_DISCOUNT * 100,
      label: 'EARLY_BIRD_REWARD',
    };
  }

  return { multiplier: 1.0, discountAmountPercent: 0, label: 'STANDARD_LEAD_TIME' };
}

/**
 * Get volume discount percentage for extended duration bookings.
 *
 * @param {number} durationHours
 * @param {Array}  [tiers]
 * @returns {number} discountPercent (0 to 100)
 */
export function getDurationDiscountPercent(
  durationHours = 1,
  tiers = DYNAMIC_PRICING_DEFAULTS.DURATION_DISCOUNTS
) {
  for (const tier of tiers) {
    if (durationHours >= tier.minHours) {
      return tier.discountPercent;
    }
  }
  return 0;
}

/**
 * Human-readable surge level tag.
 *
 * @param {number} occupancyRate
 * @returns {'LOW'|'NORMAL'|'HIGH'|'CRITICAL_SURGE'}
 */
export function calculateSurgeLevel(occupancyRate = 0) {
  if (occupancyRate >= 0.90) return 'CRITICAL_SURGE';
  if (occupancyRate >= 0.70) return 'HIGH';
  if (occupancyRate <= 0.25) return 'LOW';
  return 'NORMAL';
}

// ─── Core Dynamic Pricing Calculation ────────────────────────────────────────

/**
 * @typedef {object} DynamicPricingParams
 * @property {number}             baseHourlyRate       - Standard base rate per hour
 * @property {number}             durationHours        - Duration of slot in hours (e.g., 1, 1.5, 2)
 * @property {Date|string|number} startTime            - Slot start date/time
 * @property {number}             [occupancyRate=0]    - Venue occupancy for target slot (0.0 to 1.0)
 * @property {string}             [membershipTier]     - 'NONE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
 * @property {object}             [weather]            - { condition: 'CLEAR'|'RAIN'|'THUNDER', isOutdoor: boolean }
 * @property {number}             [promoDiscountAmount=0] - Flat coupon deduction
 * @property {number}             [taxRate]            - Sales/VAT tax rate (defaults to 15%)
 * @property {number}             [serviceFeeRate]     - Tech fee rate (defaults to 3%)
 * @property {string}             [currency='BDT']     - ISO currency
 * @property {Date|string|number} [bookedAt=Date.now()] - Timestamp when booking was drafted
 */

/**
 * Calculate dynamic price breakdown with all yield modifiers, bounds, and fees.
 *
 * @param {DynamicPricingParams} params
 * @returns {object} Itemized price breakdown and transparency receipt
 */
export function calculateDynamicPrice(params) {
  const {
    baseHourlyRate,
    durationHours = 1,
    startTime,
    occupancyRate = 0,
    membershipTier = 'NONE',
    weather = null,
    promoDiscountAmount = 0,
    taxRate = DYNAMIC_PRICING_DEFAULTS.DEFAULT_TAX_RATE,
    serviceFeeRate = DYNAMIC_PRICING_DEFAULTS.DEFAULT_SERVICE_FEE_PERCENT,
    currency = DYNAMIC_PRICING_DEFAULTS.DEFAULT_CURRENCY,
    bookedAt = Date.now(),
  } = params;

  if (typeof baseHourlyRate !== 'number' || baseHourlyRate <= 0) {
    throw new Error('baseHourlyRate must be a positive number.');
  }
  if (typeof durationHours !== 'number' || durationHours <= 0) {
    throw new Error('durationHours must be greater than 0.');
  }

  // 1. Raw Base Total
  const rawBaseTotal = baseHourlyRate * durationHours;

  // 2. Modifiers
  const { multiplier: occMult, label: occLabel } = getOccupancyMultiplier(occupancyRate);
  const { multiplier: timeMult, reason: timeReason } = getTimeMultiplier(startTime);
  const { multiplier: leadMult, label: leadLabel } = getLeadTimeAdjustment(
    startTime,
    bookedAt,
    occupancyRate
  );

  // Weather modifier
  let weatherMult = 1.0;
  let weatherLabel = 'NORMAL_WEATHER';
  if (weather && weather.condition) {
    const isBadWeather = ['RAIN', 'HEAVY_RAIN', 'THUNDER', 'STORM'].includes(
      weather.condition.toUpperCase()
    );
    if (isBadWeather) {
      if (weather.isOutdoor) {
        weatherMult = 1 - DYNAMIC_PRICING_DEFAULTS.WEATHER_MODIFIERS.RAIN_OUTDOOR_DISCOUNT;
        weatherLabel = 'OUTDOOR_RAIN_DISCOUNT';
      } else {
        weatherMult = 1 + DYNAMIC_PRICING_DEFAULTS.WEATHER_MODIFIERS.RAIN_INDOOR_SURGE;
        weatherLabel = 'INDOOR_RAIN_PREMIUM';
      }
    }
  }

  // Combined demand multiplier
  const combinedMultiplier = occMult * timeMult * leadMult * weatherMult;

  // Apply Safety Floor & Ceiling caps on the multiplier
  const minFloor = DYNAMIC_PRICING_DEFAULTS.SAFETY_LIMITS.MIN_PRICE_FLOOR_RATIO;
  const maxCeiling = DYNAMIC_PRICING_DEFAULTS.SAFETY_LIMITS.MAX_PRICE_CEILING_RATIO;
  const clampedMultiplier = clamp(combinedMultiplier, minFloor, maxCeiling);

  // Price after demand adjustments
  const demandAdjustedHourlyRate = round2(baseHourlyRate * clampedMultiplier);
  const adjustedSubtotal = round2(demandAdjustedHourlyRate * durationHours);

  // 3. Discounts: Duration volume + Membership tier
  const durationDiscountPct = getDurationDiscountPercent(durationHours);
  const durationDiscountAmount = round2(adjustedSubtotal * (durationDiscountPct / 100));

  const tierRate =
    DYNAMIC_PRICING_DEFAULTS.MEMBERSHIP_DISCOUNTS[membershipTier.toUpperCase()] || 0;
  const membershipDiscountAmount = round2(
    (adjustedSubtotal - durationDiscountAmount) * tierRate
  );

  const flatPromo = clamp(Number(promoDiscountAmount) || 0, 0, adjustedSubtotal);

  const totalDiscount = round2(
    durationDiscountAmount + membershipDiscountAmount + flatPromo
  );

  // Net subtotal before taxes and fees
  const netSubtotal = Math.max(0, round2(adjustedSubtotal - totalDiscount));

  // 4. Taxes & Service Fee
  const taxAmount = round2(netSubtotal * taxRate);
  const serviceFeeAmount = round2(netSubtotal * serviceFeeRate);
  const finalTotal = round2(netSubtotal + taxAmount + serviceFeeAmount);

  // Effective hourly rate for consumer reference
  const effectiveHourlyRate = round2(finalTotal / durationHours);

  return {
    currency,
    durationHours,
    baseHourlyRate: round2(baseHourlyRate),
    rawBaseTotal: round2(rawBaseTotal),

    // Multipliers applied
    multipliers: {
      occupancy: { rate: occupancyRate, multiplier: occMult, label: occLabel },
      time: { multiplier: timeMult, reason: timeReason },
      leadTime: { multiplier: leadMult, label: leadLabel },
      weather: { multiplier: weatherMult, label: weatherLabel },
      combined: round2(combinedMultiplier),
      clamped: round2(clampedMultiplier),
      isCapped: combinedMultiplier > maxCeiling || combinedMultiplier < minFloor,
    },

    // Adjusted rates
    dynamicHourlyRate: demandAdjustedHourlyRate,
    adjustedSubtotal,

    // Itemized deductions
    discounts: {
      durationVolume: { percent: durationDiscountPct, amount: durationDiscountAmount },
      membershipTier: { tier: membershipTier.toUpperCase(), percent: tierRate * 100, amount: membershipDiscountAmount },
      promoCode: { amount: flatPromo },
      totalSavings: totalDiscount,
    },

    // Final ledger breakdown
    netSubtotal,
    taxAmount,
    taxRatePercent: round2(taxRate * 100),
    serviceFeeAmount,
    serviceFeePercent: round2(serviceFeeRate * 100),
    finalTotal,
    effectiveHourlyRate,

    // Surge indicator tag
    surgeLevel: calculateSurgeLevel(occupancyRate),
  };
}

// ─── 24-Hour Schedule Simulator ──────────────────────────────────────────────

/**
 * Simulate hourly rates across a field's full operating day (06:00 - 23:00).
 * Useful for rendering heatmaps and dynamic price charts in the frontend.
 *
 * @param {object} params
 * @param {number} params.baseHourlyRate
 * @param {Date|string} params.date
 * @param {Record<number, number>} [params.hourlyOccupancy] - Map of hour (6..23) to occupancy (0..1)
 * @param {object} [params.weather]
 * @param {string} [params.membershipTier]
 * @returns {Array<{ hour: number, timeString: string, price: number, surgeLevel: string, isPeak: boolean }>}
 */
export function simulateDailyRateSchedule({
  baseHourlyRate,
  date = new Date(),
  hourlyOccupancy = {},
  weather = null,
  membershipTier = 'NONE',
}) {
  const baseDate = new Date(date);
  const schedule = [];

  for (let hour = 6; hour <= 23; hour++) {
    const slotDate = new Date(baseDate);
    slotDate.setHours(hour, 0, 0, 0);

    const occ = hourlyOccupancy[hour] ?? 0.35; // Default 35% typical baseline
    const priceResult = calculateDynamicPrice({
      baseHourlyRate,
      durationHours: 1,
      startTime: slotDate,
      occupancyRate: occ,
      weather,
      membershipTier,
    });

    const isPeak =
      priceResult.multipliers.clamped > 1.15 ||
      priceResult.surgeLevel === 'HIGH' ||
      priceResult.surgeLevel === 'CRITICAL_SURGE';

    const timeString = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;

    schedule.push({
      hour,
      timeString,
      occupancyRate: occ,
      dynamicHourlyRate: priceResult.dynamicHourlyRate,
      finalTotal: priceResult.finalTotal,
      surgeLevel: priceResult.surgeLevel,
      label: priceResult.multipliers.occupancy.label,
      isPeak,
    });
  }

  return schedule;
}

// ─── Group Split Calculator ──────────────────────────────────────────────────

/**
 * Split a dynamic booking bill among multiple teammates.
 *
 * @param {object} params
 * @param {number} params.totalAmount - Total booking cost
 * @param {number} params.playerCount - Total players sharing the cost
 * @param {number} [params.tipPercent=0] - Optional team locker/refreshment tip
 * @returns {{ perPlayerAmount: number, totalWithTip: number, remainder: number }}
 */
export function estimateGroupSplit({
  totalAmount,
  playerCount = 1,
  tipPercent = 0,
}) {
  if (playerCount < 1) throw new Error('playerCount must be at least 1.');
  const tipAmount = round2(totalAmount * (tipPercent / 100));
  const grandTotal = round2(totalAmount + tipAmount);

  const exactSplit = grandTotal / playerCount;
  const perPlayerAmount = round2(exactSplit);
  const remainder = round2(grandTotal - perPlayerAmount * playerCount);

  return {
    baseAmount: totalAmount,
    tipAmount,
    totalWithTip: grandTotal,
    playerCount,
    perPlayerAmount,
    remainder,
  };
}

export default {
  DYNAMIC_PRICING_DEFAULTS,
  calculateDynamicPrice,
  simulateDailyRateSchedule,
  getOccupancyMultiplier,
  getTimeMultiplier,
  getLeadTimeAdjustment,
  getDurationDiscountPercent,
  calculateSurgeLevel,
  estimateGroupSplit,
  clamp,
  round2,
};
