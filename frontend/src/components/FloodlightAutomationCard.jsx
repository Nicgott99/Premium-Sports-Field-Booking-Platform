import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Lightbulb,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Leaf,
  SunDim,
  Layers,
} from 'lucide-react';

// Preset options for lighting intensity and energy rating
const LIGHTING_MODES = [
  {
    id: 'TRAINING',
    name: 'Training Session',
    lux: 200,
    kwhRate: 18,
    warmupMin: 5,
    desc: 'Optimal for youth practice and evening recreational drills.',
    badge: 'Eco Friendly',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 'AMATEUR_MATCH',
    name: 'Standard League Match',
    lux: 350,
    kwhRate: 32,
    warmupMin: 8,
    desc: 'Official FA grassroots & amateur competitive requirement.',
    badge: 'Popular',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'BROADCAST_COMPETITION',
    name: 'Semi-Pro / HD Broadcast',
    lux: 500,
    kwhRate: 48,
    warmupMin: 12,
    desc: 'Flicker-free high-illumination for tournament recordings.',
    badge: 'Tournament',
    badgeColor: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
  },
];

const MAST_ZONES = [
  { id: 'NORTH_MAST_A', label: 'North Mast A', angle: '35°' },
  { id: 'NORTH_MAST_B', label: 'North Mast B', angle: '35°' },
  { id: 'SOUTH_MAST_A', label: 'South Mast A', angle: '38°' },
  { id: 'SOUTH_MAST_B', label: 'South Mast B', angle: '38°' },
  { id: 'PITCH_PERIMETER_PATHWAY', label: 'Pathway Lamps', angle: 'Direct' },
];

/**
 * FloodlightAutomationCard
 * 
 * Provides players and field managers with pitch lighting automation,
 * preset intensity selection, in-rush current surge protection, and eco savings calculation.
 */
export default function FloodlightAutomationCard({
  pitchName,
  sessionStart,
  sessionEnd,
  electricityRate,
  onScheduleActivated,
}) {
  const [selectedModeId, setSelectedModeId] = useState('AMATEUR_MATCH');
  const [ecoIdleDimming, setEcoIdleDimming] = useState(true);
  const [staggeredWarmup, setStaggeredWarmup] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [scheduleRef, setScheduleRef] = useState('');

  const currentMode = useMemo(() => {
    return LIGHTING_MODES.find((m) => m.id === selectedModeId) || LIGHTING_MODES[1];
  }, [selectedModeId]);

  // Duration in hours (default 2 hours if not parsed)
  const durationHours = useMemo(() => {
    if (!sessionStart || !sessionEnd) return 2;
    const s = new Date(`1970-01-01T${sessionStart}:00Z`);
    const e = new Date(`1970-01-01T${sessionEnd}:00Z`);
    const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 2;
  }, [sessionStart, sessionEnd]);

  const totalKwh = useMemo(() => {
    return Math.round(currentMode.kwhRate * durationHours * 10) / 10;
  }, [currentMode, durationHours]);

  const estimatedCost = useMemo(() => {
    return (totalKwh * electricityRate).toFixed(2);
  }, [totalKwh, electricityRate]);

  const ecoSavingEst = useMemo(() => {
    if (!ecoIdleDimming) return 0;
    // Estimated ~15% power saved by auto-dimming during transitions & half-time
    return Math.round(totalKwh * 0.15 * 10) / 10;
  }, [ecoIdleDimming, totalKwh]);

  const handleActivate = () => {
    const ref = `FLS-${Math.floor(100000 + Math.random() * 900000)}`;
    setScheduleRef(ref);
    setIsActivated(true);
    if (onScheduleActivated) {
      onScheduleActivated({
        scheduleRef: ref,
        mode: currentMode.id,
        targetLux: currentMode.lux,
        totalKwh,
        estimatedCost,
      });
    }
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Gradient accent top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lightbulb size={22} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Floodlight Automation &amp; Lux Control
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {pitchName} · {sessionStart} – {sessionEnd}
            </p>
          </div>
        </div>
        {isActivated && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 size={12} /> Active
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sliders size={13} className="text-amber-400" /> Illumination Presets
          </label>
          <div className="grid grid-cols-1 gap-2.5 mt-2">
            {LIGHTING_MODES.map((mode) => {
              const selected = mode.id === selectedModeId;
              return (
                <button
                  key={mode.id}
                  disabled={isActivated}
                  onClick={() => setSelectedModeId(mode.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    selected
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  } ${isActivated ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-100">{mode.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${mode.badgeColor}`}>
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{mode.desc}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                    <span className="text-amber-300 font-semibold">{mode.lux} Lux</span>
                    <span className="text-slate-500">·</span>
                    <span>~{mode.kwhRate} kW/hr</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{mode.warmupMin} min warmup</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mast zones matrix */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers size={13} className="text-cyan-400" /> Mast Bank Telemetry
            </span>
            <span className="text-[11px] text-cyan-400/90 font-mono">5 Banks Armed</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MAST_ZONES.map((zone) => (
              <div
                key={zone.id}
                className="bg-slate-950/60 border border-slate-800/70 rounded-lg p-2.5 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300">{zone.label}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${isActivated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                </div>
                <span className="text-[10px] text-slate-500">Angle: {zone.angle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Automated Smart Toggles */}
        <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <SunDim size={15} className="text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Eco Idle Dimming</p>
                <p className="text-[11px] text-slate-400">Lowers to 50 Lux during match transition lull</p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={isActivated}
              checked={ecoIdleDimming}
              onChange={(e) => setEcoIdleDimming(e.target.checked)}
              className="accent-amber-500 h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer border-t border-slate-800/60 pt-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-cyan-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">In-Rush Surge Stagger</p>
                <p className="text-[11px] text-slate-400">8-second step delay across masts protects breaker</p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={isActivated}
              checked={staggeredWarmup}
              onChange={(e) => setStaggeredWarmup(e.target.checked)}
              className="accent-amber-500 h-4 w-4 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Energy & Cost Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-950/50 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Est. Energy</span>
              <span className="text-sm font-bold text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                <Zap size={12} className="text-amber-400" /> {totalKwh} kWh
              </span>
            </div>
            <div className="p-2 bg-slate-950/50 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Est. Electricity</span>
              <span className="text-sm font-bold text-amber-300 mt-0.5 block">
                £{estimatedCost}
              </span>
            </div>
            <div className="p-2 bg-slate-950/50 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Eco Savings</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Leaf size={12} /> {ecoSavingEst} kWh
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center mt-1">
            Calculated at £{electricityRate}/kWh based on {durationHours} hr session duration.
          </p>
        </div>

        {/* Action Button / Success State */}
        {!isActivated ? (
          <button
            onClick={handleActivate}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <Clock size={16} /> Arm Floodlight Automation Schedule
          </button>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wide">
              <CheckCircle2 size={14} /> Schedule Armed &amp; Synced with Pitch Ballasts
            </div>
            <p className="text-[11px] text-slate-300">
              Ref: <span className="font-mono text-amber-300">{scheduleRef}</span> · Warm-up begins {currentMode.warmupMin} mins before {sessionStart}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

FloodlightAutomationCard.propTypes = {
  pitchName: PropTypes.string,
  sessionStart: PropTypes.string,
  sessionEnd: PropTypes.string,
  electricityRate: PropTypes.number,
  onScheduleActivated: PropTypes.func,
};

FloodlightAutomationCard.defaultProps = {
  pitchName: 'Floodlit Pitch 1 (3G Synthetic)',
  sessionStart: '18:00',
  sessionEnd: '20:00',
  electricityRate: 0.28,
  onScheduleActivated: null,
};
