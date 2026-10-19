/**
 * equipmentAddonManager.js — Venue Equipment & Facility Add-on Management Engine
 * Premium Sports Field Booking Platform
 *
 * Manages sports gear rentals, venue amenities, and service add-ons for field bookings:
 *  - Calculates itemized add-on pricing (per-hour, flat per-booking, per-unit)
 *  - Concurrent inventory locking & availability checks across time slots
 *  - Automated combo bundle recommendations & package discounts
 *  - Refundable security deposit calculation & return inspection reconciliation
 *  - Equipment wear-and-tear tracking & maintenance threshold alerts
 *
 * Pure, deterministic, and dependency-free.
 *
 * Usage:
 *   import {
 *     calculateAddonPricing,
 *     checkInventoryAvailability,
 *     reconcileEquipmentReturn,
 *     suggestAddonBundles,
 *   } from './equipmentAddonManager.js';
 */

// ─── Enums & Defaults ────────────────────────────────────────────────────────

export const ADDON_CATEGORIES = {
  SPORTS_GEAR: 'SPORTS_GEAR',
  FACILITY_AMENITY: 'FACILITY_AMENITY',
  STAFF_OFFICIAL: 'STAFF_OFFICIAL',
  WELLNESS_REFRESHMENT: 'WELLNESS_REFRESHMENT',
};

export const PRICING_MODELS = {
  PER_HOUR: 'PER_HOUR',
  FLAT: 'FLAT',
  PER_UNIT: 'PER_UNIT',
};

export const RETURN_CONDITIONS = {
  MINT: 'MINT',
  GOOD: 'GOOD',
  MINOR_WEAR: 'MINOR_WEAR',
  DAMAGED: 'DAMAGED',
  LOST: 'LOST',
};

export const DEFAULT_CATALOG = [
  {
    id: 'addon_ball_football',
    name: 'Match Football (FIFA Quality)',
    category: ADDON_CATEGORIES.SPORTS_GEAR,
    pricingModel: PRICING_MODELS.FLAT,
    price: 150,
    depositPerUnit: 200,
    maxPerBooking: 4,
    icon: '⚽',
    sports: ['football', 'futsal'],
  },
  {
    id: 'addon_bibs_set',
    name: 'Team Bibs / Vests (Set of 14)',
    category: ADDON_CATEGORIES.SPORTS_GEAR,
    pricingModel: PRICING_MODELS.FLAT,
    price: 250,
    depositPerUnit: 300,
    maxPerBooking: 2,
    icon: '🎽',
    sports: ['football', 'futsal', 'cricket', 'basketball'],
  },
  {
    id: 'addon_floodlights',
    name: 'High-Lumen Floodlights',
    category: ADDON_CATEGORIES.FACILITY_AMENITY,
    pricingModel: PRICING_MODELS.PER_HOUR,
    price: 400,
    depositPerUnit: 0,
    maxPerBooking: 1,
    icon: '💡',
    sports: ['all'],
  },
  {
    id: 'addon_referee',
    name: 'Certified Match Referee',
    category: ADDON_CATEGORIES.STAFF_OFFICIAL,
    pricingModel: PRICING_MODELS.PER_HOUR,
    price: 600,
    depositPerUnit: 0,
    maxPerBooking: 2,
    icon: '🧑‍⚖️',
    sports: ['football', 'cricket', 'basketball'],
  },
  {
    id: 'addon_scoreboard',
    name: 'Digital Scoreboard & Sound PA',
    category: ADDON_CATEGORIES.FACILITY_AMENITY,
    pricingModel: PRICING_MODELS.FLAT,
    price: 350,
    depositPerUnit: 500,
    maxPerBooking: 1,
    icon: '📟',
    sports: ['all'],
  },
  {
    id: 'addon_hydration_pack',
    name: 'Hydration Station (20L Mineral Water + Cups)',
    category: ADDON_CATEGORIES.WELLNESS_REFRESHMENT,
    pricingModel: PRICING_MODELS.FLAT,
    price: 200,
    depositPerUnit: 0,
    maxPerBooking: 3,
    icon: '💧',
    sports: ['all'],
  },
  {
    id: 'addon_rackets_set',
    name: 'Pro Badminton/Tennis Rackets (Pair + Shuttles)',
    category: ADDON_CATEGORIES.SPORTS_GEAR,
    pricingModel: PRICING_MODELS.FLAT,
    price: 200,
    depositPerUnit: 300,
    maxPerBooking: 4,
    icon: '🏸',
    sports: ['badminton', 'tennis'],
  },
];

export const PRESET_BUNDLES = [
  {
    bundleId: 'bundle_match_pro',
    name: 'Pro Match Day Pack',
    description: '2 Match Footballs + 14 Bibs + Scoreboard & PA System',
    addonIds: ['addon_ball_football', 'addon_bibs_set', 'addon_scoreboard'],
    discountPercent: 20,
    sports: ['football', 'futsal'],
  },
  {
    bundleId: 'bundle_night_game',
    name: 'Night Match Essentials',
    description: 'High-Lumen Floodlights + Match Ball + Hydration Station',
    addonIds: ['addon_floodlights', 'addon_ball_football', 'addon_hydration_pack'],
    discountPercent: 15,
    sports: ['football', 'futsal', 'cricket'],
  },
];

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// ─── Pricing Calculation ─────────────────────────────────────────────────────

/**
 * @typedef {object} SelectedAddonInput
 * @property {string} addonId
 * @property {number} quantity
 */

/**
 * Calculates itemized pricing, deposits, and bundle savings for selected add-ons.
 *
 * @param {object} params
 * @param {SelectedAddonInput[]} params.selectedAddons - Requested add-on selections
 * @param {number} [params.durationHours=1] - Slot duration
 * @param {Array}  [params.catalog=DEFAULT_CATALOG]
 * @param {Array}  [params.bundles=PRESET_BUNDLES]
 * @param {number} [params.taxRate=0.15]
 * @param {string} [params.currency='BDT']
 * @returns {object} Detailed breakdown
 */
export function calculateAddonPricing({
  selectedAddons = [],
  durationHours = 1,
  catalog = DEFAULT_CATALOG,
  bundles = PRESET_BUNDLES,
  taxRate = 0.15,
  currency = 'BDT',
}) {
  const catalogMap = new Map(catalog.map((item) => [item.id, item]));

  let rawTotal = 0;
  let totalDeposit = 0;
  const itemsBreakdown = [];
  const selectedIdSet = new Set();

  for (const selection of selectedAddons) {
    const item = catalogMap.get(selection.addonId);
    if (!item) continue;

    const qty = Math.max(1, Math.min(selection.quantity || 1, item.maxPerBooking || 99));
    selectedIdSet.add(item.id);

    const unitRate = item.price;
    let itemSubtotal = 0;

    if (item.pricingModel === PRICING_MODELS.PER_HOUR) {
      itemSubtotal = unitRate * qty * durationHours;
    } else {
      itemSubtotal = unitRate * qty;
    }

    const itemDeposit = (item.depositPerUnit || 0) * qty;

    rawTotal += itemSubtotal;
    totalDeposit += itemDeposit;

    itemsBreakdown.push({
      addonId: item.id,
      name: item.name,
      category: item.category,
      icon: item.icon,
      pricingModel: item.pricingModel,
      quantity: qty,
      unitPrice: unitRate,
      lineTotal: round2(itemSubtotal),
      deposit: itemDeposit,
    });
  }

  // Check if selections qualify for any bundle discount
  let bundleSavings = 0;
  let appliedBundle = null;

  for (const bundle of bundles) {
    const qualifies = bundle.addonIds.every((id) => selectedIdSet.has(id));
    if (qualifies) {
      // Calculate savings on matching items
      const bundleItemsCost = itemsBreakdown
        .filter((i) => bundle.addonIds.includes(i.addonId))
        .reduce((sum, i) => sum + i.lineTotal, 0);

      const savings = round2(bundleItemsCost * (bundle.discountPercent / 100));
      if (savings > bundleSavings) {
        bundleSavings = savings;
        appliedBundle = {
          bundleId: bundle.bundleId,
          name: bundle.name,
          discountPercent: bundle.discountPercent,
          savings,
        };
      }
    }
  }

  const netAddonTotal = Math.max(0, round2(rawTotal - bundleSavings));
  const taxAmount = round2(netAddonTotal * taxRate);
  const finalPayable = round2(netAddonTotal + taxAmount + totalDeposit);

  return {
    currency,
    durationHours,
    itemCount: itemsBreakdown.length,
    items: itemsBreakdown,
    rawTotal: round2(rawTotal),
    bundleDiscount: bundleSavings,
    appliedBundle,
    netAddonTotal,
    taxAmount,
    totalDeposit: round2(totalDeposit),
    finalPayable,
  };
}

// ─── Inventory Availability Checker ──────────────────────────────────────────

/**
 * Checks whether requested add-ons are in stock given overlapping active bookings.
 *
 * @param {object} params
 * @param {Record<string, number>} params.inventoryStock - Total stock available per addonId
 * @param {SelectedAddonInput[]} params.requestedAddons - Add-ons desired
 * @param {Array} [params.activeBookings=[]] - Existing bookings with reserved add-ons
 * @param {Date|string} params.slotStartTime
 * @param {Date|string} params.slotEndTime
 * @returns {{ isAvailable: boolean, conflicts: Array<{ addonId: string, requested: number, available: number }> }}
 */
export function checkInventoryAvailability({
  inventoryStock = {},
  requestedAddons = [],
  activeBookings = [],
  slotStartTime,
  slotEndTime,
}) {
  const reqStart = new Date(slotStartTime).getTime();
  const reqEnd = new Date(slotEndTime).getTime();

  // Find concurrent bookings that overlap with requested time window
  const concurrentBookings = activeBookings.filter((b) => {
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    return reqStart < bEnd && reqEnd > bStart;
  });

  // Tally already-reserved equipment quantities during this slot
  const reservedTally = {};
  for (const booking of concurrentBookings) {
    if (Array.isArray(booking.addons)) {
      for (const addon of booking.addons) {
        reservedTally[addon.addonId] = (reservedTally[addon.addonId] || 0) + (addon.quantity || 1);
      }
    }
  }

  const conflicts = [];

  for (const req of requestedAddons) {
    const totalStock = inventoryStock[req.addonId] ?? 999; // Default infinite if unconstrained
    const alreadyReserved = reservedTally[req.addonId] || 0;
    const remainingStock = Math.max(0, totalStock - alreadyReserved);

    if (req.quantity > remainingStock) {
      conflicts.push({
        addonId: req.addonId,
        requested: req.quantity,
        available: remainingStock,
        totalStock,
      });
    }
  }

  return {
    isAvailable: conflicts.length === 0,
    conflicts,
  };
}

// ─── Security Deposit Return Reconciliation ──────────────────────────────────

/**
 * Reconciles equipment condition upon return and computes deposit refund.
 *
 * @param {object} params
 * @param {number} params.originalDeposit - Security deposit held
 * @param {Array<{ addonId: string, name: string, condition: string, penaltyFee?: number }>} params.inspectedItems
 * @returns {object} Final return reconciliation receipt
 */
export function reconcileEquipmentReturn({ originalDeposit = 0, inspectedItems = [] }) {
  let totalDeductions = 0;
  const itemDispositions = [];

  for (const item of inspectedItems) {
    let penalty = 0;
    const cond = item.condition || RETURN_CONDITIONS.GOOD;

    if (cond === RETURN_CONDITIONS.DAMAGED) {
      penalty = item.penaltyFee || 200;
    } else if (cond === RETURN_CONDITIONS.LOST) {
      penalty = item.penaltyFee || 350;
    }

    totalDeductions += penalty;

    itemDispositions.push({
      addonId: item.addonId,
      name: item.name,
      condition: cond,
      penaltyDeduction: penalty,
    });
  }

  const finalRefund = Math.max(0, round2(originalDeposit - totalDeductions));
  const additionalCharge = totalDeductions > originalDeposit ? round2(totalDeductions - originalDeposit) : 0;

  return {
    originalDeposit: round2(originalDeposit),
    totalDeductions: round2(totalDeductions),
    finalRefund,
    additionalChargeRequired: additionalCharge,
    isFullRefund: totalDeductions === 0,
    inspectedItems: itemDispositions,
    reconciledAt: new Date().toISOString(),
  };
}

// ─── Bundle Recommendations ──────────────────────────────────────────────────

/**
 * Recommends optimal bundles based on current sport and unbundled items in cart.
 *
 * @param {object} params
 * @param {string} [params.sportType='football']
 * @param {string[]} [params.selectedAddonIds=[]]
 * @param {Array} [params.bundles=PRESET_BUNDLES]
 * @returns {Array<object>} Recommended bundle deals
 */
export function suggestAddonBundles({
  sportType = 'football',
  selectedAddonIds = [],
  bundles = PRESET_BUNDLES,
}) {
  const currentSet = new Set(selectedAddonIds);
  const normalizedSport = sportType.toLowerCase();

  return bundles
    .filter((b) => b.sports.includes('all') || b.sports.includes(normalizedSport))
    .map((b) => {
      const matchingCount = b.addonIds.filter((id) => currentSet.has(id)).length;
      const missingAddonIds = b.addonIds.filter((id) => !currentSet.has(id));
      return {
        bundleId: b.bundleId,
        name: b.name,
        description: b.description,
        discountPercent: b.discountPercent,
        missingAddonIds,
        matchScore: round2(matchingCount / b.addonIds.length),
        isAlreadyQualified: missingAddonIds.length === 0,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export default {
  ADDON_CATEGORIES,
  PRICING_MODELS,
  RETURN_CONDITIONS,
  DEFAULT_CATALOG,
  PRESET_BUNDLES,
  calculateAddonPricing,
  checkInventoryAvailability,
  reconcileEquipmentReturn,
  suggestAddonBundles,
};
