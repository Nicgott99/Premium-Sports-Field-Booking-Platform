import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  KeyRound,
  ShieldAlert,
  BatteryMedium,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const LOCKER_BANKS = [
  { id: 'BANK_HOME_CHANGING', name: 'Home Squad Dressing Room', count: 24, port: 'PORT-H01' },
  { id: 'BANK_AWAY_CHANGING', name: 'Away Squad Dressing Room', count: 24, port: 'PORT-A01' },
  { id: 'BANK_REFEREE_OFFICIALS', name: 'Match Officials Sanctuary', count: 8, port: 'PORT-REF01' },
  { id: 'BANK_CONCOURSE_PUBLIC', name: 'Main Concourse Day Lockers', count: 48, port: 'PORT-PUB01' },
];

const OVERRIDE_REASONS = [
  {
    id: 'FORGOTTEN_PIN',
    label: 'Player Forgotten PIN Code',
    badge: 'ID Check Required',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Verify player registration card or driving licence prior to unlock.',
  },
  {
    id: 'BATTERY_EXHAUSTED',
    label: 'Depleted Solenoid Cell',
    badge: 'Hardware Bypass',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    desc: 'Bypasses low-voltage keypad lock and triggers battery replacement alert.',
  },
  {
    id: 'EMERGENCY_MEDICAL',
    label: 'Medical Access (Inhaler / EpiPen)',
    badge: 'Priority Emergency',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    desc: 'Immediate emergency unlock protocol with zero ID verification delay.',
  },
  {
    id: 'ABANDONED_EQUIPMENT',
    label: 'Post-Match Forgotten Kit',
    badge: 'Lost Property Audit',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    desc: 'Unclaimed gear transfer to pitchside lost & found secure storage.',
  },
];

/**
 * LockerMasterOverrideCard
 * 
 * Provides duty managers, referees, and facility stewards with master
 * locker unlock token generation, ID check verification, and emergency access audits.
 */
export default function LockerMasterOverrideCard({
  venueName,
  dutyOfficerName,
  onOverrideIssued,
}) {
  const [selectedBankId, setSelectedBankId] = useState('BANK_HOME_CHANGING');
  const [selectedReasonId, setSelectedReasonId] = useState('FORGOTTEN_PIN');
  const [lockerNumber, setLockerNumber] = useState(14);
  const [claimantName, setClaimantName] = useState('');
  const [isIssued, setIsIssued] = useState(false);
  const [overrideTicket, setOverrideTicket] = useState(null);

  const activeBank = useMemo(() => {
    return LOCKER_BANKS.find((b) => b.id === selectedBankId) || LOCKER_BANKS[0];
  }, [selectedBankId]);

  const activeReason = useMemo(() => {
    return OVERRIDE_REASONS.find((r) => r.id === selectedReasonId) || OVERRIDE_REASONS[0];
  }, [selectedReasonId]);

  const handleIssueToken = () => {
    const rawToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const payload = {
      overrideCode: `OVR-${lockerNumber}-${rawToken}`,
      auditRef: `AUD-LCK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      bankName: activeBank.name,
      lockerNumber,
      reason: activeReason.label,
      claimant: claimantName || 'Anonymous Player',
      authorizedBy: dutyOfficerName,
      issuedAt: new Date().toLocaleTimeString(),
      expiresInMinutes: 10,
    };

    setOverrideTicket(payload);
    setIsIssued(true);

    if (onOverrideIssued) {
      onOverrideIssued(payload);
    }
  };

  const handleReset = () => {
    setIsIssued(false);
    setOverrideTicket(null);
    setClaimantName('');
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Gold Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Smart Locker Master Override
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {venueName} · Authorized Lead: {dutyOfficerName}
            </p>
          </div>
        </div>
        {isIssued && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse">
            <Unlock size={12} /> Override Active
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Locker Bank & Locker Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Locker Bank Zone
            </label>
            <select
              value={selectedBankId}
              disabled={isIssued}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {LOCKER_BANKS.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Locker Number (1 - {activeBank.count})
            </label>
            <input
              type="number"
              min="1"
              max={activeBank.count}
              disabled={isIssued}
              value={lockerNumber}
              onChange={(e) => setLockerNumber(Math.max(1, Math.min(activeBank.count, Number(e.target.value))))}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Reason Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Override Authorization Reason
          </label>
          <div className="grid grid-cols-1 gap-2">
            {OVERRIDE_REASONS.map((r) => {
              const selected = r.id === selectedReasonId;
              return (
                <button
                  key={r.id}
                  disabled={isIssued}
                  onClick={() => setSelectedReasonId(r.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${isIssued ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{r.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Claimant Details Input */}
        {!isIssued && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Player / Claimant Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Bukayo Saka (Player ID verified)"
              value={claimantName}
              onChange={(e) => setClaimantName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Battery & Override Port Telemetry */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <BatteryMedium size={16} className="text-emerald-400" />
            <div>
              <span className="text-slate-300 font-medium">Bank Solenoid Health</span>
              <p className="text-[10px] text-slate-500">Master Port: {activeBank.port}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">92% Operational</span>
        </div>

        {/* Action Button or Issued Ticket */}
        {!isIssued ? (
          <button
            onClick={handleIssueToken}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <Lock size={16} /> Authorize Master Override Key
          </button>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-amber-400" /> 10-Minute Unlock Token Armed
              </span>
              <span className="font-mono text-xs text-slate-400">
                Locker #{overrideTicket?.lockerNumber}
              </span>
            </div>

            {/* Prominent Override Code */}
            <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider block">Single-Use Master Passcode</span>
              <span className="text-xl font-bold font-mono text-amber-300 tracking-widest mt-0.5 block">
                {overrideTicket?.overrideCode}
              </span>
            </div>

            <div className="text-xs text-slate-300 flex flex-col gap-1">
              <p>
                Claimant: <span className="font-semibold text-white">{overrideTicket?.claimant}</span>
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock size={11} className="text-amber-400" /> Valid until: {overrideTicket?.issuedAt} + 10 mins
              </p>
              <p className="text-[10px] font-mono text-slate-500">Audit Reference: {overrideTicket?.auditRef}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-amber-300/80">
                <ShieldAlert size={12} /> Logged to security audit
              </span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <RotateCcw size={11} /> New Override
              </button>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
          <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            Duty stewards must physically inspect lockers during forgotten PIN overrides. Tampering or undocumented unlocks trigger an automated CCTV audit flag.
          </span>
        </div>
      </div>
    </div>
  );
}

LockerMasterOverrideCard.propTypes = {
  venueName: PropTypes.string,
  dutyOfficerName: PropTypes.string,
  onOverrideIssued: PropTypes.func,
};

LockerMasterOverrideCard.defaultProps = {
  venueName: 'Premier Sports Arena',
  dutyOfficerName: 'Marcus Sterling (Duty Steward Lead)',
  onOverrideIssued: null,
};
