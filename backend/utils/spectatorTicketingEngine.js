/**
 * spectatorTicketingEngine.js — Spectator Ticketing, Seating Tier & Gate Entry Engine
 * Premium Sports Field Booking Platform
 *
 * Provides event ticketing, tiered spectator seating, and gate admissions:
 *  - Multi-tier seat zone configuration (VIP Box, Grandstand Covered, Pitchside Bench, General Standing)
 *  - Dynamic pricing adjustments based on capacity utilization and match stage (Finals/Semis)
 *  - Group bulk discounts and student/veteran concession rates
 *  - Unique cryptographic barcode/QR gate entry pass tokens
 *  - Capacity control and overbooking prevention per seating section
 *  - Gate check-in verification with anti-passback and duplicate scan protection
 *  - Revenue yield aggregation (Gross ticketing, platform rake, host payout)
 *
 * Pure ES Module with zero external dependencies.
 */

// ─── Constants & Seating Tier Definitions ─────────────────────────────────────

export const SEATING_ZONES = {
  VIP_BOX: {
    zoneId: 'VIP_BOX',
    name: 'Executive VIP Lounge & Box',
    basePriceUsd: 45.0,
    perks: ['Complimentary refreshments & drinks', 'Padded leather armchairs', 'Private climate-controlled lounge', 'Pitchside priority access'],
    capacityPct: 10,
    hasAssignedSeats: true,
    icon: 'crown',
  },
  GRANDSTAND_COVERED: {
    zoneId: 'GRANDSTAND_COVERED',
    name: 'Covered Grandstand (Center Line)',
    basePriceUsd: 22.0,
    perks: ['Sheltered from rain/sun', 'Elevated match perspective', 'Numbered seat assignment'],
    capacityPct: 35,
    hasAssignedSeats: true,
    icon: 'armchair',
  },
  PITCHSIDE_BENCH: {
    zoneId: 'PITCHSIDE_BENCH',
    name: 'Pitchside Dugout Perimeter',
    basePriceUsd: 15.0,
    perks: ['Field-level player proximity', 'Bench seating', 'High-energy immersion'],
    capacityPct: 25,
    hasAssignedSeats: false,
    icon: 'flame',
  },
  GENERAL_STANDING: {
    zoneId: 'GENERAL_STANDING',
    name: 'General Admission / Fan Zone',
    basePriceUsd: 8.0,
    perks: ['Unreserved bleachers / standing terrace', 'Direct food truck access', 'Fan singing section'],
    capacityPct: 30,
    hasAssignedSeats: false,
    icon: 'users',
  },
};

export const MATCH_STAGES = {
  GROUP_STAGE: { id: 'GROUP_STAGE', multiplier: 1.0, label: 'Regular / Group Match' },
  QUARTER_FINAL: { id: 'QUARTER_FINAL', multiplier: 1.25, label: 'Quarter-Final' },
  SEMI_FINAL: { id: 'SEMI_FINAL', multiplier: 1.5, label: 'Semi-Final' },
  CHAMPIONSHIP_FINAL: { id: 'CHAMPIONSHIP_FINAL', multiplier: 2.0, label: 'Championship Grand Final' },
};

export const CONCESSION_DISCOUNTS = {
  STANDARD: { id: 'STANDARD', discountPct: 0, label: 'Standard Adult' },
  STUDENT: { id: 'STUDENT', discountPct: 20, label: 'Student / Youth (20% Off)' },
  VETERAN_SENIOR: { id: 'VETERAN_SENIOR', discountPct: 25, label: 'Senior / Veteran (25% Off)' },
  CHILD_UNDER_12: { id: 'CHILD_UNDER_12', discountPct: 50, label: 'Child under 12 (50% Off)' },
};

// ─── Dynamic Pricing & Capacity Calculator ───────────────────────────────────

/**
 * Calculates ticket price for a specified seating zone, match stage, and concession.
 *
 * @param {Object} params
 * @param {string} [params.zoneId='GRANDSTAND_COVERED'] - Key from SEATING_ZONES
 * @param {string} [params.matchStage='GROUP_STAGE'] - Key from MATCH_STAGES
 * @param {string} [params.concessionType='STANDARD'] - Key from CONCESSION_DISCOUNTS
 * @param {number} [params.currentOccupancyPct=0] - 0 to 100% capacity filled
 * @param {number} [params.quantity=1] - Number of tickets requested
 * @returns {Object} Complete pricing and yield breakdown
 */
export function calculateTicketPrice({
  zoneId = 'GRANDSTAND_COVERED',
  matchStage = 'GROUP_STAGE',
  concessionType = 'STANDARD',
  currentOccupancyPct = 0,
  quantity = 1,
}) {
  const zone = SEATING_ZONES[zoneId] || SEATING_ZONES.GRANDSTAND_COVERED;
  const stage = MATCH_STAGES[matchStage] || MATCH_STAGES.GROUP_STAGE;
  const concession = CONCESSION_DISCOUNTS[concessionType] || CONCESSION_DISCOUNTS.STANDARD;

  const count = Math.max(1, Math.min(50, Number(quantity) || 1));
  const occupancy = Math.max(0, Math.min(100, Number(currentOccupancyPct) || 0));

  // Dynamic surge: +15% if zone is > 80% sold out, +30% if > 90% sold out
  let surgeMultiplier = 1.0;
  if (occupancy >= 90) {
    surgeMultiplier = 1.3;
  } else if (occupancy >= 80) {
    surgeMultiplier = 1.15;
  }

  // Base adjusted price before discount
  const baseRate = zone.basePriceUsd * stage.multiplier * surgeMultiplier;

  // Apply concession discount
  const unitDiscount = (baseRate * concession.discountPct) / 100;
  const unitPrice = Math.max(2.0, Math.round((baseRate - unitDiscount) * 100) / 100);

  // Group bulk discount: 10% off for 6+ tickets, 15% off for 12+ tickets
  let groupDiscountPct = 0;
  if (count >= 12) {
    groupDiscountPct = 15;
  } else if (count >= 6) {
    groupDiscountPct = 10;
  }

  const subtotalBeforeGroup = unitPrice * count;
  const groupDiscountAmount = Math.round(((subtotalBeforeGroup * groupDiscountPct) / 100) * 100) / 100;
  const netSubtotal = Math.round((subtotalBeforeGroup - groupDiscountAmount) * 100) / 100;

  // Platform booking service fee (6% + $0.50 per ticket)
  const serviceFee = Math.round((netSubtotal * 0.06 + count * 0.5) * 100) / 100;
  const totalBilled = Math.round((netSubtotal + serviceFee) * 100) / 100;

  return {
    zoneId: zone.zoneId,
    zoneName: zone.name,
    matchStage: stage.label,
    quantity: count,
    basePricePerTicket: zone.basePriceUsd,
    stageMultiplier: stage.multiplier,
    surgeMultiplier,
    concessionApplied: concession.label,
    effectiveUnitRate: unitPrice,
    subtotalBeforeGroup,
    groupDiscountPct,
    groupDiscountAmount,
    netSubtotal,
    serviceFee,
    totalBilled,
    currency: 'USD',
  };
}

// ─── Seat Allocation Generator ───────────────────────────────────────────────

/**
 * Assigns numbered seats for reserved seating zones (VIP and Grandstand).
 *
 * @param {string} zoneId - Key from SEATING_ZONES
 * @param {number} quantity - Quantity of adjacent seats
 * @param {number} [startSeatIndex=1] - Starting seat pointer
 * @returns {Array<string>} Array of seat identifiers (e.g., ['A-12', 'A-13'])
 */
export function allocateReservedSeats(zoneId, quantity, startSeatIndex = 1) {
  const zone = SEATING_ZONES[zoneId] || SEATING_ZONES.GRANDSTAND_COVERED;
  const count = Math.max(1, Number(quantity) || 1);

  if (!zone.hasAssignedSeats) {
    return Array.from({ length: count }, () => `${zone.zoneId}-GA-UNRESERVED`);
  }

  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
  const seatsPerRow = 20;

  const allocated = [];
  for (let i = 0; i < count; i++) {
    const seatNum = Number(startSeatIndex) + i;
    const rowIndex = Math.floor((seatNum - 1) / seatsPerRow) % rowLetters.length;
    const colIndex = ((seatNum - 1) % seatsPerRow) + 1;
    allocated.push(`${rowLetters[rowIndex]}-${colIndex}`);
  }

  return allocated;
}

// ─── Digital Spectator Pass & Barcode Token Generator ────────────────────────

/**
 * Creates an electronic spectator pass bundle with unique gate scan tokens.
 *
 * @param {Object} params
 * @param {string} params.eventId - Fixture / tournament ID
 * @param {string} params.buyerName - Ticket purchaser name
 * @param {string} params.zoneId - Seating zone
 * @param {Array<string>} params.seatNumbers - Array of seat numbers
 * @param {string} params.matchDate - Match kickoff timestamp
 * @param {string} [params.gateNumber='Gate 2 — West Turnstiles'] - Entry gate
 * @returns {Object} Spectator pass dossier
 */
export function generateSpectatorPass({
  eventId,
  buyerName,
  zoneId,
  seatNumbers = [],
  matchDate,
  gateNumber = 'Gate 2 — West Turnstiles',
}) {
  if (!eventId || !buyerName || !zoneId) {
    throw new Error('eventId, buyerName, and zoneId are mandatory to issue passes');
  }

  const zone = SEATING_ZONES[zoneId] || SEATING_ZONES.GENERAL_STANDING;
  const issuedAt = new Date().toISOString();

  const tickets = seatNumbers.map((seat, index) => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const barcodeToken = `TKT-${eventId.replace(/[^a-zA-Z0-9]/g, '')}-${seat}-${randomHex}`;

    return {
      ticketId: `TCK-${Date.now().toString(36).toUpperCase()}-${index + 1}`,
      seatNumber: seat,
      barcodeToken,
      qrPayload: `PREMIUM_SPORTS_GATE_PASS:${barcodeToken}`,
      isCheckedIn: false,
      checkInTime: null,
      status: 'VALID',
    };
  });

  return {
    passBundleId: `PASS-BNDL-${Date.now().toString(36).toUpperCase()}`,
    eventId,
    buyerName,
    zoneId: zone.zoneId,
    zoneName: zone.name,
    gateNumber,
    matchDate,
    totalTickets: tickets.length,
    tickets,
    issuedAt,
    isTransferable: true,
  };
}

// ─── Gate Turnstile Scan & Duplicate Prevention ─────────────────────────────

/**
 * Validates a scanned ticket token at a venue gate turnstile.
 *
 * @param {Object} passBundle - Issued spectator pass bundle
 * @param {string} scannedBarcode - Barcode token read by optical scanner
 * @param {string|Date} [scanTimestamp=new Date()] - Time of scan
 * @returns {{ allowed: boolean, reason: string, updatedPassBundle: Object }}
 */
export function verifyGateEntry(passBundle, scannedBarcode, scanTimestamp = new Date()) {
  if (!passBundle || !Array.isArray(passBundle.tickets)) {
    return {
      allowed: false,
      reason: 'INVALID_PASS_BUNDLE',
      updatedPassBundle: passBundle,
    };
  }

  const ticketIndex = passBundle.tickets.findIndex(
    (t) => t.barcodeToken === scannedBarcode || t.qrPayload === scannedBarcode
  );

  if (ticketIndex === -1) {
    return {
      allowed: false,
      reason: 'TICKET_NOT_FOUND',
      updatedPassBundle: passBundle,
    };
  }

  const targetTicket = passBundle.tickets[ticketIndex];

  // Anti-passback & duplicate check
  if (targetTicket.isCheckedIn) {
    return {
      allowed: false,
      reason: `ALREADY_CHECKED_IN: Scanned earlier at ${targetTicket.checkInTime}`,
      updatedPassBundle: passBundle,
    };
  }

  if (targetTicket.status !== 'VALID') {
    return {
      allowed: false,
      reason: `TICKET_REVOKED: Status is ${targetTicket.status}`,
      updatedPassBundle: passBundle,
    };
  }

  // Authorize entry and mark as checked-in
  const checkInTime = new Date(scanTimestamp).toISOString();
  const updatedTickets = [...passBundle.tickets];
  updatedTickets[ticketIndex] = {
    ...targetTicket,
    isCheckedIn: true,
    checkInTime,
    status: 'ADMITTED',
  };

  const updatedBundle = {
    ...passBundle,
    tickets: updatedTickets,
    lastScannedAt: checkInTime,
  };

  return {
    allowed: true,
    reason: `ENTRY_GRANTED: Welcome to ${passBundle.zoneName}! Seat: ${targetTicket.seatNumber}`,
    updatedPassBundle: updatedBundle,
  };
}

// ─── Stadium Seating Manifest Aggregate ─────────────────────────────────────

/**
 * Calculates total venue capacity, occupancy percentages, and projected ticketing yield.
 *
 * @param {number} totalStadiumCapacity - Total seats across the facility
 * @param {Object} zoneOccupancyMap - Map of { VIP_BOX: count, GRANDSTAND_COVERED: count, ... }
 * @returns {Object} Capacity breakdown and total gate receipt projections
 */
export function calculateStadiumManifest(totalStadiumCapacity = 500, zoneOccupancyMap = {}) {
  const capacity = Math.max(50, Number(totalStadiumCapacity) || 500);
  let totalSold = 0;
  let totalGrossRevenue = 0;

  const zoneBreakdown = Object.values(SEATING_ZONES).map((zone) => {
    const zoneCap = Math.round((capacity * zone.capacityPct) / 100);
    const sold = Math.min(zoneCap, Number(zoneOccupancyMap[zone.zoneId]) || 0);
    const available = Math.max(0, zoneCap - sold);
    const occupancyPct = Math.round((sold / zoneCap) * 100);
    const zoneRevenue = sold * zone.basePriceUsd;

    totalSold += sold;
    totalGrossRevenue += zoneRevenue;

    return {
      zoneId: zone.zoneId,
      name: zone.name,
      allocatedCapacity: zoneCap,
      soldCount: sold,
      availableCount: available,
      occupancyPct,
      grossRevenueUsd: zoneRevenue,
    };
  });

  const overallOccupancyPct = Math.round((totalSold / capacity) * 100);
  const platformRakeUsd = Math.round(totalGrossRevenue * 0.08 * 100) / 100;
  const hostNetPayoutUsd = Math.round((totalGrossRevenue - platformRakeUsd) * 100) / 100;

  return {
    totalStadiumCapacity: capacity,
    totalTicketsSold: totalSold,
    totalAvailable: capacity - totalSold,
    overallOccupancyPct,
    totalGrossRevenueUsd: Math.round(totalGrossRevenue * 100) / 100,
    platformRakeUsd,
    hostNetPayoutUsd,
    zoneBreakdown,
  };
}

export default {
  SEATING_ZONES,
  MATCH_STAGES,
  CONCESSION_DISCOUNTS,
  calculateTicketPrice,
  allocateReservedSeats,
  generateSpectatorPass,
  verifyGateEntry,
  calculateStadiumManifest,
};
