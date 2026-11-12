/**
 * Smart LED Scoreboard & Digital Hoarding Telemetry Engine
 * 
 * Manages pitchside perimeter LED hoardings, dynamic multi-tier sponsor advertising rotations,
 * official FIFA added-time board visual sync, and emergency stadium safety broadcasts.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const HOARDING_SECTORS = [
  { id: 'SECTOR_PITCH_WEST', label: 'West Main Stand Touchline (Broadcast Facing)', panelsCount: 36, brightnessNits: 5500 },
  { id: 'SECTOR_PITCH_EAST', label: 'East Dugout Touchline', panelsCount: 36, brightnessNits: 5500 },
  { id: 'SECTOR_GOAL_NORTH', label: 'North Goalmouth Behind-Net Tier', panelsCount: 18, brightnessNits: 5000 },
  { id: 'SECTOR_GOAL_SOUTH', label: 'South Goalmouth Behind-Net Tier', panelsCount: 18, brightnessNits: 5000 },
  { id: 'SECTOR_CENTRE_SCOREBOARD', label: 'Centre-Roof Hung Main Scoreboard', panelsCount: 4, brightnessNits: 6500 },
];

export const DISPLAY_PRESETS = {
  MATCH_LIVE_SCORE: {
    id: 'MATCH_LIVE_SCORE',
    label: 'Live Match Clock & Goal Score',
    priorityLevel: 1,
    refreshIntervalSec: 1,
    defaultBannerColor: '#00F0FF',
  },
  SPONSOR_CAROUSEL: {
    id: 'SPONSOR_CAROUSEL',
    label: 'Commercial Partner Sponsor Carousel',
    priorityLevel: 3,
    refreshIntervalSec: 15,
    defaultBannerColor: '#FFB800',
  },
  ADDED_TIME_ANNOUNCEMENT: {
    id: 'ADDED_TIME_ANNOUNCEMENT',
    label: '4th Official Added Time Stoppage Board',
    priorityLevel: 2,
    refreshIntervalSec: 5,
    defaultBannerColor: '#FF0055',
  },
  EMERGENCY_EVACUATION: {
    id: 'EMERGENCY_EVACUATION',
    label: 'Emergency Safety Broadcast Override',
    priorityLevel: 0, // Highest priority override
    refreshIntervalSec: 0,
    defaultBannerColor: '#FF0000',
  },
};

/**
 * Validates display command parameters.
 * 
 * @param {Object} payload
 * @returns {Object} Validation outcome
 */
export function validateDisplayPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Missing LED display payload.');
  }

  const errors = [];
  if (!payload.matchId || typeof payload.matchId !== 'string') {
    errors.push('matchId is required.');
  }
  if (!payload.preset || !DISPLAY_PRESETS[payload.preset]) {
    errors.push('Invalid display preset code.');
  }
  if (payload.brightnessPercent !== undefined) {
    if (typeof payload.brightnessPercent !== 'number' || payload.brightnessPercent < 10 || payload.brightnessPercent > 100) {
      errors.push('brightnessPercent must be between 10 and 100.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates an automated perimeter LED sequence combining match clock, sponsor slots, and score flare.
 * 
 * @param {Object} options
 * @param {string} options.matchId - Unique match reference
 * @param {string} options.homeTeam - Home squad name
 * @param {string} options.awayTeam - Away squad name
 * @param {number} options.homeScore - Current home goals
 * @param {number} options.awayScore - Current away goals
 * @param {number} [options.addedMinutes=0] - Stoppage time added
 * @param {string} [options.preset='MATCH_LIVE_SCORE']
 * @param {number} [options.brightnessPercent=85]
 * @returns {Object} Synchronized LED board broadcast payload
 */
export function buildLedBoardSequence({
  matchId,
  homeTeam,
  awayTeam,
  homeScore = 0,
  awayScore = 0,
  addedMinutes = 0,
  preset = 'MATCH_LIVE_SCORE',
  brightnessPercent = 85,
}) {
  const validation = validateDisplayPayload({ matchId, preset, brightnessPercent });
  if (!validation.isValid) {
    throw new Error(`LED validation failed: ${validation.errors.join('; ')}`);
  }

  const presetConfig = DISPLAY_PRESETS[preset];
  const now = new Date();
  const sequenceId = `LED-${matchId}-${Date.now().toString(36).toUpperCase()}`;

  const sectorsPayload = HOARDING_SECTORS.map((sector) => {
    const calibratedNits = Math.round((sector.brightnessNits * brightnessPercent) / 100);
    return {
      sectorId: sector.id,
      label: sector.label,
      panelsArmed: sector.panelsCount,
      targetBrightnessNits: calibratedNits,
      activeFeed: preset === 'ADDED_TIME_ANNOUNCEMENT' ? `+${addedMinutes} MINS STOPPAGE` : `${homeScore} - ${awayScore}`,
      status: 'TRANSMITTING',
    };
  });

  return {
    sequenceId,
    matchId,
    preset,
    presetLabel: presetConfig.label,
    homeTeam,
    awayTeam,
    scoreline: `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
    addedMinutes,
    brightnessPercent,
    timestamp: now.toISOString(),
    refreshIntervalSec: presetConfig.refreshIntervalSec,
    emergencyOverrideActive: preset === 'EMERGENCY_EVACUATION',
    sectors: sectorsPayload,
    broadcastToken: `SYNC-LED-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
  };
}

/**
 * Calculates commercial ad slot rotations across 90 minutes of match play.
 * 
 * @param {number} totalSponsorsCount - Number of registered commercial partners
 * @param {number} [slotDurationSeconds=15] - Duration of each sponsor loop
 * @returns {Object} Commercial impressions calculation
 */
export function calculateSponsorRotationMetrics(totalSponsorsCount, slotDurationSeconds = 15) {
  if (typeof totalSponsorsCount !== 'number' || totalSponsorsCount < 1) {
    throw new Error('totalSponsorsCount must be a positive integer.');
  }

  const matchDurationSeconds = 90 * 60; // 5400 seconds
  const totalSlotsAvailable = Math.floor(matchDurationSeconds / slotDurationSeconds);
  const loopsPerSponsor = Math.floor(totalSlotsAvailable / totalSponsorsCount);
  const totalScreenTimeMinutes = Math.round((loopsPerSponsor * slotDurationSeconds * 10) / 60) / 10;

  return {
    totalSponsorsCount,
    slotDurationSeconds,
    totalSlotsAvailable,
    loopsPerSponsor,
    totalScreenTimeMinutes,
    broadcastExposureScore: Math.min(100, Math.round((totalScreenTimeMinutes / 15) * 100)),
  };
}

export default {
  HOARDING_SECTORS,
  DISPLAY_PRESETS,
  validateDisplayPayload,
  buildLedBoardSequence,
  calculateSponsorRotationMetrics,
};
