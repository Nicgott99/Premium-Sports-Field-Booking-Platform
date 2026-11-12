import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Monitor,
  Tv,
  Megaphone,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sliders,
  Sun,
  RotateCcw,
} from 'lucide-react';

const LED_PRESETS = [
  {
    id: 'MATCH_LIVE_SCORE',
    label: 'Live Match Clock & Scoreline',
    badge: 'In-Play Active',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'Dual-team live score and continuous running match clock.',
  },
  {
    id: 'ADDED_TIME_ANNOUNCEMENT',
    label: '4th Official Stoppage Time Board',
    badge: 'Officials Stoppage',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    desc: 'High-contrast large-digit added minutes announcement (+X Mins).',
  },
  {
    id: 'SPONSOR_CAROUSEL',
    label: 'Commercial Partner Sponsor Loops',
    badge: 'Advertising Loop',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: '15-second rotating branded hoarding animations across perimeter.',
  },
  {
    id: 'EMERGENCY_EVACUATION',
    label: 'Stadium Safety / Evacuation Alert',
    badge: 'Critical Override',
    badgeColor: 'text-red-500 bg-red-500/20 border-red-500/40',
    desc: 'Emergency amber/red safety signage directing spectators to exits.',
  },
];

const HOARDING_SECTORS = [
  { id: 'SECTOR_PITCH_WEST', name: 'West Touchline (Broadcast Facing)', panels: 36, nits: 5500 },
  { id: 'SECTOR_PITCH_EAST', name: 'East Dugouts Touchline', panels: 36, nits: 5500 },
  { id: 'SECTOR_GOAL_NORTH', name: 'North Goalmouth Behind-Net', panels: 18, nits: 5000 },
  { id: 'SECTOR_GOAL_SOUTH', name: 'South Goalmouth Behind-Net', panels: 18, nits: 5000 },
  { id: 'SECTOR_CENTRE_SCOREBOARD', name: 'Center Roof Main Scoreboard', panels: 4, nits: 6500 },
];

/**
 * LedScoreboardControllerCard
 * 
 * Pitchside perimeter LED hoarding and scoreboard controller for stadium coordinators,
 * fourth officials, and commercial managers.
 */
export default function LedScoreboardControllerCard({
  matchId,
  homeTeam,
  awayTeam,
  onDisplayBroadcast,
}) {
  const [selectedPresetId, setSelectedPresetId] = useState('MATCH_LIVE_SCORE');
  const [homeScore, setHomeScore] = useState(2);
  const [awayScore, setAwayScore] = useState(1);
  const [addedMinutes, setAddedMinutes] = useState(4);
  const [brightnessPercent, setBrightnessPercent] = useState(85);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [broadcastTicket, setBroadcastTicket] = useState(null);

  const activePreset = useMemo(() => {
    return LED_PRESETS.find((p) => p.id === selectedPresetId) || LED_PRESETS[0];
  }, [selectedPresetId]);

  const handleBroadcast = () => {
    const ticketId = `LED-${matchId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payload = {
      ticketId,
      matchId,
      preset: activePreset.id,
      scoreline: `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
      addedMinutes,
      brightnessPercent,
      dispatchedAt: new Date().toLocaleTimeString(),
    };

    setBroadcastTicket(payload);
    setIsTransmitting(true);

    if (onDisplayBroadcast) {
      onDisplayBroadcast(payload);
    }
  };

  const handleReset = () => {
    setIsTransmitting(false);
    setBroadcastTicket(null);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top LED Cyan Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-teal-500 to-indigo-600" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Monitor size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Smart LED Perimeter &amp; Scoreboard
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {homeTeam} vs {awayTeam} · Match Ref: {matchId}
            </p>
          </div>
        </div>
        {isTransmitting && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 animate-pulse">
            <Tv size={12} /> Live Transmitting
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Live Scoreline Display & Control */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Tv size={13} className="text-cyan-400" /> Digital Ribbon Scoreboard Feed
          </span>
          <div className="grid grid-cols-3 items-center text-center">
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[100px]">{homeTeam}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  disabled={isTransmitting || homeScore <= 0}
                  onClick={() => setHomeScore((s) => Math.max(0, s - 1))}
                  className="w-6 h-6 rounded bg-slate-800 text-xs hover:bg-slate-700 disabled:opacity-40"
                >
                  -
                </button>
                <span className="text-2xl font-bold font-mono text-cyan-300 px-2">{homeScore}</span>
                <button
                  disabled={isTransmitting}
                  onClick={() => setHomeScore((s) => s + 1)}
                  className="w-6 h-6 rounded bg-slate-800 text-xs hover:bg-slate-700 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <span className="text-slate-500 font-mono text-xs font-bold uppercase tracking-widest">
              VS
            </span>

            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[100px]">{awayTeam}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  disabled={isTransmitting || awayScore <= 0}
                  onClick={() => setAwayScore((s) => Math.max(0, s - 1))}
                  className="w-6 h-6 rounded bg-slate-800 text-xs hover:bg-slate-700 disabled:opacity-40"
                >
                  -
                </button>
                <span className="text-2xl font-bold font-mono text-cyan-300 px-2">{awayScore}</span>
                <button
                  disabled={isTransmitting}
                  onClick={() => setAwayScore((s) => s + 1)}
                  className="w-6 h-6 rounded bg-slate-800 text-xs hover:bg-slate-700 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Display Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Select Perimeter Feed Mode
          </label>
          <div className="grid grid-cols-1 gap-2">
            {LED_PRESETS.map((preset) => {
              const selected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  disabled={isTransmitting}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isTransmitting ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{preset.label}</span>
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

        {/* Added Time Modifier (if active) */}
        {selectedPresetId === 'ADDED_TIME_ANNOUNCEMENT' && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-rose-400" />
              <div>
                <p className="text-xs font-semibold text-rose-300">Stoppage Time (Added Minutes)</p>
                <p className="text-[10px] text-slate-400">Broadcast to pitchside 4th official board</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddedMinutes((m) => Math.max(1, m - 1))}
                className="w-7 h-7 bg-slate-800 rounded font-bold text-xs"
              >
                -
              </button>
              <span className="font-mono font-bold text-lg text-rose-400 px-1">+{addedMinutes}</span>
              <button
                onClick={() => setAddedMinutes((m) => Math.min(15, m + 1))}
                className="w-7 h-7 bg-slate-800 rounded font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Brightness / Nits Calibrator */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sun size={13} className="text-amber-400" /> Hoarding Nits Output
            </span>
            <span className="font-mono font-bold text-amber-300">{brightnessPercent}% (~4,675 Nits)</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            disabled={isTransmitting}
            value={brightnessPercent}
            onChange={(e) => setBrightnessPercent(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Hoarding Panels Telemetry Matrix */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-2">
            112 Total Pitchside Panels Armed
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HOARDING_SECTORS.map((sector) => (
              <div
                key={sector.id}
                className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 flex items-center justify-between text-xs"
              >
                <span className="text-slate-300 text-[11px] truncate max-w-[160px]">{sector.name}</span>
                <span className="font-mono text-[10px] text-cyan-400">{sector.panels} Panels</span>
              </div>
            ))}
          </div>
        </div>

        {/* Broadcast Action / Active State */}
        {!isTransmitting ? (
          <button
            onClick={handleBroadcast}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <Megaphone size={16} /> Transmit Feed to Stadium Hoardings
          </button>
        ) : (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-cyan-400" /> Transmitting Live to Panels
              </span>
              <span className="font-mono text-xs text-cyan-300 font-bold">
                {broadcastTicket?.ticketId}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Active feed: <span className="font-semibold text-white">{broadcastTicket?.scoreline}</span>. Synchronized at {broadcastTicket?.dispatchedAt} across all 5 perimeter sectors.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Sliders size={12} className="text-cyan-400" /> Broadcast protocol locked
              </span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                <RotateCcw size={11} /> Switch Preset
              </button>
            </div>
          </div>
        )}

        {/* Evacuation Alert Button */}
        {selectedPresetId === 'EMERGENCY_EVACUATION' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2 text-xs text-red-200">
            <AlertOctagon size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>
              High-priority safety override: All perimeter hoardings will flash amber/red stadium exit guidance instructions immediately.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

LedScoreboardControllerCard.propTypes = {
  matchId: PropTypes.string,
  homeTeam: PropTypes.string,
  awayTeam: PropTypes.string,
  onDisplayBroadcast: PropTypes.func,
};

LedScoreboardControllerCard.defaultProps = {
  matchId: 'MATCH-801',
  homeTeam: 'Home Squad',
  awayTeam: 'Away Squad',
  onDisplayBroadcast: null,
};
