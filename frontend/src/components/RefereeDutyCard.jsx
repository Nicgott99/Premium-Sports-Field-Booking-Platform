import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  Activity,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Users,
} from 'lucide-react';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Static reference data (mirrors matchDayRefereeSupportEngine constants)
// ---------------------------------------------------------------------------

const REFEREE_GRADES = [
  { id: 'fifa_international', label: 'FIFA International', maxLevel: 1 },
  { id: 'national_a', label: 'National A', maxLevel: 2 },
  { id: 'national_b', label: 'National B', maxLevel: 3 },
  { id: 'regional', label: 'Regional', maxLevel: 4 },
  { id: 'grassroots', label: 'Grassroots', maxLevel: 5 },
];

const OFFICIAL_ROLES = [
  { id: 'CENTRE_REFEREE', label: 'Centre Referee', required: true },
  { id: 'ASSISTANT_REFEREE_1', label: 'AR 1', required: true },
  { id: 'ASSISTANT_REFEREE_2', label: 'AR 2', required: true },
  { id: 'FOURTH_OFFICIAL', label: '4th Official', required: false },
  { id: 'VAR_OPERATOR', label: 'VAR', required: false },
  { id: 'AVAR_OPERATOR', label: 'AVAR', required: false },
];

const FITNESS_OPTIONS = ['FIT', 'MINOR_ISSUE', 'UNFIT', 'PENDING_ASSESSMENT'];
const CERT_WARN_DAYS = 30;
const MIN_REST_HOURS = 48;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysUntil(isoDate) {
  return Math.floor((new Date(isoDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function certStatus(isoDate) {
  const d = daysUntil(isoDate);
  if (d < 0) return 'EXPIRED';
  if (d <= CERT_WARN_DAYS) return 'EXPIRING_SOON';
  return 'CURRENT';
}

function restHours(lastMatchAt, nextKickoff) {
  if (!lastMatchAt) return Infinity;
  return Math.round(((new Date(nextKickoff) - new Date(lastMatchAt)) / (1000 * 60 * 60)) * 10) / 10;
}

function gradeLabel(id) {
  return REFEREE_GRADES.find((g) => g.id === id)?.label ?? id;
}

function certBadge(status) {
  if (status === 'CURRENT') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (status === 'EXPIRING_SOON') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
}

function fitnessBadge(status) {
  if (status === 'FIT') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (status === 'MINOR_ISSUE') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  if (status === 'UNFIT') return 'bg-red-500/20 text-red-300 border-red-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

function assignmentStatusBadge(s) {
  const map = {
    PENDING: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    CHECKED_IN: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    MATCH_STARTED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    WITHDREW: 'bg-red-500/20 text-red-300 border-red-500/30',
    NO_SHOW: 'bg-red-900/40 text-red-400 border-red-700/30',
  };
  return map[s] ?? map.PENDING;
}

function Pill({ label, colorClass }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
}
Pill.propTypes = { label: PropTypes.string.isRequired, colorClass: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RefereeDutyCard({ matchId, matchKickoffAt, leagueLevel, initialReferees, initialAssignments }) {
  // Referee roster state
  const [referees, setReferees] = useState(initialReferees);

  // New referee form
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState(REFEREE_GRADES[0].id);
  const [newRoles, setNewRoles] = useState(['CENTRE_REFEREE']);
  const [newCertExpiry, setNewCertExpiry] = useState('');
  const [newFitness, setNewFitness] = useState('FIT');
  const [rosterExpanded, setRosterExpanded] = useState(false);

  // Assignment state
  const [assignments, setAssignments] = useState(initialAssignments);
  const [assignRefId, setAssignRefId] = useState('');
  const [assignRole, setAssignRole] = useState(OFFICIAL_ROLES[0].id);
  const [assignSuccess, setAssignSuccess] = useState(null);

  // Sign-off state
  const [signOffTarget, setSignOffTarget] = useState(null);
  const [signOffName, setSignOffName] = useState('');

  // Expanded assignment
  const [expandedAsgn, setExpandedAsgn] = useState(null);

  // Add referee to roster
  function handleAddReferee() {
    if (!newName.trim() || !newCertExpiry) return;
    const ref = {
      refereeId: `REF-${Date.now()}`,
      name: newName.trim(),
      gradeId: newGrade,
      qualifiedRoles: newRoles,
      certExpiryDate: newCertExpiry,
      fitnessStatus: newFitness,
      lastMatchAt: null,
    };
    setReferees((prev) => [...prev, ref]);
    setNewName('');
    setNewCertExpiry('');
    setNewRoles(['CENTRE_REFEREE']);
  }

  function toggleRole(roleId) {
    setNewRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId],
    );
  }

  // Create assignment
  function handleAssign() {
    if (!assignRefId) return;
    const ref = referees.find((r) => r.refereeId === assignRefId);
    if (!ref) return;

    const grade = REFEREE_GRADES.find((g) => g.id === ref.gradeId);
    const isEligibleGrade = grade ? leagueLevel >= grade.maxLevel : false;
    const isQualifiedRole = ref.qualifiedRoles.includes(assignRole);
    const cert = certStatus(ref.certExpiryDate);
    const rest = restHours(ref.lastMatchAt, matchKickoffAt);

    const reasons = [];
    if (!isEligibleGrade) reasons.push(`Grade insufficient for league level ${leagueLevel}`);
    if (!isQualifiedRole) reasons.push(`Not qualified for role ${assignRole}`);
    if (cert === 'EXPIRED') reasons.push('Certification expired');
    if (ref.fitnessStatus === 'UNFIT') reasons.push('Referee is UNFIT');

    const newAsgn = {
      assignmentId: `ASGN-${Date.now()}`,
      matchId,
      refereeId: ref.refereeId,
      refereeName: ref.name,
      role: assignRole,
      roleLabel: OFFICIAL_ROLES.find((r) => r.id === assignRole)?.label ?? assignRole,
      matchKickoffAt,
      status: 'PENDING',
      eligibility: { eligible: reasons.length === 0, reasons },
      certStatus: cert,
      certDaysRemaining: daysUntil(ref.certExpiryDate),
      restOk: rest >= MIN_REST_HOURS,
      restHours: rest === Infinity ? '∞' : rest,
      fitnessStatus: ref.fitnessStatus,
      preMatchSignOff: false,
      signOffBy: null,
      signOffAt: null,
    };

    setAssignments((prev) => [...prev, newAsgn]);
    setAssignSuccess(newAsgn.assignmentId);
    setTimeout(() => setAssignSuccess(null), 3500);
  }

  // Sign off
  function handleSignOff(asgnId) {
    if (!signOffName.trim()) return;
    setAssignments((prev) =>
      prev.map((a) =>
        a.assignmentId === asgnId
          ? { ...a, status: 'CONFIRMED', preMatchSignOff: true, signOffBy: signOffName.trim(), signOffAt: new Date().toISOString() }
          : a,
      ),
    );
    setSignOffTarget(null);
    setSignOffName('');
  }

  // Panel readiness
  const panelStatus = useMemo(() => {
    const requiredIds = OFFICIAL_ROLES.filter((r) => r.required).map((r) => r.id);
    const coveredRoles = assignments.map((a) => a.role);
    const missing = requiredIds.filter((r) => !coveredRoles.includes(r));
    const allSigned = assignments.length > 0 && assignments.every((a) => a.preMatchSignOff);
    const anyIneligible = assignments.some((a) => !a.eligibility.eligible);
    return {
      ready: missing.length === 0 && allSigned && !anyIneligible,
      missing,
      allSigned,
      anyIneligible,
      total: assignments.length,
      confirmed: assignments.filter((a) => a.preMatchSignOff).length,
    };
  }, [assignments]);

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-500" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 mt-0.5">
          <ShieldCheck className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-100 leading-tight">Referee Duty Manager</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Match <span className="font-mono text-violet-400">{matchId}</span> · Kickoff{' '}
            <span className="text-slate-300">{new Date(matchKickoffAt).toLocaleString()}</span>
            {' '}· League Lvl <span className="text-violet-300">{leagueLevel}</span>
          </p>
        </div>
        {/* Panel status badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            panelStatus.ready
              ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/30'
              : 'bg-amber-900/20 text-amber-300 border-amber-700/30'
          }`}
        >
          {panelStatus.ready ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {panelStatus.ready ? 'Panel Ready' : 'Incomplete'}
        </div>
      </div>

      {/* Panel readiness summary */}
      <div className="px-5 py-3 border-b border-slate-800/40 grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-xl px-3 py-2 text-center">
          <div className="text-lg font-bold text-violet-300">{panelStatus.total}</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Assigned</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl px-3 py-2 text-center">
          <div className="text-lg font-bold text-emerald-300">{panelStatus.confirmed}</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><ClipboardCheck className="w-3 h-3" /> Signed Off</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl px-3 py-2 text-center">
          <div className={`text-lg font-bold ${panelStatus.missing.length === 0 ? 'text-emerald-300' : 'text-red-400'}`}>
            {panelStatus.missing.length}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> Missing Roles</div>
        </div>
      </div>

      {/* Roster section (collapsible) */}
      <div className="border-b border-slate-800/40">
        <button
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest hover:bg-slate-800/20 transition-colors"
          onClick={() => setRosterExpanded((p) => !p)}
        >
          <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Referee Roster ({referees.length})</span>
          {rosterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {rosterExpanded && (
          <div className="px-5 pb-4 space-y-3">
            {/* Add referee form */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400">Add Referee</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                  className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 col-span-2"
                />
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  {REFEREE_GRADES.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
                <select
                  value={newFitness}
                  onChange={(e) => setNewFitness(e.target.value)}
                  className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  {FITNESS_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f.replace('_', ' ')}</option>
                  ))}
                </select>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 block mb-1">Cert Expiry</label>
                  <input
                    type="date"
                    value={newCertExpiry}
                    onChange={(e) => setNewCertExpiry(e.target.value)}
                    className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 block mb-1">Qualified Roles</label>
                  <div className="flex flex-wrap gap-1.5">
                    {OFFICIAL_ROLES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => toggleRole(r.id)}
                        className={`px-2 py-0.5 rounded-lg text-xs border transition-colors ${
                          newRoles.includes(r.id)
                            ? 'bg-violet-600/40 border-violet-500/60 text-violet-200'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddReferee}
                disabled={!newName.trim() || !newCertExpiry || newRoles.length === 0}
                className="w-full py-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold transition-colors"
              >
                + Add to Roster
              </button>
            </div>

            {/* Roster list */}
            {referees.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-2">No referees in roster.</p>
            )}
            {referees.map((ref) => {
              const cs = certStatus(ref.certExpiryDate);
              const drem = daysUntil(ref.certExpiryDate);
              return (
                <div key={ref.refereeId} className="rounded-xl bg-slate-800/40 border border-slate-700/30 px-3 py-2 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-700/50">
                    <UserCheck className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{ref.name}</p>
                    <p className="text-xs text-slate-500">{gradeLabel(ref.gradeId)} · {ref.qualifiedRoles.length} roles</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Pill label={ref.fitnessStatus.replace('_', ' ')} colorClass={fitnessBadge(ref.fitnessStatus)} />
                    <span className={`text-xs font-mono ${cs === 'CURRENT' ? 'text-emerald-400' : cs === 'EXPIRING_SOON' ? 'text-amber-400' : 'text-red-400'}`}>
                      {cs === 'EXPIRED' ? 'Cert EXPIRED' : `Cert ${drem}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign official */}
      <div className="px-5 py-4 border-b border-slate-800/40 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Assign Official</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Referee</label>
            <select
              value={assignRefId}
              onChange={(e) => setAssignRefId(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="">— select —</option>
              {referees.map((r) => (
                <option key={r.refereeId} value={r.refereeId}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Role</label>
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              {OFFICIAL_ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}{r.required ? ' *' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {assignSuccess ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Assignment <span className="font-mono">{assignSuccess}</span> created
          </div>
        ) : (
          <button
            onClick={handleAssign}
            disabled={!assignRefId}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
          >
            Assign Official
          </button>
        )}
      </div>

      {/* Assignment list */}
      <div className="px-5 py-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Panel Assignments {panelStatus.missing.length > 0 && (
            <span className="text-red-400 normal-case font-normal">· missing: {panelStatus.missing.map((r) => OFFICIAL_ROLES.find((o) => o.id === r)?.label ?? r).join(', ')}</span>
          )}
        </p>
        {assignments.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-4">No officials assigned yet.</p>
        )}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {assignments.map((a) => (
            <div key={a.assignmentId} className="rounded-xl bg-slate-800/50 border border-slate-700/40 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpandedAsgn((prev) => (prev === a.assignmentId ? null : a.assignmentId))}
              >
                <Award className={`w-4 h-4 flex-shrink-0 ${a.eligibility.eligible ? 'text-violet-400' : 'text-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {a.refereeName} — {a.roleLabel ?? a.role}
                  </p>
                  <p className="text-xs text-slate-500 font-mono truncate">{a.assignmentId}</p>
                </div>
                <Pill label={a.status} colorClass={assignmentStatusBadge(a.status)} />
                {expandedAsgn === a.assignmentId
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {expandedAsgn === a.assignmentId && (
                <div className="border-t border-slate-700/30 px-3 py-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-slate-400">Cert</div>
                      <Pill label={a.certStatus} colorClass={certBadge(a.certStatus)} />
                    </div>
                    <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-slate-400">Fitness</div>
                      <Pill label={a.fitnessStatus?.replace('_', ' ') ?? '?'} colorClass={fitnessBadge(a.fitnessStatus)} />
                    </div>
                    <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                      <div className="text-slate-400 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Rest</div>
                      <div className={`font-bold text-xs ${a.restOk ? 'text-emerald-300' : 'text-red-400'}`}>
                        {a.restHours === '∞' ? '∞' : `${a.restHours}h`}
                      </div>
                    </div>
                  </div>

                  {/* Eligibility warnings */}
                  {!a.eligibility.eligible && (
                    <div className="flex items-start gap-1.5 text-xs text-red-300 bg-red-900/20 border border-red-700/30 rounded-lg px-2 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{a.eligibility.reasons.join('; ')}</span>
                    </div>
                  )}

                  {/* Fitness indicators */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Cert expires in</span>
                    <span className={a.certDaysRemaining >= 0 ? 'text-slate-200' : 'text-red-400'}>
                      {a.certDaysRemaining >= 0 ? `${a.certDaysRemaining} days` : `${Math.abs(a.certDaysRemaining)} days ago`}
                    </span>
                  </div>

                  {/* Sign-off section */}
                  {!a.preMatchSignOff && a.eligibility.eligible && (
                    <>
                      {signOffTarget === a.assignmentId ? (
                        <div className="flex gap-2">
                          <input
                            value={signOffName}
                            onChange={(e) => setSignOffName(e.target.value)}
                            placeholder="Signing official name"
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleSignOff(a.assignmentId)}
                            className="px-3 py-1 rounded-lg bg-violet-700 hover:bg-violet-600 text-xs text-white font-semibold"
                          >
                            Sign Off
                          </button>
                          <button
                            onClick={() => setSignOffTarget(null)}
                            className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSignOffTarget(a.assignmentId)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-violet-900/30 border border-violet-700/30 text-xs text-violet-300 hover:bg-violet-800/40 transition-colors"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" /> Pre-Match Sign Off
                        </button>
                      )}
                    </>
                  )}

                  {a.preMatchSignOff && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Signed off by <strong>{a.signOffBy}</strong> · {new Date(a.signOffAt).toLocaleString()}
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

RefereeDutyCard.propTypes = {
  matchId: PropTypes.string,
  matchKickoffAt: PropTypes.string,
  leagueLevel: PropTypes.number,
  initialReferees: PropTypes.arrayOf(
    PropTypes.shape({
      refereeId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      gradeId: PropTypes.string.isRequired,
      qualifiedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
      certExpiryDate: PropTypes.string.isRequired,
      fitnessStatus: PropTypes.string,
      lastMatchAt: PropTypes.string,
    }),
  ),
  initialAssignments: PropTypes.arrayOf(
    PropTypes.shape({
      assignmentId: PropTypes.string.isRequired,
      matchId: PropTypes.string,
      refereeId: PropTypes.string,
      refereeName: PropTypes.string,
      role: PropTypes.string,
      roleLabel: PropTypes.string,
      status: PropTypes.string,
      eligibility: PropTypes.shape({ eligible: PropTypes.bool, reasons: PropTypes.arrayOf(PropTypes.string) }),
      certStatus: PropTypes.string,
      certDaysRemaining: PropTypes.number,
      restOk: PropTypes.bool,
      restHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      fitnessStatus: PropTypes.string,
      preMatchSignOff: PropTypes.bool,
      signOffBy: PropTypes.string,
      signOffAt: PropTypes.string,
    }),
  ),
};

RefereeDutyCard.defaultProps = {
  matchId: 'MATCH-001',
  matchKickoffAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  leagueLevel: 2,
  initialReferees: [],
  initialAssignments: [],
};
