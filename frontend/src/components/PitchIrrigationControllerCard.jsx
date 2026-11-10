import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Droplets,
  Timer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Waves,
  Play,
  RotateCcw,
} from 'lucide-react';

const IRRIGATION_PROGRAMS = [
  {
    id: 'PRE_MATCH_SLICK',
    title: 'Pre-Match Surface Slicking',
    multiplier: 0.5,
    waterVolume: '~450 Litres',
    drainageMins: 10,
    badge: 'Matchday Spec',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'High-speed 3-minute burst decreasing ball resistance and accelerating passes.',
  },
  {
    id: 'DEEP_CYCLE_POST_MATCH',
    title: 'Overnight Rootzone Hydration',
    multiplier: 1.8,
    waterVolume: '~1,600 Litres',
    drainageMins: 60,
    badge: 'Turf Recovery',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Deep sub-surface cycle repairing turf fibers and settling infill displacement.',
  },
  {
    id: 'HOT_WEATHER_EVAPORATIVE',
    title: 'Crumb Rubber Heat Cooling',
    multiplier: 0.8,
    waterVolume: '~720 Litres',
    drainageMins: 15,
    badge: 'Heat Relief',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Evaporative misting reducing synthetic crumb surface temperatures by 6-8°C.',
  },
];

const SECTORS = [
  { id: 'SECTOR_NORTH_PENALTY', label: 'North Penalty Box', flow: '65 L/min' },
  { id: 'SECTOR_CENTRE_CIRCLE', label: 'Centre Circle & Midfield', flow: '80 L/min' },
  { id: 'SECTOR_SOUTH_PENALTY', label: 'South Penalty Box', flow: '65 L/min' },
  { id: 'SECTOR_EAST_TOUCHLINE', label: 'East Touchline & Dugouts', flow: '45 L/min' },
  { id: 'SECTOR_WEST_TOUCHLINE', label: 'West Touchline & Assistant', flow: '45 L/min' },
];

/**
 * PitchIrrigationControllerCard
 * 
 * Provides pitch groundstaff, referees, and facility coordinators with automated
 * sub-surface sprinkler valve controls, pre-kickoff slicking, and safety interlocks.
 */
export default function PitchIrrigationControllerCard({
  pitchName,
  nextFixtureKickoff,
  currentMoisturePct,
  onCycleTriggered,
}) {
  const [selectedProgramId, setSelectedProgramId] = useState('PRE_MATCH_SLICK');
  const [activeMoisture, setActiveMoisture] = useState(currentMoisturePct || 38);
  const [isCycleRunning, setIsCycleRunning] = useState(false);
  const [cycleTicket, setCycleTicket] = useState(null);

  const activeProgram = useMemo(() => {
    return IRRIGATION_PROGRAMS.find((p) => p.id === selectedProgramId) || IRRIGATION_PROGRAMS[0];
  }, [selectedProgramId]);

  const handleStartCycle = () => {
    const ticketId = `IRR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payload = {
      ticketId,
      pitchName,
      programId: activeProgram.id,
      drainageBufferMins: activeProgram.drainageMins,
      triggeredAt: new Date().toLocaleTimeString(),
    };

    setCycleTicket(payload);
    setIsCycleRunning(true);
    setActiveMoisture((prev) => Math.min(100, prev + 12));

    if (onCycleTriggered) {
      onCycleTriggered(payload);
    }
  };

  const handleReset = () => {
    setIsCycleRunning(false);
    setCycleTicket(null);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Hydro Gradient Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Droplets size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Pitch Sprinkler &amp; Irrigation Control
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {pitchName} · Next Kickoff: {nextFixtureKickoff}
            </p>
          </div>
        </div>
        {isCycleRunning && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 animate-pulse">
            <Waves size={12} /> Valves Pulsing
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Real-time Subsurface Telemetry */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Droplets size={11} className="text-cyan-400" /> Moisture Level
            </span>
            <span className="text-sm font-bold font-mono text-cyan-300">{activeMoisture}%</span>
            <span className="text-[9px] text-slate-500">Target: 45-55%</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Clock size={11} className="text-sky-400" /> Drainage SLA
            </span>
            <span className="text-sm font-bold font-mono text-slate-200">
              {activeProgram.drainageMins} mins
            </span>
            <span className="text-[9px] text-slate-500">Clear for play</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Timer size={11} className="text-blue-400" /> Est. Volume
            </span>
            <span className="text-sm font-bold font-mono text-slate-200">
              {activeProgram.waterVolume}
            </span>
            <span className="text-[9px] text-slate-500">Eco-monitored</span>
          </div>
        </div>

        {/* Sprinkler Sector Matrix */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Automated Valve Staggering (Anti-Hammer Interlock)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTORS.map((sector) => (
              <div
                key={sector.id}
                className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-slate-200">{sector.label}</p>
                  <p className="text-[10px] text-slate-500">Flow: {sector.flow}</p>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCycleRunning ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Program Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Select Irrigation Protocol
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {IRRIGATION_PROGRAMS.map((program) => {
              const selected = program.id === selectedProgramId;
              return (
                <button
                  key={program.id}
                  disabled={isCycleRunning}
                  onClick={() => setSelectedProgramId(program.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    selected
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isCycleRunning ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{program.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${program.badgeColor}`}>
                      {program.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{program.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button or Active State */}
        {!isCycleRunning ? (
          <button
            onClick={handleStartCycle}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <Play size={16} /> Engage Sprinkler Sweeps
          </button>
        ) : (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-cyan-400" /> Sweep Cycle Active
              </span>
              <span className="font-mono text-xs text-cyan-300 font-bold">
                {cycleTicket?.ticketId}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Triggered at <span className="font-semibold text-white">{cycleTicket?.triggeredAt}</span>. Sector valves sequentially opening with 10-second anti-surge buffers. Pitch play ready in {cycleTicket?.drainageBufferMins} mins.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <ShieldCheck size={12} className="text-emerald-400" /> Kickoff interlock cleared
              </span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                <RotateCcw size={11} /> Cancel / Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

PitchIrrigationControllerCard.propTypes = {
  pitchName: PropTypes.string,
  nextFixtureKickoff: PropTypes.string,
  currentMoisturePct: PropTypes.number,
  onCycleTriggered: PropTypes.func,
};

PitchIrrigationControllerCard.defaultProps = {
  pitchName: 'Premier Arena Pitch 1 (3G)',
  nextFixtureKickoff: '18:30 (Senior League)',
  currentMoisturePct: 38,
  onCycleTriggered: null,
};
