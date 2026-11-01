import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Car,
  Zap,
  Crown,
  Bus,
  CheckCircle2,
  Copy,
  QrCode,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function StadiumParkingPassCard({
  bookingId = 'BK-2026-9420',
  pitchName = 'Stadium Arena — Pitch 2 (North Gate)',
  matchTime = 'Today: 18:30 — 20:00 (Parking buffer: 18:00 — 20:30)',
  initialPlate = 'DHA-METRO-1142',
  onPassGenerated,
  className = '',
}) {
  const [bayType, setBayType] = useState('STANDARD_SEDAN_SUV');
  const [licensePlate, setLicensePlate] = useState(initialPlate);
  const [enableEvCharging, setEnableEvCharging] = useState(false);
  const [estimatedKwh, setEstimatedKwh] = useState(25);
  const [durationHours, setDurationHours] = useState(2.5);
  const [isReserved, setIsReserved] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const PARKING_OPTIONS = [
    {
      id: 'VIP_COVERED',
      name: 'VIP Covered Pitchside',
      rate: 8.0,
      icon: Crown,
      badge: 'Weather Sheltered',
      desc: 'Reserved underground spot right beside player tunnel elevator',
    },
    {
      id: 'EV_FAST_CHARGER',
      name: 'EV Ultra-Fast Charge (22kW)',
      rate: 12.0,
      icon: Zap,
      badge: 'Level 2 Fast',
      desc: 'Dedicated charging spot with automatic shutoff upon 100% full',
    },
    {
      id: 'STANDARD_SEDAN_SUV',
      name: 'Standard Car & SUV Lot',
      rate: 5.0,
      icon: Car,
      badge: 'Best Value',
      desc: 'Paved security lot with 24/7 CCTV & 3-min walk to turnstiles',
    },
    {
      id: 'TEAM_MINIVAN_BUS',
      name: 'Team Squad Van / Bus',
      rate: 15.0,
      icon: Bus,
      badge: 'Oversized Bay',
      desc: '12-meter extended bay with direct kit unloading to locker room',
    },
  ];

  // Pricing calculations
  const priceData = useMemo(() => {
    const selected = PARKING_OPTIONS.find((p) => p.id === bayType) || PARKING_OPTIONS[2];
    const rawParking = selected.rate * durationHours;

    let evChargeFee = 0;
    if (bayType === 'EV_FAST_CHARGER' && enableEvCharging) {
      evChargeFee = estimatedKwh * 0.35;
    }

    // 15% Pitch Bundle Discount
    const subtotal = rawParking + evChargeFee;
    const discount = subtotal * 0.15;
    const tax = (subtotal - discount) * 0.05;
    const total = subtotal - discount + tax;

    return {
      selected,
      rawParking: Math.round(rawParking * 100) / 100,
      evChargeFee: Math.round(evChargeFee * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [bayType, durationHours, enableEvCharging, estimatedKwh]);

  const assignedSpotNumber = useMemo(() => {
    const prefix = bayType === 'VIP_COVERED' ? 'VIP-B' : bayType === 'EV_FAST_CHARGER' ? 'EV-C' : 'LOT-A';
    return `${prefix} • Spot #24`;
  }, [bayType]);

  const barrierBarcode = useMemo(() => {
    return `PRK-${licensePlate.toUpperCase().replace(/[^A-Z0-9]/g, '')}-7X2`;
  }, [licensePlate]);

  const handleReserve = () => {
    if (!licensePlate.trim()) return;
    setIsReserved(true);
    if (onPassGenerated) {
      onPassGenerated({
        bookingId,
        bayType,
        licensePlate,
        assignedSpot: assignedSpotNumber,
        totalPaid: priceData.total,
      });
    }
  };

  const handleCopyPass = () => {
    const summary = `🅿️ STADIUM PARKING & ANPR GATE PASS
Booking: ${bookingId}
Vehicle Plate: ${licensePlate.toUpperCase()}
Allocated Spot: ${assignedSpotNumber} (${priceData.selected.name})
Window: ${matchTime}
Total Paid: $${priceData.total.toFixed(2)} USD (15% Pitch Bundle Applied)
Barrier Token: ${barrierBarcode}
Status: VERIFIED — Automated Barrier Lifts on ANPR Camera Recognition`;

    navigator.clipboard.writeText(summary);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div
      className={`relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Gradient Banner */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400" />

      {/* ── Header Bar ────────────────────────────────────────────────────── */}
      <div className="p-6 md:p-7 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" />
            Stadium ANPR Smart Parking
          </span>

          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Buffer: ±30m Kickoff
          </span>
        </div>

        <h3 className="text-xl font-black text-white tracking-tight mt-3">Pitchside Parking & EV Bay</h3>

        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            {pitchName}
          </span>
          <span>•</span>
          <span className="font-mono text-slate-300">{matchTime}</span>
        </div>
      </div>

      {/* ── Main Form / Pass Screen ───────────────────────────────────────── */}
      <div className="p-6 md:p-7 space-y-6">
        {isReserved ? (
          /* ── Confirmed ANPR Digital Parking Pass ─────────────────────────── */
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto mb-3 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                ANPR Barrier Whitelisted
              </span>

              <h4 className="text-2xl font-black text-white tracking-tight mt-3">Parking Reserved & Synced</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                The entrance barrier camera will automatically detect your license plate and lift on approach.
              </p>
            </div>

            {/* Pass Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono text-xs space-y-3">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Registered License Plate</span>
                  <span className="text-2xl font-black text-white tracking-widest">{licensePlate.toUpperCase()}</span>
                </div>
                <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
                  <QrCode className="w-12 h-12 text-slate-950" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Allocated Space</span>
                  <span className="font-bold text-cyan-400 text-sm">{assignedSpotNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase">Bay Tier</span>
                  <span className="font-bold text-white truncate block">{priceData.selected.name}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-300">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Includes 30m Post-Match Grace</span>
                </div>
                <span className="text-base font-black text-emerald-400">
                  ${priceData.total.toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCopyPass}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-md"
              >
                {copiedPass ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPass ? 'Pass Copied!' : 'Copy Parking Pass'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Section 1: Bay Tier Selector ─────────────────────────────── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                1. Select Parking Bay Tier
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PARKING_OPTIONS.map((opt) => {
                  const OptIcon = opt.icon;
                  const isSelected = bayType === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setBayType(opt.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-950/25 border-blue-500/60 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-blue-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <OptIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{opt.name}</h4>
                            <span className="text-[10px] text-slate-400">{opt.badge}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-white font-mono">${opt.rate.toFixed(2)}</span>
                          <span className="block text-[10px] text-slate-500">/ hr</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 2: License Plate & Duration ──────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Vehicle License Plate (ANPR)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DHA-GA-1122"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Parking Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2.0, 2.5, 3.5].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDurationHours(hrs)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        durationHours === hrs
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {hrs} Hrs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Section 3: EV Fast Charging Addon ────────────────────────── */}
            {bayType === 'EV_FAST_CHARGER' && (
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">22kW Fast Charging Session</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableEvCharging}
                    onChange={(e) => setEnableEvCharging(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 cursor-pointer"
                  />
                </div>

                {enableEvCharging && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-cyan-800/40">
                    <span>Target Charge: {estimatedKwh} kWh (~80% full)</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      +${(estimatedKwh * 0.35).toFixed(2)} USD (@ $0.35/kWh)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Section 4: Cost Breakdown & Checkout ─────────────────────── */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Parking Bay ({durationHours} hrs):</span>
                <span className="font-mono">${priceData.rawParking.toFixed(2)}</span>
              </div>
              {priceData.evChargeFee > 0 && (
                <div className="flex justify-between text-cyan-400">
                  <span>EV 22kW Fast Charge:</span>
                  <span className="font-mono">+${priceData.evChargeFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Pitch Booking Bundle (15% Off):</span>
                <span>-${priceData.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">Total Parking Fee:</span>
                <span className="text-lg font-black text-blue-400 font-mono">${priceData.total.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReserve}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-blue-500 hover:bg-blue-400 text-slate-950 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <Car className="w-4 h-4" />
              <span>Confirm Reservation & Whitelist ANPR Gate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

StadiumParkingPassCard.propTypes = {
  bookingId: PropTypes.string,
  pitchName: PropTypes.string,
  matchTime: PropTypes.string,
  initialPlate: PropTypes.string,
  onPassGenerated: PropTypes.func,
  className: PropTypes.string,
};
