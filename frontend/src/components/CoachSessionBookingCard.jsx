import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  GraduationCap,
  Users,
  Target,
  Video,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Sparkles,
  MapPin,
  CreditCard,
  ChevronRight,
} from 'lucide-react';

export default function CoachSessionBookingCard({
  coachName = 'Coach Rahim Uddin',
  coachTitle = 'UEFA B Licensed Tactician',
  sport = 'Football',
  avatar = '🧑‍🏫',
  rating = 4.9,
  reviewsCount = 128,
  baseHourlyRate = 60,
  pitchHourlyRate = 50,
  pitchName = 'Pitch 2 — Stadium North Arena',
  onBookSession,
  className = '',
}) {
  const [sessionFormat, setSessionFormat] = useState('ONE_ON_ONE');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedDrills, setSelectedDrills] = useState(['Finishing & Striking', 'Ball Mastery']);
  const [bundlePitch, setBundlePitch] = useState(true);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('17:30 — 18:30');
  const [isBooked, setIsBooked] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const DRILL_OPTIONS = [
    'Finishing & Striking',
    'Ball Mastery',
    'Tactical Positioning',
    'SAQ Speed & Agility',
    'Defensive 1v1 Duels',
    'Set-Piece Routines',
  ];

  const TIME_SLOTS = ['09:00 — 10:00', '11:30 — 12:30', '16:00 — 17:00', '17:30 — 18:30', '19:00 — 20:00'];

  // Financial calculations
  const priceData = useMemo(() => {
    const hours = durationMinutes / 60;
    let formatMultiplier = 1.0;
    if (sessionFormat === 'SMALL_GROUP') formatMultiplier = 1.35;
    if (sessionFormat === 'TEAM_TACTICAL') formatMultiplier = 2.2;
    if (sessionFormat === 'VIDEO_ANALYSIS') formatMultiplier = 0.8;

    const rawCoachFee = baseHourlyRate * formatMultiplier * hours;
    const rawPitchFee = bundlePitch ? pitchHourlyRate * hours : 0;

    // 10% bundle discount if pitch is bundled
    const discount = bundlePitch ? (rawCoachFee + rawPitchFee) * 0.1 : 0;
    const total = rawCoachFee + rawPitchFee - discount;

    return {
      coachFee: Math.round(rawCoachFee * 100) / 100,
      pitchFee: Math.round(rawPitchFee * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [baseHourlyRate, pitchHourlyRate, durationMinutes, sessionFormat, bundlePitch]);

  const toggleDrill = (drill) => {
    if (selectedDrills.includes(drill)) {
      if (selectedDrills.length > 1) {
        setSelectedDrills(selectedDrills.filter((d) => d !== drill));
      }
    } else {
      setSelectedDrills([...selectedDrills, drill]);
    }
  };

  const handleBook = () => {
    setIsBooked(true);
    if (onBookSession) {
      onBookSession({
        coachName,
        sessionFormat,
        durationMinutes,
        selectedDrills,
        bundlePitch,
        selectedTimeSlot,
        totalPrice: priceData.total,
      });
    }
  };

  const copyBookingSummary = () => {
    const summary = `🎓 COACHING PASS CONFIRMED: ${coachName}
Format: ${sessionFormat} (${durationMinutes} min)
Time: ${selectedTimeSlot}
Venue Turf: ${bundlePitch ? pitchName : 'Client Selected Pitch'}
Drill Focus: ${selectedDrills.join(', ')}
Total Paid: $${priceData.total.toFixed(2)} USD (10% Bundle Applied)
Status: CONFIRMED & SLOTTED`;

    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div
      className={`relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Emerald-Gold Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-indigo-500" />

      {/* ── Coach Header Card ────────────────────────────────────────────── */}
      <div className="p-6 md:p-7 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-lg">
            {avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{coachName}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO COACH
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{coachTitle}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">★ {rating}</span>
              <span className="text-slate-500">({reviewsCount} reviews)</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">From</span>
          <span className="text-xl font-black text-white font-mono">${baseHourlyRate}</span>
          <span className="text-xs text-slate-500"> / hr</span>
        </div>
      </div>

      {/* ── Main Booking Body ─────────────────────────────────────────────── */}
      <div className="p-6 md:p-7 space-y-6">
        {isBooked ? (
          /* Confirmation Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-white">Training Session Reserved!</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your training session with <span className="text-white font-semibold">{coachName}</span> has been confirmed
              and added to the stadium calendar.
            </p>

            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 my-5 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Time Slot:</span>
                <span className="text-white font-bold">{selectedTimeSlot}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Format:</span>
                <span className="text-indigo-400 font-bold">{sessionFormat}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Venue:</span>
                <span className="text-slate-200">{bundlePitch ? pitchName : 'External Turf'}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Total Paid:</span>
                <span className="text-emerald-400 font-black">${priceData.total.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={copyBookingSummary}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold mx-auto transition-all border border-slate-700"
            >
              {copiedToast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Copied Summary' : 'Copy Session Pass'}</span>
            </button>
          </div>
        ) : (
          <>
            {/* ── Section 1: Session Format ───────────────────────────────── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                1. Select Training Format
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { id: 'ONE_ON_ONE', label: '1-on-1 Elite', icon: Target },
                  { id: 'SMALL_GROUP', label: 'Group Clinic', icon: Users },
                  { id: 'TEAM_TACTICAL', label: 'Squad Master', icon: GraduationCap },
                  { id: 'VIDEO_ANALYSIS', label: 'Video Film', icon: Video },
                ].map((fmt) => {
                  const FmtIcon = fmt.icon;
                  const isSelected = sessionFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSessionFormat(fmt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/60 text-white shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <FmtIcon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="block text-xs font-bold">{fmt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section 2: Skill Focus & Drills ─────────────────────────── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                2. Target Skill Drills
              </label>
              <div className="flex flex-wrap gap-2">
                {DRILL_OPTIONS.map((drill) => {
                  const isSelected = selectedDrills.includes(drill);
                  return (
                    <button
                      key={drill}
                      type="button"
                      onClick={() => toggleDrill(drill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {drill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Section 3: Time Slot & Duration ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Session Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        durationMinutes === mins
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {mins} Min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Start Time Slot
                </label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Section 4: Turf Pitch Bundle Toggle ──────────────────────── */}
            <div
              onClick={() => setBundlePitch(!bundlePitch)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                bundlePitch
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    bundlePitch ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Bundle Match Turf Reservation</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      SAVE 10%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{pitchName} (bundled with session)</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={bundlePitch}
                onChange={() => {}} // handled by parent onClick
                className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 pointer-events-none"
              />
            </div>

            {/* ── Price Summary & Checkout Action ──────────────────────────── */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Coach Trainer Fee:</span>
                <span>${priceData.coachFee.toFixed(2)}</span>
              </div>
              {bundlePitch && (
                <div className="flex justify-between text-slate-400">
                  <span>Pitch Turf Fee:</span>
                  <span>${priceData.pitchFee.toFixed(2)}</span>
                </div>
              )}
              {bundlePitch && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>10% Bundle Discount:</span>
                  <span>-${priceData.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">Total Amount:</span>
                <span className="text-lg font-black text-amber-400 font-mono">${priceData.total.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBook}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Confirm & Reserve Training Session</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

CoachSessionBookingCard.propTypes = {
  coachName: PropTypes.string,
  coachTitle: PropTypes.string,
  sport: PropTypes.string,
  avatar: PropTypes.string,
  rating: PropTypes.number,
  reviewsCount: PropTypes.number,
  baseHourlyRate: PropTypes.number,
  pitchHourlyRate: PropTypes.number,
  pitchName: PropTypes.string,
  onBookSession: PropTypes.func,
  className: PropTypes.string,
};
