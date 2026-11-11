import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Video,
  Eye,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Tv,
  Maximize2,
  ShieldAlert,
} from 'lucide-react';

const VAR_REVIEWS = [
  {
    id: 'PENALTY_DECISION',
    title: 'Penalty Box Foul / Handball',
    angles: ['CAM_MAIN_HIGH', 'CAM_TOUCH_EAST', 'CAM_GOALLINE_NORTH'],
    maxWindowSec: 90,
    badge: 'Critical Decision',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'GOAL_LEAD_UP',
    title: 'Goal Disallowance / Offside',
    angles: ['CAM_OFFSIDE_RAIL', 'CAM_MAIN_HIGH', 'CAM_GOALLINE_SOUTH'],
    maxWindowSec: 120,
    badge: 'Goal Check',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'DIRECT_RED_CARD',
    title: 'Violent Conduct / Red Card',
    angles: ['CAM_MAIN_HIGH', 'CAM_TOUCH_WEST', 'CAM_RRA_MONITOR'],
    maxWindowSec: 90,
    badge: 'Disciplinary',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
];

const CAMERA_FEEDS = [
  { id: 'CAM_MAIN_HIGH', label: 'Grandstand Tactical 4K', fps: 120, status: 'LOCKED' },
  { id: 'CAM_OFFSIDE_RAIL', label: 'Touchline Parallax Rail', fps: 240, status: 'SYNCED' },
  { id: 'CAM_GOALLINE_NORTH', label: 'North Goalmouth Slit', fps: 300, status: 'SYNCED' },
  { id: 'CAM_TOUCH_EAST', label: 'East Dugout Angle', fps: 120, status: 'SYNCED' },
];

/**
 * VarPitchsideReviewCard
 * 
 * Provides match officials, VAR referees, and broadcast supervisors with
 * multi-angle camera synchronization, offside triangulation line offsets,
 * and pitchside Referee Review Area (RRA) decision logging.
 */
export default function VarPitchsideReviewCard({
  matchId,
  leadReferee,
  varOfficial,
  onDecisionFinalized,
}) {
  const [selectedReviewId, setSelectedReviewId] = useState('PENALTY_DECISION');
  const [activeCameraId, setActiveCameraId] = useState('CAM_OFFSIDE_RAIL');
  const [offsideOffsetMm, setOffsideOffsetMm] = useState(-42); // Negative = onside, Positive = offside
  const [reviewState, setReviewState] = useState('CHECKING'); // 'CHECKING' | 'DECIDED'
  const [decisionVerdict, setDecisionVerdict] = useState(null);

  const activeReview = useMemo(() => {
    return VAR_REVIEWS.find((r) => r.id === selectedReviewId) || VAR_REVIEWS[0];
  }, [selectedReviewId]);

  const triangulationResult = useMemo(() => {
    const isOffside = offsideOffsetMm > 0;
    return {
      isOffside,
      marginMm: Math.abs(offsideOffsetMm),
      verdictLabel: isOffside ? 'OFFSIDE - NO GOAL' : 'ONSIDE - GOAL STANDS',
    };
  }, [offsideOffsetMm]);

  const handleFinalizeDecision = (verdict) => {
    const docketId = `VAR-${matchId}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const payload = {
      docketId,
      matchId,
      reviewType: activeReview.id,
      verdict,
      offsideOffsetMm,
      leadReferee,
      varOfficial,
      confirmedAt: new Date().toLocaleTimeString(),
    };

    setDecisionVerdict(payload);
    setReviewState('DECIDED');

    if (onDecisionFinalized) {
      onDecisionFinalized(payload);
    }
  };

  const handleReset = () => {
    setReviewState('CHECKING');
    setDecisionVerdict(null);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Gradient Status Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-cyan-500" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <Tv size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              VAR Pitchside Review &amp; RRA Feed
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Ref: {leadReferee} · VAR Lead: {varOfficial}
            </p>
          </div>
        </div>
        {reviewState === 'CHECKING' ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse">
            <Video size={12} /> VAR CHECK ACTIVE
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 size={12} /> DECISION CONCLUDED
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Review Incident Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Incident Under Review
          </label>
          <div className="grid grid-cols-1 gap-2">
            {VAR_REVIEWS.map((rev) => {
              const selected = rev.id === selectedReviewId;
              return (
                <button
                  key={rev.id}
                  disabled={reviewState === 'DECIDED'}
                  onClick={() => setSelectedReviewId(rev.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selected
                      ? 'bg-red-500/15 border-red-500/50 shadow-md shadow-red-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  } ${reviewState === 'DECIDED' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100">{rev.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${rev.badgeColor}`}>
                      {rev.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={10} /> Max SLA: {rev.maxWindowSec}s
                    </span>
                    <span>·</span>
                    <span>{rev.angles.length} Synced 240fps Feeds</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-angle Camera Grid */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye size={12} className="text-cyan-400" /> Synchronized Camera Angles
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Frame Locked 120-300fps</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CAMERA_FEEDS.map((cam) => {
              const isSelected = cam.id === activeCameraId;
              return (
                <button
                  key={cam.id}
                  onClick={() => setActiveCameraId(cam.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  } cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{cam.label}</span>
                    <Maximize2 size={11} className={isSelected ? 'text-cyan-400' : 'text-slate-600'} />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                    <span>{cam.fps} FPS</span>
                    <span className="text-emerald-400">{cam.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Semi-automated Offside Line Triangulation */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sliders size={13} className="text-amber-400" /> Parallax Line Calibrator
            </span>
            <span className="font-mono font-bold text-amber-300">
              {offsideOffsetMm > 0 ? `+${offsideOffsetMm}` : offsideOffsetMm} mm
            </span>
          </div>
          <input
            type="range"
            min="-150"
            max="150"
            disabled={reviewState === 'DECIDED'}
            value={offsideOffsetMm}
            onChange={(e) => setOffsideOffsetMm(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className={triangulationResult.isOffside ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              Triangulation: {triangulationResult.verdictLabel}
            </span>
            <span className="text-slate-500 text-[10px]">Margin: {triangulationResult.marginMm}mm</span>
          </div>
        </div>

        {/* Decision Actions */}
        {reviewState === 'CHECKING' ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleFinalizeDecision('CONFIRMED_DECISION')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              <CheckCircle2 size={15} /> Confirm / Award
            </button>
            <button
              onClick={() => handleFinalizeDecision('OVERTURN_ON_FIELD_CALL')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-3 px-3 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              <XCircle size={15} /> Overturn On-Field
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-emerald-400" /> Review Concluded &amp; Broadcasted
              </span>
              <span className="font-mono text-xs text-slate-400">
                {decisionVerdict?.docketId}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Verdict: <span className="font-bold text-white">{decisionVerdict?.verdict}</span>. RRA monitor synchronized with pitchside big screens at {decisionVerdict?.confirmedAt}.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-cyan-300">
                <ShieldAlert size={12} /> Certified in official match report
              </span>
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Reset for Next Check
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

VarPitchsideReviewCard.propTypes = {
  matchId: PropTypes.string,
  leadReferee: PropTypes.string,
  varOfficial: PropTypes.string,
  onDecisionFinalized: PropTypes.func,
};

VarPitchsideReviewCard.defaultProps = {
  matchId: 'MATCH-782',
  leadReferee: 'Michael Oliver (On-Field)',
  varOfficial: 'Stuart Attwell (VAR Hub)',
  onDecisionFinalized: null,
};
