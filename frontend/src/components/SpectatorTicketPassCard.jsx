import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Ticket,
  Armchair,
  Crown,
  Users,
  Flame,
  Plus,
  Minus,
  CheckCircle2,
  Copy,
  Download,
  QrCode,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function SpectatorTicketPassCard({
  matchTitle = 'Super Cup Grand Final: Apex Strikers vs Metro Titans',
  venueName = 'Apex National Stadium Arena — Field 1',
  matchDate = 'Saturday, Nov 14, 2026',
  kickoffTime = '19:30 Local',
  gateEntry = 'Turnstile Gate 3 (West Concourse)',
  onPurchaseComplete,
  className = '',
}) {
  const [selectedZone, setSelectedZone] = useState('GRANDSTAND_COVERED');
  const [concession, setConcession] = useState('STANDARD');
  const [ticketCount, setTicketCount] = useState(2);
  const [isPurchased, setIsPurchased] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const SEATING_TIERS = [
    {
      id: 'VIP_BOX',
      title: 'Executive VIP Box',
      basePrice: 45,
      icon: Crown,
      badge: 'All-Inclusive',
      badgeColor: 'amber',
      perks: 'Complimentary drinks, padded armchairs & private lounge',
    },
    {
      id: 'GRANDSTAND_COVERED',
      title: 'Covered Grandstand',
      basePrice: 22,
      icon: Armchair,
      badge: 'Best View',
      badgeColor: 'cyan',
      perks: 'Weather sheltered, numbered seats & central view',
    },
    {
      id: 'PITCHSIDE_BENCH',
      title: 'Pitchside Dugout',
      basePrice: 15,
      icon: Flame,
      badge: 'Immersive',
      badgeColor: 'rose',
      perks: 'Field-level proximity & intense crowd energy',
    },
    {
      id: 'GENERAL_STANDING',
      title: 'Fan Terrace Standing',
      basePrice: 8,
      icon: Users,
      badge: 'Best Value',
      badgeColor: 'emerald',
      perks: 'Supporter chants, food truck terrace & open admission',
    },
  ];

  // Pricing calculations
  const priceData = useMemo(() => {
    const tier = SEATING_TIERS.find((t) => t.id === selectedZone) || SEATING_TIERS[1];
    let unitRate = tier.basePrice;

    // Concession discounts
    if (concession === 'STUDENT') unitRate *= 0.8;
    if (concession === 'SENIOR') unitRate *= 0.75;
    if (concession === 'CHILD') unitRate *= 0.5;

    // Group discounts: 10% for 6+
    const groupDiscountRate = ticketCount >= 6 ? 0.1 : 0;
    const subtotal = unitRate * ticketCount;
    const groupSavings = subtotal * groupDiscountRate;
    const netSubtotal = subtotal - groupSavings;
    const serviceFee = netSubtotal * 0.06 + ticketCount * 0.5;
    const total = netSubtotal + serviceFee;

    return {
      tier,
      unitRate: Math.round(unitRate * 100) / 100,
      groupSavings: Math.round(groupSavings * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [selectedZone, concession, ticketCount]);

  const assignedSeats = useMemo(() => {
    if (selectedZone === 'GENERAL_STANDING') {
      return Array.from({ length: ticketCount }, () => 'FAN-TERRACE-GA');
    }
    const row = selectedZone === 'VIP_BOX' ? 'VIP-A' : 'SEC-104';
    return Array.from({ length: ticketCount }, (_, i) => `${row} • Seat ${12 + i}`);
  }, [selectedZone, ticketCount]);

  const handlePurchase = () => {
    setIsPurchased(true);
    if (onPurchaseComplete) {
      onPurchaseComplete({
        matchTitle,
        zone: selectedZone,
        ticketCount,
        seats: assignedSeats,
        totalPrice: priceData.total,
      });
    }
  };

  const handleCopyPass = () => {
    const summary = `🎟️ OFFICIAL STADIUM MATCH PASS: ${matchTitle}
📍 Venue: ${venueName}
📅 Date: ${matchDate} at ${kickoffTime}
🚪 Gate: ${gateEntry}
Section: ${priceData.tier.title} (${assignedSeats.join(', ')})
Quantity: ${ticketCount} Tickets | Total Paid: $${priceData.total.toFixed(2)} USD
Gate Barcode Token: TKT-APX-${Date.now().toString(36).toUpperCase()}`;

    navigator.clipboard.writeText(summary);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div
      className={`relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Emerald Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500" />

      {/* ── Match Event Header ────────────────────────────────────────────── */}
      <div className="p-6 md:p-7 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" />
            Official Spectator Gate Pass
          </span>

          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {kickoffTime}
          </span>
        </div>

        <h3 className="text-xl font-black text-white tracking-tight mt-3">{matchTitle}</h3>

        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            {matchDate}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 truncate max-w-[280px]">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            {venueName}
          </span>
        </div>
      </div>

      {/* ── Main Booking & Pass View ──────────────────────────────────────── */}
      <div className="p-6 md:p-7 space-y-6">
        {isPurchased ? (
          /* ── Perforated Stadium Digital Ticket Pass ─────────────────────── */
          <div className="space-y-6">
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 overflow-hidden shadow-2xl">
              {/* Ticket Top Half */}
              <div className="p-6 border-b-2 border-dashed border-slate-800 relative">
                {/* Left and Right Notches */}
                <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-slate-950 border-r border-slate-700" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-slate-950 border-l border-slate-700" />

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      Admit {ticketCount} Person(s)
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">{priceData.tier.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{gateEntry}</p>
                  </div>

                  <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-slate-950" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Assigned Seats</span>
                    <span className="text-slate-200 font-bold">{assignedSeats.join(', ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase">Amount Paid</span>
                    <span className="text-emerald-400 font-bold">${priceData.total.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>

              {/* Ticket Bottom Stub */}
              <div className="p-4 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Valid Gate Pass • Single Entry</span>
                </div>
                <span className="text-[11px] text-slate-500">TKT-PASS-2026-X8</span>
              </div>
            </div>

            {/* Pass Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyPass}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-md"
              >
                {copiedPass ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPass ? 'Pass Copied!' : 'Copy Ticket Info'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Save Pass to Wallet</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Section 1: Seating Zone Selector ─────────────────────────── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                1. Choose Seating Section
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SEATING_TIERS.map((tier) => {
                  const TierIcon = tier.icon;
                  const isSelected = selectedZone === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedZone(tier.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/25 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <TierIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{tier.title}</h4>
                            <span className="text-[10px] text-slate-400">{tier.badge}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-white font-mono">${tier.basePrice}</span>
                          <span className="block text-[10px] text-slate-500">/ seat</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">{tier.perks}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 2: Concession & Quantity Stepper ─────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  2. Concession Category
                </label>
                <select
                  value={concession}
                  onChange={(e) => setConcession(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="STANDARD">Standard Adult Ticket</option>
                  <option value="STUDENT">Student / Youth (20% Off)</option>
                  <option value="SENIOR">Senior / Veteran (25% Off)</option>
                  <option value="CHILD">Child Under 12 (50% Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Number of Tickets
                </label>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-base font-bold text-white font-mono">{ticketCount} Tickets</span>

                  <button
                    type="button"
                    onClick={() => setTicketCount(Math.min(20, ticketCount + 1))}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Section 3: Pricing Summary & Checkout ────────────────────── */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Unit Rate ({priceData.tier.title}):</span>
                <span className="font-mono">${priceData.unitRate.toFixed(2)} x {ticketCount}</span>
              </div>

              {priceData.groupSavings > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Group Bulk Savings (10% Off):</span>
                  <span>-${priceData.groupSavings.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Service & Processing Fee:</span>
                <span>${priceData.serviceFee.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">Total Pass Amount:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ${priceData.total.toFixed(2)} USD
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePurchase}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Purchase & Generate Digital Spectator Pass</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

SpectatorTicketPassCard.propTypes = {
  matchTitle: PropTypes.string,
  venueName: PropTypes.string,
  matchDate: PropTypes.string,
  kickoffTime: PropTypes.string,
  gateEntry: PropTypes.string,
  onPurchaseComplete: PropTypes.func,
  className: PropTypes.string,
};
