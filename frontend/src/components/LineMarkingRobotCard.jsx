import { useState, useMemo } from 'react';
import { Bot, Paintbrush, CalendarCheck, CheckCircle2, AlertTriangle, Clock, Droplets, Ruler, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Static data mirroring pitchLineMarkingRobotScheduler constants
// ---------------------------------------------------------------------------

const ROBOT_MODELS = [
  { id: 'grassbot_elite', name: 'GrassBot Elite', tankL: 25, speedMMin: 30, gpsAccMm: 2, batteryMin: 240, nightOp: true },
  { id: 'turf_pro_x1', name: 'TurfPro X1', tankL: 20, speedMMin: 25, gpsAccMm: 3, batteryMin: 180, nightOp: true },
  { id: 'linemaster_3000', name: 'LineMaster 3000', tankL: 15, speedMMin: 18, gpsAccMm: 5, batteryMin: 120, nightOp: false },
];

const JOB_TYPES = [
  { id: 'FULL_PITCH', label: 'Full Pitch', lineM: 462, factor: 1.0 },
  { id: 'TOUCH_UP', label: 'Touch-Up', lineM: 69, factor: 0.15 },
  { id: 'PENALTY_BOX_ONLY', label: 'Penalty Box', lineM: 116, factor: 0.25 },
  { id: 'CENTRE_CIRCLE_ONLY', label: 'Centre Circle', lineM: 55, factor: 0.12 },
  { id: 'CUSTOM_ZONE', label: 'Custom Zone', lineM: 139, factor: 0.3 },
];

const PAINT_TYPES = [
  { id: 'water_based_white', label: 'Water-Based White', coverageM2L: 12, dryMin: 20 },
  { id: 'aerosol_marking', label: 'Aerosol Marking', coverageM2L: 10, dryMin: 10 },
  { id: 'uv_reactive', label: 'UV Reactive', coverageM2L: 8, dryMin: 30 },
];

const FIFA_WIDTH_MIN = 50;
const FIFA_WIDTH_MAX = 120;
const FIFA_WIDTH_REC = 80;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcPaintLitres(lineM, lineWidthMm, coverageM2L) {
  const areaM2 = lineM * (lineWidthMm / 1000);
  return Math.ceil((areaM2 / coverageM2L) * 10) / 10;
}

function calcDurationMin(lineM, speedMMin) {
  return Math.ceil(lineM / speedMMin);
}

function fifaCompliant(w) {
  return w >= FIFA_WIDTH_MIN && w <= FIFA_WIDTH_MAX;
}

function statusColor(status) {
  if (status === 'CERTIFIED') return 'text-emerald-400';
  if (status === 'IN_PROGRESS') return 'text-blue-400';
  if (status === 'FAILED') return 'text-red-400';
  if (status === 'CANCELLED') return 'text-slate-400';
  return 'text-amber-400';
}

function StatusPill({ status }) {
  const colors = {
    SCHEDULED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    COMPLETED: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    CERTIFIED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    FAILED: 'bg-red-500/20 text-red-300 border-red-500/30',
    CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[status] ?? colors.SCHEDULED}`}>
      {status}
    </span>
  );
}

StatusPill.propTypes = { status: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LineMarkingRobotCard({ pitchId, initialJobs }) {
  const [robotId, setRobotId] = useState(ROBOT_MODELS[0].id);
  const [jobType, setJobType] = useState(JOB_TYPES[0].id);
  const [paintId, setPaintId] = useState(PAINT_TYPES[0].id);
  const [lineWidthMm, setLineWidthMm] = useState(FIFA_WIDTH_REC);
  const [scheduledAt, setScheduledAt] = useState('');
  const [jobs, setJobs] = useState(initialJobs);
  const [dispatched, setDispatched] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [certifier, setCertifier] = useState('');
  const [certifyTarget, setCertifyTarget] = useState(null);

  const selectedRobot = useMemo(() => ROBOT_MODELS.find((r) => r.id === robotId), [robotId]);
  const selectedJobType = useMemo(() => JOB_TYPES.find((j) => j.id === jobType), [jobType]);
  const selectedPaint = useMemo(() => PAINT_TYPES.find((p) => p.id === paintId), [paintId]);

  const preview = useMemo(() => {
    if (!selectedRobot || !selectedJobType || !selectedPaint) return null;
    const lineM = selectedJobType.lineM;
    const paintL = calcPaintLitres(lineM, lineWidthMm, selectedPaint.coverageM2L);
    const durationMin = calcDurationMin(lineM, selectedRobot.speedMMin);
    const tankOk = paintL <= selectedRobot.tankL;
    const battOk = durationMin <= selectedRobot.batteryMin;
    return { lineM, paintL, durationMin, tankOk, battOk };
  }, [selectedRobot, selectedJobType, selectedPaint, lineWidthMm]);

  function handleDispatch() {
    if (!scheduledAt) return;
    const newJob = {
      jobId: `JOB-${Date.now()}`,
      pitchId,
      robot: { id: selectedRobot.id, name: selectedRobot.name },
      jobType: selectedJobType.id,
      jobTypeLabel: selectedJobType.label,
      paintId,
      paintLabel: selectedPaint.label,
      lineWidthMm,
      status: 'SCHEDULED',
      lineM: selectedJobType.lineM,
      paintLitres: preview.paintLitres,
      durationMin: preview.durationMin,
      scheduledAt,
      fifaCompliant: fifaCompliant(lineWidthMm),
      certifiedBy: null,
      certifiedAt: null,
    };
    setJobs((prev) => [newJob, ...prev]);
    setDispatched(newJob.jobId);
    setScheduledAt('');
    setTimeout(() => setDispatched(null), 4000);
  }

  function handleCertify(jobId) {
    if (!certifier.trim()) return;
    setJobs((prev) =>
      prev.map((j) =>
        j.jobId === jobId
          ? { ...j, status: 'CERTIFIED', certifiedBy: certifier.trim(), certifiedAt: new Date().toISOString() }
          : j,
      ),
    );
    setCertifyTarget(null);
    setCertifier('');
  }

  const fleetStats = useMemo(() => {
    const total = jobs.length;
    const certified = jobs.filter((j) => j.status === 'CERTIFIED').length;
    const scheduled = jobs.filter((j) => j.status === 'SCHEDULED').length;
    return { total, certified, scheduled };
  }, [jobs]);

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-400 to-teal-500" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-lime-500/10 border border-lime-500/20 mt-0.5">
          <Bot className="w-5 h-5 text-lime-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100 leading-tight">Line Marking Robot Scheduler</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            FIFA/UEFA compliant pitch line dispatch · Pitch&nbsp;
            <span className="font-mono text-lime-400">{pitchId}</span>
          </p>
        </div>
        {/* Fleet stats badges */}
        <div className="ml-auto flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            Total&nbsp;<strong className="text-white">{fleetStats.total}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">
            Certified&nbsp;<strong>{fleetStats.certified}</strong>
          </span>
          <span className="px-2 py-1 rounded-lg bg-amber-900/30 text-amber-300 border border-amber-700/30">
            Scheduled&nbsp;<strong>{fleetStats.scheduled}</strong>
          </span>
        </div>
      </div>

      {/* Dispatch form */}
      <div className="px-5 py-4 border-b border-slate-800/40 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Dispatch New Job</p>

        {/* Row 1: Robot + Job type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Robot Model</label>
            <select
              value={robotId}
              onChange={(e) => setRobotId(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500"
            >
              {ROBOT_MODELS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {selectedRobot && (
              <p className="text-xs text-slate-500 mt-1">
                {selectedRobot.speedMMin} m/min · {selectedRobot.gpsAccMm} mm GPS · {selectedRobot.batteryMin} min battery
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Job Type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500"
            >
              {JOB_TYPES.map((j) => (
                <option key={j.id} value={j.id}>{j.label} (~{j.lineM} m)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Paint + Line width */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Paint Type</label>
            <select
              value={paintId}
              onChange={(e) => setPaintId(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500"
            >
              {PAINT_TYPES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 flex justify-between">
              <span>Line Width (mm)</span>
              <span className={fifaCompliant(lineWidthMm) ? 'text-lime-400' : 'text-red-400'}>
                {fifaCompliant(lineWidthMm) ? '✓ FIFA OK' : '✗ Out of spec'}
              </span>
            </label>
            <input
              type="number"
              min={FIFA_WIDTH_MIN}
              max={FIFA_WIDTH_MAX}
              value={lineWidthMm}
              onChange={(e) => setLineWidthMm(Number(e.target.value))}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500"
            />
          </div>
        </div>

        {/* Row 3: Schedule datetime */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Schedule Date &amp; Time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-lime-500"
          />
        </div>

        {/* Preview card */}
        {preview && (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/40 p-3 grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-lime-300">{preview.lineM} m</div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><Ruler className="w-3 h-3" /> Line</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${preview.paintL <= (selectedRobot?.tankL ?? 999) ? 'text-cyan-300' : 'text-red-400'}`}>{preview.paintL} L</div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><Droplets className="w-3 h-3" /> Paint</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${preview.battOk ? 'text-emerald-300' : 'text-red-400'}`}>{preview.durationMin} min</div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-300">{selectedPaint?.dryMin} min</div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><Paintbrush className="w-3 h-3" /> Dry</div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {preview && (!preview.tankOk || !preview.battOk) && (
          <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              {!preview.tankOk && `Paint required (${preview.paintL} L) exceeds tank capacity (${selectedRobot?.tankL} L). `}
              {!preview.battOk && `Duration (${preview.durationMin} min) exceeds battery life (${selectedRobot?.batteryMin} min).`}
            </span>
          </div>
        )}

        {/* Dispatch button / success */}
        {dispatched ? (
          <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-4 py-2">
            <CheckCircle2 className="w-4 h-4" />
            Job <span className="font-mono text-xs">{dispatched}</span> dispatched successfully
          </div>
        ) : (
          <button
            onClick={handleDispatch}
            disabled={!scheduledAt || !fifaCompliant(lineWidthMm)}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
          >
            🤖 Dispatch Robot
          </button>
        )}
      </div>

      {/* Job log */}
      <div className="px-5 py-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Job Log</p>
        {jobs.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-4">No jobs scheduled yet.</p>
        )}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {jobs.map((job) => (
            <div key={job.jobId} className="rounded-xl bg-slate-800/50 border border-slate-700/40 overflow-hidden">
              {/* Job summary row */}
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpanded((prev) => (prev === job.jobId ? null : job.jobId))}
              >
                <Bot className={`w-4 h-4 flex-shrink-0 ${statusColor(job.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{job.robot?.name} — {job.jobTypeLabel ?? job.jobType}</p>
                  <p className="text-xs text-slate-500 font-mono truncate">{job.jobId}</p>
                </div>
                <StatusPill status={job.status} />
                {expanded === job.jobId
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {/* Expanded detail */}
              {expanded === job.jobId && (
                <div className="border-t border-slate-700/30 px-3 py-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-slate-400">Line Width</div>
                      <div className={`font-bold ${fifaCompliant(job.lineWidthMm) ? 'text-lime-300' : 'text-red-400'}`}>{job.lineWidthMm} mm</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-slate-400">Paint</div>
                      <div className="font-bold text-cyan-300">{job.paintLabel ?? job.paintId}</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-slate-400">FIFA</div>
                      <div className={`font-bold ${job.fifaCompliant ? 'text-emerald-300' : 'text-red-400'}`}>
                        {job.fifaCompliant ? '✓ OK' : '✗ Fail'}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500">Scheduled: </span>
                    <span className="text-slate-300">{new Date(job.scheduledAt).toLocaleString()}</span>
                  </div>

                  {/* Certify section */}
                  {job.status === 'COMPLETED' && (
                    <div>
                      {certifyTarget === job.jobId ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            value={certifier}
                            onChange={(e) => setCertifier(e.target.value)}
                            placeholder="Certifying official name"
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={() => handleCertify(job.jobId)}
                            className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs text-white font-semibold"
                          >
                            Sign Off
                          </button>
                          <button
                            onClick={() => setCertifyTarget(null)}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCertifyTarget(job.jobId)}
                          className="mt-1 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-700/30 text-xs text-emerald-300 hover:bg-emerald-800/40 transition-colors"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" /> Certify &amp; Sign Off
                        </button>
                      )}
                    </div>
                  )}

                  {job.status === 'CERTIFIED' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Certified by <strong>{job.certifiedBy}</strong> · {new Date(job.certifiedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

LineMarkingRobotCard.propTypes = {
  pitchId: PropTypes.string,
  initialJobs: PropTypes.arrayOf(
    PropTypes.shape({
      jobId: PropTypes.string.isRequired,
      robot: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
      jobType: PropTypes.string,
      jobTypeLabel: PropTypes.string,
      paintId: PropTypes.string,
      paintLabel: PropTypes.string,
      lineWidthMm: PropTypes.number,
      status: PropTypes.string,
      scheduledAt: PropTypes.string,
      fifaCompliant: PropTypes.bool,
      certifiedBy: PropTypes.string,
      certifiedAt: PropTypes.string,
    }),
  ),
};

LineMarkingRobotCard.defaultProps = {
  pitchId: 'PITCH-A1',
  initialJobs: [],
};
