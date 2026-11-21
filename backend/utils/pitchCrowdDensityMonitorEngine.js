/**
 * pitchCrowdDensityMonitorEngine.js
 *
 * Spectator crowd density monitoring and safety management engine.
 * Handles stand zone capacity tracking, occupancy thresholds, crush-prevention
 * alerting, flow-rate metering, and emergency evacuation route generation in
 * accordance with UEFA/FIFA Stadium Safety Standards and UK Green Guide v6.
 *
 * @module pitchCrowdDensityMonitorEngine
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** UK Green Guide v6 density thresholds (persons per m²) */
export const DENSITY_THRESHOLDS = {
  SAFE: 2.0,       // ≤ 2.0 p/m² – normal safe operation
  MODERATE: 3.0,   // 2.0–3.0 p/m² – monitor closely
  HIGH: 4.0,       // 3.0–4.0 p/m² – active management required
  CRITICAL: 4.7,   // 4.0–4.7 p/m² – prepare for intervention
  // > 4.7 p/m² → CRUSH RISK — immediate action
};

export const ALERT_LEVELS = {
  NORMAL: 'NORMAL',
  MONITOR: 'MONITOR',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  CRUSH_RISK: 'CRUSH_RISK',
};

export const ZONE_TYPES = {
  TERRACE: 'TERRACE',
  SEATED: 'SEATED',
  CONCOURSE: 'CONCOURSE',
  ENTRY_GATE: 'ENTRY_GATE',
  EXIT_ROUTE: 'EXIT_ROUTE',
  EMERGENCY_ASSEMBLY: 'EMERGENCY_ASSEMBLY',
};

export const EVACUATION_PRIORITY = {
  IMMEDIATE: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
};

// Flow rate threshold: persons per minute per metre of exit width
export const MIN_EXIT_FLOW_RATE_PPM = 82;  // Green Guide minimum

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validates a stand zone definition.
 * @param {Object} zone
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateZone(zone) {
  const errors = [];

  if (!zone || typeof zone !== 'object') {
    return { valid: false, errors: ['Zone must be a non-null object.'] };
  }
  if (!zone.zoneId || typeof zone.zoneId !== 'string') {
    errors.push('zoneId must be a non-empty string.');
  }
  if (!zone.name || typeof zone.name !== 'string') {
    errors.push('name must be a non-empty string.');
  }
  if (!Object.values(ZONE_TYPES).includes(zone.type)) {
    errors.push(`type must be one of: ${Object.values(ZONE_TYPES).join(', ')}.`);
  }
  if (typeof zone.capacityPersons !== 'number' || zone.capacityPersons <= 0) {
    errors.push('capacityPersons must be a positive number.');
  }
  if (typeof zone.areaM2 !== 'number' || zone.areaM2 <= 0) {
    errors.push('areaM2 must be a positive number.');
  }
  if (!Array.isArray(zone.exitWidthsM) || zone.exitWidthsM.length === 0) {
    errors.push('exitWidthsM must be a non-empty array of positive numbers.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an occupancy reading.
 * @param {Object} reading
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateOccupancyReading(reading) {
  const errors = [];

  if (!reading || typeof reading !== 'object') {
    return { valid: false, errors: ['Reading must be a non-null object.'] };
  }
  if (!reading.zoneId || typeof reading.zoneId !== 'string') {
    errors.push('zoneId must be a non-empty string.');
  }
  if (!Number.isInteger(reading.occupancy) || reading.occupancy < 0) {
    errors.push('occupancy must be a non-negative integer.');
  }
  if (!reading.recordedAt || isNaN(new Date(reading.recordedAt).getTime())) {
    errors.push('recordedAt must be a valid ISO 8601 datetime string.');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Density and alert calculations
// ---------------------------------------------------------------------------

/**
 * Calculates crowd density (persons per m²) for a zone.
 * @param {number} occupancy - Current number of persons
 * @param {number} areaM2 - Zone floor area in m²
 * @returns {number} Density rounded to 2 decimal places
 */
export function calcDensity(occupancy, areaM2) {
  if (areaM2 <= 0) throw new Error('areaM2 must be greater than zero.');
  return Math.round((occupancy / areaM2) * 100) / 100;
}

/**
 * Determines the alert level based on crowd density.
 * @param {number} densityPPM2 - Persons per m²
 * @returns {string} One of ALERT_LEVELS values
 */
export function getAlertLevel(densityPPM2) {
  if (densityPPM2 > DENSITY_THRESHOLDS.CRITICAL) return ALERT_LEVELS.CRUSH_RISK;
  if (densityPPM2 > DENSITY_THRESHOLDS.HIGH)     return ALERT_LEVELS.CRITICAL;
  if (densityPPM2 > DENSITY_THRESHOLDS.MODERATE) return ALERT_LEVELS.WARNING;
  if (densityPPM2 > DENSITY_THRESHOLDS.SAFE)     return ALERT_LEVELS.MONITOR;
  return ALERT_LEVELS.NORMAL;
}

/**
 * Calculates the occupancy percentage relative to rated capacity.
 * @param {number} occupancy
 * @param {number} capacityPersons
 * @returns {number} Percentage (0–100+)
 */
export function calcOccupancyPct(occupancy, capacityPersons) {
  if (capacityPersons <= 0) throw new Error('capacityPersons must be greater than zero.');
  return Math.round((occupancy / capacityPersons) * 1000) / 10;
}

/**
 * Calculates the theoretical exit flow capacity for a zone.
 * @param {number[]} exitWidthsM - Array of exit widths in metres
 * @returns {{ totalWidthM: number, flowCapacityPPM: number }}
 */
export function calcExitCapacity(exitWidthsM) {
  if (!Array.isArray(exitWidthsM) || exitWidthsM.length === 0) {
    throw new Error('exitWidthsM must be a non-empty array.');
  }
  const totalWidthM = Math.round(exitWidthsM.reduce((s, w) => s + w, 0) * 100) / 100;
  const flowCapacityPPM = Math.round(totalWidthM * MIN_EXIT_FLOW_RATE_PPM);
  return { totalWidthM, flowCapacityPPM };
}

/**
 * Estimates evacuation time in minutes given current occupancy and exit capacity.
 * @param {number} occupancy
 * @param {number} flowCapacityPPM - Persons per minute
 * @returns {number} Estimated evacuation time in minutes
 */
export function estimateEvacuationTimeMin(occupancy, flowCapacityPPM) {
  if (flowCapacityPPM <= 0) throw new Error('flowCapacityPPM must be greater than zero.');
  return Math.ceil(occupancy / flowCapacityPPM);
}

// ---------------------------------------------------------------------------
// Zone snapshot
// ---------------------------------------------------------------------------

/**
 * Produces a full density snapshot for a zone given its current occupancy.
 * @param {Object} zone - Zone definition (validated)
 * @param {number} occupancy - Current number of persons in zone
 * @returns {Object} Zone snapshot with all safety metrics
 */
export function buildZoneSnapshot(zone, occupancy) {
  const validation = validateZone(zone);
  if (!validation.valid) {
    throw new Error(`Invalid zone: ${validation.errors.join('; ')}`);
  }
  if (!Number.isInteger(occupancy) || occupancy < 0) {
    throw new Error('occupancy must be a non-negative integer.');
  }

  const density = calcDensity(occupancy, zone.areaM2);
  const alertLevel = getAlertLevel(density);
  const occupancyPct = calcOccupancyPct(occupancy, zone.capacityPersons);
  const exitCap = calcExitCapacity(zone.exitWidthsM);
  const evacTimeMin = estimateEvacuationTimeMin(occupancy, exitCap.flowCapacityPPM);
  const headroom = Math.max(0, zone.capacityPersons - occupancy);

  return {
    zoneId: zone.zoneId,
    zoneName: zone.name,
    zoneType: zone.type,
    occupancy,
    capacityPersons: zone.capacityPersons,
    headroom,
    occupancyPct,
    areaM2: zone.areaM2,
    densityPPM2: density,
    alertLevel,
    exitCapacity: exitCap,
    evacTimeMin,
    overCapacity: occupancy > zone.capacityPersons,
    snapshotAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Venue-wide monitoring
// ---------------------------------------------------------------------------

/**
 * Builds a venue-wide crowd density report from multiple zone snapshots.
 * @param {Object[]} snapshots - Array of zone snapshot objects
 * @param {string} venueId
 * @returns {Object} Venue-wide report
 */
export function buildVenueReport(snapshots, venueId) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    throw new Error('snapshots must be a non-empty array.');
  }

  const totalOccupancy = snapshots.reduce((s, z) => s + z.occupancy, 0);
  const totalCapacity = snapshots.reduce((s, z) => s + z.capacityPersons, 0);
  const overallOccupancyPct = calcOccupancyPct(totalOccupancy, totalCapacity);

  const alertCounts = {
    [ALERT_LEVELS.NORMAL]: 0,
    [ALERT_LEVELS.MONITOR]: 0,
    [ALERT_LEVELS.WARNING]: 0,
    [ALERT_LEVELS.CRITICAL]: 0,
    [ALERT_LEVELS.CRUSH_RISK]: 0,
  };
  for (const snap of snapshots) {
    alertCounts[snap.alertLevel] = (alertCounts[snap.alertLevel] ?? 0) + 1;
  }

  const worstZone = snapshots.reduce((prev, curr) =>
    curr.densityPPM2 > prev.densityPPM2 ? curr : prev,
  );

  const overCapacityZones = snapshots.filter((s) => s.overCapacity).map((s) => s.zoneId);
  const criticalZones = snapshots
    .filter((s) => s.alertLevel === ALERT_LEVELS.CRITICAL || s.alertLevel === ALERT_LEVELS.CRUSH_RISK)
    .map((s) => ({ zoneId: s.zoneId, zoneName: s.zoneName, alertLevel: s.alertLevel, densityPPM2: s.densityPPM2 }));

  // Highest venue-level alert
  let venueAlertLevel = ALERT_LEVELS.NORMAL;
  const levelOrder = [ALERT_LEVELS.NORMAL, ALERT_LEVELS.MONITOR, ALERT_LEVELS.WARNING, ALERT_LEVELS.CRITICAL, ALERT_LEVELS.CRUSH_RISK];
  for (const snap of snapshots) {
    if (levelOrder.indexOf(snap.alertLevel) > levelOrder.indexOf(venueAlertLevel)) {
      venueAlertLevel = snap.alertLevel;
    }
  }

  return {
    reportId: `CDR-${Date.now()}`,
    venueId: venueId || null,
    generatedAt: new Date().toISOString(),
    totalOccupancy,
    totalCapacity,
    overallOccupancyPct,
    venueAlertLevel,
    alertCounts,
    worstZone: {
      zoneId: worstZone.zoneId,
      zoneName: worstZone.zoneName,
      densityPPM2: worstZone.densityPPM2,
      alertLevel: worstZone.alertLevel,
    },
    overCapacityZones,
    criticalZones,
    zoneCount: snapshots.length,
  };
}

// ---------------------------------------------------------------------------
// Evacuation routing
// ---------------------------------------------------------------------------

/**
 * Generates an ordered evacuation plan from zone snapshots.
 * Prioritises zones with highest density / crush risk first.
 * @param {Object[]} snapshots - Array of zone snapshots
 * @param {Object} [exitRoutes={}] - Map of zoneId → array of exit route descriptions
 * @returns {Object[]} Ordered evacuation actions
 */
export function generateEvacuationPlan(snapshots, exitRoutes = {}) {
  if (!Array.isArray(snapshots)) {
    throw new Error('snapshots must be an array.');
  }

  const alertOrder = {
    [ALERT_LEVELS.CRUSH_RISK]: EVACUATION_PRIORITY.IMMEDIATE,
    [ALERT_LEVELS.CRITICAL]: EVACUATION_PRIORITY.HIGH,
    [ALERT_LEVELS.WARNING]: EVACUATION_PRIORITY.MEDIUM,
    [ALERT_LEVELS.MONITOR]: EVACUATION_PRIORITY.LOW,
    [ALERT_LEVELS.NORMAL]: EVACUATION_PRIORITY.LOW,
  };

  return snapshots
    .map((snap) => ({
      zoneId: snap.zoneId,
      zoneName: snap.zoneName,
      priority: alertOrder[snap.alertLevel] ?? EVACUATION_PRIORITY.LOW,
      alertLevel: snap.alertLevel,
      occupancy: snap.occupancy,
      densityPPM2: snap.densityPPM2,
      estimatedEvacTimeMin: snap.evacTimeMin,
      exitRoutes: exitRoutes[snap.zoneId] ?? ['Follow emergency signage to nearest exit'],
      action: (() => {
        if (snap.alertLevel === ALERT_LEVELS.CRUSH_RISK) {
          return 'IMMEDIATE EVACUATION — activate PA system and deploy stewards';
        }
        if (snap.alertLevel === ALERT_LEVELS.CRITICAL) {
          return 'Begin controlled zone clearance — redirect ingress';
        }
        if (snap.alertLevel === ALERT_LEVELS.WARNING) {
          return 'Hold ingress — open additional exit lanes';
        }
        return 'Monitor — no immediate action required';
      })(),
    }))
    .sort((a, b) => a.priority - b.priority || b.densityPPM2 - a.densityPPM2);
}

// ---------------------------------------------------------------------------
// Occupancy history trend
// ---------------------------------------------------------------------------

/**
 * Calculates the occupancy trend (rate of change) from a time-series of readings.
 * @param {Object[]} readings - Array of { occupancy, recordedAt } sorted oldest first
 * @returns {{ ratePerMin: number, trend: 'RISING' | 'STABLE' | 'FALLING' }}
 */
export function calcOccupancyTrend(readings) {
  if (!Array.isArray(readings) || readings.length < 2) {
    return { ratePerMin: 0, trend: 'STABLE' };
  }

  const first = readings[0];
  const last = readings[readings.length - 1];
  const deltaOccupancy = last.occupancy - first.occupancy;
  const deltaMs = new Date(last.recordedAt) - new Date(first.recordedAt);
  const deltaMin = deltaMs / (1000 * 60);

  if (deltaMin <= 0) return { ratePerMin: 0, trend: 'STABLE' };

  const ratePerMin = Math.round((deltaOccupancy / deltaMin) * 10) / 10;

  let trend;
  if (ratePerMin > 5) {
    trend = 'RISING';
  } else if (ratePerMin < -5) {
    trend = 'FALLING';
  } else {
    trend = 'STABLE';
  }

  return { ratePerMin, trend };
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  DENSITY_THRESHOLDS,
  ALERT_LEVELS,
  ZONE_TYPES,
  EVACUATION_PRIORITY,
  MIN_EXIT_FLOW_RATE_PPM,
  validateZone,
  validateOccupancyReading,
  calcDensity,
  getAlertLevel,
  calcOccupancyPct,
  calcExitCapacity,
  estimateEvacuationTimeMin,
  buildZoneSnapshot,
  buildVenueReport,
  generateEvacuationPlan,
  calcOccupancyTrend,
};
