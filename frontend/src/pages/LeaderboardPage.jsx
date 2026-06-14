import React, { useState, useEffect } from 'react';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_PLAYERS = [
  { rank: 1,  name: 'Arman Hossain',   avatar: '🏆', sport: 'Football',  points: 9840, wins: 47, bookings: 62, badge: 'Platinum', streak: 12 },
  { rank: 2,  name: 'Nadia Rahman',    avatar: '🥈', sport: 'Badminton', points: 8720, wins: 41, bookings: 55, badge: 'Gold',     streak: 8  },
  { rank: 3,  name: 'Karim Uddin',     avatar: '🥉', sport: 'Cricket',   points: 7950, wins: 38, bookings: 50, badge: 'Gold',     streak: 5  },
  { rank: 4,  name: 'Sultana Begum',   avatar: '🎯', sport: 'Tennis',    points: 7200, wins: 34, bookings: 46, badge: 'Gold',     streak: 3  },
  { rank: 5,  name: 'Rafiq Islam',     avatar: '⚡', sport: 'Football',  points: 6850, wins: 30, bookings: 41, badge: 'Silver',   streak: 7  },
  { rank: 6,  name: 'Tanvir Ahmed',    avatar: '🔥', sport: 'Basketball',points: 6100, wins: 27, bookings: 38, badge: 'Silver',   streak: 4  },
  { rank: 7,  name: 'Fahmida Khanam',  avatar: '⭐', sport: 'Volleyball',points: 5700, wins: 25, bookings: 35, badge: 'Silver',   streak: 2  },
  { rank: 8,  name: 'Monir Khan',      avatar: '🎮', sport: 'Cricket',   points: 5200, wins: 22, bookings: 31, badge: 'Silver',   streak: 6  },
  { rank: 9,  name: 'Roksana Akter',   avatar: '💪', sport: 'Badminton', points: 4800, wins: 20, bookings: 28, badge: 'Bronze',   streak: 1  },
  { rank: 10, name: 'Imran Chowdhury', avatar: '🚀', sport: 'Tennis',    points: 4350, wins: 18, bookings: 25, badge: 'Bronze',   streak: 3  },
];

const MOCK_TEAMS = [
  { rank: 1, name: 'Thunder Bolts',  sport: 'Football',   members: 11, wins: 28, points: 14200, badge: 'Champion' },
  { rank: 2, name: 'Storm Eagles',   sport: 'Cricket',    members: 11, wins: 24, points: 11800, badge: 'Finalist' },
  { rank: 3, name: 'Fire Hawks',     sport: 'Basketball', members: 5,  wins: 21, points: 10500, badge: 'Finalist' },
  { rank: 4, name: 'Blue Sharks',    sport: 'Football',   members: 11, wins: 18, points: 9200,  badge: 'Semi'     },
  { rank: 5, name: 'Green Giants',   sport: 'Volleyball', members: 6,  wins: 15, points: 7800,  badge: 'Semi'     },
];

const SPORTS = ['All', 'Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Volleyball'];
const PERIODS = ['This Week', 'This Month', 'All Time'];

const BADGE_COLORS = { Platinum: '#a78bfa', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#cd7f32', Champion: '#ec4899', Finalist: '#7c3aed', Semi: '#10b981' };

const rankStyle = (rank) => {
  if (rank === 1) return { color: '#f59e0b', fontWeight: 900, fontSize: '1.1rem' };
  if (rank === 2) return { color: '#94a3b8', fontWeight: 800 };
  if (rank === 3) return { color: '#cd7f32', fontWeight: 800 };
  return { color: '#64748b', fontWeight: 600 };
};

const LeaderboardPage = () => {
  const [players,  setPlayers]  = useState([]);
  const [teams,    setTeams]    = useState([]);
  const [sport,    setSport]    = useState('All');
  const [period,   setPeriod]   = useState('All Time');
  const [tab,      setTab]      = useState('players');
  const [loading,  setLoading]  = useState(true);
  const [myRank,   setMyRank]   = useState(null);

  useEffect(() => {
    setLoading(true);
    const raw = localStorage.getItem('user');
    const uid = raw ? (JSON.parse(raw)._id ?? JSON.parse(raw).id) : null;

    Promise.all([
      authFetch(`/api/v1/leaderboard/players?sport=${sport}&period=${period}`).then(r => r.json()).catch(() => null),
      authFetch(`/api/v1/leaderboard/teams?sport=${sport}&period=${period}`).then(r => r.json()).catch(() => null),
      uid ? authFetch(`/api/v1/leaderboard/my-rank?userId=${uid}`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
    ]).then(([pd, td, rd]) => {
      setPlayers(pd?.success ? pd.data : MOCK_PLAYERS.filter(p => sport === 'All' || p.sport === sport));
      setTeams(td?.success ? td.data : MOCK_TEAMS.filter(t => sport === 'All' || t.sport === sport));
      if (rd?.success) setMyRank(rd.data);
    }).finally(() => setLoading(false));
  }, [sport, period]);

  const S = {
    page:    { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:    { maxWidth: 900, margin: '0 auto' },
    title:   { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#f59e0b,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    chips:   { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' },
    chip:    (a) => ({ background: a ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${a ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, color: a ? '#f1f5f9' : '#94a3b8', padding: '0.35rem 0.85rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: a ? 700 : 500 }),
    tabs:    { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.3rem' },
    tab:     (a) => ({ flex: 1, background: a ? 'rgba(124,58,237,0.5)' : 'transparent', border: 'none', color: a ? '#f1f5f9' : '#94a3b8', fontWeight: a ? 700 : 500, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }),
    podium:  { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem' },
    podCard: (h) => ({ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1rem 1.25rem', textAlign: 'center', width: 140, height: h }),
    row:     (i) => ({ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: '10px', marginBottom: '0.25rem' }),
  };

  const top3    = players.slice(0, 3);
  const rest    = players.slice(3);

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={S.title}>🏆 Leaderboard</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Top performers across all sports</p>
        </div>

        {/* My rank card */}
        {myRank && (
          <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Your Ranking</div>
              <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.3rem' }}>#{myRank.rank}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f59e0b', fontWeight: 800 }}>{myRank.points?.toLocaleString()} pts</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{myRank.wins} wins</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={S.chips}>
          {SPORTS.map(s => <button key={s} style={S.chip(sport === s)} onClick={() => setSport(s)}>{s}</button>)}
        </div>
        <div style={{ ...S.chips, marginBottom: '1.5rem' }}>
          {PERIODS.map(p => <button key={p} style={S.chip(period === p)} onClick={() => setPeriod(p)}>{p}</button>)}
        </div>

        <div style={S.tabs}>
          <button style={S.tab(tab === 'players')} onClick={() => setTab('players')}>👤 Players</button>
          <button style={S.tab(tab === 'teams')}   onClick={() => setTab('teams')}>👥 Teams</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading…</div>
        ) : tab === 'players' ? (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div style={S.podium}>
                {[top3[1], top3[0], top3[2]].map((p, idx) => {
                  const heights = [180, 220, 160];
                  const crowns  = ['🥈', '🏆', '🥉'];
                  return (
                    <div key={p.rank} style={S.podCard(heights[idx])}>
                      <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>{crowns[idx]}</div>
                      <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{p.avatar}</div>
                      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.2rem' }}>{p.name.split(' ')[0]}</div>
                      <div style={{ color: BADGE_COLORS[p.badge] ?? '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>{p.points.toLocaleString()} pts</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem' }}>{p.sport}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem' }}>
              {(players.length ? players : MOCK_PLAYERS).map((p, i) => (
                <div key={p.rank} style={S.row(i)}>
                  <span style={{ width: 28, textAlign: 'center', flexShrink: 0, ...rankStyle(p.rank) }}>
                    {p.rank <= 3 ? ['🥇','🥈','🥉'][p.rank - 1] : `#${p.rank}`}
                  </span>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{p.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{p.sport} · {p.wins} wins · 🔥 {p.streak}-day streak</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.9rem' }}>{p.points.toLocaleString()}</div>
                    <span style={{ background: `${BADGE_COLORS[p.badge]}22`, border: `1px solid ${BADGE_COLORS[p.badge]}55`, color: BADGE_COLORS[p.badge], padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700 }}>{p.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1rem' }}>
            {(teams.length ? teams : MOCK_TEAMS).map((t, i) => (
              <div key={t.rank} style={S.row(i)}>
                <span style={{ width: 28, textAlign: 'center', flexShrink: 0, ...rankStyle(t.rank) }}>
                  {t.rank <= 3 ? ['🥇','🥈','🥉'][t.rank - 1] : `#${t.rank}`}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{t.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{t.sport} · {t.members} members · {t.wins} wins</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.9rem' }}>{t.points.toLocaleString()}</div>
                  <span style={{ background: `${BADGE_COLORS[t.badge] ?? '#7c3aed'}22`, border: `1px solid ${BADGE_COLORS[t.badge] ?? '#7c3aed'}55`, color: BADGE_COLORS[t.badge] ?? '#a78bfa', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700 }}>{t.badge}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
