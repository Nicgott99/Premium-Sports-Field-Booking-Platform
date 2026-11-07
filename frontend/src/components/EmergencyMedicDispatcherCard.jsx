import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  HeartPulse,
  Activity,
  AlertOctagon,
  PhoneCall,
  ShieldAlert,
  Clock,
  CheckCircle2,
  MapPin,
  BatteryCharging,
} from 'lucide-react';

const SEVERITY_TIERS = [
  {
    id: 'CODE_RED_CRITICAL',
    title: 'Code Red - Cardiac / Critical Trauma',
    color: 'from-rose-600 to-red-700',
    border: 'border-rose-500/50',
    badge: 'Ambulance 999 + AED',
    slaSeconds: 90,
    desc: 'Unresponsive player, suspected cardiac arrest, or severe neck/head trauma.',
  },
  {
    id: 'CODE_AMBER_URGENT',
    title: 'Code Amber - Fracture / Dislocation',
    color: 'from-amber-600 to-orange-700',
    border: 'border-amber-500/50',
    badge: 'Paramedic On-Site',
    slaSeconds: 180,
    desc: 'Concussion symptoms, joint dislocation, or open bone fracture.',
  },
  {
    id: 'CODE_GREEN_STANDARD',
    title: 'Code Green - Sprain / Bleed / Muscle Tear',
    color: 'from-emerald-600 to-teal-700',
    border: 'border-emerald-500/50',
    badge: 'Pitchside Responder',
    slaSeconds: 300,
    desc: 'Hamstring pull, rolled ankle, or surface bleeding requiring dressing.',
  },
];

const AED_STATIONS = [
  { id: 'AED-01', location: 'Pitch 1 & 2 Main Tunnel', battery: 98, status: 'Active' },
  { id: 'AED-02', location: 'Grandstand Reception Desk', battery: 100, status: 'Active' },
  { id: 'AED-03', location: 'Changing Pavilion Corridor', battery: 95, status: 'Active' },
];

/**
 * EmergencyMedicDispatcherCard
 * 
 * Pitchside emergency responder dispatch interface for referees, coaches, and marshals.
 * Provides rapid severity triage, nearest AED locator, and automated ambulance escalation.
 */
export default function EmergencyMedicDispatcherCard({
  pitchName,
  dutyOfficerName,
  onIncidentDispatched,
}) {
  const [selectedSeverity, setSelectedSeverity] = useState('CODE_AMBER_URGENT');
  const [reporterRole, setReporterRole] = useState('REFEREE');
  const [symptomSummary, setSymptomSummary] = useState('');
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchTicket, setDispatchTicket] = useState(null);

  const activeTier = useMemo(() => {
    return SEVERITY_TIERS.find((t) => t.id === selectedSeverity) || SEVERITY_TIERS[1];
  }, [selectedSeverity]);

  const handleDispatch = () => {
    const ticketId = `MED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payload = {
      ticketId,
      pitchName,
      severity: activeTier.id,
      slaSeconds: activeTier.slaSeconds,
      reporterRole,
      symptomSummary: symptomSummary || 'Immediate pitchside first aid assistance requested.',
      dispatchedAt: new Date().toLocaleTimeString(),
    };

    setDispatchTicket(payload);
    setIsDispatched(true);

    if (onIncidentDispatched) {
      onIncidentDispatched(payload);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Red Alert Gradient Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-red-600" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <HeartPulse size={22} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Emergency Medic &amp; First Aid Dispatch
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {pitchName} · Duty Lead: {dutyOfficerName}
            </p>
          </div>
        </div>
        {isDispatched && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
            <Activity size={12} /> Responders En Route
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Severity Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-rose-400" /> Injury Severity Triage
          </label>
          <div className="grid grid-cols-1 gap-2.5 mt-2">
            {SEVERITY_TIERS.map((tier) => {
              const selected = tier.id === selectedSeverity;
              return (
                <button
                  key={tier.id}
                  disabled={isDispatched}
                  onClick={() => setSelectedSeverity(tier.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    selected
                      ? `bg-slate-900 border-rose-500/70 shadow-lg shadow-rose-950/30`
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isDispatched ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-100">{tier.title}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                      {tier.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{tier.desc}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-rose-300/90">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={11} /> Target SLA: {tier.slaSeconds}s
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reporter Role & Incident Note */}
        {!isDispatched && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Caller Authority Role
              </label>
              <select
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="REFEREE">Match Referee / Assistant</option>
                <option value="COACH">Team Head Coach / Physio</option>
                <option value="CAPTAIN">Squad Captain</option>
                <option value="STEWARD">Pitchside Safety Steward</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Symptom &amp; Location Details
              </label>
              <input
                type="text"
                placeholder="e.g. Penalty box collision, left ankle injury, unable to stand"
                value={symptomSummary}
                onChange={(e) => setSymptomSummary(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        )}

        {/* AED Geofencing Stations */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Defibrillator (AED) Network Telemetry
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {AED_STATIONS.map((aed) => (
              <div
                key={aed.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-rose-400">{aed.id}</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <BatteryCharging size={11} /> {aed.battery}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <MapPin size={10} className="text-slate-500 shrink-0" />
                  {aed.location}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Trigger or Dispatched Status */}
        {!isDispatched ? (
          <button
            onClick={handleDispatch}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rose-950/50 transition-all text-sm cursor-pointer"
          >
            <AlertOctagon size={18} /> Trigger Immediate Pitchside Medic Dispatch
          </button>
        ) : (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-rose-400" /> Dispatch Ticket Confirmed
              </span>
              <span className="font-mono text-xs text-rose-400 font-bold">
                {dispatchTicket?.ticketId}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Paramedics alerted at <span className="font-semibold text-white">{dispatchTicket?.dispatchedAt}</span>. Nearest AED unlocked in Tunnel. Response team ETA &lt; {dispatchTicket?.slaSeconds}s.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-rose-500/20 text-[11px] text-slate-400">
              <span>Emergency Services Desk: +44 20 7946 0199</span>
              <span className="flex items-center gap-1 text-rose-300 font-semibold cursor-pointer">
                <PhoneCall size={12} /> Call 999 Direct
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

EmergencyMedicDispatcherCard.propTypes = {
  pitchName: PropTypes.string,
  dutyOfficerName: PropTypes.string,
  onIncidentDispatched: PropTypes.func,
};

EmergencyMedicDispatcherCard.defaultProps = {
  pitchName: 'Premier Arena Pitch 1',
  dutyOfficerName: 'Dr. Sarah Jenkins (Lead Sports Medic)',
  onIncidentDispatched: null,
};
