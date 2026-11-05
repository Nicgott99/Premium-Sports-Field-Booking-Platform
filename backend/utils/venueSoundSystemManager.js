/**
 * Match Sound System & PA Announcer Engine
 * 
 * Manages automated audio zone presets, pitchside public address (PA) announcements,
 * decibel sound level curfew checks, team lineup audio sequences, and walkout anthems.
 * 
 * Pure ES Module, zero external dependencies.
 */

export const AUDIO_ZONES = [
  { id: 'PITCH_CENTRE', label: 'Pitch In-Field System', maxDbLevel: 92 },
  { id: 'HOME_DUGOUT', label: 'Home Team Dugout', maxDbLevel: 80 },
  { id: 'AWAY_DUGOUT', label: 'Away Team Dugout', maxDbLevel: 80 },
  { id: 'MAIN_STAND', label: 'Main Spectator Grandstand', maxDbLevel: 88 },
  { id: 'PERIMETER_CONCOURSE', label: 'Perimeter Concourse & Cafe', maxDbLevel: 75 },
];

export const AUDIO_PRESETS = {
  PRE_MATCH_HYPE: {
    id: 'PRE_MATCH_HYPE',
    label: 'Pre-Match Warmup & Team Walkout',
    targetDb: 86,
    activeZones: ['PITCH_CENTRE', 'MAIN_STAND', 'HOME_DUGOUT', 'AWAY_DUGOUT'],
    eqProfile: 'DYNAMIC_BASS_BOOST',
  },
  IN_PLAY_CHELSEA: {
    id: 'IN_PLAY_CHELSEA',
    label: 'Match Live / Ambient Atmosphere',
    targetDb: 70,
    activeZones: ['MAIN_STAND', 'PERIMETER_CONCOURSE'],
    eqProfile: 'BALANCED_STADIUM',
  },
  GOAL_CELEBRATION: {
    id: 'GOAL_CELEBRATION',
    label: 'Goal Stinger & Horn Flare',
    targetDb: 90,
    activeZones: ['PITCH_CENTRE', 'MAIN_STAND', 'HOME_DUGOUT'],
    eqProfile: 'MAX_VOCAL_CLARITY',
  },
  HALF_TIME_TALK: {
    id: 'HALF_TIME_TALK',
    label: 'Half-Time Lounge & Briefings',
    targetDb: 68,
    activeZones: ['MAIN_STAND', 'PERIMETER_CONCOURSE'],
    eqProfile: 'SMOOTH_ACOUSTIC',
  },
  CURFEW_RESTRICTED: {
    id: 'CURFEW_RESTRICTED',
    label: 'Neighbourhood Noise Curfew Mode',
    targetDb: 62,
    activeZones: ['PITCH_CENTRE', 'PERIMETER_CONCOURSE'],
    eqProfile: 'SUB_BASS_CUT',
  },
};

/**
 * Checks if target decibels comply with local environmental curfew laws.
 * 
 * @param {string|Date} timestamp - Current session time
 * @param {number} targetDb - Target sound level in dB
 * @param {number} [curfewHour=21] - Evening curfew start hour (e.g. 21 = 9 PM)
 * @returns {Object} Evaluation with allowed max dB and compliance status
 */
export function evaluateSoundCurfew(timestamp, targetDb, curfewHour = 21) {
  const date = new Date(timestamp);
  const hours = date.getHours();

  // Curfew applies from curfewHour (e.g. 21:00) until 07:00 morning
  const isCurfewActive = hours >= curfewHour || hours < 7;
  const maxAllowedDb = isCurfewActive ? 65 : 92;
  const isCompliant = targetDb <= maxAllowedDb;

  return {
    isCurfewActive,
    curfewHour,
    currentHour: hours,
    targetDb,
    maxAllowedDb,
    isCompliant,
    advisory: isCompliant
      ? 'Sound levels compliant with local municipal environmental ordinances'
      : `Exceeds municipal curfew limit of ${maxAllowedDb} dB by ${targetDb - maxAllowedDb} dB. Auto-compression recommended.`,
  };
}

/**
 * Generates an automated team walkout audio cue schedule.
 * 
 * @param {Object} options
 * @param {string} options.matchId - Unique match reference
 * @param {string} options.homeTeam - Home team name
 * @param {string} options.awayTeam - Away team name
 * @param {string} [options.anthemTrackTitle='UEFA Style Stadium Fanfare'] - Track name
 * @param {string} options.kickoffTimeISO - ISO match start time
 * @returns {Object} Audio rundown sequence
 */
export function buildMatchAudioRundown({
  matchId,
  homeTeam,
  awayTeam,
  anthemTrackTitle = 'UEFA Style Stadium Fanfare',
  kickoffTimeISO,
}) {
  if (!matchId || !homeTeam || !awayTeam || !kickoffTimeISO) {
    throw new Error('Missing match metadata or kickoff timestamp.');
  }

  const kickoff = new Date(kickoffTimeISO);
  // Walkout sequence starts 7 minutes before kickoff
  const walkoutStart = new Date(kickoff.getTime() - 7 * 60 * 1000);
  const lineupReadStart = new Date(kickoff.getTime() - 5 * 60 * 1000);
  const nationalAnthemStart = new Date(kickoff.getTime() - 2 * 60 * 1000);
  const whistleCountdown = new Date(kickoff.getTime() - 30 * 1000);

  return {
    sequenceId: `AUD-${matchId}-${Date.now().toString(36).toUpperCase()}`,
    matchId,
    homeTeam,
    awayTeam,
    anthemTrackTitle,
    kickoffTime: kickoff.toISOString(),
    cues: [
      {
        step: 1,
        time: walkoutStart.toISOString(),
        cueName: 'TEAMS_TUNNEL_EMERGENCE',
        audioTrack: anthemTrackTitle,
        targetDb: 84,
        zones: ['PITCH_CENTRE', 'MAIN_STAND', 'HOME_DUGOUT', 'AWAY_DUGOUT'],
      },
      {
        step: 2,
        time: lineupReadStart.toISOString(),
        cueName: 'OFFICIAL_TEAM_LINEUPS',
        audioTrack: 'PA Mic Ducking Over Ambient Stinger',
        targetDb: 82,
        zones: ['MAIN_STAND', 'PITCH_CENTRE'],
      },
      {
        step: 3,
        time: nationalAnthemStart.toISOString(),
        cueName: 'WALKOUT_CREST_PRESENTATION',
        audioTrack: 'Orchestral Match Salutation',
        targetDb: 86,
        zones: ['PITCH_CENTRE', 'MAIN_STAND'],
      },
      {
        step: 4,
        time: whistleCountdown.toISOString(),
        cueName: 'COUNTDOWN_WHISTLE',
        audioTrack: 'Sub-Bass Kick Pulse (30s to Kickoff)',
        targetDb: 78,
        zones: ['PITCH_CENTRE', 'MAIN_STAND'],
      },
    ],
  };
}

/**
 * Calculates audio zone routing and decibel distribution across pitch speakers.
 * 
 * @param {string} presetKey - Audio preset identifier
 * @param {number} [masterFaderGain=1.0] - Master fader multiplier (0.0 to 1.2)
 * @returns {Object} Active zone distribution matrix
 */
export function calculateZoneDistribution(presetKey, masterFaderGain = 1.0) {
  const preset = AUDIO_PRESETS[presetKey] || AUDIO_PRESETS.IN_PLAY_CHELSEA;
  const clampedFader = Math.max(0, Math.min(1.2, masterFaderGain));

  const zoneMatrix = AUDIO_ZONES.map((zone) => {
    const isZoneActive = preset.activeZones.includes(zone.id);
    const calculatedDb = isZoneActive
      ? Math.round(Math.min(zone.maxDbLevel, preset.targetDb * clampedFader))
      : 0;

    return {
      zoneId: zone.id,
      label: zone.label,
      isActive: isZoneActive,
      maxSafetyLimitDb: zone.maxDbLevel,
      outputDb: calculatedDb,
      headroomDb: isZoneActive ? zone.maxDbLevel - calculatedDb : zone.maxDbLevel,
    };
  });

  return {
    presetId: preset.id,
    presetLabel: preset.label,
    eqProfile: preset.eqProfile,
    masterGainMultiplier: clampedFader,
    zones: zoneMatrix,
  };
}

export default {
  AUDIO_ZONES,
  AUDIO_PRESETS,
  evaluateSoundCurfew,
  buildMatchAudioRundown,
  calculateZoneDistribution,
};
