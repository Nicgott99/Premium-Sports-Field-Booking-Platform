/**
 * Stadium Turnstile Ingress Flow & Congestion Dispatcher Engine
 * 
 * Manages pitchside spectator ingress flow rates, turnstile throughput throttling,
 * automated overflow queue redistribution, and digital capacity occupancy safety checks.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const TURNSTILE_GATES = [
  { id: 'GATE_NORTH_A', label: 'North Stand Turnstiles 1-6', capacityPerMin: 120, currentQueue: 45, isFastTrack: false },
  { id: 'GATE_NORTH_B', label: 'North Stand Turnstiles 7-12', capacityPerMin: 120, currentQueue: 30, isFastTrack: false },
  { id: 'GATE_SOUTH_AWAY', label: 'South Stand Visiting Squad Entry', capacityPerMin: 90, currentQueue: 65, isFastTrack: false },
  { id: 'GATE_EAST_VIP', label: 'East Concourse Hospitality & Media', capacityPerMin: 50, currentQueue: 10, isFastTrack: true },
  { id: 'GATE_WEST_FAMILY', label: 'West Stand Accessible & Family Lane', capacityPerMin: 80, currentQueue: 25, isFastTrack: true },
];

export const CONGESTION_TIERS = {
  CLEAR_FLOW: {
    id: 'CLEAR_FLOW',
    label: 'Fluid Ingress Flow',
    maxWaitMinutes: 3,
    colorCode: '#10B981',
    redistributionRequired: false,
  },
  MODERATE_SURGE: {
    id: 'MODERATE_SURGE',
    label: 'Pre-Match Surge (30m to Kickoff)',
    maxWaitMinutes: 8,
    colorCode: '#F59E0B',
    redistributionRequired: false,
  },
  CRITICAL_CONGESTION: {
    id: 'CRITICAL_CONGESTION',
    label: 'Critical Bottleneck (>15m Wait)',
    maxWaitMinutes: 15,
    colorCode: '#EF4444',
    redistributionRequired: true,
  },
};

/**
 * Validates turnstile telemetry inputs.
 * 
 * @param {Object} data
 * @returns {Object} Validation outcome
 */
export function validateTurnstileTelemetry(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Missing turnstile telemetry payload.');
  }

  const errors = [];
  if (!data.venueId || typeof data.venueId !== 'string') {
    errors.push('venueId is required.');
  }
  if (typeof data.totalSpectatorsInside !== 'number' || data.totalSpectatorsInside < 0) {
    errors.push('totalSpectatorsInside must be a non-negative number.');
  }
  if (typeof data.venueCapacity !== 'number' || data.venueCapacity <= 0) {
    errors.push('venueCapacity must be a positive number.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates queue wait times across all gates and identifies bottlenecked turnstiles.
 * 
 * @param {Array<{ id: string, currentQueue: number, capacityPerMin: number }>} [customGateData]
 * @returns {Object} Ingress congestion diagnostics
 */
export function evaluateGateCongestion(customGateData) {
  const gates = customGateData && Array.isArray(customGateData) && customGateData.length > 0
    ? customGateData
    : TURNSTILE_GATES;

  let totalQueue = 0;
  let maxWaitTime = 0;
  let bottleneckGate = null;

  const analyzedGates = gates.map((gate) => {
    const queue = gate.currentQueue || 0;
    const rate = gate.capacityPerMin || 60;
    const estimatedWaitMinutes = Math.round((queue / rate) * 10) / 10;
    totalQueue += queue;

    if (estimatedWaitMinutes > maxWaitTime) {
      maxWaitTime = estimatedWaitMinutes;
      bottleneckGate = gate.label || gate.id;
    }

    let status = 'CLEAR_FLOW';
    if (estimatedWaitMinutes >= 12) {
      status = 'CRITICAL_CONGESTION';
    } else if (estimatedWaitMinutes >= 5) {
      status = 'MODERATE_SURGE';
    }

    return {
      gateId: gate.id,
      label: gate.label || gate.id,
      currentQueue: queue,
      capacityPerMin: rate,
      estimatedWaitMinutes,
      status,
      isFastTrack: Boolean(gate.isFastTrack),
    };
  });

  let overallTier = 'CLEAR_FLOW';
  if (maxWaitTime >= 12) {
    overallTier = 'CRITICAL_CONGESTION';
  } else if (maxWaitTime >= 5) {
    overallTier = 'MODERATE_SURGE';
  }

  return {
    assessmentTimestamp: new Date().toISOString(),
    totalQueueCount: totalQueue,
    maxWaitMinutes: maxWaitTime,
    bottleneckGate,
    congestionTier: overallTier,
    tierDetails: CONGESTION_TIERS[overallTier],
    gates: analyzedGates,
    redistributionAdvisory: overallTier === 'CRITICAL_CONGESTION'
      ? `High delay at ${bottleneckGate}. Divert general admission to adjacent North B gates.`
      : 'Turnstile ingress pacing is optimal.',
  };
}

/**
 * Calculates automated turnstile redistribution routing.
 * 
 * @param {string} overloadedGateId - Gate experiencing bottleneck
 * @param {number} excessSpectators - Number of queueing fans to divert
 * @returns {Object} Queue diversion recommendation
 */
export function generateQueueRedistributionPlan(overloadedGateId, excessSpectators) {
  if (!overloadedGateId || typeof excessSpectators !== 'number' || excessSpectators <= 0) {
    throw new Error('Valid overloadedGateId and positive excessSpectators count required.');
  }

  // Find lowest load non-VIP gate
  const availableGates = TURNSTILE_GATES.filter((g) => g.id !== overloadedGateId && !g.isFastTrack);
  const targetGate = availableGates.reduce((min, curr) => (curr.currentQueue < min.currentQueue ? curr : min), availableGates[0]);

  const divertedWaitReductionMins = Math.round((excessSpectators / 90) * 10) / 10;

  return {
    planId: `RTE-${Date.now().toString(36).toUpperCase()}`,
    sourceGateId: overloadedGateId,
    targetGateId: targetGate.id,
    targetGateName: targetGate.label,
    divertedCount: excessSpectators,
    estimatedWaitReductionMinutes: divertedWaitReductionMins,
    digitalSignageDirective: `Please proceed to ${targetGate.label} for accelerated turnstile entry.`,
  };
}

export default {
  TURNSTILE_GATES,
  CONGESTION_TIERS,
  validateTurnstileTelemetry,
  evaluateGateCongestion,
  generateQueueRedistributionPlan,
};
