import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Lock,
  Unlock,
  Key,
  QrCode,
  Lightbulb,
  Zap,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  LogOut,
  PhoneCall,
} from 'lucide-react';

export default function SmartLockerAccessPass({
  bookingId = 'BK-2026-8841',
  fieldId = 'Stadium Pitch 3',
  lockerUnit = 'Bank B • Locker #24 (Squad XL)',
  initialGatePin = '684920',
  initialLockerPin = '3194',
  validTimeWindow = '18:40 — 20:25',
  depositHeld = 25.0,
  onCheckout,
  className = '',
}) {
  const [gatePin, setGatePin] = useState(initialGatePin);
  const [isLockerLocked, setIsLockerLocked] = useState(true);
  const [copiedGatePin, setCopiedGatePin] = useState(false);
  const [copiedLockerPin, setCopiedLockerPin] = useState(false);
  const [floodlightMode, setFloodlightMode] = useState('MATCH_LUX'); // 'OFF' | 'ECO' | 'MATCH_LUX'
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Copy PIN helper
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'gate') {
      setCopiedGatePin(true);
      setTimeout(() => setCopiedGatePin(false), 2000);
    } else {
      setCopiedLockerPin(true);
      setTimeout(() => setCopiedLockerPin(false), 2000);
    }
  };

  // Toggle smart locker solenoid latch
  const toggleLockerLock = () => {
    setIsLockerLocked((prev) => !prev);
  };

  const regeneratePin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setGatePin(newPin);
  };

  const handleCheckoutLocker = () => {
    setIsCheckedOut(true);
    if (onCheckout) {
      onCheckout({ bookingId, lockerUnit, depositRefunded: depositHeld });
    }
  };

  return (
    <div
      className={`relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Gradient Banner */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

      {/* ── Header Bar ────────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">Smart Access Pass</h3>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Booking: <span className="text-slate-200 font-mono">{bookingId}</span> • {fieldId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Valid: {validTimeWindow}</span>
        </div>
      </div>

      {/* ── Main Access Card Body ─────────────────────────────────────────── */}
      <div className="p-6 md:p-8 space-y-6">
        {isCheckedOut ? (
          /* Checked out state */
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">Locker Checked Out & Relinquished</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your security deposit of <span className="text-emerald-400 font-bold">${depositHeld.toFixed(2)}</span> has
              been automatically unreserved and refunded to your payment method.
            </p>
          </div>
        ) : (
          <>
            {/* ── Section 1: Pitch Turnstile Gate PIN ───────────────────────── */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  Turnstile & Changing Room Gate PIN
                </span>
                <button
                  onClick={regeneratePin}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  title="Generate new PIN"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Refresh PIN</span>
                </button>
              </div>

              {/* Big PIN Display */}
              <div className="flex items-center justify-between bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-3xl md:text-4xl font-mono font-black text-white tracking-widest">
                    {gatePin}
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(gatePin, 'gate')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  {copiedGatePin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGatePin ? 'Copied' : 'Copy PIN'}</span>
                </button>
              </div>
            </div>

            {/* ── Section 2: Smart Locker Card ─────────────────────────────── */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">Assigned Unit</span>
                  <h4 className="text-base font-bold text-white mt-0.5">{lockerUnit}</h4>
                </div>

                {/* Digital Padlock Button */}
                <button
                  onClick={toggleLockerLock}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    isLockerLocked
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {isLockerLocked ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                  <span>{isLockerLocked ? 'LOCKED (Click to Unlock)' : 'UNLOCKED (Click to Lock)'}</span>
                </button>
              </div>

              {/* Locker PIN & Deposit Info */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Master Locker PIN:</span>
                  <span className="font-mono font-bold text-white tracking-widest">{initialLockerPin}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Security Deposit:</span>
                  <span className="font-semibold text-emerald-400">${depositHeld.toFixed(2)} Escrow</span>
                </div>
              </div>
            </div>

            {/* ── Section 3: Pitch Floodlight Automation Controller ────────── */}
            <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white">Automated Pitch Floodlights</span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {floodlightMode === 'MATCH_LUX' ? '4.8 kW (100% Lux)' : floodlightMode === 'ECO' ? '2.1 kW (Eco 45%)' : '0.0 kW (Off)'}
                </span>
              </div>

              {/* Floodlight Mode Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'OFF', label: 'Lights Off' },
                  { id: 'ECO', label: 'Eco Warmup (45%)' },
                  { id: 'MATCH_LUX', label: 'Match Daylight (100%)' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setFloodlightMode(mode.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border ${
                      floodlightMode === mode.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Bottom Actions Bar ────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                <span>Call Pitch Attendant</span>
              </button>

              <button
                onClick={handleCheckoutLocker}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-md"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Checkout Locker & Release Deposit</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Help Modal ────────────────────────────────────────────────────── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Pitchside Duty Attendant</h4>
            <p className="text-xs text-slate-400 mt-1">
              Need assistance with locker locks, ball pumps, or stadium gates?
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 my-4 text-xs font-mono text-emerald-400">
              Direct Attendant Hotline: +1 (800) 555-PITCH
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

SmartLockerAccessPass.propTypes = {
  bookingId: PropTypes.string,
  fieldId: PropTypes.string,
  lockerUnit: PropTypes.string,
  initialGatePin: PropTypes.string,
  initialLockerPin: PropTypes.string,
  validTimeWindow: PropTypes.string,
  depositHeld: PropTypes.number,
  onCheckout: PropTypes.func,
  className: PropTypes.string,
};
