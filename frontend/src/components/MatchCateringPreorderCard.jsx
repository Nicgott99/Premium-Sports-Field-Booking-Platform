import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Utensils,
  Droplets,
  Zap,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Copy,
  Users,
  ChevronRight,
  Flame,
  Crown,
  QrCode,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function MatchCateringPreorderCard({
  bookingId = 'BK-2026-9420',
  pitchName = 'Pitch 4 — Stadium North Turf',
  teamName = 'Apex Strikers FC',
  matchTime = 'Today at 18:30 (Kickoff in 90m)',
  squadSize = 14,
  onOrderSuccess,
  className = '',
}) {
  const [selectedHydration, setSelectedHydration] = useState(['ISOTONIC_SQUAD_PACK']);
  const [selectedMeal, setSelectedMeal] = useState('SQUAD_WRAP_BOX');
  const [headcount, setHeadcount] = useState(squadSize);
  const [deliverySlot, setDeliverySlot] = useState('HALFTIME_WHISTLE');
  const [isOrdered, setIsOrdered] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  const HYDRATION_ITEMS = [
    {
      id: 'BASIC_PITCH_COOLER',
      name: 'Pitchside Ice Cooler (20L)',
      price: 12,
      icon: Droplets,
      servings: '20 Cups',
      desc: 'Insulated ice water dispenser & electrolyte dissolve tabs',
    },
    {
      id: 'ISOTONIC_SQUAD_PACK',
      name: 'Isotonic Electrolyte Crate',
      price: 28,
      icon: Zap,
      servings: '16 Bottles',
      desc: '16x Chilled sports drinks & energy performance chews',
    },
    {
      id: 'RECOVERY_PROTEIN_BAR',
      name: 'Post-Match Protein Crate',
      price: 45,
      icon: Sparkles,
      servings: '14 Shakes',
      desc: '25g Whey/Plant protein shakes & organic flapjacks',
    },
  ];

  const MEAL_BUNDLES = [
    {
      id: 'SQUAD_WRAP_BOX',
      name: 'MatchDay Fuel Wraps',
      pricePerPerson: 8.5,
      icon: Utensils,
      badge: 'Balanced Carb/Protein',
      desc: 'Grilled Lemon Chicken, Falafel Vegan & Pita Chips',
    },
    {
      id: 'GOURMET_BURGER_POST_MATCH',
      name: 'Champion Smash Burgers',
      pricePerPerson: 12.0,
      icon: Flame,
      badge: 'High Calorie Refuel',
      desc: 'Angus Beef / Beyond Vegan Burgers with Truffle Wedges',
    },
    {
      id: 'VIP_HOSPITALITY_PLATTER',
      name: 'VIP Executive Platter',
      pricePerPerson: 18.0,
      icon: Crown,
      badge: 'Executive Hospitality',
      desc: 'Artisan cold cuts, sushi rolls & sparkling cold juices',
    },
  ];

  const toggleHydration = (id) => {
    if (selectedHydration.includes(id)) {
      setSelectedHydration(selectedHydration.filter((item) => item !== id));
    } else {
      setSelectedHydration([...selectedHydration, id]);
    }
  };

  // Price calculations
  const orderData = useMemo(() => {
    let hydrationSubtotal = 0;
    for (const hid of selectedHydration) {
      const item = HYDRATION_ITEMS.find((h) => h.id === hid);
      if (item) hydrationSubtotal += item.price;
    }

    let mealSubtotal = 0;
    const meal = MEAL_BUNDLES.find((m) => m.id === selectedMeal);
    if (meal) {
      mealSubtotal = meal.pricePerPerson * headcount;
    }

    const subtotal = hydrationSubtotal + mealSubtotal;
    const runnerFee = subtotal > 0 ? 5.0 : 0.0;
    const tax = subtotal * 0.07;
    const grandTotal = subtotal + runnerFee + tax;
    const perPlayer = grandTotal / Math.max(1, headcount);

    return {
      hydrationSubtotal: Math.round(hydrationSubtotal * 100) / 100,
      mealSubtotal: Math.round(mealSubtotal * 100) / 100,
      runnerFee,
      tax: Math.round(tax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      perPlayer: Math.round(perPlayer * 100) / 100,
    };
  }, [selectedHydration, selectedMeal, headcount]);

  const voucherToken = useMemo(() => {
    return `FND-${bookingId.slice(-4)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }, [bookingId]);

  const handleCheckout = () => {
    setIsOrdered(true);
    if (onOrderSuccess) {
      onOrderSuccess({
        bookingId,
        voucherToken,
        pitchName,
        teamName,
        totalAmount: orderData.grandTotal,
        deliverySlot,
      });
    }
  };

  const handleCopyVoucher = () => {
    const summary = `🥤 PITCHSIDE HYDRATION & CATERING VOUCHER
Voucher Code: ${voucherToken}
Team: ${teamName} | Location: ${pitchName}
Timing: ${deliverySlot === 'HALFTIME_WHISTLE' ? 'Halftime Whistle' : 'Post-Match Whistle'}
Total: $${orderData.grandTotal.toFixed(2)} USD ($${orderData.perPlayer.toFixed(2)}/player)
Status: ORDER CONFIRMED — Runner Dispatched to Pitchside Dugout`;

    navigator.clipboard.writeText(summary);
    setCopiedVoucher(true);
    setTimeout(() => setCopiedVoucher(false), 2000);
  };

  return (
    <div
      className={`relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Gradient Banner */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-500" />

      {/* ── Header Bar ────────────────────────────────────────────────────── */}
      <div className="p-6 md:p-7 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" />
              Pitchside Dugout Express
            </span>
          </div>

          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {matchTime}
          </span>
        </div>

        <h3 className="text-xl font-black text-white tracking-tight mt-3">Team Hydration & Recovery Fuel</h3>

        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">{teamName}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            {pitchName}
          </span>
        </div>
      </div>

      {/* ── Main Order Form / Voucher View ────────────────────────────────── */}
      <div className="p-6 md:p-7 space-y-6">
        {isOrdered ? (
          /* ── Confirmed Runner Delivery Voucher ───────────────────────────── */
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-3 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Runner Dispatched
              </span>

              <h4 className="text-2xl font-black text-white tracking-tight mt-3">Pitchside Delivery Scheduled</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Our kitchen & beverage runners will deliver your chilled coolers and meal boxes directly to the dugout.
              </p>
            </div>

            {/* Voucher Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono text-xs space-y-3">
              <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Delivery Handover PIN</span>
                  <span className="text-2xl font-black text-white tracking-widest">{voucherToken}</span>
                </div>
                <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
                  <QrCode className="w-12 h-12 text-slate-950" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Delivery Timing</span>
                  <span className="font-bold text-amber-400">
                    {deliverySlot === 'HALFTIME_WHISTLE' ? 'Halftime Whistle' : 'Post-Match Whistle'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase">Pitch Location</span>
                  <span className="font-bold text-white truncate block">{pitchName}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-300">
                <span>Total Amount Paid:</span>
                <span className="text-base font-black text-emerald-400">
                  ${orderData.grandTotal.toFixed(2)} USD (${orderData.perPlayer.toFixed(2)} / player)
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCopyVoucher}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-md"
              >
                {copiedVoucher ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedVoucher ? 'Voucher Copied!' : 'Copy Runner Voucher'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Section 1: Hydration & Electrolytes ──────────────────────── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                1. Select Hydration & Electrolytes
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {HYDRATION_ITEMS.map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected = selectedHydration.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleHydration(item.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/25 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <ItemIcon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-black text-white font-mono">${item.price}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                      <span className="inline-block mt-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {item.servings}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 2: Squad Recovery Meal ───────────────────────────── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                2. Post-Match Squad Meal Bundle
              </label>
              <div className="space-y-2.5">
                {MEAL_BUNDLES.map((meal) => {
                  const MealIcon = meal.icon;
                  const isSelected = selectedMeal === meal.id;
                  return (
                    <div
                      key={meal.id}
                      onClick={() => setSelectedMeal(meal.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-950/25 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <MealIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{meal.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {meal.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{meal.desc}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-white font-mono">${meal.pricePerPerson.toFixed(2)}</span>
                        <span className="block text-[10px] text-slate-500">/ player</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 3: Delivery Timing & Headcount ───────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Pitch Delivery Timing
                </label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="HALFTIME_WHISTLE">Halftime Whistle (Dugout Ice Drops)</option>
                  <option value="POST_MATCH_FINAL">Post-Match Whistle (Locker Room Refuel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Squad Headcount (Split Bill)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="6"
                    max="30"
                    value={headcount}
                    onChange={(e) => setHeadcount(Math.max(6, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap">Players</span>
                </div>
              </div>
            </div>

            {/* ── Section 4: Cost Breakdown & Checkout ─────────────────────── */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Hydration Subtotal:</span>
                <span className="font-mono">${orderData.hydrationSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Meal Boxes ({headcount} Players):</span>
                <span className="font-mono">${orderData.mealSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dedicated Pitchside Runner:</span>
                <span className="font-mono">${orderData.runnerFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
                <div>
                  <span className="font-bold text-white block">Total Order:</span>
                  <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                    Only ${orderData.perPlayer.toFixed(2)} / player
                  </span>
                </div>
                <span className="text-lg font-black text-cyan-400 font-mono">${orderData.grandTotal.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Utensils className="w-4 h-4" />
              <span>Confirm Pitchside Delivery & Issue Voucher</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

MatchCateringPreorderCard.propTypes = {
  bookingId: PropTypes.string,
  pitchName: PropTypes.string,
  teamName: PropTypes.string,
  matchTime: PropTypes.string,
  squadSize: PropTypes.number,
  onOrderSuccess: PropTypes.func,
  className: PropTypes.string,
};
