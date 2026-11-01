/**
 * stadiumParkingTransportEngine.js — Stadium Parking Spot Reservation, EV Charging & Transport Manager
 * Premium Sports Field Booking Platform
 *
 * Implements parking spot allocation, multi-vehicle space reservations, and ANPR access:
 *  - Multi-tier parking bays (VIP Pitchside Covered, Standard Car/SUV, EV Fast-Charging, Team Bus/Minivan)
 *  - Automated Number Plate Recognition (ANPR) dynamic gate token generation
 *  - EV charging duration calculator and kilowatt-hour surcharge modeling
 *  - Booking sync: automatically extends parking buffer before kickoff and after final whistle
 *  - Overstay penalty calculation and security barrier clearance verification
 *  - Full venue parking capacity manifest and occupancy reporting
 *
 * Pure ES Module with zero external dependencies.
 */

// ─── Constants & Parking Bay Types ───────────────────────────────────────────

export const PARKING_BAY_TYPES = {
  VIP_COVERED: {
    typeId: 'VIP_COVERED',
    name: 'VIP Covered Pitchside Bay',
    baseHourlyUsd: 8.0,
    features: ['Direct stadium tunnel elevator', 'Undercover weather shelter', 'Reserved individual spot'],
    hasEvCharger: false,
    capacityPct: 15,
    icon: 'crown',
  },
  EV_FAST_CHARGER: {
    typeId: 'EV_FAST_CHARGER',
    name: 'EV Ultra-Fast Charging Bay (22kW)',
    baseHourlyUsd: 12.0,
    kwhRateUsd: 0.35,
    features: ['22kW Type 2 / CCS Fast Charging', 'Guaranteed charging space', 'Auto shutoff upon full charge'],
    hasEvCharger: true,
    capacityPct: 20,
    icon: 'zap',
  },
  STANDARD_SEDAN_SUV: {
    typeId: 'STANDARD_SEDAN_SUV',
    name: 'Standard Car & SUV Bay',
    baseHourlyUsd: 5.0,
    features: ['Paved asphalt lot', 'Security camera surveillance', '5-minute walking distance to turnstiles'],
    hasEvCharger: false,
    capacityPct: 55,
    icon: 'car',
  },
  TEAM_MINIVAN_BUS: {
    typeId: 'TEAM_MINIVAN_BUS',
    name: 'Team Bus / Minivan Oversized Bay',
    baseHourlyUsd: 15.0,
    features: ['Extended 12m length bay', 'Easy squad kit unloading zone', 'Direct access to locker room gate'],
    hasEvCharger: false,
    capacityPct: 10,
    icon: 'bus',
  },
};

export const PARKING_DEFAULTS = {
  PRE_MATCH_BUFFER_MINS: 30, // Parking valid 30 mins before match
  POST_MATCH_BUFFER_MINS: 30, // Parking valid 30 mins after match
  OVERSTAY_CHARGE_PER_HOUR_USD: 10.0,
};

export const PARKING_STATUS = {
  RESERVED: 'RESERVED',
  VEHICLE_ON_SITE: 'VEHICLE_ON_SITE',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  OVERSTAY_PENALTY: 'OVERSTAY_PENALTY',
  CANCELLED: 'CANCELLED',
};

// ─── Price & EV Charging Calculator ──────────────────────────────────────────

/**
 * Calculates parking bay fees, EV charging surcharges, and match sync pricing.
 *
 * @param {Object} params
 * @param {string} [params.bayType='STANDARD_SEDAN_SUV'] - Key from PARKING_BAY_TYPES
 * @param {number} [params.durationHours=2.5] - Total parking duration
 * @param {boolean} [params.enableEvCharging=false] - Whether EV charge is active
 * @param {number} [params.estimatedKwhNeeded=25] - Estimated kWh for EV session
 * @param {boolean} [params.isBundledWithPitch=true] - 15% discount if booked with pitch
 * @returns {Object} Complete parking invoice
 */
export function calculateParkingPricing({
  bayType = 'STANDARD_SEDAN_SUV',
  durationHours = 2.5,
  enableEvCharging = false,
  estimatedKwhNeeded = 25,
  isBundledWithPitch = true,
}) {
  const bay = PARKING_BAY_TYPES[bayType] || PARKING_BAY_TYPES.STANDARD_SEDAN_SUV;
  const hours = Math.max(1, Math.min(12, Number(durationHours) || 2.5));

  const rawParkingCost = bay.baseHourlyUsd * hours;

  // EV Charging calculation
  let evChargingFee = 0;
  if (bay.hasEvCharger && enableEvCharging) {
    const kwh = Math.max(5, Math.min(80, Number(estimatedKwhNeeded) || 25));
    evChargingFee = kwh * bay.kwhRateUsd;
  }

  // 15% Pitch Bundle Discount
  const discountAmount = isBundledWithPitch ? (rawParkingCost + evChargingFee) * 0.15 : 0;
  const netSubtotal = rawParkingCost + evChargingFee - discountAmount;

  // City parking facility tax (5%)
  const municipalTax = netSubtotal * 0.05;
  const grandTotal = Math.round((netSubtotal + municipalTax) * 100) / 100;

  return {
    bayType: bay.typeId,
    bayName: bay.name,
    durationHours: hours,
    rawParkingCost: Math.round(rawParkingCost * 100) / 100,
    evChargingFee: Math.round(evChargingFee * 100) / 100,
    isBundledWithPitch,
    discountAmount: Math.round(discountAmount * 100) / 100,
    municipalTax: Math.round(municipalTax * 100) / 100,
    grandTotal,
    currency: 'USD',
  };
}

// ─── ANPR Gate Token & Bay Allocation Generator ──────────────────────────────

/**
 * Assigns an individual bay and generates an ANPR vehicle barrier access token.
 *
 * @param {Object} params
 * @param {string} params.bookingId - Field booking identifier
 * @param {string} params.licensePlate - Vehicle license plate number
 * @param {string} [params.bayType='STANDARD_SEDAN_SUV'] - Bay type key
 * @param {string} params.matchStartTime - ISO match start
 * @param {string} params.matchEndTime - ISO match end
 * @returns {Object} Parking reservation pass dossier
 */
export function generateParkingPass({
  bookingId,
  licensePlate,
  bayType = 'STANDARD_SEDAN_SUV',
  matchStartTime,
  matchEndTime,
}) {
  if (!bookingId || !licensePlate) {
    throw new Error('bookingId and licensePlate are mandatory to issue parking pass');
  }

  const startMs = new Date(matchStartTime).getTime();
  const endMs = new Date(matchEndTime).getTime();

  // Apply pre and post match buffers
  const validFromMs = startMs - PARKING_DEFAULTS.PRE_MATCH_BUFFER_MINS * 60 * 1000;
  const validUntilMs = endMs + PARKING_DEFAULTS.POST_MATCH_BUFFER_MINS * 60 * 1000;

  const normalizedPlate = licensePlate.toUpperCase().replace(/[^A-Z0-9-]/g, '');

  // Generate numbered spot (e.g. VIP-B12 or LOT-A45)
  let prefix = 'LOT';
  if (bayType === 'VIP_COVERED') {
    prefix = 'VIP';
  } else if (bayType === 'EV_FAST_CHARGER') {
    prefix = 'EV';
  }
  const bayNumber = `${prefix}-${Math.floor(Math.random() * 80 + 10)}`;

  const entropy = Math.random().toString(36).substring(2, 6).toUpperCase();
  const barrierToken = `PRK-${normalizedPlate}-${entropy}`;

  return {
    passId: `PRK-PASS-${Date.now().toString(36).toUpperCase()}`,
    bookingId,
    licensePlate: normalizedPlate,
    bayType,
    allocatedBay: bayNumber,
    barrierToken,
    qrPayload: `PREMIUM_SPORTS_PARKING_GATE:${barrierToken}:${normalizedPlate}`,
    validFrom: new Date(validFromMs).toISOString(),
    validUntil: new Date(validUntilMs).toISOString(),
    status: PARKING_STATUS.RESERVED,
    issuedAt: new Date().toISOString(),
  };
}

// ─── Barrier ANPR Camera Verification ────────────────────────────────────────

/**
 * Validates vehicle entry/exit at the automated parking barrier.
 *
 * @param {Object} parkingPass - Active parking pass
 * @param {string} scannedPlate - License plate captured by camera
 * @param {string|Date} [eventTime=new Date()] - Time of scan
 * @returns {{ allowed: boolean, reason: string, updatedPass: Object }}
 */
export function verifyBarrierAccess(parkingPass, scannedPlate, eventTime = new Date()) {
  if (!parkingPass) {
    return { allowed: false, reason: 'PASS_NOT_FOUND', updatedPass: null };
  }

  const targetPlate = parkingPass.licensePlate.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const readPlate = String(scannedPlate).toUpperCase().replace(/[^A-Z0-9-]/g, '');

  if (targetPlate !== readPlate) {
    return {
      allowed: false,
      reason: `PLATE_MISMATCH: Registered for ${targetPlate}, camera read ${readPlate}`,
      updatedPass: parkingPass,
    };
  }

  const nowMs = new Date(eventTime).getTime();
  const validFromMs = new Date(parkingPass.validFrom).getTime();
  const validUntilMs = new Date(parkingPass.validUntil).getTime();

  if (nowMs < validFromMs) {
    const minsEarly = Math.ceil((validFromMs - nowMs) / 60000);
    return {
      allowed: false,
      reason: `EARLY_ARRIVAL: Barrier opens in ${minsEarly} min(s)`,
      updatedPass: parkingPass,
    };
  }

  if (nowMs > validUntilMs) {
    return {
      allowed: false,
      reason: 'PASS_EXPIRED: Vehicle overstay detected beyond post-match buffer',
      updatedPass: parkingPass,
    };
  }

  const updatedPass = {
    ...parkingPass,
    status: PARKING_STATUS.VEHICLE_ON_SITE,
    lastScannedAt: new Date(nowMs).toISOString(),
  };

  return {
    allowed: true,
    reason: `BARRIER_OPENED: Welcome! Proceed to Bay ${parkingPass.allocatedBay}`,
    updatedPass,
  };
}

// ─── Overstay Penalty Calculator ─────────────────────────────────────────────

/**
 * Calculates overstay fees if vehicle leaves after post-match grace window.
 *
 * @param {string|Date} exitTime - Actual barrier exit time
 * @param {string|Date} validUntil - Stored validUntil window
 * @returns {Object} Overstay invoice
 */
export function calculateParkingOverstay(exitTime, validUntil) {
  const exitMs = new Date(exitTime).getTime();
  const windowEndMs = new Date(validUntil).getTime();

  if (exitMs <= windowEndMs) {
    return {
      hasOverstayed: false,
      overstayMinutes: 0,
      penaltyFeeUsd: 0.0,
      message: 'Departed within allowed match buffer.',
    };
  }

  const overstayMs = exitMs - windowEndMs;
  const overstayMinutes = Math.ceil(overstayMs / 60000);
  const overstayHours = Math.ceil(overstayMinutes / 60);

  const penaltyFeeUsd = overstayHours * PARKING_DEFAULTS.OVERSTAY_CHARGE_PER_HOUR_USD;

  return {
    hasOverstayed: true,
    overstayMinutes,
    overstayHours,
    penaltyFeeUsd: Math.round(penaltyFeeUsd * 100) / 100,
    message: `Overstay of ${overstayMinutes}m (${overstayHours}h). Charge: $${penaltyFeeUsd.toFixed(2)} USD.`,
  };
}

// ─── Venue Parking Manifest Aggregate ────────────────────────────────────────

/**
 * Generates an aggregated overview of stadium parking lot occupancy.
 *
 * @param {number} totalLotCapacity - Total venue parking spaces
 * @param {Object} occupancyMap - Map of { VIP_COVERED: count, EV_FAST_CHARGER: count, ... }
 * @returns {Object} Parking capacity manifest
 */
export function calculateParkingManifest(totalLotCapacity = 200, occupancyMap = {}) {
  const capacity = Math.max(20, Number(totalLotCapacity) || 200);
  let totalOccupied = 0;
  let totalRevenue = 0;

  const bayBreakdown = Object.values(PARKING_BAY_TYPES).map((bay) => {
    const bayCap = Math.round((capacity * bay.capacityPct) / 100);
    const occupied = Math.min(bayCap, Number(occupancyMap[bay.typeId]) || 0);
    const available = Math.max(0, bayCap - occupied);
    const occupancyPct = Math.round((occupied / bayCap) * 100);
    const revenue = occupied * bay.baseHourlyUsd * 2.5;

    totalOccupied += occupied;
    totalRevenue += revenue;

    return {
      bayType: bay.typeId,
      name: bay.name,
      allocatedBays: bayCap,
      occupiedBays: occupied,
      availableBays: available,
      occupancyPct,
      projectedRevenueUsd: Math.round(revenue * 100) / 100,
    };
  });

  const overallOccupancyPct = Math.round((totalOccupied / capacity) * 100);

  return {
    totalLotCapacity: capacity,
    totalOccupiedBays: totalOccupied,
    totalAvailableBays: capacity - totalOccupied,
    overallOccupancyPct,
    totalProjectedRevenueUsd: Math.round(totalRevenue * 100) / 100,
    bayBreakdown,
  };
}

export default {
  PARKING_BAY_TYPES,
  PARKING_DEFAULTS,
  PARKING_STATUS,
  calculateParkingPricing,
  generateParkingPass,
  verifyBarrierAccess,
  calculateParkingOverstay,
  calculateParkingManifest,
};
