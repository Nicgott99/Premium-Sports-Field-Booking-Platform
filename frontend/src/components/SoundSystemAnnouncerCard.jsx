import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Music,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
} from 'lucide-react';

// Preset options for sound control
const AUDIO_PRESETS = [
  {
    id: 'PRE_MATCH_HYPE',
    name: 'Pre-Match Anthem & Lineups',
    targetDb: 86,
    badge: 'Walkout',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Tunnel emergence fanfare with dynamic sub-bass boost.',
  },
  {
    id: 'IN_PLAY_CHELSEA',
    name: 'Live Match Atmosphere',
    targetDb: 70,
    badge: 'Standard',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'Balanced acoustic spread for match whistles and commentary.',
  },
  {
    id: 'GOAL_CELEBRATION',
    name: 'Goal Stinger & Horn',
    targetDb: 90,
    badge: 'Celebration',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Vocal clarity horn blast across grandstand & field center.',
  },
  {
    id: 'CURFEW_RESTRICTED',
    name: 'Neighbourhood Noise Curfew',
    targetDb: 62,
    badge: 'Curfew Protected',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    desc: 'Sub-bass cutoff below 65 dB complying with night regulations.',
  },
];

const AUDIO_ZONES = [
  { id: 'PITCH_CENTRE', name: 'Field In-Play Horns', maxDb: 92 },
  { id: 'HOME_DUGOUT', name: 'Home Team Dugout', maxDb: 80 },
  { id: 'AWAY_DUGOUT', name: 'Away Team Dugout', maxDb: 80 },
  { id: 'MAIN_STAND', name: 'Grandstand Tier', maxDb: 88 },
  { id: 'PERIMETER_CONCOURSE', name: 'Concourse & Cafe', maxDb: 75 },
];

/**
 * SoundSystemAnnouncerCard
 * 
 * Allows stadium coordinators and team captains to trigger walkout anthems,
 * inspect pitch speaker zone routing, enforce municipal noise decibel curfews,
 * and broadcast PA announcements.
 */
export default function SoundSystemAnnouncerCard({
  pitchName,
  homeTeam,
  awayTeam,
  matchTime,
  curfewHour,
  onAudioArmed,
}) {
  const [selectedPresetId, setSelectedPresetId] = useState('PRE_MATCH_HYPE');
  const [masterVolume, setMasterVolume] = useState(82);
  const [micLive, setMicLive] = useState(false);
  const [isPlayingAnthem, setIsPlayingAnthem] = useState(false);
  const [systemArmed, setSystemArmed] = useState(false);
  const [audioSessionToken, setAudioSessionToken] = useState('');

  const currentPreset = useMemo(() => {
    return AUDIO_PRESETS.find((p) => p.id === selectedPresetId) || AUDIO_PRESETS[0];
  }, [selectedPresetId]);

  // Curfew check
  const isCurfewRisk = useMemo(() => {
    if (!matchTime) return false;
    const hour = parseInt(matchTime.split(':')[0], 10);
    return hour >= curfewHour || masterVolume > 85;
  }, [matchTime, curfewHour, masterVolume]);

  const handleArmSoundSystem = () => {
    const token = `PA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setAudioSessionToken(token);
    setSystemArmed(true);
    if (onAudioArmed) {
      onAudioArmed({
        token,
        presetId: currentPreset.id,
        masterVolume,
        isCurfewProtected: isCurfewRisk,
      });
    }
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Accent gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Radio size={22} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              PA Announcer &amp; Stadium Audio
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {pitchName} · {homeTeam} vs {awayTeam}
            </p>
          </div>
        </div>
        {systemArmed && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 size={12} /> Broadcast Ready
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Walkout Anthem Controls */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingAnthem(!isPlayingAnthem)}
              className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow transition-colors cursor-pointer"
              title={isPlayingAnthem ? 'Pause Walkout Fanfare' : 'Preview Walkout Fanfare'}
            >
              {isPlayingAnthem ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Music size={14} className="text-violet-400" /> Walkout Anthem Flare
              </p>
              <p className="text-xs text-slate-400">
                {isPlayingAnthem ? 'Playing: Champions Entrance Theme...' : 'Queued: Official League Salutation'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMicLive(!micLive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              micLive
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell size={12} /> {micLive ? 'MIC ON AIR' : 'Hold to Speak'}
          </button>
        </div>

        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sliders size={13} className="text-cyan-400" /> Audio Profiles
          </label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {AUDIO_PRESETS.map((preset) => {
              const selected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  disabled={systemArmed}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-violet-500/15 border-violet-500/50 shadow-md shadow-violet-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${systemArmed ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{preset.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{preset.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Master Gain Slider */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              {masterVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} className="text-cyan-400" />}
              Master Sound Gain
            </span>
            <span className="font-mono font-bold text-cyan-300">{masterVolume} dB SPL</span>
          </div>
          <input
            type="range"
            min="40"
            max="95"
            value={masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>40 dB (Whisper)</span>
            <span>65 dB (Curfew Cap)</span>
            <span>95 dB (Festival Cap)</span>
          </div>
        </div>

        {/* Zone Decibel Metering */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Speaker Matrix Decibel Levels
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AUDIO_ZONES.map((zone) => {
              const currentZoneDb = Math.min(zone.maxDb, masterVolume - 3);
              return (
                <div
                  key={zone.id}
                  className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[11px] font-medium text-slate-300">{zone.name}</p>
                    <p className="text-[9px] text-slate-500">Ceiling: {zone.maxDb} dB</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {currentZoneDb} dB
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curfew Advisory */}
        {isCurfewRisk && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Curfew threshold active ({curfewHour}:00). Sound is limited to 65 dB in exterior zones to protect residential neighbours.
            </p>
          </div>
        )}

        {/* Action Button */}
        {!systemArmed ? (
          <button
            onClick={handleArmSoundSystem}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <Radio size={16} /> Arm Stadium PA &amp; Synchronize Broadcast
          </button>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wide">
              <CheckCircle2 size={14} /> PA System Live &amp; Anthems Scheduled
            </div>
            <p className="text-[11px] text-slate-300">
              Access Token: <span className="font-mono text-cyan-300">{audioSessionToken}</span> · Pitchside mic unlocked for matchday officials.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

SoundSystemAnnouncerCard.propTypes = {
  pitchName: PropTypes.string,
  homeTeam: PropTypes.string,
  awayTeam: PropTypes.string,
  matchTime: PropTypes.string,
  curfewHour: PropTypes.number,
  onAudioArmed: PropTypes.func,
};

SoundSystemAnnouncerCard.defaultProps = {
  pitchName: 'Premier Arena Pitch 1',
  homeTeam: 'Home Squad',
  awayTeam: 'Visiting Squad',
  matchTime: '20:00',
  curfewHour: 21,
  onAudioArmed: null,
};
