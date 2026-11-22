import { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Siren,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  DoorOpen,
} from 'lucide-react';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Constants mirroring pitchCrowdDensityMonitorEngine
// ---------------------------------------------------------------------------

const DENSITY_THRESHOLDS = { SAFE: 2.0, MODERATE: 3.0, HIGH: 4.0, CRITICAL: 4.7 };

const ALERT_LEVELS = {
  NORMAL: 'NORMAL',
  MONITOR: 'MONITOR',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  CRUSH_RISK: 'CRUSH_RISK',
};

const MIN_EXIT_FLOW_PPM = 82; // persons per minute per metre of exit width

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcDensity(occupancy, areaM2) {
  return Math.round((occupancy / areaM2) * 100) / 100;
}

function calcOccupancyPct(occupancy, capacity) {
  return Math.round((occupancy / capacity) * 1000) / 10;
}

function calcEvacMin(occupancy, exitWidthsM) {
  const totalW = exitWidthsM.reduce((s, w) => s + w, 0);
  const flowPPM = Math.round(totalW * MIN_EXIT_FLOW_PPM);
  return Math.ceil(occupancy / Math.max(flowPPM, 1));
}

function getAlertLevel(density) {
  if (density > DENSITY_THRESHOLDS.CRITICAL)  return ALERT_LEVELS.CRUSH_RISK;
  if (density > DENSITY_THRESHOLDS.HIGH)      return ALERT_LEVELS.CRITICAL;
  if (density > DENSITY_THRESHOLDS.MODERATE)  return ALERT_LEVELS.WARNING;
  if (density > DENSITY_THRESHOLDS.SAFE)      return ALERT_LEVELS.MONITOR;
  return ALERT_LEVELS.NORMAL;
}

function alertConfig(level) {
  const map = {
    NORMAL:     { label: 'Normal',     color: 'emerald', bar: 'bg-emerald-500', text: 'text-emerald-300', border: 'border-emerald-700/40', bg: 'bg-emerald-900/20' },
    MONITOR:    { label: 'Monitor',    color: 'blue',    bar: 'bg-blue-500',    text: 'text-blue-300',    border: 'border-blue-700/40',    bg: 'bg-blue-900/20' },
    WARNING:    { label: 'Warning',    color: 'amber',   bar: 'bg-amber-500',   text: 'text-amber-300',   border: 'border-amber-700/40',   bg: 'bg-amber-900/20' },
    CRITICAL:   { label: 'Critical',   color: 'orange',  bar: 'bg-orange-500',  text: 'text-orange-300',  border: 'border-orange-700/40',  bg: 'bg-orange-900/20' },
    CRUSH_RISK: { label: 'CRUSH RISK', color: 'red',     bar: 'bg-red-500',     text: 'text-red-300',     border: 'border-red-700/40',     bg: 'bg-red-900/30' },
  };
  return map[level] ?? map.NORMAL;
}

function densityBarWidth(density) {
  // Map 0–6 p/m² to 0–100%
  return Math.min(100, Math.round((density / 6) * 100));
}

function ActionText({ level }) {
  const actions = {
    NORMAL:     'Normal operation — no action required.',
    MONITOR:    'Monitor closely — stewards on standby.',
    WARNING:    'Hold further ingress — open extra exit lanes.',
    CRITICAL:   'Begin controlled zone clearance — redirect crowd.',
    CRUSH_RISK: 'IMMEDIATE EVACUATION — activate PA & deploy all stewards.',
  };
  return <span>{actions[level] ?? actions.NORMAL}</span>;
}
ActionText.propTypes = { level: PropTypes.string.isRequired };

function TrendIcon({ trend }) {
  if (trend === 'RISING')  return <ArrowUp  className="w-3.5 h-3.5 text-red-400" />;
  if (trend === 'FALLING') return <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}
TrendIcon.propTypes = { trend: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CrowdDensityMonitorCard({ venueId, initialZones }) {
  const [zones, setZones] = useState(
    initialZones.map((z) => ({ ...z, occupancy: z.occupancy ?? 0, history: [] })),
  );
  const [selectedZoneId, setSelectedZoneId] = useState(initialZones[0]?.zoneId ?? null);
  const [showEvacPlan, setShowEvacPlan] = useState(false);

  // -------------------------------------------------------------------------
  // Derived snapshots
  // -------------------------------------------------------------------------

  const snapshots = useMemo(
    () =>
      zones.map((z) => {
        const density = calcDensity(z.occupancy, z.areaM2);
        const alertLevel = getAlertLevel(density);
        const occupancyPct = calcOccupancyPct(z.occupancy, z.capacityPersons);
        const evacuationMin = calcEvacMin(z.occupancy, z.exitWidthsM);
        const headroom = Math.max(0, z.capacityPersons - z.occupancy);
        const trend =
          z.history.length >= 2
            ? z.history[z.history.length - 1].occupancy - z.history[0].occupancy > 50
              ? 'RISING'
              : z.history[z.history.length - 1].occupancy - z.history[0].occupancy < -50
              ? 'FALLING'
              : 'STABLE'
            : 'STABLE';
        return { ...z, density, alertLevel, occupancyPct, evacuationMin, headroom, trend };
      }),
    [zones],
  );

  const selectedSnap = useMemo(
    () => snapshots.find((s) => s.zoneId === selectedZoneId) ?? snapshots[0],
    [snapshots, selectedZoneId],
  );

  // Venue-wide aggregates
  const venueStats = useMemo(() => {
    const totalOcc = snapshots.reduce((s, z) => s + z.occupancy, 0);
    const totalCap = snapshots.reduce((s, z) => s + z.capacityPersons, 0);
    const levelOrder = ['NORMAL', 'MONITOR', 'WARNING', 'CRITICAL', 'CRUSH_RISK'];
    const worstLevel = snapshots.reduce((best, z) =>
      levelOrder.indexOf(z.alertLevel) > levelOrder.indexOf(best) ? z.alertLevel : best,
    ALERT_LEVELS.NORMAL);
    const criticalCount = snapshots.filter(
      (z) => z.alertLevel === 'CRITICAL' || z.alertLevel === 'CRUSH_RISK',
    ).length;
    return {
      totalOcc,
      totalCap,
      pct: calcOccupancyPct(totalOcc, Math.max(totalCap, 1)),
      worstLevel,
      criticalCount,
    };
  }, [snapshots]);

  // Sorted evacuation plan (worst first)
  const evacPlan = useMemo(() => {
    const order = { CRUSH_RISK: 0, CRITICAL: 1, WARNING: 2, MONITOR: 3, NORMAL: 4 };
    return [...snapshots].sort((a, b) => order[a.alertLevel] - order[b.alertLevel]);
  }, [snapshots]);

  // -------------------------------------------------------------------------
  // Occupancy editor
  // -------------------------------------------------------------------------

  function adjustOccupancy(zoneId, delta) {
    setZones((prev) =>
      prev.map((z) => {
        if (z.zoneId !== zoneId) return z;
        const newOcc = Math.max(0, z.occupancy + delta);
        const history = [
          ...z.history.slice(-9),
          { occupancy: newOcc, recordedAt: new Date().toISOString() },
        ];
        return { ...z, occupancy: newOcc, history };
      }),
    );
  }

  function setOccupancy(zoneId, value) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return;
    setZones((prev) =>
      prev.map((z) => {
        if (z.zoneId !== zoneId) return z;
        const history = [
          ...z.history.slice(-9),
          { occupancy: parsed, recordedAt: new Date().toISOString() },
        ];
        return { ...z, occupancy: parsed, history };
      }),
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const venueConf = alertConfig(venueStats.worstLevel);

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
      {/* Accent bar — changes colour with venue alert level */}
      <div className={`h-1 bg-gradient-to-r ${
        venueStats.worstLevel === 'CRUSH_RISK' ? 'from-red-600 via-red-500 to-rose-500' :
        venueStats.worstLevel === 'CRITICAL'   ? 'from-orange-600 via-orange-500 to-amber-500' :
        venueStats.worstLevel === 'WARNING'    ? 'from-amber-600 via-yellow-500 to-amber-400' :
        venueStats.worstLevel === 'MONITOR'    ? 'from-blue-600 via-blue-400 to-cyan-500' :
                                                 'from-emerald-600 via-teal-500 to-cyan-500'
      }`} />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-start gap-3">
        <div className={`p-2 rounded-xl border mt-0.5 ${venueConf.bg} ${venueConf.border}`}>
          <Users className={`w-5 h-5 ${venueConf.text}`} />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-100 leading-tight">Crowd Density Monitor</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Venue <span className={`font-mono ${venueConf.text}`}>{venueId}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            {snapshots.length} zone{snapshots.length !== 1 ? 's' : ''}
            <span className="mx-1.5 text-slate-600">·</span>
            UK Green Guide v6
          </p>
        </div>
        {/* Venue-level alert badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${venueConf.bg} ${venueConf.border} ${venueConf.text}`}>
          {venueStats.worstLevel === 'CRUSH_RISK' || venueStats.worstLevel === 'CRITICAL'
            ? <Siren className="w-3.5 h-3.5" />
            : venueStats.worstLevel === 'WARNING'
            ? <AlertTriangle className="w-3.5 h-3.5" />
            : <CheckCircle2 className="w-3.5 h-3.5" />}
          {venueConf.label}
        </div>
      </div>

      {/* Venue KPI strip */}
      <div className="px-5 py-3 border-b border-slate-800/40 grid grid-cols-4 gap-2">
        {[
          { label: 'Total Occ.', value: venueStats.totalOcc.toLocaleString(), sub: `of ${venueStats.totalCap.toLocaleString()}`, icon: Users, color: 'text-slate-200' },
          { label: 'Fill Rate', value: `${venueStats.pct}%`, sub: 'capacity', icon: TrendingUp, color: venueStats.pct > 100 ? 'text-red-400' : venueStats.pct > 85 ? 'text-amber-300' : 'text-emerald-300' },
          { label: 'Alert Zones', value: venueStats.criticalCount, sub: 'critical/crush', icon: ShieldAlert, color: venueStats.criticalCount > 0 ? 'text-red-400' : 'text-emerald-300' },
          { label: 'Zones', value: snapshots.length, sub: 'monitored', icon: Eye, color: 'text-blue-300' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-800/50 rounded-xl px-2.5 py-2 text-center">
            <div className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-slate-400">{kpi.label}</div>
            <div className="text-xs text-slate-600">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Zone list */}
      <div className="px-5 py-3 border-b border-slate-800/40">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Zone Overview</p>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {snapshots.map((snap) => {
            const conf = alertConfig(snap.alertLevel);
            const isSelected = snap.zoneId === selectedZoneId;
            return (
              <button
                key={snap.zoneId}
                onClick={() => setSelectedZoneId(snap.zoneId)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                  isSelected ? `${conf.bg} ${conf.border}` : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conf.bar}`} />
                  <span className="text-xs font-semibold text-slate-200 flex-1 truncate">{snap.name}</span>
                  <span className={`text-xs font-bold ${conf.text}`}>{conf.label}</span>
                  <TrendIcon trend={snap.trend} />
                </div>
                {/* Density bar */}
                <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${conf.bar}`}
                    style={{ width: `${densityBarWidth(snap.density)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{snap.occupancy.toLocaleString()} / {snap.capacityPersons.toLocaleString()} persons</span>
                  <span>{snap.density} p/m²</span>
                  <span className={snap.occupancyPct > 100 ? 'text-red-400' : 'text-slate-400'}>{snap.occupancyPct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected zone detail */}
      {selectedSnap && (
        <div className="px-5 py-3 border-b border-slate-800/40">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Zone Detail — <span className="text-slate-200 normal-case font-normal">{selectedSnap.name}</span>
          </p>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Density', value: `${selectedSnap.density} p/m²`, color: alertConfig(selectedSnap.alertLevel).text },
              { label: 'Headroom', value: selectedSnap.headroom.toLocaleString(), color: selectedSnap.headroom === 0 ? 'text-red-400' : 'text-emerald-300' },
              { label: 'Evac Time', value: `${selectedSnap.evacuationMin} min`, color: selectedSnap.evacuationMin > 8 ? 'text-amber-400' : 'text-emerald-300', icon: DoorOpen },
            ].map((m) => (
              <div key={m.label} className="bg-slate-800/50 rounded-xl px-2.5 py-2 text-center">
                <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Alert action banner */}
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs border mb-3 ${alertConfig(selectedSnap.alertLevel).bg} ${alertConfig(selectedSnap.alertLevel).border} ${alertConfig(selectedSnap.alertLevel).text}`}>
            {selectedSnap.alertLevel === 'CRUSH_RISK' || selectedSnap.alertLevel === 'CRITICAL'
              ? <Siren className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              : <Activity className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
            <ActionText level={selectedSnap.alertLevel} />
          </div>

          {/* Occupancy adjuster */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Adjust Occupancy (live update)</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustOccupancy(selectedSnap.zoneId, -100)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 font-bold transition-colors"
              >−100</button>
              <button
                onClick={() => adjustOccupancy(selectedSnap.zoneId, -10)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 font-bold transition-colors"
              >−10</button>
              <input
                type="number"
                min="0"
                value={selectedSnap.occupancy}
                onChange={(e) => setOccupancy(selectedSnap.zoneId, e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-center font-bold text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => adjustOccupancy(selectedSnap.zoneId, 10)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 font-bold transition-colors"
              >+10</button>
              <button
                onClick={() => adjustOccupancy(selectedSnap.zoneId, 100)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 font-bold transition-colors"
              >+100</button>
            </div>
            {selectedSnap.history.length > 0 && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendIcon trend={selectedSnap.trend} />
                Trend: <span className="text-slate-300">{selectedSnap.trend}</span>
                {selectedSnap.history.length >= 2 && (
                  <span className="ml-1">
                    ({selectedSnap.history[selectedSnap.history.length - 1].occupancy - selectedSnap.history[0].occupancy > 0 ? '+' : ''}
                    {selectedSnap.history[selectedSnap.history.length - 1].occupancy - selectedSnap.history[0].occupancy} over {selectedSnap.history.length} readings)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Evacuation plan panel */}
      <div className="px-5 py-3">
        <button
          onClick={() => setShowEvacPlan((p) => !p)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-300 transition-colors mb-1"
        >
          <span className="flex items-center gap-2">
            <DoorOpen className="w-3.5 h-3.5 text-red-400" /> Evacuation Plan (priority order)
          </span>
          {showEvacPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showEvacPlan && (
          <div className="space-y-1.5 mt-2">
            {evacPlan.map((snap, idx) => {
              const conf = alertConfig(snap.alertLevel);
              return (
                <div
                  key={snap.zoneId}
                  className={`rounded-xl border px-3 py-2 ${conf.bg} ${conf.border}`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                    <span className="text-xs font-semibold text-slate-200 flex-1">{snap.name}</span>
                    <span className={`text-xs font-bold ${conf.text}`}>{conf.label}</span>
                  </div>
                  <p className={`text-xs ml-7 ${conf.text}`}>
                    <ActionText level={snap.alertLevel} />
                  </p>
                  <p className="text-xs text-slate-500 ml-7 mt-0.5">
                    {snap.occupancy.toLocaleString()} persons · est. {snap.evacuationMin} min to evacuate
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

CrowdDensityMonitorCard.propTypes = {
  venueId: PropTypes.string,
  initialZones: PropTypes.arrayOf(
    PropTypes.shape({
      zoneId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      capacityPersons: PropTypes.number.isRequired,
      areaM2: PropTypes.number.isRequired,
      exitWidthsM: PropTypes.arrayOf(PropTypes.number).isRequired,
      occupancy: PropTypes.number,
    }),
  ),
};

CrowdDensityMonitorCard.defaultProps = {
  venueId: 'VENUE-001',
  initialZones: [
    { zoneId: 'Z-NORTH', name: 'North Terrace',   type: 'TERRACE',   capacityPersons: 5000, areaM2: 1500, exitWidthsM: [2.4, 2.4, 1.8], occupancy: 3200 },
    { zoneId: 'Z-SOUTH', name: 'South Stand',     type: 'SEATED',    capacityPersons: 3500, areaM2: 1050, exitWidthsM: [2.4, 2.4],       occupancy: 2800 },
    { zoneId: 'Z-EAST',  name: 'East Concourse',  type: 'CONCOURSE', capacityPersons: 1200, areaM2: 600,  exitWidthsM: [2.0, 2.0],       occupancy: 450  },
    { zoneId: 'Z-WEST',  name: 'West Gate',       type: 'ENTRY_GATE',capacityPersons: 800,  areaM2: 320,  exitWidthsM: [3.0],             occupancy: 120  },
  ],
};
