import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Sun,
  Camera,
  CheckCircle2,
  Sliders,
  Send,
  Plane,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const BROADCAST_SPECS = [
  {
    id: 'UEFA_ELITE_CATEGORY_4',
    name: 'UEFA Elite Category 4 (UCL Final)',
    minLux: 1500,
    u1Min: 0.6,
    u2Min: 0.7,
    badge: '4K HDR Broadcast',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Mandatory illuminance for ultra-high-definition slow-motion flicker-free cameras.',
  },
  {
    id: 'FIFA_TOURNAMENT_TIER_A',
    name: 'FIFA World Cup Tournament Spec',
    minLux: 2000,
    u1Min: 0.65,
    u2Min: 0.75,
    badge: 'FIFA Global',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'Maximum optical uniformity across every square meter of playing surface.',
  },
  {
    id: 'DOMESTIC_COMPETITIVE_TIER_B',
    name: 'National League / Regional Semi-Pro',
    minLux: 800,
    u1Min: 0.45,
    u2Min: 0.55,
    badge: 'Regional League',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Standard domestic evening lighting certified for standard linear broadcast.',
  },
];

const GRID_ZONES = [
  { id: 'Z_N_GOAL', label: 'North Goalmouth (6-Yard)', defaultLux: 1650 },
  { id: 'Z_N_BOX', label: 'North 18-Yard Box', defaultLux: 1720 },
  { id: 'Z_CENTRE', label: 'Pitch Center Circle', defaultLux: 1850 },
  { id: 'Z_S_BOX', label: 'South 18-Yard Box', defaultLux: 1710 },
  { id: 'Z_S_GOAL', label: 'South Goalmouth (6-Yard)', defaultLux: 1640 },
  { id: 'Z_FLANKS', label: 'Broadcast Touchline Flanks', defaultLux: 1560 },
];

/**
 * LuxPhotometrySurveyCard
 * 
 * Provides stadium electrical engineers, UEFA match delegates, and facility directors with
 * automated pitch illumination uniformity calculations (U1 & U2 ratios) and drone survey dispatch.
 */
export default function LuxPhotometrySurveyCard({
  pitchName,
  facilityLead,
  broadcastInspector,
  onSurveyCertified,
}) {
  const [selectedSpecId, setSelectedSpecId] = useState('UEFA_ELITE_CATEGORY_4');
  const [masterLuxFactor, setMasterLuxFactor] = useState(100);
  const [isSurveyRunning, setIsSurveyRunning] = useState(false);
  const [certifiedDocket, setCertifiedDocket] = useState(null);

  const activeSpec = useMemo(() => {
    return BROADCAST_SPECS.find((s) => s.id === selectedSpecId) || BROADCAST_SPECS[0];
  }, [selectedSpecId]);

  // Telemetry computation
  const audit = useMemo(() => {
    const factor = masterLuxFactor / 100;
    const zoneReadings = GRID_ZONES.map((z) => ({
      ...z,
      lux: Math.round(z.defaultLux * factor),
    }));

    const luxValues = zoneReadings.map((z) => z.lux);
    const minLux = Math.min(...luxValues);
    const maxLux = Math.max(...luxValues);
    const aveLux = Math.round(luxValues.reduce((a, b) => a + b, 0) / luxValues.length);

    const u1 = Math.round((minLux / (maxLux || 1)) * 100) / 100; // Emin / Emax
    const u2 = Math.round((minLux / (aveLux || 1)) * 100) / 100; // Emin / Eave

    const isMinOk = minLux >= activeSpec.minLux;
    const isU1Ok = u1 >= activeSpec.u1Min;
    const isU2Ok = u2 >= activeSpec.u2Min;
    const isApproved = isMinOk && isU1Ok && isU2Ok;

    return {
      zoneReadings,
      minLux,
      maxLux,
      aveLux,
      u1,
      u2,
      isMinOk,
      isU1Ok,
      isU2Ok,
      isApproved,
    };
  }, [masterLuxFactor, activeSpec]);

  const handleDispatchDrone = () => {
    const token = `LUX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payload = {
      token,
      pitchName,
      specId: activeSpec.id,
      minLux: audit.minLux,
      aveLux: audit.aveLux,
      u1Ratio: audit.u1,
      u2Ratio: audit.u2,
      facilityLead,
      broadcastInspector,
      certifiedAt: new Date().toLocaleTimeString(),
    };

    setCertifiedDocket(payload);
    setIsSurveyRunning(true);

    if (onSurveyCertified) {
      onSurveyCertified(payload);
    }
  };

  const handleReset = () => {
    setIsSurveyRunning(false);
    setCertifiedDocket(null);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Gradient Status Accent Bar */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${
          audit.isApproved
            ? 'from-amber-400 via-orange-500 to-yellow-400'
            : 'from-rose-500 via-amber-500 to-red-600'
        }`}
      />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              audit.isApproved
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <Sun size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Drone Photometry &amp; Lux Uniformity
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {pitchName} · Inspector: {broadcastInspector}
            </p>
          </div>
        </div>
        {isSurveyRunning && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse">
            <Plane size={12} /> Drone Sweeping
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Uniformity Metrics Matrix */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Sun size={11} className="text-amber-400" /> Min Lux (Emin)
            </span>
            <span className="text-sm font-bold font-mono text-amber-300">{audit.minLux} Lux</span>
            <span className="text-[9px] text-slate-500">Req: &ge;{activeSpec.minLux}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Sliders size={11} className="text-cyan-400" /> U1 Ratio (Min/Max)
            </span>
            <span className={`text-sm font-bold font-mono ${audit.isU1Ok ? 'text-emerald-400' : 'text-rose-400'}`}>
              {audit.u1}
            </span>
            <span className="text-[9px] text-slate-500">Req: &ge;{activeSpec.u1Min}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Camera size={11} className="text-indigo-400" /> U2 Ratio (Min/Ave)
            </span>
            <span className={`text-sm font-bold font-mono ${audit.isU2Ok ? 'text-emerald-400' : 'text-rose-400'}`}>
              {audit.u2}
            </span>
            <span className="text-[9px] text-slate-500">Req: &ge;{activeSpec.u2Min}</span>
          </div>
        </div>

        {/* Standard Tournament Spec Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Select Broadcast Illuminance Standard
          </label>
          <div className="grid grid-cols-1 gap-2">
            {BROADCAST_SPECS.map((spec) => {
              const selected = spec.id === selectedSpecId;
              return (
                <button
                  key={spec.id}
                  disabled={isSurveyRunning}
                  onClick={() => setSelectedSpecId(spec.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isSurveyRunning ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{spec.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${spec.badgeColor}`}>
                      {spec.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{spec.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mast Luminaire Intensity Slider */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" /> Floodlight Luminaire Power
            </span>
            <span className="font-mono font-bold text-amber-300">{masterLuxFactor}% (~{audit.aveLux} Ave Lux)</span>
          </div>
          <input
            type="range"
            min="60"
            max="120"
            disabled={isSurveyRunning}
            value={masterLuxFactor}
            onChange={(e) => setMasterLuxFactor(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Photometric Grid Sampling Zones */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-2">
            Pitch Grid Drone Photometer Readings
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {audit.zoneReadings.map((z) => (
              <div
                key={z.id}
                className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 flex flex-col gap-0.5"
              >
                <span className="text-slate-400 text-[10px] truncate">{z.label}</span>
                <span className="font-mono text-xs font-bold text-slate-200">{z.lux} Lux</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button or Survey Docket */}
        {!isSurveyRunning ? (
          <button
            onClick={handleDispatchDrone}
            disabled={!audit.isApproved}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <Send size={16} /> Dispatch Drone Grid Sweep &amp; Sign Off UEFA Lux
          </button>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-amber-400" /> UEFA Broadcast Lux Certificate Issued
              </span>
              <span className="font-mono text-xs text-amber-400 font-bold">
                {certifiedDocket?.token}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Photometric survey complete. <span className="font-semibold text-white">{certifiedDocket?.aveLux} Average Lux</span> verified across all zones (U1: {certifiedDocket?.u1Ratio}, U2: {certifiedDocket?.u2Ratio}). Signed off by Inspector {broadcastInspector}.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[11px] text-slate-400">
              <span>Flight Altitude: 12.0m (Cosine Spectral Mode)</span>
              <button
                onClick={handleReset}
                className="text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={11} /> New Survey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

LuxPhotometrySurveyCard.propTypes = {
  pitchName: PropTypes.string,
  facilityLead: PropTypes.string,
  broadcastInspector: PropTypes.string,
  onSurveyCertified: PropTypes.func,
};

LuxPhotometrySurveyCard.defaultProps = {
  pitchName: 'National Stadium Main Pitch',
  facilityLead: 'Gary Neville (Operations Director)',
  broadcastInspector: 'Martin Atkinson (UEFA Delegate)',
  onSurveyCertified: null,
};
