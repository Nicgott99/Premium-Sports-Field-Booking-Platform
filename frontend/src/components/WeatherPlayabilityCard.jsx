import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  CloudRain,
  Wind,
  Thermometer,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileBadge,
  RefreshCw,
} from 'lucide-react';

const PITCH_PROFILES = [
  { id: 'FOOTBALL_3G_SYNTHETIC', label: '3G Synthetic Turf (Football)', maxWind: 65, maxSat: 88 },
  { id: 'FOOTBALL_NATURAL_GRASS', label: 'Natural Hybrid Grass (Football)', maxWind: 60, maxSat: 78 },
  { id: 'RUGBY_UNION', label: 'Rugby Union Championship Pitch', maxWind: 75, maxSat: 92 },
];

/**
 * WeatherPlayabilityCard
 * 
 * Pitchside environmental intelligence card for referees, groundskeepers, and match captains.
 * Monitors turf soil saturation, surface temperature, wind velocity, and lightning safety radius.
 */
export default function WeatherPlayabilityCard({
  pitchName,
  initialProfile,
  onCertificateIssued,
}) {
  const [selectedProfile, setSelectedProfile] = useState(initialProfile || 'FOOTBALL_3G_SYNTHETIC');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState({
    soilSaturationPct: 42,
    surfaceTempC: 16.4,
    windSpeedKmh: 24,
    rainRateMmPerHour: 2.1,
    lightningDistanceKm: 68,
  });

  const activeProfileConfig = useMemo(() => {
    return PITCH_PROFILES.find((p) => p.id === selectedProfile) || PITCH_PROFILES[0];
  }, [selectedProfile]);

  // Derived evaluation
  const evaluation = useMemo(() => {
    const hazards = [];
    if (telemetry.lightningDistanceKm <= 10) {
      hazards.push({ title: 'Lightning Hazard', desc: 'Lightning detected within 10 km. Immediate suspension required.' });
    }
    if (telemetry.windSpeedKmh >= activeProfileConfig.maxWind) {
      hazards.push({ title: 'Gale Force Wind', desc: `Wind gusts (${telemetry.windSpeedKmh} km/h) exceed safety threshold.` });
    }
    if (telemetry.soilSaturationPct >= activeProfileConfig.maxSat) {
      hazards.push({ title: 'Waterlogged Turf', desc: `Soil saturation at ${telemetry.soilSaturationPct}% impairs safe traction.` });
    }
    if (telemetry.surfaceTempC <= 1.0) {
      hazards.push({ title: 'Frozen Surface', desc: 'Pitch sub-base frost risk creating severe stud slip hazard.' });
    }

    const isPlayable = hazards.length === 0;
    const playabilityScore = isPlayable ? Math.max(75, 100 - telemetry.soilSaturationPct * 0.3) : 25;

    return {
      isPlayable,
      hazards,
      playabilityScore: Math.round(playabilityScore),
      certificateId: isPlayable ? `CERT-PITCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null,
    };
  }, [telemetry, activeProfileConfig]);

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        soilSaturationPct: Math.floor(38 + Math.random() * 15),
        surfaceTempC: Math.round((14 + Math.random() * 5) * 10) / 10,
        windSpeedKmh: Math.floor(18 + Math.random() * 12),
      }));
      setIsRefreshing(false);
    }, 500);
  };

  const handleIssueCert = () => {
    if (onCertificateIssued && evaluation.certificateId) {
      onCertificateIssued({
        certificateId: evaluation.certificateId,
        pitchName,
        profile: selectedProfile,
        score: evaluation.playabilityScore,
      });
    }
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Gradient Status Indicator */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${
          evaluation.isPlayable
            ? 'from-emerald-400 via-teal-500 to-cyan-500'
            : 'from-rose-500 via-amber-500 to-red-600'
        }`}
      />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              evaluation.isPlayable
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <CloudRain size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Pitch Weather &amp; Playability Radar
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {pitchName} · Live Sub-Surface Telemetry
            </p>
          </div>
        </div>
        <button
          onClick={handleSimulateRefresh}
          className="p-2 text-slate-400 hover:text-cyan-300 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          title="Poll Ground Sensors"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Profile Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
            Turf Standard &amp; Sport Spec
          </label>
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {PITCH_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Live Environmental Sensor Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
              <CloudRain size={11} className="text-cyan-400" /> Moisture
            </span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {telemetry.soilSaturationPct}%
            </span>
            <span className="text-[9px] text-slate-500">Max: {activeProfileConfig.maxSat}%</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
              <Wind size={11} className="text-indigo-400" /> Wind Gusts
            </span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {telemetry.windSpeedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
            </span>
            <span className="text-[9px] text-slate-500">Cap: {activeProfileConfig.maxWind} km/h</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
              <Thermometer size={11} className="text-amber-400" /> Surface
            </span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {telemetry.surfaceTempC}°C
            </span>
            <span className="text-[9px] text-emerald-400">Optimal traction</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
              <Zap size={11} className="text-yellow-400" /> Lightning
            </span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {telemetry.lightningDistanceKm} <span className="text-[10px] font-normal text-slate-400">km</span>
            </span>
            <span className="text-[9px] text-slate-500">Safe (&gt;10 km)</span>
          </div>
        </div>

        {/* Status Verdict Banner */}
        <div
          className={`border rounded-xl p-4 flex items-start gap-3 ${
            evaluation.isPlayable
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}
        >
          {evaluation.isPlayable ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  evaluation.isPlayable ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {evaluation.isPlayable ? 'Pitch Certified Playable' : 'Play Unsafe / Fixture Delayed'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                Score: {evaluation.playabilityScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {evaluation.isPlayable
                ? 'Turf drainage and surface temperatures meet standard governing requirements for competitive fixture play.'
                : 'Current conditions exceed structural safety limits. Suspension protocol active.'}
            </p>
          </div>
        </div>

        {/* Hazard List if unplayable */}
        {evaluation.hazards.length > 0 && (
          <div className="flex flex-col gap-2">
            {evaluation.hazards.map((h) => (
              <div
                key={h.title}
                className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200"
              >
                <AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{h.title}:</span> {h.desc}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificate Section */}
        {evaluation.isPlayable && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileBadge size={18} className="text-cyan-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Official Playability Clearance</p>
                <p className="text-[11px] font-mono text-cyan-300">{evaluation.certificateId}</p>
              </div>
            </div>
            <button
              onClick={handleIssueCert}
              className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign Clearance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

WeatherPlayabilityCard.propTypes = {
  pitchName: PropTypes.string,
  initialProfile: PropTypes.string,
  onCertificateIssued: PropTypes.func,
};

WeatherPlayabilityCard.defaultProps = {
  pitchName: 'All-Weather Stadium Pitch 1',
  initialProfile: 'FOOTBALL_3G_SYNTHETIC',
  onCertificateIssued: null,
};
