import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Flag,
  Clock,
  Share2,
  Copy,
  Plus,
  Minus,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Users,
} from 'lucide-react';

// ─── Supported Sport Presets ──────────────────────────────────────────────────

export const SPORT_PRESETS = {
  FOOTBALL: {
    id: 'FOOTBALL',
    name: 'Football / Soccer',
    periods: ['1st Half', 'Half Time', '2nd Half', 'Extra Time (1)', 'Extra Time (2)', 'Penalties', 'Full Time'],
    defaultHalfMinutes: 45,
    supportsCards: true,
    supportsTimeouts: false,
    scoreLabel: 'Goals',
  },
  FUTSAL: {
    id: 'FUTSAL',
    name: '5v5 Turf / Futsal',
    periods: ['1st Half', 'Half Time', '2nd Half', 'Penalties', 'Full Time'],
    defaultHalfMinutes: 20,
    supportsCards: true,
    supportsTimeouts: true,
    scoreLabel: 'Goals',
  },
  BASKETBALL: {
    id: 'BASKETBALL',
    name: 'Basketball',
    periods: ['Q1', 'Q2', 'Half Time', 'Q3', 'Q4', 'Overtime', 'Final'],
    defaultHalfMinutes: 12,
    supportsCards: false,
    supportsTimeouts: true,
    scoreLabel: 'Points',
  },
  CRICKET: {
    id: 'CRICKET',
    name: 'T20 Box Cricket',
    periods: ['1st Innings', 'Innings Break', '2nd Innings', 'Super Over', 'Match Complete'],
    defaultHalfMinutes: 30,
    supportsCards: false,
    supportsTimeouts: false,
    scoreLabel: 'Runs',
  },
};

// ─── Component Definition ────────────────────────────────────────────────────

export default function LiveScoreboard({
  fixtureId = 'FIX-2026-089',
  sport = 'FOOTBALL',
  initialHomeTeam = { name: 'Apex Strikers FC', shortName: 'APX', color: '#10b981', logo: '⚡' },
  initialAwayTeam = { name: 'Metro Titans', shortName: 'MTN', color: '#6366f1', logo: '🛡️' },
  initialScore = { home: 2, away: 1 },
  fieldVenue = 'Pitch 4 — Stadium Turf',
  refereeName = 'Marcus Sterling (FIFA Elite)',
  onMatchComplete,
  className = '',
}) {
  const currentSport = SPORT_PRESETS[sport] || SPORT_PRESETS.FOOTBALL;

  // ── Match State ────────────────────────────────────────────────────────────
  const [homeTeam, setHomeTeam] = useState(initialHomeTeam);
  const [awayTeam, setAwayTeam] = useState(initialAwayTeam);
  const [homeScore, setHomeScore] = useState(initialScore.home);
  const [awayScore, setAwayScore] = useState(initialScore.away);
  const [activePossession, setActivePossession] = useState('HOME');
  const [possessionRatio, setPossessionRatio] = useState(58); // % for Home

  // ── Clock State ────────────────────────────────────────────────────────────
  const [secondsElapsed, setSecondsElapsed] = useState(38 * 60 + 24); // Start at 38:24 min
  const [isRunning, setIsRunning] = useState(false);
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(0);
  const [addedMinutes, setAddedMinutes] = useState(3);
  const timerRef = useRef(null);

  // ── Events & Incident Log ──────────────────────────────────────────────────
  const [events, setEvents] = useState([
    {
      id: 'ev-1',
      minute: 14,
      period: '1st Half',
      team: 'HOME',
      type: 'GOAL',
      icon: '⚽',
      title: 'Goal! Apex Strikers',
      player: 'D. Vance (#10)',
      assist: 'L. Chen (#7)',
      detail: 'Right-foot strike from outside penalty area',
    },
    {
      id: 'ev-2',
      minute: 26,
      period: '1st Half',
      team: 'AWAY',
      type: 'CARD',
      icon: '🟨',
      title: 'Yellow Card',
      player: 'K. Miller (#4)',
      detail: 'Tactical foul preventing counter-attack',
    },
    {
      id: 'ev-3',
      minute: 31,
      period: '1st Half',
      team: 'AWAY',
      type: 'GOAL',
      icon: '⚽',
      title: 'Goal! Metro Titans',
      player: 'T. Harris (#9)',
      assist: 'J. Ramos (#11)',
      detail: 'Header off set-piece corner',
    },
    {
      id: 'ev-4',
      minute: 37,
      period: '1st Half',
      team: 'HOME',
      type: 'GOAL',
      icon: '⚽',
      title: 'Goal! Apex Strikers',
      player: 'D. Vance (#10)',
      assist: 'Unassisted',
      detail: 'Stunning curling free kick top corner',
    },
  ]);

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    type: 'GOAL',
    team: 'HOME',
    player: '',
    assist: '',
    notes: '',
  });

  const [copiedToast, setCopiedToast] = useState(false);

  // ── Timer Effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Format MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [secondsElapsed]);

  const currentMinute = Math.floor(secondsElapsed / 60);
  const currentPeriod = currentSport.periods[currentPeriodIdx] || '1st Half';

  // ── Event Handlers ─────────────────────────────────────────────────────────
  const toggleTimer = () => setIsRunning((prev) => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
  };

  const handleNextPeriod = () => {
    if (currentPeriodIdx < currentSport.periods.length - 1) {
      setCurrentPeriodIdx((prev) => prev + 1);
    }
  };

  const adjustScore = (team, delta) => {
    if (team === 'HOME') {
      setHomeScore((prev) => Math.max(0, prev + delta));
    } else {
      setAwayScore((prev) => Math.max(0, prev + delta));
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.player.trim()) return;

    let icon = '⚽';
    let title = 'Match Event';
    if (newEvent.type === 'GOAL') {
      icon = '⚽';
      title = `Goal! ${newEvent.team === 'HOME' ? homeTeam.name : awayTeam.name}`;
      adjustScore(newEvent.team, 1);
    } else if (newEvent.type === 'YELLOW_CARD') {
      icon = '🟨';
      title = 'Yellow Card';
    } else if (newEvent.type === 'RED_CARD') {
      icon = '🟥';
      title = 'Red Card';
    } else if (newEvent.type === 'SUBSTITUTION') {
      icon = '🔄';
      title = 'Substitution';
    } else if (newEvent.type === 'VAR') {
      icon = '🎯';
      title = 'VAR Review';
    }

    const created = {
      id: `ev-${Date.now()}`,
      minute: currentMinute,
      period: currentPeriod,
      team: newEvent.team,
      type: newEvent.type,
      icon,
      title,
      player: newEvent.player.trim(),
      assist: newEvent.assist.trim() || undefined,
      detail: newEvent.notes.trim() || undefined,
    };

    setEvents((prev) => [created, ...prev]);
    setShowEventModal(false);
    setNewEvent({ type: 'GOAL', team: 'HOME', player: '', assist: '', notes: '' });
  };

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'ALL') return events;
    if (activeFilter === 'GOALS') return events.filter((e) => e.type === 'GOAL');
    if (activeFilter === 'CARDS') return events.filter((e) => e.type === 'CARD' || e.type.includes('CARD'));
    if (activeFilter === 'SUBS') return events.filter((e) => e.type === 'SUBSTITUTION');
    return events;
  }, [events, activeFilter]);

  const copyMatchSummary = () => {
    const summary = `🏆 Match Sheet: ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}
📍 Venue: ${fieldVenue} | ⏱️ Time: ${formattedTime} (${currentPeriod})
Referee: ${refereeName}
Key Highlights:
${events.map((e) => `[${e.minute}'] ${e.icon} ${e.title}: ${e.player} ${e.assist ? `(Assist: ${e.assist})` : ''}`).join('\n')}`;

    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Header Glow Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

      {/* ── Match Fixture Sub-Bar ─────────────────────────────────────────── */}
      <div className="px-6 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <span className="font-semibold text-slate-300">{fixtureId}</span>
          <span>•</span>
          <span className="truncate max-w-[200px]">{fieldVenue}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Ref: {refereeName}</span>
          </div>
          <button
            onClick={copyMatchSummary}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-3 py-1 rounded-full transition-all border border-slate-700/60"
            title="Copy match summary to clipboard"
          >
            {copiedToast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedToast ? 'Copied!' : 'Share Sheet'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Stadium Scoreboard Core ───────────────────────────────────── */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center">
          {/* Home Team Card */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10"
                style={{ backgroundColor: `${homeTeam.color}25`, borderColor: `${homeTeam.color}60` }}
              >
                {homeTeam.logo}
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">{homeTeam.name}</h3>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Home Squad</span>
              </div>
            </div>

            {/* Home Possession Toggle Button */}
            <button
              onClick={() => {
                setActivePossession('HOME');
                setPossessionRatio((prev) => Math.min(85, prev + 2));
              }}
              className={`mt-2 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 transition-all border ${
                activePossession === 'HOME'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>{activePossession === 'HOME' ? 'In Possession' : 'Set Possession'}</span>
            </button>
          </div>

          {/* Center Digital Clock & Big Score Display */}
          <div className="md:col-span-3 flex flex-col items-center justify-center bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 shadow-inner">
            {/* Period & Extra Time Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded-full border border-indigo-500/30">
                {currentPeriod}
              </span>
              {addedMinutes > 0 && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  +{addedMinutes} MIN
                </span>
              )}
            </div>

            {/* Huge Scores Display */}
            <div className="flex items-center gap-6 my-1">
              {/* Home Score & Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustScore('HOME', -1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  aria-label="Decrease Home Score"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter drop-shadow-md">
                  {homeScore}
                </span>
                <button
                  onClick={() => adjustScore('HOME', 1)}
                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition-colors"
                  aria-label="Increase Home Score"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-3xl font-light text-slate-600 select-none">:</span>

              {/* Away Score & Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustScore('AWAY', 1)}
                  className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-colors"
                  aria-label="Increase Away Score"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter drop-shadow-md">
                  {awayScore}
                </span>
                <button
                  onClick={() => adjustScore('AWAY', -1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  aria-label="Decrease Away Score"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stadium Clock Timer */}
            <div className="flex items-center gap-2 mt-3 text-slate-300 font-mono text-xl font-bold bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{formattedTime}</span>
            </div>

            {/* Clock Controls */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
                  isRunning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
                title="Reset Match Clock"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleNextPeriod}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                title="Advance to next period"
              >
                Next Period
              </button>
            </div>
          </div>

          {/* Away Team Card */}
          <div className="md:col-span-2 flex flex-col items-center md:items-end text-center md:text-right">
            <div className="flex items-center gap-3 mb-2 flex-row-reverse md:flex-row">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">{awayTeam.name}</h3>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Away Squad</span>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10"
                style={{ backgroundColor: `${awayTeam.color}25`, borderColor: `${awayTeam.color}60` }}
              >
                {awayTeam.logo}
              </div>
            </div>

            {/* Away Possession Toggle Button */}
            <button
              onClick={() => {
                setActivePossession('AWAY');
                setPossessionRatio((prev) => Math.max(15, prev - 2));
              }}
              className={`mt-2 text-xs px-3 py-1 rounded-full flex items-center gap-1.5 transition-all border ${
                activePossession === 'AWAY'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>{activePossession === 'AWAY' ? 'In Possession' : 'Set Possession'}</span>
            </button>
          </div>
        </div>

        {/* ── Possession & Momentum Meter ─────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {homeTeam.shortName} ({possessionRatio}%)
            </span>
            <span className="text-slate-500 font-normal">Game Possession & Dominance</span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              {awayTeam.shortName} ({100 - possessionRatio}%)
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${possessionRatio}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500"
              style={{ width: `${100 - possessionRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Live Match Event Ticker & Log ─────────────────────────────────── */}
      <div className="bg-slate-900/70 border-t border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Match Feed
            </h4>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
              {['ALL', 'GOALS', 'CARDS', 'SUBS'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    activeFilter === filter
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Record Event Button */}
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Incident</span>
          </button>
        </div>

        {/* Event List Items */}
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">No incidents recorded in this view.</div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-400 w-8">{evt.minute}'</span>
                  <span className="text-base">{evt.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{evt.player}</span>
                      {evt.assist && <span className="text-slate-400">(Assist: {evt.assist})</span>}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          evt.team === 'HOME'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {evt.team === 'HOME' ? homeTeam.shortName : awayTeam.shortName}
                      </span>
                    </div>
                    {evt.detail && <p className="text-slate-400 mt-0.5 text-[11px]">{evt.detail}</p>}
                  </div>
                </div>

                <span className="text-slate-500 text-[11px]">{evt.period}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Record Event Modal ────────────────────────────────────────────── */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Record Match Incident ({currentMinute}')
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-4">
              {/* Event Type & Team */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Incident Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="GOAL">⚽ Goal Scored</option>
                    <option value="YELLOW_CARD">🟨 Yellow Card</option>
                    <option value="RED_CARD">🟥 Red Card</option>
                    <option value="SUBSTITUTION">🔄 Substitution</option>
                    <option value="VAR">🎯 VAR Decision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Squad / Team</label>
                  <select
                    value={newEvent.team}
                    onChange={(e) => setNewEvent({ ...newEvent, team: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="HOME">{homeTeam.name} (Home)</option>
                    <option value="AWAY">{awayTeam.name} (Away)</option>
                  </select>
                </div>
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Player Name & Number</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Rashford (#10)"
                  value={newEvent.player}
                  onChange={(e) => setNewEvent({ ...newEvent, player: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Assist / Sub Details */}
              {newEvent.type === 'GOAL' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Assist By (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bruno Fernandes (#8)"
                    value={newEvent.assist}
                    onChange={(e) => setNewEvent({ ...newEvent, assist: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Incident Notes / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Header from corner kick"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-md"
                >
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

LiveScoreboard.propTypes = {
  fixtureId: PropTypes.string,
  sport: PropTypes.string,
  initialHomeTeam: PropTypes.shape({
    name: PropTypes.string,
    shortName: PropTypes.string,
    color: PropTypes.string,
    logo: PropTypes.string,
  }),
  initialAwayTeam: PropTypes.shape({
    name: PropTypes.string,
    shortName: PropTypes.string,
    color: PropTypes.string,
    logo: PropTypes.string,
  }),
  initialScore: PropTypes.shape({
    home: PropTypes.number,
    away: PropTypes.number,
  }),
  fieldVenue: PropTypes.string,
  refereeName: PropTypes.string,
  onMatchComplete: PropTypes.func,
  className: PropTypes.string,
};
