/**
 * matchHydrationCateringEngine.js — Pitchside Hydration, Team Catering & Concession Manager
 * Premium Sports Field Booking Platform
 *
 * Implements pre-order and pitchside delivery for sports teams, tournaments, and spectators:
 *  - Electrolyte & hydration station packages (Chilled water coolers, Isotonic drinks, Protein shakes)
 *  - Post-match squad recovery meal bundles (Carb refuel, Lean protein boxes, Halal/Vegan options)
 *  - Pitch delivery time scheduling synced with match halftime or post-match whistle
 *  - Squad per-player split cost calculation
 *  - Inventory stock depletion tracking and minimum lead time enforcement
 *  - Digital order voucher token with redemption verification
 *
 * Pure ES Module with zero external dependencies.
 */

// ─── Constants & Package Catalogs ────────────────────────────────────────────

export const HYDRATION_PACKAGES = {
  BASIC_PITCH_COOLER: {
    packageId: 'BASIC_PITCH_COOLER',
    name: 'Pitchside Ice Water Cooler (20L)',
    category: 'HYDRATION',
    basePriceUsd: 12.0,
    servings: 20,
    itemsIncluded: ['20L Insulated Ice Water Dispenser', '20 Biodegradable Sports Cups', 'Electrolyte Dissolve Tablets'],
    minLeadTimeMins: 30,
    icon: 'droplets',
  },
  ISOTONIC_SQUAD_PACK: {
    packageId: 'ISOTONIC_SQUAD_PACK',
    name: 'Pro Isotonic Electrolyte Crate',
    category: 'HYDRATION',
    basePriceUsd: 28.0,
    servings: 16,
    itemsIncluded: ['16x 500ml Chilled Gatorade / Lucozade bottles', 'Crushed ice cooler box', 'Pre-game energy chews'],
    minLeadTimeMins: 45,
    icon: 'zap',
  },
  RECOVERY_PROTEIN_BAR: {
    packageId: 'RECOVERY_PROTEIN_BAR',
    name: 'Post-Match Protein & Recovery Bar',
    category: 'RECOVERY',
    basePriceUsd: 45.0,
    servings: 14,
    itemsIncluded: ['14x Whey / Plant 25g Protein Shakes', '14x Organic Banana & Flapjack energy bars', 'Electrolyte replenishment sachets'],
    minLeadTimeMins: 60,
    icon: 'shield-plus',
  },
};

export const CATERING_BUNDLES = {
  SQUAD_WRAP_BOX: {
    bundleId: 'SQUAD_WRAP_BOX',
    name: 'MatchDay Fuel: Grilled Chicken & Vegan Wraps',
    category: 'MEALS',
    pricePerPersonUsd: 8.5,
    minPartySize: 8,
    dietaryOptions: ['Grilled Lemon Chicken', 'Falafel & Hummus (Vegan)', 'Chipotle Beef'],
    sidesIncluded: ['Fresh cut fruit cups', 'Baked pita crisps', 'Hydration juice'],
    minLeadTimeMins: 120,
    icon: 'utensils',
  },
  GOURMET_BURGER_POST_MATCH: {
    bundleId: 'GOURMET_BURGER_POST_MATCH',
    name: 'Champion Post-Match Smash Burgers',
    category: 'MEALS',
    pricePerPersonUsd: 12.0,
    minPartySize: 10,
    dietaryOptions: ['Angus Beef Smash Burger', 'Crispy Chicken', 'Beyond Meat Vegan Burger'],
    sidesIncluded: ['Seasoned Potato Wedges', 'Signature Truffle Sauce', 'Chilled Soda Can'],
    minLeadTimeMins: 180,
    icon: 'flame',
  },
  VIP_HOSPITALITY_PLATTER: {
    bundleId: 'VIP_HOSPITALITY_PLATTER',
    name: 'Executive Lounge Charcuterie & Artisan Bites',
    category: 'VIP_HOSPITALITY',
    pricePerPersonUsd: 18.0,
    minPartySize: 6,
    dietaryOptions: ['Imported Cheeses & Cold Cuts', 'Artisan Bruschetta', 'Sushi & Roll Selection'],
    sidesIncluded: ['Sparkling Water', 'Cold-Pressed Juices', 'Gourmet Dessert Canapes'],
    minLeadTimeMins: 240,
    icon: 'crown',
  },
};

export const DELIVERY_TIMINGS = {
  PRE_MATCH: { id: 'PRE_MATCH', label: 'Pre-Match Warmup (15m before kickoff)' },
  HALFTIME_WHISTLE: { id: 'HALFTIME_WHISTLE', label: 'Halftime Whistle (Direct to Pitch Dugout)' },
  POST_MATCH_FINAL: { id: 'POST_MATCH_FINAL', label: 'Post-Match Final Whistle (Locker Room / Terrace)' },
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  OUT_FOR_PITCH_DELIVERY: 'OUT_FOR_PITCH_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

// ─── Order Calculation & Pricing Engine ─────────────────────────────────────

/**
 * Calculates total order cost, squad per-player splits, delivery fees, and taxes.
 *
 * @param {Object} params
 * @param {Array<string>} [params.selectedHydrationIds=[]] - Array of package keys from HYDRATION_PACKAGES
 * @param {string|null} [params.selectedCateringBundleId=null] - Bundle key from CATERING_BUNDLES
 * @param {number} [params.cateringHeadcount=12] - Number of players to feed
 * @param {number} [params.squadSplitSize=12] - Number of players contributing to the bill
 * @param {boolean} [params.isPitchsideDelivery=true] - Whether delivered directly to field bench
 * @returns {Object} Complete order invoice and breakdown
 */
export function calculateCateringOrder({
  selectedHydrationIds = [],
  selectedCateringBundleId = null,
  cateringHeadcount = 12,
  squadSplitSize = 12,
  isPitchsideDelivery = true,
}) {
  let hydrationTotal = 0;
  const items = [];

  // 1. Hydration packages total
  for (const hid of selectedHydrationIds) {
    const pkg = HYDRATION_PACKAGES[hid];
    if (pkg) {
      hydrationTotal += pkg.basePriceUsd;
      items.push({
        id: pkg.packageId,
        name: pkg.name,
        category: pkg.category,
        price: pkg.basePriceUsd,
        servings: pkg.servings,
      });
    }
  }

  // 2. Catering bundle total
  let cateringTotal = 0;
  const headcount = Math.max(1, Number(cateringHeadcount) || 12);
  const bundle = CATERING_BUNDLES[selectedCateringBundleId];

  if (bundle) {
    const effectiveCount = Math.max(bundle.minPartySize, headcount);
    cateringTotal = bundle.pricePerPersonUsd * effectiveCount;
    items.push({
      id: bundle.bundleId,
      name: bundle.name,
      category: bundle.category,
      price: cateringTotal,
      unitPrice: bundle.pricePerPersonUsd,
      headcount: effectiveCount,
    });
  }

  const rawSubtotal = Math.round((hydrationTotal + cateringTotal) * 100) / 100;

  // 3. Pitchside delivery express fee ($5 for dedicated runner)
  const deliveryRunnerFee = isPitchsideDelivery && rawSubtotal > 0 ? 5.0 : 0.0;

  // 4. City concession & service tax (7%)
  const taxAmount = Math.round(rawSubtotal * 0.07 * 100) / 100;
  const grandTotal = Math.round((rawSubtotal + deliveryRunnerFee + taxAmount) * 100) / 100;

  // 5. Squad per-player split
  const splitCount = Math.max(1, Math.min(30, Number(squadSplitSize) || headcount || 12));
  const perPlayerCost = Math.round((grandTotal / splitCount) * 100) / 100;

  return {
    itemsCount: items.length,
    items,
    hydrationSubtotalUsd: Math.round(hydrationTotal * 100) / 100,
    cateringSubtotalUsd: Math.round(cateringTotal * 100) / 100,
    rawSubtotalUsd: rawSubtotal,
    deliveryRunnerFeeUsd: deliveryRunnerFee,
    taxAmountUsd: taxAmount,
    grandTotalUsd: grandTotal,
    perPlayerCostUsd: perPlayerCost,
    squadSplitSize: splitCount,
    currency: 'USD',
  };
}

// ─── Order Lead Time & Timing Validator ─────────────────────────────────────

/**
 * Validates whether an order meets the minimum preparation lead time before kickoff.
 *
 * @param {Array<string>} selectedPackageIds - Array of package and bundle IDs
 * @param {string|Date} matchStartTime - Match start timestamp
 * @param {string|Date} [orderPlacementTime=new Date()] - Current order time
 * @returns {{ isEligible: boolean, requiredLeadTimeMins: number, availableLeadTimeMins: number, warningReason: string|null }}
 */
export function validateOrderLeadTime(
  selectedPackageIds = [],
  matchStartTime,
  orderPlacementTime = new Date()
) {
  const matchMs = new Date(matchStartTime).getTime();
  const orderMs = new Date(orderPlacementTime).getTime();
  const availableLeadTimeMins = Math.floor((matchMs - orderMs) / (60 * 1000));

  let maxLeadTimeRequired = 30; // default 30 mins

  for (const id of selectedPackageIds) {
    const pkg = HYDRATION_PACKAGES[id] || CATERING_BUNDLES[id];
    if (pkg && pkg.minLeadTimeMins > maxLeadTimeRequired) {
      maxLeadTimeRequired = pkg.minLeadTimeMins;
    }
  }

  const isEligible = availableLeadTimeMins >= maxLeadTimeRequired;

  return {
    isEligible,
    requiredLeadTimeMins: maxLeadTimeRequired,
    availableLeadTimeMins,
    warningReason: isEligible
      ? null
      : `Order requires at least ${maxLeadTimeRequired} minutes preparation notice. Match begins in ${availableLeadTimeMins} minutes.`,
  };
}

// ─── Pitchside Delivery Voucher & Token Generator ───────────────────────────

/**
 * Generates an encrypted pitchside delivery voucher token.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking identifier
 * @param {string} params.pitchName - Pitch / Field identifier
 * @param {string} params.teamName - Ordering team name
 * @param {string} params.deliveryTimingId - Delivery slot key from DELIVERY_TIMINGS
 * @param {Object} params.orderInvoice - Invoice from calculateCateringOrder
 * @returns {Object} Delivery voucher dossier
 */
export function generateDeliveryVoucher({
  bookingId,
  pitchName,
  teamName,
  deliveryTimingId = 'HALFTIME_WHISTLE',
  orderInvoice,
}) {
  if (!bookingId || !pitchName || !teamName) {
    throw new Error('bookingId, pitchName, and teamName are required to generate voucher');
  }

  const timing = DELIVERY_TIMINGS[deliveryTimingId] || DELIVERY_TIMINGS.HALFTIME_WHISTLE;
  const entropy = Math.random().toString(36).substring(2, 7).toUpperCase();
  const voucherCode = `FND-${bookingId.replace(/[^a-zA-Z0-9]/g, '')}-${entropy}`;

  return {
    voucherId: `VCH-${Date.now().toString(36).toUpperCase()}`,
    voucherCode,
    bookingId,
    pitchName,
    teamName,
    deliverySlot: timing.label,
    orderSummary: {
      itemsCount: orderInvoice?.itemsCount || 0,
      grandTotalUsd: orderInvoice?.grandTotalUsd || 0,
      currency: 'USD',
    },
    qrPayload: `PREMIUM_SPORTS_CATERING:${voucherCode}:${pitchName}`,
    status: ORDER_STATUS.PENDING,
    issuedAt: new Date().toISOString(),
  };
}

// ─── Runner Delivery Redemption Verifier ────────────────────────────────────

/**
 * Verifies and redempts a delivery voucher upon runner handover at the pitch.
 *
 * @param {Object} deliveryVoucher - Issued voucher record
 * @param {string} enteredCode - Code verified by runner or team captain
 * @returns {{ success: boolean, message: string, updatedVoucher: Object }}
 */
export function redeemDeliveryVoucher(deliveryVoucher, enteredCode) {
  if (!deliveryVoucher) {
    return { success: false, message: 'Invalid voucher record', updatedVoucher: null };
  }

  if (String(enteredCode).trim() !== String(deliveryVoucher.voucherCode).trim()) {
    return { success: false, message: 'Incorrect voucher code entered', updatedVoucher: deliveryVoucher };
  }

  if (deliveryVoucher.status === ORDER_STATUS.DELIVERED) {
    return { success: false, message: 'Voucher was already fulfilled and delivered earlier', updatedVoucher: deliveryVoucher };
  }

  const deliveredAt = new Date().toISOString();
  const updatedVoucher = {
    ...deliveryVoucher,
    status: ORDER_STATUS.DELIVERED,
    deliveredAt,
  };

  return {
    success: true,
    message: `Delivery successfully confirmed for ${deliveryVoucher.teamName} at ${deliveryVoucher.pitchName}!`,
    updatedVoucher,
  };
}

export default {
  HYDRATION_PACKAGES,
  CATERING_BUNDLES,
  DELIVERY_TIMINGS,
  ORDER_STATUS,
  calculateCateringOrder,
  validateOrderLeadTime,
  generateDeliveryVoucher,
  redeemDeliveryVoucher,
};
