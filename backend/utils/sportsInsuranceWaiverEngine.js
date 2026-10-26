/**
 * sportsInsuranceWaiverEngine.js — Sports Liability Waiver & Micro-Insurance Engine
 * Premium Sports Field Booking Platform
 *
 * Implements digital liability waivers, risk stratification, minor guardian consent,
 * medical clearance disclosures, and fixture micro-insurance policies:
 *  - Risk profiling by sport category (High, Medium, Low Impact)
 *  - Age & legal guardian co-signature requirement (< 18 years old)
 *  - Micro-insurance policy underwriting (Accident, Dental, Ambulance, Theft)
 *  - Medical declaration evaluation & clearance flags
 *  - Tamper-evident cryptographic signature verification digest (SHA-256)
 *  - Annual and per-fixture waiver compliance verification
 *
 * Pure ES Module with zero external dependencies (uses Node built-in crypto).
 */

import crypto from 'crypto';

// ─── Enums & Constants ───────────────────────────────────────────────────────

export const SPORT_RISK_TIERS = {
  HIGH_RISK: {
    tierId: 'HIGH_RISK',
    title: 'High-Impact / Collision Sport',
    sports: ['RUGBY', 'AMERICAN_FOOTBALL', 'COMBAT', 'LACROSSE'],
    basePremiumUsd: 6.5,
    requiresConcussionProtocol: true,
    requiresEmergencyContact: true,
    recommendedCoverageCap: 25000,
  },
  MEDIUM_RISK: {
    tierId: 'MEDIUM_RISK',
    title: 'Medium-Impact / Contact Sport',
    sports: ['FOOTBALL', 'SOCCER', 'FUTSAL', 'BASKETBALL', 'HOCKEY', 'VOLLEYBALL'],
    basePremiumUsd: 3.5,
    requiresConcussionProtocol: true,
    requiresEmergencyContact: true,
    recommendedCoverageCap: 10000,
  },
  LOW_RISK: {
    tierId: 'LOW_RISK',
    title: 'Low-Impact / Non-Contact Sport',
    sports: ['TENNIS', 'PADEL', 'BADMINTON', 'PICKLEBALL', 'TABLE_TENNIS', 'SQUASH', 'CRICKET'],
    basePremiumUsd: 1.75,
    requiresConcussionProtocol: false,
    requiresEmergencyContact: true,
    recommendedCoverageCap: 5000,
  },
};

export const INSURANCE_PLANS = {
  WAIVER_ONLY: {
    planId: 'WAIVER_ONLY',
    name: 'Standard Liability Release (No Extra Insurance)',
    premiumUsd: 0.0,
    medicalBenefitMaxUsd: 0,
    ambulanceBenefitUsd: 0,
    dentalBenefitUsd: 0,
    equipmentProtectionUsd: 0,
    features: ['Venue property liability release', 'Emergency first-aid consent'],
  },
  BASIC_INJURY_GUARD: {
    planId: 'BASIC_INJURY_GUARD',
    name: 'MatchDay Basic Injury Guard',
    premiumUsd: 2.5,
    medicalBenefitMaxUsd: 5000,
    ambulanceBenefitUsd: 500,
    dentalBenefitUsd: 750,
    equipmentProtectionUsd: 0,
    features: [
      'Accidental bodily injury coverage up to $5,000',
      'Emergency ambulance transit stipend ($500)',
      'Emergency dental trauma coverage ($750)',
      'Direct venue incident claim routing',
    ],
  },
  PREMIUM_TOTAL_SHIELD: {
    planId: 'PREMIUM_TOTAL_SHIELD',
    name: 'Total Player Shield & Gear Protection',
    premiumUsd: 4.95,
    medicalBenefitMaxUsd: 15000,
    ambulanceBenefitUsd: 1500,
    dentalBenefitUsd: 2000,
    equipmentProtectionUsd: 500,
    features: [
      'Accidental bodily injury coverage up to $15,000',
      'Full emergency ambulance & paramedic transport ($1,500)',
      'Dental trauma & facial injury repair ($2,000)',
      'Sports equipment theft / pitch accidental damage ($500)',
      'Zero deductible on first claim',
    ],
  },
};

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Resolves the risk tier object for a given sport name.
 *
 * @param {string} sport - Sport identifier (e.g. 'FOOTBALL', 'TENNIS')
 * @returns {Object} Risk tier definition
 */
export function getSportRiskTier(sport) {
  const normalized = (sport || 'FOOTBALL').toUpperCase().replace(/\s+/g, '_');
  for (const tier of Object.values(SPORT_RISK_TIERS)) {
    if (tier.sports.includes(normalized)) {
      return tier;
    }
  }
  return SPORT_RISK_TIERS.MEDIUM_RISK;
}

// ─── Risk & Eligibility Evaluator ───────────────────────────────────────────

/**
 * Calculates the comprehensive waiver risk profile for a participant.
 *
 * @param {Object} params
 * @param {string} params.sport - Sport identifier
 * @param {number} params.playerAge - Player age in years
 * @param {string} [params.participantType='PLAYER'] - 'PLAYER' | 'REFEREE' | 'COACH' | 'SPECTATOR'
 * @returns {Object} Risk assessment & signing requirements
 */
export function calculateWaiverRiskProfile({
  sport = 'FOOTBALL',
  playerAge = 25,
  participantType = 'PLAYER',
}) {
  const age = Number(playerAge) || 18;
  const isMinor = age < 18;
  const riskTier = getSportRiskTier(sport);

  const clausesRequired = [
    'GENERAL_ASSUMPTION_OF_RISK',
    'RELEASE_OF_VENUE_LIABILITY',
    'EMERGENCY_MEDICAL_TREATMENT_AUTHORIZATION',
    'COVID_INFECTIOUS_DISEASE_DISCLAIMER',
  ];

  if (riskTier.requiresConcussionProtocol) {
    clausesRequired.push('CONCUSSION_AWARENESS_AND_RETURN_TO_PLAY');
  }

  if (isMinor) {
    clausesRequired.push('PARENT_OR_LEGAL_GUARDIAN_INDEMNIFICATION');
  }

  return {
    sport: sport.toUpperCase(),
    participantType,
    playerAge: age,
    isMinor,
    requiresGuardianCoSignature: isMinor,
    riskTier: riskTier.tierId,
    riskTitle: riskTier.title,
    concussionProtocolMandatory: riskTier.requiresConcussionProtocol,
    emergencyContactMandatory: riskTier.requiresEmergencyContact,
    clausesRequired,
    recommendedInsuranceCoverageUsd: riskTier.recommendedCoverageCap,
  };
}

// ─── Insurance Policy & Pricing Calculator ──────────────────────────────────

/**
 * Underwrites and calculates the micro-insurance pricing for a match booking.
 *
 * @param {Object} params
 * @param {string} params.planId - Selected insurance plan identifier
 * @param {string} params.sport - Sport category
 * @param {number} [params.durationHours=1.5] - Booking fixture length in hours
 * @param {number} [params.numParticipants=1] - Number of players to insure
 * @returns {Object} Insurance premium quotation and coverage details
 */
export function calculateInsuranceCoverage({
  planId = 'BASIC_INJURY_GUARD',
  sport = 'FOOTBALL',
  durationHours = 1.5,
  numParticipants = 1,
}) {
  const plan = INSURANCE_PLANS[planId] || INSURANCE_PLANS.WAIVER_ONLY;
  const riskTier = getSportRiskTier(sport);
  const participants = Math.max(1, Math.min(50, Number(numParticipants) || 1));
  const hours = Math.max(0.5, Math.min(12, Number(durationHours) || 1.5));

  // High risk sport adjustment (+25%), Low risk discount (-15%)
  let riskMultiplier = 1.0;
  if (riskTier.tierId === 'HIGH_RISK') riskMultiplier = 1.25;
  if (riskTier.tierId === 'LOW_RISK') riskMultiplier = 0.85;

  // Extended duration adjustment (> 2 hours adds 15% per additional hour)
  const durationMultiplier = hours > 2 ? 1 + (hours - 2) * 0.15 : 1.0;

  const rawUnitPremium = plan.premiumUsd * riskMultiplier * durationMultiplier;
  const unitPremium = Math.round(rawUnitPremium * 100) / 100;
  const totalPremium = Math.round(unitPremium * participants * 100) / 100;

  // Platform brokerage & underwriting administration (12%)
  const platformUnderwritingFee = Math.round(totalPremium * 0.12 * 100) / 100;

  return {
    planId: plan.planId,
    planName: plan.name,
    sportRiskTier: riskTier.tierId,
    participantsInsured: participants,
    durationHours: hours,
    unitPremiumUsd: unitPremium,
    totalPremiumUsd: totalPremium,
    platformUnderwritingFeeUsd: platformUnderwritingFee,
    benefits: {
      medicalAccidentCapUsd: plan.medicalBenefitMaxUsd,
      ambulanceStipendUsd: plan.ambulanceBenefitUsd,
      dentalTraumaCapUsd: plan.dentalBenefitUsd,
      equipmentProtectionCapUsd: plan.equipmentProtectionUsd,
    },
    features: plan.features,
    currency: 'USD',
  };
}

// ─── Medical Declaration Evaluator ──────────────────────────────────────────

/**
 * Evaluates self-declared medical conditions and flags potential risks.
 *
 * @param {Object} medicalData
 * @param {boolean} [medicalData.hasHeartCondition] - Diagnosed cardiovascular condition
 * @param {boolean} [medicalData.hasConcussionPast6Mo] - Concussion in last 6 months
 * @param {boolean} [medicalData.hasAsthma] - Respiratory / asthma diagnosis
 * @param {boolean} [medicalData.hasAllergies] - Severe allergies requiring EpiPen
 * @param {string} [medicalData.medications] - Active medications
 * @param {Object} [medicalData.emergencyContact] - Name, phone, relationship
 * @returns {Object} Health clearance status and advisory flags
 */
export function evaluateMedicalDeclarations(medicalData = {}) {
  const flags = [];
  const restrictions = [];
  let clearanceStatus = 'CLEARED';

  if (medicalData.hasHeartCondition) {
    flags.push('CRITICAL: Player reported diagnosed heart/cardiovascular condition');
    restrictions.push('Requires physician medical clearance letter prior to intense match play');
    clearanceStatus = 'REQUIRES_PHYSICIAN_CLEARANCE';
  }

  if (medicalData.hasConcussionPast6Mo) {
    flags.push('WARNING: Recent head trauma / concussion within last 6 months');
    restrictions.push('Must adhere to Return-to-Play protocol; non-contact recommended');
    if (clearanceStatus !== 'REQUIRES_PHYSICIAN_CLEARANCE') {
      clearanceStatus = 'CONDITIONAL_APPROVAL';
    }
  }

  if (medicalData.hasAsthma) {
    flags.push('NOTICE: Asthma declared; player must keep prescribed inhaler pitchside');
  }

  if (medicalData.hasAllergies) {
    flags.push('NOTICE: Severe allergy declared; venue staff notified for first-aid readiness');
  }

  // Validate Emergency Contact
  const ec = medicalData.emergencyContact;
  const hasValidEmergencyContact = Boolean(ec && ec.name && ec.phone);

  if (!hasValidEmergencyContact) {
    flags.push('INCOMPLETE: Valid emergency contact name and phone number required');
    if (clearanceStatus === 'CLEARED') {
      clearanceStatus = 'PENDING_CONTACT';
    }
  }

  return {
    clearanceStatus,
    isClearedForPlay: clearanceStatus === 'CLEARED' || clearanceStatus === 'CONDITIONAL_APPROVAL',
    flags,
    restrictions,
    emergencyContactVerified: hasValidEmergencyContact,
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── Digital Signature & Cryptographic Digest ───────────────────────────────

/**
 * Creates an immutable, tamper-evident SHA-256 certificate digest for a signed waiver.
 *
 * @param {Object} signingData
 * @param {string} signingData.waiverId - Unique waiver record ID
 * @param {string} signingData.playerId - User / Player ID
 * @param {string} signingData.bookingId - Associated booking or venue ID
 * @param {string} signingData.signatureText - Typed or biometric signature string
 * @param {string} [signingData.ipAddress] - IP address of signer
 * @param {string} [signingData.userAgent] - Browser/Device user agent
 * @param {string} [signingData.agreedTimestamp] - ISO timestamp
 * @param {Object} [signingData.guardianSignature] - Optional guardian signature details
 * @returns {Object} Cryptographic verification certificate
 */
export function generateDigitalWaiverDigest({
  waiverId,
  playerId,
  bookingId,
  signatureText,
  ipAddress = '127.0.0.1',
  userAgent = 'SportsApp/1.0',
  agreedTimestamp = new Date().toISOString(),
  guardianSignature = null,
}) {
  if (!waiverId || !playerId || !signatureText) {
    throw new Error('waiverId, playerId, and signatureText are mandatory to generate waiver digest');
  }

  // Canonical payload representation
  const canonicalPayload = JSON.stringify({
    waiverId,
    playerId,
    bookingId: bookingId || 'ALL_VENUE_FIXTURES',
    signatureText: signatureText.trim(),
    ipAddress,
    userAgent,
    agreedTimestamp,
    guardianSignature: guardianSignature
      ? {
          name: guardianSignature.name,
          relation: guardianSignature.relation,
          signatureText: guardianSignature.signatureText,
        }
      : null,
  });

  const sha256Hash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
  const certificateId = `WVR-CERT-${Date.now().toString(36).toUpperCase()}-${sha256Hash.substring(0, 8).toUpperCase()}`;

  return {
    certificateId,
    sha256Hash,
    canonicalPayload,
    issuedAt: agreedTimestamp,
    algorithm: 'SHA-256',
    isDigitallySigned: true,
  };
}

// ─── Compliance Verification ────────────────────────────────────────────────

/**
 * Validates whether an existing signed waiver covers a specific upcoming booking fixture.
 *
 * @param {Object} signedWaiver - Stored waiver record
 * @param {Object} fixture - Fixture details (sport, bookingDate, isMinor)
 * @returns {{ isCompliant: boolean, reasons: string[] }}
 */
export function validateWaiverCompliance(signedWaiver, fixture) {
  const reasons = [];

  if (!signedWaiver || !signedWaiver.isDigitallySigned) {
    return { isCompliant: false, reasons: ['No verified digitally signed waiver on record'] };
  }

  // 1. Expiration Check (Standard annual validity: 365 days)
  const issuedTime = new Date(signedWaiver.issuedAt).getTime();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (now - issuedTime > ONE_YEAR_MS) {
    reasons.push('Waiver has expired (validity period is 12 months from signing)');
  }

  // 2. Minor Guardian Check
  if (fixture?.isMinor && !signedWaiver.guardianSignature) {
    reasons.push('Player is a minor (<18) but signed waiver lacks parent/guardian co-signature');
  }

  // 3. Sport Risk Tier Check
  if (fixture?.sport) {
    const requiredRiskTier = getSportRiskTier(fixture.sport).tierId;
    const waiverRiskTier = signedWaiver.riskTier || 'MEDIUM_RISK';

    // A low-risk waiver cannot cover high-risk sports
    if (requiredRiskTier === 'HIGH_RISK' && waiverRiskTier !== 'HIGH_RISK') {
      reasons.push(
        `Waiver was signed for ${waiverRiskTier} sports and does not cover high-collision sport (${fixture.sport})`
      );
    }
  }

  return {
    isCompliant: reasons.length === 0,
    reasons,
  };
}

export default {
  SPORT_RISK_TIERS,
  INSURANCE_PLANS,
  getSportRiskTier,
  calculateWaiverRiskProfile,
  calculateInsuranceCoverage,
  evaluateMedicalDeclarations,
  generateDigitalWaiverDigest,
  validateWaiverCompliance,
};
