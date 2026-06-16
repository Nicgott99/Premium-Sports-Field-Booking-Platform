import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const MOCK_PROFILE = {
  name: 'Hasibullah Khan', username: '@hk_elite', avatar: '', sport: 'Football',
  level: 'Pro', xp: 8400, nextXp: 10000, rank: 12, totalGames: 184, wins: 127,
  streak: 7, badges: ['🏆 Champion', '⚡ Speed Demon', '🎯 Precision', '🔥 On Fire'],
  recentBookings: [
    { field: 'Bashundhara Sports Complex', date: '2026-06-15', sport: 'Football', result: 'Win' },
    { field: 'Mirpur Indoor Stadium', date: '2026-06-12', sport: 'Basketball', result: 'Win' },
    { field: 'Dhanmondi Tennis Club', date: '2026-06-10', sport: 'Tennis', result: 'Loss' },
  ],
  stats: { goals: 43, assists: 29, cleanSheets: 18, mvp: 11 },
};

const LEVEL_COLOR = { Rookie:'#506070', Amateur:'#8ba3be', Semi:'#ff5e07', Pro:'#FBBF24', Elite:'#fff' };

function StatBadge({ label, value }) {
  return (
    <article style={{ background:'rgba(13,28,45,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'1.1rem 1.25rem', textAlign:'center' }}>
      <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.9rem', color:'#FBBF24', lineHeight:1 }}>{value}</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'0.35rem' }}>{label}</div>
    </article>
  );
}
StatBadge.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired };

const PlayerProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const userId = raw ? JSON.parse(raw)._id : null;
    const url = userId ? `/api/v1/users/${userId}/profile` : null;
    const load = async () => {
      try {
        if (!url) throw new Error('no id');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setProfile(data.data ?? data);
      } catch {
        setProfile(MOCK_PROFILE);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#051424', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'3px solid rgba(251,191,36,0.2)', borderTop:'3px solid #FBBF24', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const p = profile ?? MOCK_PROFILE;
  const xpPct = Math.round((p.xp / p.nextXp) * 100);
  const winRate = p.totalGames > 0 ? Math.round((p.wins / p.totalGames) * 100) : 0;

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'0 1.25rem' }}>

        {/* Hero card */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'2.5rem', marginBottom:'1.75rem', backdropFilter:'blur(16px)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'220px', height:'220px', background:'radial-gradient(circle,rgba(251,191,36,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
          <div style={{ display:'flex', gap:'2rem', alignItems:'flex-start', flexWrap:'wrap' }}>
            <div style={{ width:'88px', height:'88px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(251,191,36,0.15),rgba(255,94,7,0.1))', border:'3px solid rgba(251,191,36,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'2.2rem' }}>
              {p.avatar ? <img src={p.avatar} alt={p.name} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} /> : '🏃'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap', marginBottom:'0.35rem' }}>
                <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.8rem', color:'#f0f6ff', margin:0 }}>{p.name}</h1>
                <span style={{ background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.3)', color: LEVEL_COLOR[p.level] ?? '#FBBF24', padding:'0.2rem 0.7rem', borderRadius:'999px', fontSize:'0.78rem', fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{p.level}</span>
              </div>
              <div style={{ color:'#506070', fontSize:'0.88rem', marginBottom:'1rem' }}>{p.username} · {p.sport}</div>

              {/* XP bar */}
              <div style={{ marginBottom:'0.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#8ba3be' }}>XP Progress</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24' }}>{p.xp.toLocaleString()} / {p.nextXp.toLocaleString()}</span>
                </div>
                <div style={{ height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${xpPct}%`, background:'linear-gradient(90deg,#FBBF24,#ff5e07)', borderRadius:'999px', transition:'width 1s ease' }} />
                </div>
              </div>

              {/* Badges */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'0.75rem' }}>
                {(p.badges ?? []).map(b => (
                  <span key={b} style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.18)', color:'#8ba3be', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.75rem' }}>{b}</span>
                ))}
              </div>
            </div>

            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.25rem' }}>Global Rank</div>
              <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'2.8rem', color:'#FBBF24', lineHeight:1 }}>#{p.rank}</div>
              <div style={{ color:'#506070', fontSize:'0.78rem', marginTop:'0.35rem' }}>🔥 {p.streak}-day streak</div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.85rem', marginBottom:'1.75rem' }}>
          <StatBadge label="Total Games" value={p.totalGames} />
          <StatBadge label="Wins" value={p.wins} />
          <StatBadge label="Win Rate" value={`${winRate}%`} />
          <StatBadge label="Goals" value={p.stats?.goals ?? 0} />
          <StatBadge label="Assists" value={p.stats?.assists ?? 0} />
          <StatBadge label="MVP Awards" value={p.stats?.mvp ?? 0} />
        </div>

        {/* Recent activity */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.75rem', backdropFilter:'blur(14px)' }}>
          <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1.15rem', color:'#f0f6ff', marginBottom:'1.25rem' }}>Recent Activity</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            {(p.recentBookings ?? []).map((b, i) => (
              <article key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.85rem 1rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'10px' }}>
                <div>
                  <div style={{ color:'#f0f6ff', fontWeight:600, fontSize:'0.88rem' }}>{b.field}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.72rem', marginTop:'0.2rem' }}>{b.date} · {b.sport}</div>
                </div>
                <span style={{ padding:'0.2rem 0.65rem', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700, background: b.result === 'Win' ? 'rgba(251,191,36,0.12)' : 'rgba(255,94,7,0.12)', color: b.result === 'Win' ? '#FBBF24' : '#ff5e07', border:`1px solid ${b.result === 'Win' ? 'rgba(251,191,36,0.25)' : 'rgba(255,94,7,0.25)'}` }}>{b.result}</span>
              </article>
            ))}
          </div>
          <button onClick={() => navigate('/bookings')} style={{ marginTop:'1.25rem', width:'100%', padding:'0.7rem', background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'10px', color:'#FBBF24', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
            View All Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
