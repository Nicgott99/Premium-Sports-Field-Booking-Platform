import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Moon,
  Sun,
  Activity,
  RotateCcw,
} from 'lucide-react';

const NOISE_PROFILES = [
  {
    id: 'LEAGUE_MATCH_STANDARD',
    name: 'Competitive League Fixture',
    targetDb: 86,
    subBassCut: '-6 dB',
    badge: 'Standard Match',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'High spectator cheer allowance with standard perimeter inverse-distance attenuation.',
  },
  {
    id: 'EVENING_CURFEW_RESTRICTED',
    name: 'Post-21:00 Curfew Whisper Spec',
    targetDb: 68,
    subBassCut: '-18 dB',
    badge: 'Curfew Enforced',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Deep sub-bass frequency filter capping residential boundary spillover strictly under 55 dB.',
  },
  {
    id: 'COMMUNITY_YOUTH_TRAINING',
    name: 'Youth Coaching & Whistles',
    targetDb: 74,
    subBassCut: '-12 dB',
    badge: 'Grassroots',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Vocal pitch clarity optimized for referee whistles and team tactical instructions.',
  },
];

const BOUNDARY_SENSORS = [
  { id: 'SENSOR_NORTH', label: 'North Boundary (Residential Houses, 45m)', capDay: 70, capCurfew: 55 },
  { id: 'SENSOR_EAST', label: 'East Perimeter (Community Library, 80m)', capDay: 68, capCurfew: 50 },
  { id: 'SENSOR_GRANDSTAND', label: 'Main Covered Grandstand (Interior)', capDay: 95, capCurfew: 85 },
  { id: 'SENSOR_INFIELD', label: 'Pitch Field Center Line', capDay: 92, capCurfew: 80 },
];

/**
 * AcousticCurfewControllerCard
 * 
 * Provides stadium operations, event directors, and local authority liaisons with
 * real-time boundary decibel compliance monitoring, automated DSP phase cancellation,
 * and STIPA speech intelligibility certification.
 */
export default function AcousticCurfewControllerCard({
  venueName,
  eventTitle,
  initialSplDb,
  onCalibrationSaved,
}) {
  const [selectedProfileId, setSelectedProfileId] = useState('LEAGUE_MATCH_STANDARD');
  const [currentSplDb, setCurrentSplDb] = useState(initialSplDb || 84);
  const [isCurfewMode, setIsCurfewMode] = useState(false);
  const [activePhaseCancellation, setActivePhaseCancellation] = useState(true);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [docketRef, setDocketRef] = useState('');

  const activeProfile = useMemo(() => {
    return NOISE_PROFILES.find((p) => p.id === selectedProfileId) || NOISE_PROFILES[0];
  }, [selectedProfileId]);

  // Telemetry computation
  const audit = useMemo(() => {
    let violations = 0;
    const sensors = BOUNDARY_SENSORS.map((s) => {
      const statutoryCap = isCurfewMode ? s.capCurfew : s.capDay;
      // Distance drop-off + phase cut
      const dropoff = s.id === 'SENSOR_NORTH' ? 18 : s.id === 'SENSOR_EAST' ? 24 : 0;
      const dspReduction = activePhaseCancellation ? 8 : 0;
      const netBoundaryDb = Math.max(35, currentSplDb - dropoff - dspReduction);
      const isExceeded = netBoundaryDb > statutoryCap;

      if (isExceeded) violations += 1;

      return {
        ...s,
        statutoryCap,
        netBoundaryDb,
        isExceeded,
      };
    });

    return {
      sensors,
      violations,
      isCompliant: violations === 0,
      stipaRating: currentSplDb >= 70 && currentSplDb <= 90 ? '0.74 (Excellent)' : '0.58 (Fair)',
    };
  }, [currentSplDb, isCurfewMode, activePhaseCancellation]);

  const handleApplyCalibration = () => {
    const ref = `AUD-SPL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setDocketRef(ref);
    setIsCalibrated(true);

    if (onCalibrationSaved) {
      onCalibrationSaved({
        docketRef: ref,
        venueName,
        profileId: activeProfile.id,
        currentSplDb,
        isCurfewMode,
        isCompliant: audit.isCompliant,
      });
    }
  };

  const handleReset = () => {
    setIsCalibrated(false);
    setDocketRef('');
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Gradient Status Accent Bar */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${
          audit.isCompliant
            ? 'from-emerald-400 via-teal-500 to-cyan-500'
            : 'from-amber-500 via-rose-500 to-red-600'
        }`}
      />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              audit.isCompliant
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <Volume2 size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Acoustic Curfew &amp; Noise Cancellation
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {venueName} · {eventTitle}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCurfewMode(!isCurfewMode)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
            isCurfewMode
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isCurfewMode ? <Moon size={11} /> : <Sun size={11} />}
          {isCurfewMode ? 'Curfew Active (21:00)' : 'Daytime Mode'}
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Real-time In-Field Sound Meter */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={13} className="text-cyan-400" /> Pitch Sound Pressure Level (SPL)
            </span>
            <span className="font-mono font-bold text-lg text-cyan-300">{currentSplDb} dB</span>
          </div>
          <input
            type="range"
            min="60"
            max="105"
            disabled={isCalibrated}
            value={currentSplDb}
            onChange={(e) => setCurrentSplDb(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>60 dB (Recreational)</span>
            <span>85 dB (Match Cap)</span>
            <span>105 dB (Concert Peak)</span>
          </div>
        </div>

        {/* Profile Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Select Acoustic Profile
          </label>
          <div className="grid grid-cols-1 gap-2">
            {NOISE_PROFILES.map((p) => {
              const selected = p.id === selectedProfileId;
              return (
                <button
                  key={p.id}
                  disabled={isCalibrated}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isCalibrated ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Boundary Decibel Telemetry Grid */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Perimeter Boundary Sensor Array
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              STIPA Rating: <strong className="text-emerald-400">{audit.stipaRating}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {audit.sensors.map((s) => (
              <div
                key={s.id}
                className="bg-slate-950/60 border border-slate-800/70 rounded-lg p-2.5 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300 truncate max-w-[150px]">
                    {s.label}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      s.isExceeded ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {s.netBoundaryDb} dB
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Statutory Cap: {s.statutoryCap} dB</span>
                  <span>{s.isExceeded ? 'Exceeded' : 'Pass'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Phase Cancellation Toggle */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-cyan-400" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Active DSP Phase Cancellation</p>
              <p className="text-[10px] text-slate-400">Inverts 180° anti-phase wave at outer baffles (-8 dB)</p>
            </div>
          </div>
          <input
            type="checkbox"
            disabled={isCalibrated}
            checked={activePhaseCancellation}
            onChange={(e) => setActivePhaseCancellation(e.target.checked)}
            className="w-4 h-4 accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Violations Notice if present */}
        {!audit.isCompliant && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
            <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Statutory Curfew Breach:</span> Sound levels at residential perimeter exceed local authority limits by up to {audit.violations} sensor(s). Lower master volume or engage high sub-bass attenuation.
            </div>
          </div>
        )}

        {/* Action Button or Calibrated Ticket */}
        {!isCalibrated ? (
          <button
            onClick={handleApplyCalibration}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <ShieldCheck size={16} /> Certify &amp; Apply Acoustic Profile
          </button>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-emerald-400" /> Acoustic Profile Calibrated
              </span>
              <span className="font-mono text-xs text-cyan-300 font-bold">
                {docketRef}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Preset <span className="font-semibold text-white">{activeProfile.name}</span> active. DSP phase cancellation locked. Telemetry submitted to venue environmental compliance registry.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-[11px] text-slate-400">
              <span>Speech intelligibility (STIPA): {audit.stipaRating}</span>
              <button
                onClick={handleReset}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={11} /> Re-calibrate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

AcousticCurfewControllerCard.propTypes = {
  venueName: PropTypes.string,
  eventTitle: PropTypes.string,
  initialSplDb: PropTypes.number,
  onCalibrationSaved: PropTypes.func,
};

AcousticCurfewControllerCard.defaultProps = {
  venueName: 'Premier Sports Stadium',
  eventTitle: 'Evening Championship Fixture',
  initialSplDb: 84,
  onCalibrationSaved: null,
};
