import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Users,
  DoorOpen,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Sliders,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const TURNSTILE_GATES = [
  { id: 'GATE_NORTH_A', name: 'North Stand Turnstiles 1-6', capacityMin: 120, defaultQueue: 45, isFastTrack: false },
  { id: 'GATE_NORTH_B', name: 'North Stand Turnstiles 7-12', capacityMin: 120, defaultQueue: 28, isFastTrack: false },
  { id: 'GATE_SOUTH_AWAY', name: 'South Stand Visiting Squad Entry', capacityMin: 90, defaultQueue: 75, isFastTrack: false },
  { id: 'GATE_EAST_VIP', name: 'East Concourse Hospitality & Media', capacityMin: 50, defaultQueue: 12, isFastTrack: true },
  { id: 'GATE_WEST_FAMILY', name: 'West Stand Accessible & Family Lane', capacityMin: 80, defaultQueue: 22, isFastTrack: true },
];

/**
 * TurnstileIngressMonitorCard
 * 
 * Provides stadium operations, safety stewards, and queue marshals with
 * real-time turnstile entry throughput pacing, queue bottleneck alerts,
 * and automated gate diversion routing.
 */
export default function TurnstileIngressMonitorCard({
  stadiumName,
  eventFixture,
  onRerouteDispatched,
}) {
  const [gateQueues, setGateQueues] = useState({
    GATE_NORTH_A: 45,
    GATE_NORTH_B: 28,
    GATE_SOUTH_AWAY: 75,
    GATE_EAST_VIP: 12,
    GATE_WEST_FAMILY: 22,
  });

  const [isReroutingActive, setIsReroutingActive] = useState(false);
  const [rerouteTicket, setRerouteTicket] = useState(null);

  // Ingress analytics
  const analytics = useMemo(() => {
    let totalQueue = 0;
    let maxWaitMinutes = 0;
    let bottleneck = null;

    const gateReports = TURNSTILE_GATES.map((gate) => {
      const queue = gateQueues[gate.id] || 0;
      totalQueue += queue;
      const waitMinutes = Math.round((queue / (gate.capacityMin / 60)) / 60 * 10) / 10;

      if (waitMinutes > maxWaitMinutes) {
        maxWaitMinutes = waitMinutes;
        bottleneck = gate;
      }

      let statusTier = 'CLEAR';
      if (waitMinutes >= 15) {
        statusTier = 'CRITICAL';
      } else if (waitMinutes >= 8) {
        statusTier = 'SURGE';
      }

      return {
        ...gate,
        queue,
        waitMinutes,
        statusTier,
      };
    });

    const isBottlenecked = maxWaitMinutes >= 8;

    return {
      totalQueue,
      maxWaitMinutes,
      bottleneck,
      gateReports,
      isBottlenecked,
      pacingScore: Math.max(40, 100 - Math.round(maxWaitMinutes * 4)),
    };
  }, [gateQueues]);

  const handleSimulateQueueChange = (gateId, delta) => {
    setGateQueues((prev) => ({
      ...prev,
      [gateId]: Math.max(0, (prev[gateId] || 0) + delta),
    }));
  };

  const handleDispatchReroute = () => {
    const ticketId = `DIV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const payload = {
      ticketId,
      sourceGate: analytics.bottleneck?.name || 'South Stand Visiting Squad Entry',
      targetGate: 'North Stand Turnstiles 7-12',
      divertedFans: 25,
      dispatchedAt: new Date().toLocaleTimeString(),
    };

    setRerouteTicket(payload);
    setIsReroutingActive(true);

    // Apply queue balance simulation
    setGateQueues((prev) => ({
      ...prev,
      GATE_SOUTH_AWAY: Math.max(10, (prev.GATE_SOUTH_AWAY || 75) - 25),
      GATE_NORTH_B: (prev.GATE_NORTH_B || 28) + 25,
    }));

    if (onRerouteDispatched) {
      onRerouteDispatched(payload);
    }
  };

  const handleReset = () => {
    setIsReroutingActive(false);
    setRerouteTicket(null);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg mx-auto text-slate-100">
      {/* Top Gradient Status Accent */}
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${
          analytics.isBottlenecked
            ? 'from-amber-500 via-orange-500 to-rose-600'
            : 'from-emerald-400 via-teal-500 to-cyan-500'
        }`}
      />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              analytics.isBottlenecked
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            <DoorOpen size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Turnstile Ingress &amp; Flow Control
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {stadiumName} · {eventFixture}
            </p>
          </div>
        </div>
        {isReroutingActive && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 animate-pulse">
            <ArrowRightLeft size={12} /> Divert Active
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Real-time Turnstile Throughput Telemetry */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Users size={11} className="text-cyan-400" /> Total In Queue
            </span>
            <span className="text-sm font-bold font-mono text-cyan-300">{analytics.totalQueue} fans</span>
            <span className="text-[9px] text-slate-500">Across 5 portals</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <Clock size={11} className="text-amber-400" /> Max Wait Time
            </span>
            <span className="text-sm font-bold font-mono text-slate-100">
              {analytics.maxWaitMinutes} mins
            </span>
            <span className="text-[9px] text-slate-500">SLA: &lt;10 mins</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-400" /> Flow Health
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {analytics.pacingScore}/100
            </span>
            <span className="text-[9px] text-slate-500">Pacing index</span>
          </div>
        </div>

        {/* Turnstile Portal Matrix */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Turnstile Gate Ingress Pacing
          </span>

          <div className="flex flex-col gap-2">
            {analytics.gateReports.map((gate) => (
              <div
                key={gate.id}
                className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex flex-col gap-0.5 max-w-[200px]">
                  <span className="font-medium text-slate-200 truncate">{gate.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>{gate.capacityMin}/min rate</span>
                    <span>·</span>
                    <span className={gate.statusTier === 'CRITICAL' ? 'text-rose-400 font-bold' : gate.statusTier === 'SURGE' ? 'text-amber-400' : 'text-emerald-400'}>
                      {gate.waitMinutes}m wait
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isReroutingActive || gate.queue <= 0}
                    onClick={() => handleSimulateQueueChange(gate.id, -10)}
                    className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-xs text-cyan-300 w-8 text-center">
                    {gate.queue}
                  </span>
                  <button
                    disabled={isReroutingActive}
                    onClick={() => handleSimulateQueueChange(gate.id, 10)}
                    className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reroute Action or Active Notice */}
        {!isReroutingActive ? (
          <button
            onClick={handleDispatchReroute}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
          >
            <ArrowRightLeft size={16} /> Deploy Dynamic Queue Redistribution
          </button>
        ) : (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                <CheckCircle2 size={14} className="text-cyan-400" /> Digital Signage Diversion Active
              </span>
              <span className="font-mono text-xs text-cyan-300 font-bold">
                {rerouteTicket?.ticketId}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Diverting fans from <span className="font-semibold text-white">{rerouteTicket?.sourceGate}</span> to <span className="font-semibold text-white">{rerouteTicket?.targetGate}</span>. Concourse LED panels and steward megaphones armed at {rerouteTicket?.dispatchedAt}.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Sliders size={12} className="text-cyan-400" /> Estimated wait cut: -4.5 mins
              </span>
              <button
                onClick={handleReset}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

TurnstileIngressMonitorCard.propTypes = {
  stadiumName: PropTypes.string,
  eventFixture: PropTypes.string,
  onRerouteDispatched: PropTypes.func,
};

TurnstileIngressMonitorCard.defaultProps = {
  stadiumName: 'National Premier Stadium',
  eventFixture: 'London Derby (Kickoff: 19:45)',
  onRerouteDispatched: null,
};
