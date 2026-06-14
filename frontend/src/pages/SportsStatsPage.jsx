import React, { useState, useEffect } from 'react';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_STATS = {
  overview: { totalBookings: 48, totalHours: 96, totalSpent: 28800, winRate: 72, currentStreak: 7, longestStreak: 14, favoriteSport: 'Football', level: 'Gold', points: 6840, rank: 5 },
  monthly: [
    { month: 'Jan', bookings: 3, hours: 6,  spent: 1800 },
    { month: 'Feb', bookings: 4, hours: 8,  spent: 2400 },
    { month: 'Mar', bookings: 5, hours: 10, spent: 3000 },
    { month: 'Apr', bookings: 4, hours: 8,  spent: 2400 },
    { month: 'May', bookings: 6, hours: 12, spent: 3600 },
    { month: 'Jun', bookings: 8, hours: 16, spent: 4800 },
    { month: 'Jul', bookings: 7, hours: 14, spent: 4200 },
    { month: 'Aug', bookings: 5, hours: 10, spent: 3000 },
    { month: 'Sep', bookings: 6, hours: 12, spent: 3600 },
  ],
  bySport: [
    { sport: 'Football',   bookings: 20, hours: 40, winRate: 75, color: '#10b981' },
    { sport: 'Cricket',    bookings: 12, hours: 24, winRate: 67, color: '#f59e0b' },
    { sport: 'Badminton',  bookings: 10, hours: 20, winRate: 80, color: '#7c3aed' },
    { sport: 'Basketball', bookings: 6,  hours: 12, winRate: 60, color: '#ec4899' },
  ],
  recentGames: [
    { date: '2026-06-14', sport: 'Football',  field: 'Green Valley FC',   result: 'Win',  score: '3-1', duration: 2 },
    { date: '2026-06-12', sport: 'Badminton', field: 'Court 7 Sports',    result: 'Win',  score: '21-15', duration: 1 },
    { date: '2026-06-10', sport: 'Cricket',   field: 'Mirpur Ground A',   result: 'Loss', score: '145-162', duration: 3 },
    { date: '2026-06-08', sport: 'Football',  field: 'Bashundhara Arena', result: 'Win',  score: '2-0', duration: 2 },
    { date: '2026-06-05', sport: 'Basketball',field: 'Dhanmondi Court',   result: 'Loss', score: '42-58', duration: 1 },
    { date: '2026-06-02', sport: 'Football',  field: 'Uttara Turf',       result: 'Win',  score: '4-2', duration: 2 },
  ],
  achievements: [
    { title: 'Century Booker',   desc: 'Book 100+ hours',        progress: 96, max: 100, icon: '🏟️',  unlocked: false },
    { title: 'Hat-trick Hero',   desc: '3 wins in a row',        progress: 3,  max: 3,   icon: '⚽',   unlocked: true  },
    { title: 'Early Riser',      desc: '10 bookings before 8AM', progress: 7,  max: 10,  icon: '🌅',   unlocked: false },
    { title: 'Sport Polyglot',   desc: 'Play 4+ different sports',progress: 4, max: 4,   icon: '🎯',   unlocked: true  },
    { title: 'Streak Master',    desc: '14-day booking streak',   progress: 14, max: 14,  icon: '🔥',   unlocked: true  },
    { title: 'Social Player',    desc: 'Play with 20+ teammates', progress: 13, max: 20,  icon: '👥',   unlocked: false },
  ],
};

const SPORT_COLORS = { Football: '#10b981', Cricket: '#f59e0b', Badminton: '#7c3aed', Basketball: '#ec4899', Tennis: '#06b6d4', Volleyball: '#f97316' };

const MiniBar = ({ value, max, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden', flex: 1 }}>
    <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 4 }} />
  </div>
);

const SportsStatsPage = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');
  const [metric,  setMetric]  = useState('bookings');

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const uid = raw ? (JSON.parse(raw)._id ?? JSON.parse(raw).id) : null;
    authFetch(`/api/v1/stats/user${uid ? `?userId=${uid}` : ''}`)
      .then(r => r.json())
      .then(d => setStats(d.success ? d.data : MOCK_STATS))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  const S = {
    page:  { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:  { maxWidth: 1000, margin: '0 auto' },
    title: { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#10b981,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' },
    card:  { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem' },
    tabs:  { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.3rem', flexWrap: 'wrap' },
    tab:   (a) => ({ background: a ? 'rgba(124,58,237,0.5)' : 'transparent', border: 'none', color: a ? '#f1f5f9' : '#94a3b8', fontWeight: a ? 700 : 500, padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }),
    mchip:(a,c) => ({ background: a ? `${c}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${a ? c+'55' : 'rgba(255,255,255,0.08)'}`, color: a ? c : '#64748b', padding: '0.3rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: a ? 700 : 500 }),
  };

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#64748b' }}>Loading your stats…</div></div>;

  const { overview, monthly, bySport, recentGames, achievements } = stats;
  const maxBarVal = Math.max(...monthly.map(m => m[metric]));

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={S.title}>📊 My Sports Stats</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Personal analytics and performance history</p>
        </div>

        {/* KPI row */}
        <div style={S.grid2}>
          {[
            { label: 'Total Bookings', value: overview.totalBookings, icon: '📅', color: '#7c3aed' },
            { label: 'Hours Played',   value: overview.totalHours,    icon: '⏱️', color: '#10b981' },
            { label: 'Win Rate',       value: `${overview.winRate}%`, icon: '🏆', color: '#f59e0b' },
            { label: 'Points',         value: overview.points.toLocaleString(), icon: '⭐', color: '#ec4899' },
            { label: 'Current Streak', value: `${overview.currentStreak}d`,     icon: '🔥', color: '#f97316' },
            { label: 'Rank',           value: `#${overview.rank}`,   icon: '📈', color: '#06b6d4' },
          ].map(k => (
            <div key={k.label} style={{ ...S.card, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{k.icon}</div>
              <div style={{ color: k.color, fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>{k.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.3rem' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Level badge */}
        <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(124,58,237,0.1))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '2rem' }}>🥇</div>
          <div>
            <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>CURRENT LEVEL</div>
            <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.2rem' }}>{overview.level} Player · {overview.favoriteSport} Specialist</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Best streak: {overview.longestStreak} days</div>
            <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>৳{overview.totalSpent.toLocaleString()} total spent</div>
          </div>
        </div>

        {/* Tab nav */}
        <div style={S.tabs}>
          {[['overview','📈 Overview'],['sports','⚽ By Sport'],['history','📋 History'],['achievements','🏅 Achievements']].map(([k,l]) => (
            <button key={k} style={S.tab(tab === k)} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ color: '#f1f5f9', fontWeight: 700 }}>Monthly Activity</div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {[['bookings','Bookings','#7c3aed'],['hours','Hours','#10b981'],['spent','Spent (৳)','#f59e0b']].map(([k,l,c]) => (
                  <button key={k} style={S.mchip(metric === k, c)} onClick={() => setMetric(k)}>{l}</button>
                ))}
              </div>
            </div>
            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 160 }}>
              {monthly.map(m => {
                const pct = maxBarVal > 0 ? (m[metric] / maxBarVal) * 100 : 0;
                const col = metric === 'bookings' ? '#7c3aed' : metric === 'hours' ? '#10b981' : '#f59e0b';
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{m[metric]}</div>
                    <div style={{ width: '100%', height: `${pct}%`, minHeight: 4, background: `linear-gradient(180deg,${col},${col}88)`, borderRadius: '4px 4px 0 0' }} title={`${m.month}: ${m[metric]}`} />
                    <div style={{ fontSize: '0.65rem', color: '#475569' }}>{m.month}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BY SPORT TAB */}
        {tab === 'sports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {bySport.map(s => (
              <div key={s.sport} style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <div style={{ fontWeight: 700, color: '#f1f5f9', width: 90, flexShrink: 0 }}>{s.sport}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', width: 60 }}>Bookings</span>
                      <MiniBar value={s.bookings} max={20} color={s.color} />
                      <span style={{ color: '#f1f5f9', fontSize: '0.72rem', width: 20, textAlign: 'right' }}>{s.bookings}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontSize: '0.72rem', width: 60 }}>Win Rate</span>
                      <MiniBar value={s.winRate} max={100} color={s.color} />
                      <span style={{ color: '#f1f5f9', fontSize: '0.72rem', width: 20, textAlign: 'right' }}>{s.winRate}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: s.color, fontWeight: 800 }}>{s.hours}h</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div style={S.card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {recentGames.map((g, i) => {
                const win = g.result === 'Win';
                const col = SPORT_COLORS[g.sport] ?? '#7c3aed';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', flexWrap: 'wrap' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.875rem' }}>{g.sport} · {g.field}</div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{g.date} · {g.duration}h</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.875rem' }}>{g.score}</div>
                    <span style={{ background: win ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${win ? '#10b981' : '#ef4444'}44`, color: win ? '#6ee7b7' : '#fca5a5', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800 }}>{g.result}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {tab === 'achievements' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {achievements.map((a, i) => {
              const pct = Math.min(100, Math.round((a.progress / a.max) * 100));
              return (
                <div key={i} style={{ ...S.card, opacity: a.unlocked ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>{a.icon}</span>
                    <div>
                      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{a.title}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{a.desc}</div>
                    </div>
                    {a.unlocked && <span style={{ marginLeft: 'auto', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 800 }}>✓ Unlocked</span>}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '20px', height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: a.unlocked ? '#10b981' : '#7c3aed', borderRadius: '20px' }} />
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: '0.35rem', textAlign: 'right' }}>{a.progress} / {a.max}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SportsStatsPage;
