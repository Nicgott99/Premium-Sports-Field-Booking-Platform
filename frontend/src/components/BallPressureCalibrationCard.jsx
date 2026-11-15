import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CircleDot,
  ShieldCheck,
  Compass,
} from 'lucide-react';

const BALL_SPECS = [
  {
    id: 'FIFA_QUALITY_PRO',
    name: 'FIFA Quality Pro Match Ball',
    minPsi: 8.5,
    maxPsi: 15.6,
    optimalPsi: 11.5,
    badge: 'Official Fixture',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Mandatory standard for league tournaments and FA sanctioned fixtures.',
  },
  {
    id: 'WET_TURF_HEAVY',
    name: 'Wet Weather / Synthetic Infill Spec',
    minPsi: 8.5,
    maxPsi: 13.0,
    optimalPsi: 10.0,
    badge: 'Wet Turf Spec',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'Slightly softened pressure profile avoiding excess bounce on soaked turf.',
  },
  {
    id: 'TRAINING_RECREATIONAL',
    name: 'Recreational & Academy Practice',
    minPsi: 8.0,
    maxPsi: 16.0,
    optimalPsi: 10.5,
    badge: 'Youth & Training',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'High-durability inflation tolerance for squad drills and casual play.',
  },
];

const MULTI_BALL_SYSTEM = [
  { id: 'BALL_1', label: 'Match Ball #1 (Kickoff)', location: 'Center Circle Plinth', defaultPsi: 11.5 },
  { id: 'BALL_2', label: 'Match Ball #2', location: 'North Goal Plinth', defaultPsi: 11.4 },
  { id: 'BALL_3', label: 'Match Ball #3', location: 'South Goal Plinth', defaultPsi: 11.6 },
  { id: 'BALL_4', label: 'Match Ball #4', location: 'East Dugout Touchline', defaultPsi: 11.5 },
  { id: 'BALL_5', label: 'Match Ball #5', location: 'West Assistant Touchline', defaultPsi: 11.3 },
  { id: 'BALL_6', label: 'Match Ball #6 (Reserve)', location: '4th Official Technical Table', defaultPsi: 11.5 },
];

/**
 * BallPressureCalibrationCard
 * 
 * Provides match referees, kit managers, and academy coaches with
 * digital ball manometer pressure auditing, FIFA Quality Pro tolerance checks,
 * and pitchside multi-ball rotation verification.
 */
export default function BallPressureCalibrationCard({
  matchId,
  leadReferee,
  kitManager,
  onCalibrationCertified,
}) {
  const [selectedSpecId, setSelectedSpecId] = useState('FIFA_QUALITY_PRO');
  const [currentPsi, setCurrentPsi] = useState(11.4);
  const [circumferenceCm, setCircumferenceCm] = useState(69.0);
  const [isCertified, setIsCertified] = useState(false);
  const [certDocket, setCertDocket] = useState(null);

  const activeSpec = useMemo(() => {
    return BALL_SPECS.find((s) => s.id === selectedSpecId) || BALL_SPECS[0];
  }, [selectedSpecId]);

  const audit = useMemo(() => {
    const isPressureOk = currentPsi >= activeSpec.minPsi && currentPsi <= activeSpec.maxPsi;
    const isCircumferenceOk = circumferenceCm >= 68.5 && circumferenceCm <= 69.5;
    const isApproved = isPressureOk && isCircumferenceOk;

    const barEquivalent = (currentPsi * 0.0689476).toFixed(2);

    let guidance = 'Pressure optimal. Ball certified for competitive fixture.';
    if (currentPsi < activeSpec.minPsi) {
      guidance = `Under-inflated by ${(activeSpec.optimalPsi - currentPsi).toFixed(1)} PSI. Top up via hand compressor.`;
    } else if (currentPsi > activeSpec.maxPsi) {
      guidance = `Over-inflated by ${(currentPsi - activeSpec.optimalPsi).toFixed(1)} PSI. Release pressure valve immediately.`;
    }

    return {
      barEquivalent,
      isPressureOk,
      isCircumferenceOk,
      isApproved,
      guidance,
    };
  }, [currentPsi, circumferenceCm, activeSpec]);

  const handleCertify = () => {
    const certToken = `BALL-CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payload = {
      certToken,
      matchId,
      specId: activeSpec.id,
      measuredPsi: currentPsi,
      measuredBar: audit.barEquivalent,
      circumferenceCm,
      leadReferee,
      kitManager,
      certifiedAt: new Date().toLocaleTimeString(),
    };

    setCertDocket(payload);
    setIsCertified(true);

    if (onCalibrationCertified) {
      onCalibrationCertified(payload);
    }
  };

  const handleReset = () => {
    setIsCertified(false);
    setCertDocket(null);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Gradient Status Bar */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${
          audit.isApproved
            ? 'from-emerald-400 via-teal-500 to-cyan-500'
            : 'from-amber-500 via-rose-500 to-red-600'
        }`}
      />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              audit.isApproved
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <Gauge size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Match Ball Pressure Calibration
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Ref: {leadReferee} · Kit Lead: {kitManager}
            </p>
          </div>
        </div>
        {isCertified && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 size={12} /> FIFA Certified
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Real-time Digital Manometer Display */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400" /> Digital Manometer Reading
            </span>
            <span className="text-xs font-mono text-slate-400">
              Bar: <strong className="text-cyan-300 font-bold">{audit.barEquivalent} Bar</strong>
            </span>
          </div>

          <div className="flex items-baseline justify-between px-2">
            <span className="text-3xl font-bold font-mono text-cyan-300">
              {currentPsi.toFixed(1)} <span className="text-sm font-normal text-slate-400">PSI</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Optimal: {activeSpec.optimalPsi} PSI ({activeSpec.optimalBar} Bar)
            </span>
          </div>

          <input
            type="range"
            min="6.0"
            max="18.0"
            step="0.1"
            disabled={isCertified}
            value={currentPsi}
            onChange={(e) => setCurrentPsi(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Min: {activeSpec.minPsi} PSI</span>
            <span>FIFA Pro Standard</span>
            <span>Max: {activeSpec.maxPsi} PSI</span>
          </div>
        </div>

        {/* Standard Tournament Spec Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Select Calibration Tournament Standard
          </label>
          <div className="grid grid-cols-1 gap-2">
            {BALL_SPECS.map((spec) => {
              const selected = spec.id === selectedSpecId;
              return (
                <button
                  key={spec.id}
                  disabled={isCertified}
                  onClick={() => setSelectedSpecId(spec.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isCertified ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
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

        {/* Circumference & Tolerance Checker */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-amber-400" />
            <div>
              <p className="text-xs font-medium text-slate-200">Official Circumference (68.5 - 69.5 cm)</p>
              <p className="text-[10px] text-slate-500">Gauge check at 20°C standard ambient temperature</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="66.0"
              max="72.0"
              disabled={isCertified}
              value={circumferenceCm}
              onChange={(e) => setCircumferenceCm(Number(e.target.value))}
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-center font-mono text-slate-200"
            />
            <span className="text-xs text-slate-400">cm</span>
          </div>
        </div>

        {/* Multi-Ball System Plinth Tracking */}
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-2">
            Pitchside Multi-Ball System (6 Plinths Ready)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {MULTI_BALL_SYSTEM.map((b) => (
              <div
                key={b.id}
                className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                  <CircleDot size={11} className="text-cyan-400 shrink-0" />
                  <span className="text-slate-300 text-[11px] truncate">{b.label}</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 shrink-0">11.5 PSI</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Advisory Notice if out of spec */}
        {!audit.isApproved && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Calibration Required:</span> {audit.guidance}
            </div>
          </div>
        )}

        {/* Action Button or Certificate Docket */}
        {!isCertified ? (
          <button
            onClick={handleCertify}
            disabled={!audit.isApproved}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <ShieldCheck size={16} /> Sign Off Ball Inspection &amp; Lock Pressures
          </button>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-emerald-400" /> Ball Certified for Fixture Play
              </span>
              <span className="font-mono text-xs text-cyan-300 font-bold">
                {certDocket?.certToken}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Calibrated to <span className="font-semibold text-white">{certDocket?.measuredPsi} PSI ({certDocket?.measuredBar} Bar)</span>. Signed off by Referee {leadReferee} at {certDocket?.certifiedAt}.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-[11px] text-slate-400">
              <span>Circumference: {certDocket?.circumferenceCm} cm (FIFA Quality Pro)</span>
              <button
                onClick={handleReset}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={11} /> Re-test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

BallPressureCalibrationCard.propTypes = {
  matchId: PropTypes.string,
  leadReferee: PropTypes.string,
  kitManager: PropTypes.string,
  onCalibrationCertified: PropTypes.func,
};

BallPressureCalibrationCard.defaultProps = {
  matchId: 'MATCH-804',
  leadReferee: 'Howard Webb (Lead Official)',
  kitManager: 'Dave Wright (Head Kit Logistics)',
  onCalibrationCertified: null,
};
