import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Wrench,
  Layers,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

const MAINTENANCE_SERVICES = [
  {
    id: 'ROUTINE_TRIANGULAR_BRUSHING',
    name: 'Triangular Drag Brush',
    wearThreshold: 'Routine (Every 35 hrs)',
    infillTarget: 'Surface leveling',
    badge: 'Standard Grooming',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'Redistributes rubber crumb infill across high-wear penalty and centre circles.',
  },
  {
    id: 'POWER_BRUSH_AND_MAGNET_SWEEP',
    name: 'Power Rotary Brush & De-metal',
    wearThreshold: 'Intermediate (65% Wear)',
    infillTarget: 'Fiber upright revival',
    badge: 'Deep Groom',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Lifts bent turf blades and sweeps metal detritus, pins, and broken studs.',
  },
  {
    id: 'CRUMB_INFILL_TOP_UP_AND_ROTARY_DECOMPACTION',
    name: 'Decompaction & Crumb Top-up',
    wearThreshold: 'Critical (>90% Wear)',
    infillTarget: '+5.0mm infill depth',
    badge: 'FIFA Pro Restoration',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    desc: 'Relieves hard sub-base compaction and spreads new SBR rubber infill to restore shock absorption.',
  },
];

/**
 * TurfMaintenanceSchedulerCard
 * 
 * Provides pitch owners, facilities managers, and groundskeepers with
 * real-time turf wear analytics, crumb infill depth monitoring,
 * and automated maintenance service dispatch.
 */
export default function TurfMaintenanceSchedulerCard({
  pitchName,
  initialPlayHours,
  initialInfillDepth,
  onServiceScheduled,
}) {
  const [playHours, setPlayHours] = useState(initialPlayHours || 185);
  const [infillDepth, setInfillDepth] = useState(initialInfillDepth || 11.5);
  const [selectedServiceId, setSelectedServiceId] = useState('POWER_BRUSH_AND_MAGNET_SWEEP');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleRef, setScheduleRef] = useState('');

  // Diagnostic calculations
  const diagnostic = useMemo(() => {
    // 250 hours is typical decompaction lifecycle
    const wearPct = Math.min(100, Math.round((playHours / 250) * 100));
    const idealDepth = 15.0;
    const deficitMm = Math.max(0, Math.round((idealDepth - infillDepth) * 10) / 10);
    const tonnage = deficitMm > 0 ? (deficitMm * 0.8 * 7000 / 1000).toFixed(1) : 0;
    const isUrgent = wearPct >= 85 || infillDepth < 10.0;

    return {
      wearPct,
      deficitMm,
      tonnage,
      isUrgent,
      shockAbsorptionScore: Math.max(30, 100 - wearPct * 0.5 - deficitMm * 8),
    };
  }, [playHours, infillDepth]);

  const activeService = useMemo(() => {
    return MAINTENANCE_SERVICES.find((s) => s.id === selectedServiceId) || MAINTENANCE_SERVICES[0];
  }, [selectedServiceId]);

  const handleDispatch = () => {
    const ref = `MAINT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setScheduleRef(ref);
    setIsScheduled(true);
    if (onServiceScheduled) {
      onServiceScheduled({
        scheduleRef: ref,
        pitchName,
        serviceId: activeService.id,
        playHours,
        infillDepth,
      });
    }
  };

  const handleResetMetrics = () => {
    setPlayHours(15);
    setInfillDepth(15.0);
    setIsScheduled(false);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Emerald Accent Gradient */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Wrench size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Turf Aeration &amp; Infill Maintenance
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {pitchName} · 3G Synthetic Monofilament
            </p>
          </div>
        </div>
        {isScheduled && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 size={12} /> Service Dispatched
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Clock size={11} className="text-cyan-400" /> Play Hours
            </span>
            <span className="text-sm font-bold font-mono text-slate-100">{playHours} hrs</span>
            <span className="text-[9px] text-slate-500">Cap: 250 hrs</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Layers size={11} className="text-amber-400" /> Infill Depth
            </span>
            <span className="text-sm font-bold font-mono text-slate-100">{infillDepth} mm</span>
            <span className="text-[9px] text-slate-500">Ideal: 15.0 mm</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Sparkles size={11} className="text-emerald-400" /> Wear Index
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">{diagnostic.wearPct}%</span>
            <span className="text-[9px] text-slate-500">Fiber fatigue</span>
          </div>
        </div>

        {/* Sliders for Simulation & Telemetry Override */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders size={13} className="text-emerald-400" /> Telemetry Calibration
          </span>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Play Hours: {playHours} hrs</span>
              <span className="text-slate-500 text-[10px]">Max 300 hrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              disabled={isScheduled}
              value={playHours}
              onChange={(e) => setPlayHours(Number(e.target.value))}
              className="accent-emerald-400 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Infill Depth: {infillDepth} mm</span>
              <span className="text-slate-500 text-[10px]">Min 6 mm - Max 18 mm</span>
            </div>
            <input
              type="range"
              min="6"
              max="18"
              step="0.5"
              disabled={isScheduled}
              value={infillDepth}
              onChange={(e) => setInfillDepth(Number(e.target.value))}
              className="accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Warning Alert if critical */}
        {diagnostic.isUrgent && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Maintenance Urgent:</span> Infill depth is deficient by {diagnostic.deficitMm} mm ({diagnostic.tonnage} tonnes of SBR crumb rubber top-up required).
            </div>
          </div>
        )}

        {/* Service Options */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Select Pitch Grooming Program
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {MAINTENANCE_SERVICES.map((s) => {
              const selected = s.id === selectedServiceId;
              return (
                <button
                  key={s.id}
                  disabled={isScheduled}
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isScheduled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{s.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{s.desc}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                    <span>{s.wearThreshold}</span>
                    <span>·</span>
                    <span className="text-emerald-300">{s.infillTarget}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        {!isScheduled ? (
          <button
            onClick={handleDispatch}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <ShieldCheck size={16} /> Dispatch Grounds Team &amp; Schedule Service
          </button>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-emerald-400" /> Grounds Crew Scheduled
              </span>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                {scheduleRef}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Contracted: <span className="font-semibold text-white">{activeService.name}</span>. Triangular decompaction and drag mat scheduled for morning maintenance window (06:00 - 08:30).
            </p>
            <button
              onClick={handleResetMetrics}
              className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw size={11} /> Reset Wear Counters Post-Service
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

TurfMaintenanceSchedulerCard.propTypes = {
  pitchName: PropTypes.string,
  initialPlayHours: PropTypes.number,
  initialInfillDepth: PropTypes.number,
  onServiceScheduled: PropTypes.func,
};

TurfMaintenanceSchedulerCard.defaultProps = {
  pitchName: 'Pitch 1 (3G Synthetic)',
  initialPlayHours: 185,
  initialInfillDepth: 11.5,
  onServiceScheduled: null,
};
