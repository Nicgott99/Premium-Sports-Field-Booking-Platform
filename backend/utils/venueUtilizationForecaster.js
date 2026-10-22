/**
 * venueUtilizationForecaster.js — Venue Capacity Utilization & Yield Forecasting Engine
 * Premium Sports Field Booking Platform
 *
 * Analyzes field booking density, detects off-peak dead zones, and forecasts revenue yield:
 *  - Computes 7-day × 18-hour venue occupancy matrix (126 operating slots/week per field)
 *  - Categorizes slot density into status tiers (EMPTY, LOW, MODERATE, PEAK, SURGE)
 *  - Automated dead-zone detection with targeted discount yield recommendations
 *  - Calculates revenue efficiency score, idle capacity loss, and target shortfall
 *  - Identifies high-demand bottleneck windows to guide dynamic pricing strategy
 *
 * Pure, deterministic, and dependency-free.
 *
 * Usage:
 *   import {
 *     calculateWeeklyUtilizationGrid,
 *     detectDeadZones,
 *     forecastWeeklyRevenueYield,
 *     identifyPeakCongestionWindows,
 *   } from './venueUtilizationForecaster.js';
 */

// ─── Enums & Constants ───────────────────────────────────────────────────────

export const DENSITY_TIERS = {
  EMPTY: 'EMPTY',           // 0% occupancy
  LOW: 'LOW',               // 1% – 30%
  MODERATE: 'MODERATE',     // 31% – 65%
  PEAK: 'PEAK',             // 66% – 85%
  SURGE: 'SURGE',           // 86% – 100%
};

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const FORECAST_DEFAULTS = {
  OPENING_HOUR: 6,   // 06:00 AM
  CLOSING_HOUR: 23,  // 11:00 PM (18 hours/day)
  DEFAULT_BASE_RATE: 1000,
  PEAK_RATE_MULTIPLIER: 1.35,
  DEAD_ZONE_THRESHOLD: 0.25,
  PEAK_CONGESTION_THRESHOLD: 0.80,
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Categorize occupancy rate into a density status tier.
 */
export function getDensityTier(rate) {
  if (rate <= 0) return DENSITY_TIERS.EMPTY;
  if (rate <= 0.30) return DENSITY_TIERS.LOW;
  if (rate <= 0.65) return DENSITY_TIERS.MODERATE;
  if (rate <= 0.85) return DENSITY_TIERS.PEAK;
  return DENSITY_TIERS.SURGE;
}

// ─── Weekly Utilization Matrix Generator ─────────────────────────────────────

/**
 * @typedef {object} BookingSlotInput
 * @property {string|Date} startTime
 * @property {string|Date} endTime
 * @property {string} [fieldId]
 * @property {number} [price]
 */

/**
 * Builds a 7-day x 18-hour utilization matrix across all fields in a venue.
 *
 * @param {object} params
 * @param {BookingSlotInput[]} [params.bookings=[]] - Confirmed bookings within the week
 * @param {number} [params.fieldCount=1] - Number of playable pitches/courts at venue
 * @param {number} [params.openingHour=6] - Opening hour (0-23)
 * @param {number} [params.closingHour=23] - Closing hour (0-23)
 * @returns {object} Weekly utilization matrix and summary metrics
 */
export function calculateWeeklyUtilizationGrid({
  bookings = [],
  fieldCount = 1,
  openingHour = FORECAST_DEFAULTS.OPENING_HOUR,
  closingHour = FORECAST_DEFAULTS.CLOSING_HOUR,
}) {
  const fields = Math.max(1, fieldCount);
  const totalHoursPerDay = closingHour - openingHour;
  const grid = [];

  // Tally bookings into dayOfWeek (0=Mon..6=Sun) and hour buckets
  // Note: Standard Date.getDay(): 0=Sun, 1=Mon... We normalize to 0=Mon, 6=Sun
  const tally = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );

  for (const b of bookings) {
    const start = new Date(b.startTime);
    const end = new Date(b.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

    const rawDay = start.getDay();
    const dayIdx = rawDay === 0 ? 6 : rawDay - 1; // 0=Mon, 6=Sun

    const startH = start.getHours();
    const endH = end.getHours() || 24;

    for (let h = startH; h < endH; h++) {
      if (h >= openingHour && h < closingHour) {
        tally[dayIdx][h] = Math.min(fields, tally[dayIdx][h] + 1);
      }
    }
  }

  let totalAvailableSlots = 0;
  let totalBookedSlots = 0;

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayName = DAYS_OF_WEEK[dayIdx];
    const hourlyData = [];

    for (let h = openingHour; h < closingHour; h++) {
      const bookedCount = tally[dayIdx][h];
      const occupancyRate = clamp(round2(bookedCount / fields), 0, 1);
      const densityTier = getDensityTier(occupancyRate);

      totalAvailableSlots += fields;
      totalBookedSlots += bookedCount;

      hourlyData.push({
        hour: h,
        timeLabel: `${String(h).padStart(2, '0')}:00`,
        timeRange: `${String(h).padStart(2, '0')}:00 – ${String(h + 1).padStart(2, '0')}:00`,
        availableSlots: fields,
        bookedSlots: bookedCount,
        occupancyRate,
        occupancyPercent: Math.round(occupancyRate * 100),
        densityTier,
        isPeakHour: h >= 17 && h < 22,
      });
    }

    grid.push({
      dayIndex: dayIdx,
      dayName,
      hours: hourlyData,
    });
  }

  const overallOccupancyRate = totalAvailableSlots > 0
    ? round2(totalBookedSlots / totalAvailableSlots)
    : 0;

  return {
    fieldCount: fields,
    openingHour,
    closingHour,
    totalHoursPerDay,
    totalAvailableSlots,
    totalBookedSlots,
    overallOccupancyRate,
    overallOccupancyPercent: Math.round(overallOccupancyRate * 100),
    grid,
  };
}

// ─── Dead-Zone Identifier & Deal Suggester ───────────────────────────────────

/**
 * Identifies contiguous idle hours ("Dead Zones") and recommends promotional discounts.
 *
 * @param {object} params
 * @param {Array} params.grid - Weekly utilization grid from calculateWeeklyUtilizationGrid
 * @param {number} [params.deadZoneThreshold=0.25] - Occupancy ceiling for dead zone
 * @param {number} [params.minContiguousHours=2] - Minimum duration to qualify as dead zone
 * @returns {Array<object>} Identified dead zones with actionable discount suggestions
 */
export function detectDeadZones({
  grid = [],
  deadZoneThreshold = FORECAST_DEFAULTS.DEAD_ZONE_THRESHOLD,
  minContiguousHours = 2,
}) {
  const deadZones = [];

  for (const day of grid) {
    let currentBlock = [];

    for (const slot of day.hours) {
      if (slot.occupancyRate <= deadZoneThreshold && !slot.isPeakHour) {
        currentBlock.push(slot);
      } else {
        if (currentBlock.length >= minContiguousHours) {
          const startSlot = currentBlock[0];
          const endSlot = currentBlock.at(-1);
          const avgOccupancy = round2(
            currentBlock.reduce((s, x) => s + x.occupancyRate, 0) / currentBlock.length
          );

          deadZones.push({
            dayName: day.dayName,
            dayIndex: day.dayIndex,
            startHour: startSlot.hour,
            endHour: endSlot.hour + 1,
            timeRange: `${startSlot.timeLabel} – ${String(endSlot.hour + 1).padStart(2, '0')}:00`,
            durationHours: currentBlock.length,
            averageOccupancyPercent: Math.round(avgOccupancy * 100),
            recommendedDiscountPercent: avgOccupancy <= 0.1 ? 25 : 15,
            promotionTitle: `${day.dayName} Off-Peak Matinee Special`,
            actionableDeal: `Apply a ${avgOccupancy <= 0.1 ? 25 : 15}% off promotion for ${day.dayName} ${startSlot.timeLabel}–${String(endSlot.hour + 1).padStart(2, '0')}:00 to stimulate idle booking demand.`,
          });
        }
        currentBlock = [];
      }
    }

    if (currentBlock.length >= minContiguousHours) {
      const startSlot = currentBlock[0];
      const endSlot = currentBlock.at(-1);
      const avgOccupancy = round2(
        currentBlock.reduce((s, x) => s + x.occupancyRate, 0) / currentBlock.length
      );

      deadZones.push({
        dayName: day.dayName,
        dayIndex: day.dayIndex,
        startHour: startSlot.hour,
        endHour: endSlot.hour + 1,
        timeRange: `${startSlot.timeLabel} – ${String(endSlot.hour + 1).padStart(2, '0')}:00`,
        durationHours: currentBlock.length,
        averageOccupancyPercent: Math.round(avgOccupancy * 100),
        recommendedDiscountPercent: avgOccupancy <= 0.1 ? 25 : 15,
        promotionTitle: `${day.dayName} Late-Night Deal`,
        actionableDeal: `Apply a ${avgOccupancy <= 0.1 ? 25 : 15}% discount for ${day.dayName} ${startSlot.timeLabel}–${String(endSlot.hour + 1).padStart(2, '0')}:00.`,
      });
    }
  }

  return deadZones;
}

// ─── Revenue Yield Forecaster ────────────────────────────────────────────────

/**
 * Projects weekly revenue, quantifies unbooked capacity losses, and evaluates target gap.
 *
 * @param {object} params
 * @param {object} params.utilizationResult - Result from calculateWeeklyUtilizationGrid
 * @param {number} [params.baseHourlyRate=1000]
 * @param {number} [params.peakMultiplier=1.35]
 * @param {number} [params.targetOccupancyPercent=70]
 * @param {string} [params.currency='BDT']
 * @returns {object} Comprehensive revenue yield forecast
 */
export function forecastWeeklyRevenueYield({
  utilizationResult,
  baseHourlyRate = FORECAST_DEFAULTS.DEFAULT_BASE_RATE,
  peakMultiplier = FORECAST_DEFAULTS.PEAK_RATE_MULTIPLIER,
  targetOccupancyPercent = 70,
  currency = 'BDT',
}) {
  if (!utilizationResult || !Array.isArray(utilizationResult.grid)) {
    throw new Error('Valid utilizationResult is required.');
  }

  let realizedRevenue = 0;
  let maxPotentialRevenue = 0;

  for (const day of utilizationResult.grid) {
    const isWeekend = day.dayIndex >= 4; // Friday, Saturday, Sunday

    for (const slot of day.hours) {
      const effectiveRate = slot.isPeakHour || isWeekend
        ? round2(baseHourlyRate * peakMultiplier)
        : baseHourlyRate;

      realizedRevenue += slot.bookedSlots * effectiveRate;
      maxPotentialRevenue += slot.availableSlots * effectiveRate;
    }
  }

  realizedRevenue = round2(realizedRevenue);
  maxPotentialRevenue = round2(maxPotentialRevenue);

  const targetTargetRate = targetOccupancyPercent / 100;
  const targetRevenueGoal = round2(maxPotentialRevenue * targetTargetRate);
  const revenueShortfall = Math.max(0, round2(targetRevenueGoal - realizedRevenue));
  const capacityLoss = round2(maxPotentialRevenue - realizedRevenue);
  const yieldEfficiencyPercent = maxPotentialRevenue > 0
    ? Math.round((realizedRevenue / maxPotentialRevenue) * 100)
    : 0;

  return {
    currency,
    baseHourlyRate,
    peakHourlyRate: round2(baseHourlyRate * peakMultiplier),
    realizedRevenue,
    maxPotentialRevenue,
    targetRevenueGoal,
    revenueShortfall,
    capacityLoss,
    yieldEfficiencyPercent,
    targetOccupancyPercent,
    currentOccupancyPercent: utilizationResult.overallOccupancyPercent,
    isTargetAchieved: realizedRevenue >= targetRevenueGoal,
  };
}

// ─── Peak Congestion Bottleneck Finder ────────────────────────────────────────

/**
 * Identifies high-demand bottleneck windows where demand outstrips availability.
 *
 * @param {object} params
 * @param {Array} params.grid
 * @param {number} [params.peakThreshold=0.80]
 * @returns {Array<object>} High-demand congestion slots
 */
export function identifyPeakCongestionWindows({
  grid = [],
  peakThreshold = FORECAST_DEFAULTS.PEAK_CONGESTION_THRESHOLD,
}) {
  const congestedSlots = [];

  for (const day of grid) {
    for (const slot of day.hours) {
      if (slot.occupancyRate >= peakThreshold) {
        congestedSlots.push({
          dayName: day.dayName,
          dayIndex: day.dayIndex,
          hour: slot.hour,
          timeRange: slot.timeRange,
          occupancyPercent: slot.occupancyPercent,
          bookedSlots: slot.bookedSlots,
          availableSlots: slot.availableSlots,
          strategy: slot.occupancyRate >= 0.95
            ? 'MAX_SURGE_AND_WAITLIST'
            : 'MILD_SURGE_PRICING',
        });
      }
    }
  }

  return congestedSlots;
}

export default {
  DENSITY_TIERS,
  DAYS_OF_WEEK,
  FORECAST_DEFAULTS,
  getDensityTier,
  calculateWeeklyUtilizationGrid,
  detectDeadZones,
  forecastWeeklyRevenueYield,
  identifyPeakCongestionWindows,
};
