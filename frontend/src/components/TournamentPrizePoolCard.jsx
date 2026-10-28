import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Trophy,
  Crown,
  Medal,
  Coins,
  Users,
  Copy,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Sliders,
  Award,
} from 'lucide-react';

export default function TournamentPrizePoolCard({
  tournamentName = 'Apex Super League Cup 2026',
  entryFee = 250,
  initialTeams = 14,
  maxTeams = 16,
  sponsorBonus = 750,
  sponsorName = 'Nike Football & Red Bull Energy',
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('PODIUM'); // 'PODIUM' | 'INDIVIDUAL' | 'SIMULATOR'
  const [simulatedTeams, setSimulatedTeams] = useState(initialTeams);
  const [copiedToast, setCopiedToast] = useState(false);

  // Financial calculations
  const poolData = useMemo(() => {
    const teams = activeTab === 'SIMULATOR' ? simulatedTeams : initialTeams;
    const entryRevenue = entryFee * teams;
    const grossTotal = entryRevenue + sponsorBonus;

    // Standard deductions: 10% platform, 5% referees
    const platformRake = grossTotal * 0.1;
    const refereeFund = grossTotal * 0.05;
    const awardPurse = grossTotal - platformRake - refereeFund;

    // 8% to individual bounties, 92% to team podium
    const individualFund = awardPurse * 0.08;
    const teamPurse = awardPurse - individualFund;

    // Top 3 Podium: 60% / 25% / 15%
    const firstPlace = teamPurse * 0.6;
    const secondPlace = teamPurse * 0.25;
    const thirdPlace = teamPurse * 0.15;

    return {
      teams,
      entryRevenue,
      grossTotal,
      awardPurse,
      firstPlace,
      secondPlace,
      thirdPlace,
      individualFund,
      goldenBoot: individualFund * 0.35,
      goldenGlove: individualFund * 0.25,
      mvp: individualFund * 0.25,
      fairPlay: individualFund * 0.15,
    };
  }, [entryFee, initialTeams, sponsorBonus, activeTab, simulatedTeams]);

  const fillPercentage = Math.round((initialTeams / maxTeams) * 100);

  const handleCopySummary = () => {
    const summary = `🏆 ${tournamentName} — PRIZE POOL BREAKDOWN
Total Purse: $${poolData.grossTotal.toLocaleString()} USD
🥇 1st Place Champion: $${Math.round(poolData.firstPlace).toLocaleString()} USD (60%)
🥈 2nd Place Runner-Up: $${Math.round(poolData.secondPlace).toLocaleString()} USD (25%)
🥉 3rd Place Bronze: $${Math.round(poolData.thirdPlace).toLocaleString()} USD (15%)
Individual Bounties: Golden Boot ($${Math.round(poolData.goldenBoot)}), MVP ($${Math.round(
      poolData.mvp
    )}), Golden Glove ($${Math.round(poolData.goldenGlove)})
Status: Escrow Protected & Verified`;

    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Gold Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

      {/* ── Header Title & Sponsor Bar ───────────────────────────────────── */}
      <div className="p-6 md:p-8 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">{tournamentName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Prize Vault
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Sponsored by {sponsorName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-md"
            >
              {copiedToast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Copied' : 'Share Pool'}</span>
            </button>
          </div>
        </div>

        {/* ── Total Prize Pool Banner ───────────────────────────────────────── */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              Total Guaranteed Prize Purse
            </span>
            <div className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1 font-mono">
              ${poolData.grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm font-normal text-slate-400 ml-2">USD</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Enrolled Squads</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {initialTeams} / {maxTeams} Teams
            </span>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 ml-auto">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${fillPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs w-fit">
          {[
            { id: 'PODIUM', label: 'Team Podium Splits', icon: Medal },
            { id: 'INDIVIDUAL', label: 'Individual Accolades', icon: Award },
            { id: 'SIMULATOR', label: 'Turnout Simulator', icon: Sliders },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Tab Body ─────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8">
        {/* TAB 1: 3D Visual Podium */}
        {activeTab === 'PODIUM' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 md:gap-4 items-end pt-4 pb-2">
              {/* 2nd Place (Silver) */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xl font-black mb-2 shadow-lg">
                  🥈
                </div>
                <span className="text-xs font-bold text-slate-300">Runner-Up</span>
                <span className="text-sm md:text-base font-black text-white font-mono mt-0.5">
                  ${Math.round(poolData.secondPlace).toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400">25% Share</span>
                <div className="w-full h-24 md:h-32 rounded-t-2xl bg-gradient-to-t from-slate-900 to-slate-800 border-t-2 border-slate-400 mt-3 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-600 font-mono">2</span>
                </div>
              </div>

              {/* 1st Place (Gold) - Elevated */}
              <div className="flex flex-col items-center text-center -mt-4">
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-1">
                  <Crown className="w-4 h-4 fill-current" />
                  <span>CHAMPION</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 text-2xl font-black mb-2 shadow-xl shadow-amber-500/20">
                  🥇
                </div>
                <span className="text-xs font-bold text-amber-300">1st Place</span>
                <span className="text-base md:text-xl font-black text-amber-400 font-mono mt-0.5">
                  ${Math.round(poolData.firstPlace).toLocaleString()}
                </span>
                <span className="text-[11px] text-amber-400/80 font-semibold">60% Share</span>
                <div className="w-full h-32 md:h-40 rounded-t-2xl bg-gradient-to-t from-amber-950/40 via-amber-900/20 to-amber-500/30 border-t-2 border-amber-400 mt-3 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <span className="text-3xl font-black text-amber-400/40 font-mono">1</span>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-700/60 flex items-center justify-center text-amber-600 text-xl font-black mb-2 shadow-lg">
                  🥉
                </div>
                <span className="text-xs font-bold text-amber-600">3rd Bronze</span>
                <span className="text-sm md:text-base font-black text-white font-mono mt-0.5">
                  ${Math.round(poolData.thirdPlace).toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400">15% Share</span>
                <div className="w-full h-16 md:h-20 rounded-t-2xl bg-gradient-to-t from-slate-900 to-amber-950/30 border-t-2 border-amber-700 mt-3 flex items-center justify-center">
                  <span className="text-2xl font-black text-amber-800/40 font-mono">3</span>
                </div>
              </div>
            </div>

            {/* Escrow Trust Stamp */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Prize purse locked in multi-signature escrow until tournament director certification.</span>
            </div>
          </div>
        )}

        {/* TAB 2: Individual Accolade Bounties */}
        {activeTab === 'INDIVIDUAL' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Cash bounties awarded to outstanding tournament individual performers:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Golden Boot Award', desc: 'Tournament Top Goalscorer', amount: poolData.goldenBoot, icon: '👟' },
                { title: 'Tournament MVP', desc: 'Best Player of the Tournament', amount: poolData.mvp, icon: '⭐' },
                { title: 'Golden Glove Award', desc: 'Best Goalkeeper / Most Clean Sheets', amount: poolData.goldenGlove, icon: '🧤' },
                { title: 'Fair Play Team Bounty', desc: 'Squad with lowest disciplinary penalty points', amount: poolData.fairPlay, icon: '🕊️' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-amber-400 font-mono">
                      ${Math.round(item.amount).toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-slate-500 uppercase">Cash Bounty</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Dynamic Turnout Simulator */}
        {activeTab === 'SIMULATOR' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Sliders className="w-4 h-4 text-amber-400" />
                Simulate Prize Pool at Different Team Capacities
              </h4>
              <p className="text-xs text-slate-400">
                Adjust team registration numbers to see how payouts scale as brackets fill up.
              </p>
            </div>

            {/* Slider */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Simulated Enrolled Teams:</span>
                <span className="font-bold text-amber-400 font-mono text-sm">{simulatedTeams} Teams</span>
              </div>
              <input
                type="range"
                min="4"
                max={maxTeams}
                step="2"
                value={simulatedTeams}
                onChange={(e) => setSimulatedTeams(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Min: 4 Teams</span>
                <span>Max: {maxTeams} Teams (Full Bracket)</span>
              </div>
            </div>

            {/* Projected Simulation Table */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Gross Pool</span>
                <span className="font-bold text-white text-sm font-mono mt-0.5 block">
                  ${poolData.grossTotal.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-amber-400 block text-[11px]">1st Place Take</span>
                <span className="font-bold text-amber-400 text-sm font-mono mt-0.5 block">
                  ${Math.round(poolData.firstPlace).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">2nd Place Take</span>
                <span className="font-bold text-white text-sm font-mono mt-0.5 block">
                  ${Math.round(poolData.secondPlace).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

TournamentPrizePoolCard.propTypes = {
  tournamentName: PropTypes.string,
  entryFee: PropTypes.number,
  initialTeams: PropTypes.number,
  maxTeams: PropTypes.number,
  sponsorBonus: PropTypes.number,
  sponsorName: PropTypes.string,
  className: PropTypes.string,
};
