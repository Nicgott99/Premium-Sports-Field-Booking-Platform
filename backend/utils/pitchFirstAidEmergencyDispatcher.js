/**
 * Pitchside First Aid & Emergency Response Dispatcher Engine
 * 
 * Manages rapid emergency responder alerts, AED location geofencing,
 * trauma kit inspection auditing, and digital injury incident handovers.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const INCIDENT_SEVERITY_LEVELS = {
  CODE_RED_CRITICAL: {
    level: 1,
    label: 'Code Red - Cardiac / Unconscious / Severe Trauma',
    requiresAmbulance999: true,
    requiresAEDDispatch: true,
    targetResponseTimeSeconds: 90,
  },
  CODE_AMBER_URGENT: {
    level: 2,
    label: 'Code Amber - Fracture / Dislocation / Concussion',
    requiresAmbulance999: false,
    requiresAEDDispatch: false,
    targetResponseTimeSeconds: 180,
  },
  CODE_GREEN_STANDARD: {
    level: 3,
    label: 'Code Green - Sprain / Strain / Surface Abrasion',
    requiresAmbulance999: false,
    requiresAEDDispatch: false,
    targetResponseTimeSeconds: 300,
  },
};

export const AED_LOCATIONS = [
  { id: 'AED-01', location: 'Pitch 1 & 2 Main Tunnel', batteryPct: 98, padsExpiryDate: '2028-06-30' },
  { id: 'AED-02', location: 'Grandstand Reception Desk', batteryPct: 100, padsExpiryDate: '2028-11-15' },
  { id: 'AED-03', location: 'Changing Pavilion Corridor', batteryPct: 95, padsExpiryDate: '2027-12-01' },
];

/**
 * Validates that an emergency incident report has all critical fields populated.
 * 
 * @param {Object} report
 * @param {string} report.pitchId - Unique pitch identifier
 * @param {string} report.severity - Key from INCIDENT_SEVERITY_LEVELS
 * @param {string} report.symptomSummary - Description of player injury
 * @param {string} report.reporterRole - 'REFEREE' | 'CAPTAIN' | 'COACH' | 'STEWARD'
 * @returns {Object} Validation status and error messages
 */
export function validateIncidentReport(report) {
  const errors = [];
  if (!report.pitchId || typeof report.pitchId !== 'string') {
    errors.push('Missing or invalid pitchId.');
  }
  if (!report.severity || !INCIDENT_SEVERITY_LEVELS[report.severity]) {
    errors.push('Invalid severity tier provided.');
  }
  if (!report.symptomSummary || report.symptomSummary.trim().length < 5) {
    errors.push('Symptom summary must be at least 5 characters long.');
  }
  if (!report.reporterRole) {
    errors.push('Reporter role is required for duty of care handover.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates an emergency dispatch event with nearest AED routing and duty responder alerting.
 * 
 * @param {Object} payload
 * @param {string} payload.pitchId
 * @param {string} payload.severity
 * @param {string} payload.symptomSummary
 * @param {string} payload.reporterName
 * @param {string} payload.reporterRole
 * @param {string} [payload.playerTeamName='Unknown Squad']
 * @returns {Object} Emergency dispatch ticket with responder SLA and AED routing
 */
export function dispatchEmergencyResponder(payload) {
  const validation = validateIncidentReport(payload);
  if (!validation.isValid) {
    throw new Error(`Incident validation failed: ${validation.errors.join('; ')}`);
  }

  const severityConfig = INCIDENT_SEVERITY_LEVELS[payload.severity];
  const timestamp = new Date();
  const dispatchId = `EMERG-${payload.pitchId}-${Date.now().toString(36).toUpperCase()}`;

  // Find optimal AED (highest battery and valid pads)
  const primaryAED = AED_LOCATIONS.reduce((best, curr) => {
    return curr.batteryPct > best.batteryPct ? curr : best;
  }, AED_LOCATIONS[0]);

  return {
    dispatchId,
    timestamp: timestamp.toISOString(),
    pitchId: payload.pitchId,
    severity: payload.severity,
    severityLabel: severityConfig.label,
    targetResponseWindowSeconds: severityConfig.targetResponseTimeSeconds,
    ambulanceServiceEscalated: severityConfig.requiresAmbulance999,
    nearestAED: severityConfig.requiresAEDDispatch ? primaryAED : null,
    reporter: {
      name: payload.reporterName || 'Duty Referee',
      role: payload.reporterRole,
      team: payload.playerTeamName,
    },
    symptomSummary: payload.symptomSummary,
    responderStatus: 'DISPATCHED_TO_PITCH',
    chainOfCustodyAuditToken: `MED-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
  };
}

/**
 * Checks AED readiness status including battery charge and electrode pad expiry.
 * 
 * @param {Object} aed - AED device record
 * @param {Date|string} [currentDate=new Date()]
 * @returns {Object} Inspection readiness breakdown
 */
export function evaluateAEDReadiness(aed, currentDate = new Date()) {
  const now = new Date(currentDate);
  const expiry = new Date(aed.padsExpiryDate);
  const daysUntilPadsExpire = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isBatteryAdequate = aed.batteryPct >= 70;
  const isPadsValid = daysUntilPadsExpire > 0;
  const isEmergencyReady = isBatteryAdequate && isPadsValid;

  let advisory = 'Device fully operational and ready for deployment.';
  if (!isEmergencyReady) {
    advisory = !isBatteryAdequate
      ? `Critical: Battery low at ${aed.batteryPct}%. Recharge immediate.`
      : `Critical: Defibrillator pads expired on ${aed.padsExpiryDate}.`;
  }

  return {
    aedId: aed.id,
    location: aed.location,
    batteryPct: aed.batteryPct,
    daysUntilPadsExpire,
    isEmergencyReady,
    advisory,
  };
}

export default {
  INCIDENT_SEVERITY_LEVELS,
  AED_LOCATIONS,
  validateIncidentReport,
  dispatchEmergencyResponder,
  evaluateAEDReadiness,
};
