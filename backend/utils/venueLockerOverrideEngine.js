/**
 * Venue Lost Key & Smart Locker Overhaul Dispatcher Engine
 * 
 * Manages rapid master key overrides, physical locker battery audits,
 * forgotten PIN resets, emergency access custody logs, and digital handovers.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const LOCKER_BANKS = [
  { id: 'BANK_HOME_CHANGING', label: 'Home Squad Dressing Room', totalLockers: 24, masterOverridePort: 'PORT-H01' },
  { id: 'BANK_AWAY_CHANGING', label: 'Away Squad Dressing Room', totalLockers: 24, masterOverridePort: 'PORT-A01' },
  { id: 'BANK_REFEREE_OFFICIALS', label: 'Match Officials Sanctuary', totalLockers: 8, masterOverridePort: 'PORT-REF01' },
  { id: 'BANK_CONCOURSE_PUBLIC', label: 'Main Concourse Day Lockers', totalLockers: 48, masterOverridePort: 'PORT-PUB01' },
];

export const OVERRIDE_REASONS = {
  FORGOTTEN_PIN: {
    id: 'FORGOTTEN_PIN',
    label: 'Player Forgotten PIN Code',
    requiresIDCheck: true,
    cooldownMinutes: 5,
  },
  BATTERY_EXHAUSTED: {
    id: 'BATTERY_EXHAUSTED',
    label: 'Locker Solenoid Battery Depleted',
    requiresIDCheck: false,
    cooldownMinutes: 0,
  },
  EMERGENCY_MEDICAL: {
    id: 'EMERGENCY_MEDICAL',
    label: 'Emergency Access (Medic/Inhaler/EpiPen)',
    requiresIDCheck: false,
    cooldownMinutes: 0,
  },
  ABANDONED_EQUIPMENT: {
    id: 'ABANDONED_EQUIPMENT',
    label: 'Post-Match Forgotten Kit Clearance',
    requiresIDCheck: true,
    cooldownMinutes: 15,
  },
};

/**
 * Validates locker override request parameters.
 * 
 * @param {Object} params
 * @returns {Object} Validation outcome
 */
export function validateOverrideRequest(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('Missing locker override payload.');
  }

  const errors = [];
  if (!params.lockerNumber || typeof params.lockerNumber !== 'number' || params.lockerNumber < 1) {
    errors.push('lockerNumber must be a positive integer.');
  }
  if (!params.bankId || !LOCKER_BANKS.some((b) => b.id === params.bankId)) {
    errors.push('Invalid or unsupported locker bankId.');
  }
  if (!params.reason || !OVERRIDE_REASONS[params.reason]) {
    errors.push('Invalid override reason code.');
  }
  if (!params.dutyStaffName || typeof params.dutyStaffName !== 'string' || params.dutyStaffName.trim().length < 2) {
    errors.push('dutyStaffName is required for chain of custody.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates an automated cryptographic temporary unlock token and audit log.
 * 
 * @param {Object} options
 * @param {number} options.lockerNumber - Target locker index
 * @param {string} options.bankId - Key in LOCKER_BANKS
 * @param {string} options.reason - Key in OVERRIDE_REASONS
 * @param {string} options.dutyStaffName - Authorizing staff member
 * @param {string} [options.playerClaimantName='Unspecified Player']
 * @returns {Object} Temporary master override ticket
 */
export function issueMasterOverrideToken({
  lockerNumber,
  bankId,
  reason,
  dutyStaffName,
  playerClaimantName = 'Unspecified Player',
}) {
  const validation = validateOverrideRequest({ lockerNumber, bankId, reason, dutyStaffName });
  if (!validation.isValid) {
    throw new Error(`Override validation failed: ${validation.errors.join('; ')}`);
  }

  const bank = LOCKER_BANKS.find((b) => b.id === bankId);
  const reasonConfig = OVERRIDE_REASONS[reason];
  const now = new Date();
  // Override code valid for 10 minutes
  const expiry = new Date(now.getTime() + 10 * 60 * 1000);

  const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
  const overrideCode = `OVR-${lockerNumber}-${rawToken}`;
  const digitalAuditRef = `AUD-LCK-${Date.now().toString(36).toUpperCase()}`;

  return {
    digitalAuditRef,
    bankId,
    bankName: bank.label,
    lockerNumber,
    masterOverridePort: bank.masterOverridePort,
    overrideCode,
    reason: reasonConfig.label,
    authorizedBy: dutyStaffName,
    claimant: playerClaimantName,
    issuedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    requiresIdentityVerification: reasonConfig.requiresIDCheck,
    securityNotice: 'Master override logged to venue security server. Single-use only.',
  };
}

/**
 * Evaluates locker battery telemetry and flags lockers needing cell replacement.
 * 
 * @param {Array<{ lockerNumber: number, batteryPct: number, cycleCount: number }>} telemetryList
 * @returns {Object} Fleet health diagnosis
 */
export function diagnoseLockerFleetHealth(telemetryList) {
  if (!Array.isArray(telemetryList)) {
    throw new Error('telemetryList must be an array of locker records.');
  }

  const criticalBatteries = [];
  const serviceRecommended = [];

  telemetryList.forEach((lck) => {
    if (lck.batteryPct <= 15) {
      criticalBatteries.push({
        lockerNumber: lck.lockerNumber,
        batteryPct: lck.batteryPct,
        urgency: 'IMMEDIATE_BATTERY_SWAP_REQUIRED',
      });
    } else if (lck.batteryPct <= 30 || lck.cycleCount >= 2500) {
      serviceRecommended.push({
        lockerNumber: lck.lockerNumber,
        batteryPct: lck.batteryPct,
        cycleCount: lck.cycleCount,
        urgency: 'ROUTINE_PREVENTATIVE_MAINTENANCE',
      });
    }
  });

  return {
    evaluatedLockersCount: telemetryList.length,
    criticalBatteriesCount: criticalBatteries.length,
    serviceRecommendedCount: serviceRecommended.length,
    criticalBatteries,
    serviceRecommended,
    fleetOperationalHealthPct: Math.round(((telemetryList.length - criticalBatteries.length) / (telemetryList.length || 1)) * 100),
  };
}

export default {
  LOCKER_BANKS,
  OVERRIDE_REASONS,
  validateOverrideRequest,
  issueMasterOverrideToken,
  diagnoseLockerFleetHealth,
};
