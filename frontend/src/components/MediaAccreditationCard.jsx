import { useState, useMemo } from 'react';
import {
  Camera,
  Tv,
  Radio,
  Globe,
  FileText,
  Mic,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldX,
  BadgeCheck,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  Hash,
} from 'lucide-react';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Constants mirroring venueMediaAccreditationEngine
// ---------------------------------------------------------------------------

const MEDIA_TYPES = ['PRINT', 'BROADCAST_TV', 'BROADCAST_RADIO', 'ONLINE', 'PHOTOGRAPHY', 'AGENCY', 'PODCAST'];

const CREDENTIAL_ROLES = [
  'JOURNALIST', 'PHOTOGRAPHER', 'CAMERA_OPERATOR', 'SOUND_ENGINEER',
  'PRODUCER', 'REPORTER', 'EDITOR', 'SOCIAL_MEDIA',
];

const ACCESS_ZONES = [
  'PRESS_BOX', 'MIXED_ZONE', 'PITCH_SIDE', 'PRESS_CONFERENCE',
  'TV_GANTRY', 'TUNNEL', 'MEDIA_CENTRE', 'BROADCAST_COMPOUND',
];

const DEFAULT_ZONE_ACCESS = {
  JOURNALIST:      ['PRESS_BOX', 'PRESS_CONFERENCE', 'MIXED_ZONE', 'MEDIA_CENTRE'],
  PHOTOGRAPHER:    ['PITCH_SIDE', 'MIXED_ZONE', 'MEDIA_CENTRE', 'PRESS_CONFERENCE'],
  CAMERA_OPERATOR: ['TV_GANTRY', 'PITCH_SIDE', 'BROADCAST_COMPOUND', 'MIXED_ZONE'],
  SOUND_ENGINEER:  ['BROADCAST_COMPOUND', 'TV_GANTRY'],
  PRODUCER:        ['BROADCAST_COMPOUND', 'PRESS_CONFERENCE', 'MEDIA_CENTRE'],
  REPORTER:        ['PRESS_BOX', 'MIXED_ZONE', 'PRESS_CONFERENCE', 'MEDIA_CENTRE'],
  EDITOR:          ['MEDIA_CENTRE', 'PRESS_CONFERENCE'],
  SOCIAL_MEDIA:    ['MEDIA_CENTRE', 'PRESS_CONFERENCE'],
};

const STATUS = {
  SUBMITTED:    'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED:     'APPROVED',
  REJECTED:     'REJECTED',
  REVOKED:      'REVOKED',
};

const MAX_PITCH_SIDE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mediaIcon(type) {
  const map = { BROADCAST_TV: Tv, BROADCAST_RADIO: Radio, ONLINE: Globe,
    PHOTOGRAPHY: Camera, AGENCY: FileText, PODCAST: Mic, PRINT: BookOpen };
  return map[type] ?? FileText;
}

function statusConfig(s) {
  const map = {
    SUBMITTED:    { label: 'Submitted',    text: 'text-blue-300',    bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    icon: Clock },
    UNDER_REVIEW: { label: 'In Review',    text: 'text-amber-300',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   icon: Clock },
    APPROVED:     { label: 'Approved',     text: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: BadgeCheck },
    REJECTED:     { label: 'Rejected',     text: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30',     icon: XCircle },
    REVOKED:      { label: 'Revoked',      text: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  icon: ShieldX },
  };
  return map[s] ?? map.SUBMITTED;
}

function zoneTag(zone, granted) {
  const sensitive = ['PITCH_SIDE', 'TUNNEL', 'TV_GANTRY', 'BROADCAST_COMPOUND'];
  const isSensitive = sensitive.includes(zone);
  if (!granted) return 'bg-slate-800/50 text-slate-500 border-slate-700/40 line-through';
  if (isSensitive) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
}

function StatusPill({ status }) {
  const conf = statusConfig(status);
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${conf.bg} ${conf.border} ${conf.text}`}>
      <Icon className="w-3 h-3" /> {conf.label}
    </span>
  );
}
StatusPill.propTypes = { status: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MediaAccreditationCard({ eventId, initialOrgs, initialApplications }) {
  const [orgs,  setOrgs]  = useState(initialOrgs);
  const [apps,  setApps]  = useState(initialApplications);
  const [expanded, setExpanded] = useState(null);

  // New application form
  const [formOrgId,   setFormOrgId]   = useState(initialOrgs[0]?.orgId ?? '');
  const [formName,    setFormName]    = useState('');
  const [formEmail,   setFormEmail]   = useState('');
  const [formRole,    setFormRole]    = useState(CREDENTIAL_ROLES[0]);
  const [formZones,   setFormZones]   = useState([]);
  const [submitMsg,   setSubmitMsg]   = useState(null);

  // Add org form
  const [showAddOrg,  setShowAddOrg]  = useState(false);
  const [orgName,     setOrgName]     = useState('');
  const [orgType,     setOrgType]     = useState(MEDIA_TYPES[0]);
  const [orgCountry,  setOrgCountry]  = useState('');

  // Vetting / approval panel
  const [vetTarget,   setVetTarget]   = useState(null);
  const [vetNotes,    setVetNotes]    = useState('');
  const [bibInput,    setBibInput]    = useState('');

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const stats = useMemo(() => {
    const approved    = apps.filter((a) => a.status === STATUS.APPROVED).length;
    const checkedIn   = apps.filter((a) => a.checkedInAt).length;
    const pitchSide   = apps.filter(
      (a) => a.status === STATUS.APPROVED && a.approvedZones.includes('PITCH_SIDE') && a.role === 'PHOTOGRAPHER',
    ).length;
    return { total: apps.length, approved, checkedIn, pitchSide };
  }, [apps]);

  const defaultZones = useMemo(() => DEFAULT_ZONE_ACCESS[formRole] ?? [], [formRole]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  function toggleZone(zone) {
    setFormZones((prev) => prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]);
  }

  function handleSubmitApp() {
    if (!formOrgId || !formName.trim() || !formEmail.trim()) return;
    const org = orgs.find((o) => o.orgId === formOrgId);
    const merged = [...new Set([...defaultZones, ...formZones])];
    const app = {
      applicationId: `APP-${Date.now()}`,
      orgId:         formOrgId,
      orgName:       org?.name ?? formOrgId,
      orgType:       org?.mediaType ?? 'PRINT',
      applicantName: formName.trim(),
      email:         formEmail.toLowerCase().trim(),
      role:          formRole,
      eventId,
      requestedZones: merged,
      approvedZones:  [],
      status:         STATUS.SUBMITTED,
      vettingNotes:   '',
      bibNumber:      null,
      vestColour:     null,
      submittedAt:    new Date().toISOString(),
      reviewedAt:     null,
      approvedAt:     null,
      checkedInAt:    null,
      checkedOutAt:   null,
    };
    setApps((prev) => [app, ...prev]);
    setSubmitMsg(app.applicationId);
    setFormName(''); setFormEmail(''); setFormZones([]);
    setTimeout(() => setSubmitMsg(null), 4000);
  }

  function handleAddOrg() {
    if (!orgName.trim() || !orgCountry.trim()) return;
    const org = { orgId: `ORG-${Date.now()}`, name: orgName.trim(), mediaType: orgType, country: orgCountry.trim() };
    setOrgs((prev) => [...prev, org]);
    if (!formOrgId) setFormOrgId(org.orgId);
    setOrgName(''); setOrgCountry(''); setShowAddOrg(false);
  }

  function advanceStatus(appId) {
    setApps((prev) => prev.map((a) => {
      if (a.applicationId !== appId) return a;
      if (a.status === STATUS.SUBMITTED)    return { ...a, status: STATUS.UNDER_REVIEW, reviewedAt: new Date().toISOString() };
      return a;
    }));
  }

  function handleApprove(appId) {
    setApps((prev) => prev.map((a) => {
      if (a.applicationId !== appId) return a;
      return {
        ...a,
        status:        STATUS.APPROVED,
        approvedZones: a.requestedZones,
        bibNumber:     bibInput ? parseInt(bibInput, 10) : null,
        vestColour:    a.role === 'PHOTOGRAPHER' || a.role === 'CAMERA_OPERATOR' ? 'YELLOW' : null,
        vettingNotes:  vetNotes,
        approvedAt:    new Date().toISOString(),
      };
    }));
    setVetTarget(null); setVetNotes(''); setBibInput('');
  }

  function handleReject(appId) {
    if (!vetNotes.trim()) return;
    setApps((prev) => prev.map((a) =>
      a.applicationId === appId ? { ...a, status: STATUS.REJECTED, vettingNotes: vetNotes, reviewedAt: new Date().toISOString() } : a,
    ));
    setVetTarget(null); setVetNotes(''); setBibInput('');
  }

  function handleRevoke(appId) {
    setApps((prev) => prev.map((a) =>
      a.applicationId === appId
        ? { ...a, status: STATUS.REVOKED, approvedZones: [], revokedAt: new Date().toISOString() }
        : a,
    ));
  }

  function handleCheckIn(appId) {
    setApps((prev) => prev.map((a) =>
      a.applicationId === appId && a.status === STATUS.APPROVED
        ? { ...a, checkedInAt: new Date().toISOString() }
        : a,
    ));
  }

  function handleCheckOut(appId) {
    setApps((prev) => prev.map((a) =>
      a.applicationId === appId && a.checkedInAt
        ? { ...a, checkedOutAt: new Date().toISOString() }
        : a,
    ));
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-500" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 mt-0.5">
          <Camera className="w-5 h-5 text-rose-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-100 leading-tight">Media Accreditation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Event <span className="font-mono text-rose-400">{eventId}</span>
            <span className="mx-1.5 text-slate-600">·</span>UEFA media operations guidelines
          </p>
        </div>
        <div className="flex gap-1.5 text-xs flex-shrink-0 flex-wrap justify-end">
          <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">{stats.total} apps</span>
          <span className="px-2 py-1 rounded-lg bg-emerald-900/30 text-emerald-300 border border-emerald-700/30">{stats.approved} approved</span>
          <span className="px-2 py-1 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-700/30">{stats.checkedIn} in</span>
        </div>
      </div>

      {/* Pitch-side quota bar */}
      <div className="px-5 py-2.5 border-b border-slate-800/40 flex items-center gap-3">
        <span className="text-xs text-slate-400 flex-shrink-0">Pitch-side quota</span>
        <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${stats.pitchSide >= MAX_PITCH_SIDE ? 'bg-red-500' : stats.pitchSide >= MAX_PITCH_SIDE * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (stats.pitchSide / MAX_PITCH_SIDE) * 100)}%` }}
          />
        </div>
        <span className={`text-xs font-bold flex-shrink-0 ${stats.pitchSide >= MAX_PITCH_SIDE ? 'text-red-400' : 'text-slate-300'}`}>
          {stats.pitchSide} / {MAX_PITCH_SIDE}
        </span>
        {stats.pitchSide >= MAX_PITCH_SIDE && (
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        )}
      </div>

      {/* New application form */}
      <div className="px-5 py-3 border-b border-slate-800/40 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">New Application</p>
          <button
            onClick={() => setShowAddOrg((p) => !p)}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
          >
            {showAddOrg ? 'Cancel' : '+ Add Org'}
          </button>
        </div>

        {/* Add organisation inline */}
        {showAddOrg && (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/40 p-3 space-y-2">
            <p className="text-xs text-slate-400 font-semibold">Register Media Organisation</p>
            <div className="grid grid-cols-2 gap-2">
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organisation name"
                className="col-span-2 bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500" />
              <select value={orgType} onChange={(e) => setOrgType(e.target.value)}
                className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500">
                {MEDIA_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <input value={orgCountry} onChange={(e) => setOrgCountry(e.target.value)} placeholder="Country (e.g. GBR)"
                className="bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500" />
            </div>
            <button onClick={handleAddOrg} disabled={!orgName.trim() || !orgCountry.trim()}
              className="w-full py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-semibold transition-colors">
              Register Organisation
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <select value={formOrgId} onChange={(e) => setFormOrgId(e.target.value)}
            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500">
            <option value="">— select org —</option>
            {orgs.map((o) => <option key={o.orgId} value={o.orgId}>{o.name}</option>)}
          </select>
          <select value={formRole} onChange={(e) => { setFormRole(e.target.value); setFormZones([]); }}
            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500">
            {CREDENTIAL_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Applicant full name"
            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500" />
          <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email address"
            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500" />
        </div>

        {/* Zone toggles */}
        <div>
          <p className="text-xs text-slate-500 mb-1">Extra zones beyond role defaults</p>
          <div className="flex flex-wrap gap-1.5">
            {ACCESS_ZONES.map((zone) => {
              const isDefault = defaultZones.includes(zone);
              const isExtra   = formZones.includes(zone);
              return (
                <button key={zone} onClick={() => !isDefault && toggleZone(zone)}
                  disabled={isDefault}
                  className={`px-2 py-0.5 rounded-lg text-xs border transition-colors ${
                    isDefault
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 cursor-default'
                      : isExtra
                      ? 'bg-rose-600/30 border-rose-500/50 text-rose-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>
                  {isDefault ? '✓ ' : ''}{zone.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {submitMsg ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4" /> Application <span className="font-mono">{submitMsg}</span> submitted
          </div>
        ) : (
          <button onClick={handleSubmitApp}
            disabled={!formOrgId || !formName.trim() || !formEmail.trim()}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all">
            Submit Application
          </button>
        )}
      </div>

      {/* Applications list */}
      <div className="px-5 py-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Applications <span className="text-slate-500 normal-case font-normal">({apps.length})</span>
        </p>
        {apps.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-4">No applications yet.</p>
        )}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {apps.map((app) => {
            const conf  = statusConfig(app.status);
            const OIcon = mediaIcon(app.orgType);
            return (
              <div key={app.applicationId} className="rounded-xl bg-slate-800/50 border border-slate-700/40 overflow-hidden">
                {/* Row */}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
                  onClick={() => setExpanded((p) => (p === app.applicationId ? null : app.applicationId))}
                >
                  <OIcon className={`w-4 h-4 flex-shrink-0 ${conf.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{app.applicantName}</p>
                    <p className="text-xs text-slate-500 truncate">{app.orgName} · {app.role.replace('_', ' ')}</p>
                  </div>
                  {app.bibNumber && (
                    <span className="flex items-center gap-0.5 text-xs font-mono text-amber-300">
                      <Hash className="w-3 h-3" />{app.bibNumber}
                    </span>
                  )}
                  {app.checkedInAt && !app.checkedOutAt && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><LogIn className="w-3 h-3" />In</span>
                  )}
                  <StatusPill status={app.status} />
                  {expanded === app.applicationId
                    ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                {/* Expanded detail */}
                {expanded === app.applicationId && (
                  <div className="border-t border-slate-700/30 px-3 py-3 space-y-2">

                    {/* Zone access tags */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Zone Access</p>
                      <div className="flex flex-wrap gap-1">
                        {ACCESS_ZONES.map((zone) => {
                          const granted = app.status === STATUS.APPROVED
                            ? app.approvedZones.includes(zone)
                            : app.requestedZones.includes(zone);
                          return (
                            <span key={zone}
                              className={`px-2 py-0.5 rounded-md text-xs border ${zoneTag(zone, granted)}`}>
                              {zone.replace('_', ' ')}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vetting notes */}
                    {app.vettingNotes && (
                      <p className="text-xs text-slate-400 italic">Notes: {app.vettingNotes}</p>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>Submitted: <span className="text-slate-300">{new Date(app.submittedAt).toLocaleString()}</span></p>
                      {app.approvedAt && <p>Approved: <span className="text-slate-300">{new Date(app.approvedAt).toLocaleString()}</span></p>}
                      {app.checkedInAt && <p>Checked in: <span className="text-emerald-300">{new Date(app.checkedInAt).toLocaleTimeString()}</span></p>}
                      {app.checkedOutAt && <p>Checked out: <span className="text-blue-300">{new Date(app.checkedOutAt).toLocaleTimeString()}</span></p>}
                    </div>

                    {/* Workflow actions */}
                    <div className="space-y-2">
                      {/* Move to review */}
                      {app.status === STATUS.SUBMITTED && (
                        <button onClick={() => advanceStatus(app.applicationId)}
                          className="w-full py-1.5 rounded-lg bg-amber-700/40 hover:bg-amber-600/50 border border-amber-600/30 text-xs text-amber-300 font-semibold transition-colors">
                          Start Review
                        </button>
                      )}

                      {/* Approve / reject panel */}
                      {app.status === STATUS.UNDER_REVIEW && (
                        vetTarget === app.applicationId ? (
                          <div className="space-y-2">
                            <input value={vetNotes} onChange={(e) => setVetNotes(e.target.value)} placeholder="Vetting notes / rejection reason"
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500" />
                            <div className="flex gap-2">
                              <input type="number" value={bibInput} onChange={(e) => setBibInput(e.target.value)} placeholder="Bib #"
                                className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                              <button onClick={() => handleApprove(app.applicationId)}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-700/50 hover:bg-emerald-600/60 border border-emerald-600/30 text-xs text-emerald-300 font-semibold transition-colors flex items-center justify-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button onClick={() => handleReject(app.applicationId)}
                                className="flex-1 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/50 border border-red-700/30 text-xs text-red-400 font-semibold transition-colors flex items-center justify-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                            <button onClick={() => setVetTarget(null)} className="w-full text-xs text-slate-500 hover:text-slate-400">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setVetTarget(app.applicationId)}
                            className="w-full py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/40 text-xs text-slate-300 font-semibold transition-colors">
                            Approve / Reject
                          </button>
                        )
                      )}

                      {/* Check-in / check-out */}
                      {app.status === STATUS.APPROVED && !app.checkedInAt && (
                        <button onClick={() => handleCheckIn(app.applicationId)}
                          className="w-full py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/40 border border-emerald-700/30 text-xs text-emerald-300 font-semibold transition-colors flex items-center justify-center gap-1">
                          <LogIn className="w-3.5 h-3.5" /> Match-Day Check In
                        </button>
                      )}
                      {app.checkedInAt && !app.checkedOutAt && (
                        <button onClick={() => handleCheckOut(app.applicationId)}
                          className="w-full py-1.5 rounded-lg bg-blue-900/30 hover:bg-blue-800/40 border border-blue-700/30 text-xs text-blue-300 font-semibold transition-colors flex items-center justify-center gap-1">
                          <LogOut className="w-3.5 h-3.5" /> Check Out
                        </button>
                      )}

                      {/* Revoke */}
                      {app.status === STATUS.APPROVED && (
                        <button onClick={() => handleRevoke(app.applicationId)}
                          className="w-full py-1 rounded-lg text-xs text-orange-500 hover:text-orange-400 transition-colors">
                          Revoke Credential
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        {apps.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { label: 'Total', value: stats.total, color: 'text-slate-200' },
              { label: 'Approved', value: stats.approved, color: 'text-emerald-300' },
              { label: 'On-site', value: stats.checkedIn, color: 'text-blue-300' },
              { label: 'Pitch-side', value: `${stats.pitchSide}/${MAX_PITCH_SIDE}`, color: stats.pitchSide >= MAX_PITCH_SIDE ? 'text-red-400' : 'text-amber-300' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800/40 rounded-xl px-2 py-2 text-center">
                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500"><Users className="w-3 h-3 inline mr-0.5" />{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

MediaAccreditationCard.propTypes = {
  eventId:             PropTypes.string,
  initialOrgs:         PropTypes.arrayOf(
    PropTypes.shape({
      orgId:     PropTypes.string.isRequired,
      name:      PropTypes.string.isRequired,
      mediaType: PropTypes.string.isRequired,
      country:   PropTypes.string.isRequired,
    }),
  ),
  initialApplications: PropTypes.arrayOf(
    PropTypes.shape({
      applicationId:  PropTypes.string.isRequired,
      orgId:          PropTypes.string,
      orgName:        PropTypes.string,
      orgType:        PropTypes.string,
      applicantName:  PropTypes.string,
      email:          PropTypes.string,
      role:           PropTypes.string,
      requestedZones: PropTypes.arrayOf(PropTypes.string),
      approvedZones:  PropTypes.arrayOf(PropTypes.string),
      status:         PropTypes.string,
      vettingNotes:   PropTypes.string,
      bibNumber:      PropTypes.number,
      submittedAt:    PropTypes.string,
      approvedAt:     PropTypes.string,
      checkedInAt:    PropTypes.string,
      checkedOutAt:   PropTypes.string,
    }),
  ),
};

MediaAccreditationCard.defaultProps = {
  eventId:             'MATCH-001',
  initialOrgs:         [
    { orgId: 'ORG-001', name: 'BBC Sport',       mediaType: 'BROADCAST_TV',    country: 'GBR' },
    { orgId: 'ORG-002', name: 'Sky Sports',      mediaType: 'BROADCAST_TV',    country: 'GBR' },
    { orgId: 'ORG-003', name: 'The Guardian',    mediaType: 'PRINT',           country: 'GBR' },
    { orgId: 'ORG-004', name: 'Getty Images',    mediaType: 'PHOTOGRAPHY',     country: 'USA' },
    { orgId: 'ORG-005', name: 'Reuters Sport',   mediaType: 'AGENCY',          country: 'GBR' },
  ],
  initialApplications: [],
};
