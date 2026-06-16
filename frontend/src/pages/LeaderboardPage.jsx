import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_PLAYERS = [
  { rank: 1,  name: 'Arman Hossain',   avatar: '🏆', sport: 'Football',   points: 9840, wins: 47, bookings: 62, badge: 'Platinum', streak: 12 },
  { rank: 2,  name: 'Nadia Rahman',    avatar: '🥈', sport: 'Badminton',  points: 8720, wins: 41, bookings: 55, badge: 'Gold',     streak: 8  },
  { rank: 3,  name: 'Karim Uddin',     avatar: '🥉', sport: 'Cricket',    points: 7950, wins: 38, bookings: 50, badge: 'Gold',     streak: 5  },
  { rank: 4,  name: 'Sultana Begum',   avatar: '🎯', sport: 'Tennis',     points: 7200, wins: 34, bookings: 46, badge: 'Gold',     streak: 3  },
  { rank: 5,  name: 'Rafiq Islam',     avatar: '⚡', sport: 'Football',   points: 6850, wins: 30, bookings: 41, badge: 'Silver',   streak: 7  },
  { rank: 6,  name: 'Tanvir Ahmed',    avatar: '🔥', sport: 'Basketball', points: 6100, wins: 27, bookings: 38, badge: 'Silver',   streak: 4  },
  { rank: 7,  name: 'Fahmida Khanam', avatar: '⭐', sport: 'Volleyball',  points: 5700, wins: 25, bookings: 35, badge: 'Silver',   streak: 2  },
  { rank: 8,  name: 'Monir Khan',      avatar: '🎮', sport: 'Cricket',    points: 5200, wins: 22, bookings: 31, badge: 'Silver',   streak: 6  },
  { rank: 9,  name: 'Roksana Akter',   avatar: '💪', sport: 'Badminton',  points: 4800, wins: 20, bookings: 28, badge: 'Bronze',   streak: 1  },
  { rank: 10, name: 'Imran Chowdhury', avatar: '🚀', sport: 'Tennis',     points: 4350, wins: 18, bookings: 25, badge: 'Bronze',   streak: 3  },
];

const MOCK_TEAMS = [
  { rank: 1, name: 'Thunder Bolts', sport: 'Football',   members: 11, wins: 28, points: 14200, badge: 'Champion' },
  { rank: 2, name: 'Storm Eagles',  sport: 'Cricket',    members: 11, wins: 24, points: 11800, badge: 'Finalist' },
  { rank: 3, name: 'Fire Hawks',    sport: 'Basketball', members: 5,  wins: 21, points: 10500, badge: 'Finalist' },
  { rank: 4, name: 'Blue Sharks',   sport: 'Football',   members: 11, wins: 18, points: 9200,  badge: 'Semi'     },
  { rank: 5, name: 'Green Giants',  sport: 'Volleyball', members: 6,  wins: 15, points: 7800,  badge: 'Semi'     },
];

const SPORTS  = ['All', 'Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Volleyball'];
const PERIODS = ['This Week', 'This Month', 'All Time'];

const BADGE_COLORS = {
  Platinum: '#c3f400', Gold: '#ff5e07', Silver: '#94a3b8',
  Bronze: '#cd7f32', Champion: '#c3f400', Finalist: '#ff5e07', Semi: '#7dd3fc',
};

const RANK_ICONS = ['emoji_events', 'workspace_premium', 'military_tech'];

const glass = { background: 'rgba(13,28,45,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.07)' };

function PodiumCard({ player, height, crownIcon, crownColor }) {
  return (
    <div style={{
      ...glass,
      borderRadius: 16,
      padding: '1.25rem 1rem',
      textAlign: 'center',
      width: 140,
      height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.3rem',
      border: `1px solid ${crownColor}33`,
      boxShadow: `0 0 24px ${crownColor}22`,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: crownColor }}>{crownIcon}</span>
      <div style={{ fontSize: '1.6rem' }}>{player.avatar}</div>
      <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '0.82rem', fontFamily: "'Inter',sans-serif" }}>{player.name.split(' ')[0]}</div>
      <div style={{ color: crownColor, fontWeight: 900, fontSize: '0.88rem', fontFamily: "'JetBrains Mono',monospace" }}>{player.points.toLocaleString()}</div>
      <div style={{ color: '#506070', fontSize: '0.68rem' }}>{player.sport}</div>
    </div>
  );
}
PodiumCard.propTypes = {
  player: PropTypes.shape({ avatar: PropTypes.string, name: PropTypes.string, points: PropTypes.number, sport: PropTypes.string }).isRequired,
  height: PropTypes.number.isRequired,
  crownIcon: PropTypes.string.isRequired,
  crownColor: PropTypes.string.isRequired,
};

function PlayerRow({ player, index }) {
  const badgeColor = BADGE_COLORS[player.badge] ?? '#506070';
  const isTop3 = player.rank <= 3;
  const rankIcon = isTop3 ? RANK_ICONS[player.rank - 1] : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.9rem',
      padding: '0.85rem 1rem',
      background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
      borderRadius: 10,
      marginBottom: '0.2rem',
    }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
        {rankIcon
          ? <span className="material-symbols-outlined" style={{ fontSize: '1.3rem', color: [BADGE_COLORS.Platinum, BADGE_COLORS.Gold, BADGE_COLORS.Silver][player.rank - 1] }}>{rankIcon}</span>
          : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', color: '#506070', fontWeight: 700 }}>#{player.rank}</span>
        }
      </div>
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{player.avatar}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Inter',sans-serif" }}>{player.name}</div>
        <div style={{ color: '#506070', fontSize: '0.74rem' }}>{player.sport} · {player.wins} wins · 🔥 {player.streak}d streak</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: '#c3f400', fontWeight: 900, fontSize: '0.9rem', fontFamily: "'JetBrains Mono',monospace" }}>{player.points.toLocaleString()}</div>
        <span style={{ background: `${badgeColor}18`, border: `1px solid ${badgeColor}44`, color: badgeColor, padding: '0.12rem 0.45rem', borderRadius: 8, fontSize: '0.66rem', fontWeight: 700 }}>{player.badge}</span>
      </div>
    </div>
  );
}
PlayerRow.propTypes = {
  player: PropTypes.shape({ rank: PropTypes.number, avatar: PropTypes.string, name: PropTypes.string, sport: PropTypes.string, wins: PropTypes.number, streak: PropTypes.number, points: PropTypes.number, badge: PropTypes.string }).isRequired,
  index: PropTypes.number.isRequired,
};

function TeamRow({ team, index }) {
  const badgeColor = BADGE_COLORS[team.badge] ?? '#506070';
  const isTop3 = team.rank <= 3;
  const rankIcon = isTop3 ? RANK_ICONS[team.rank - 1] : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.9rem',
      padding: '0.85rem 1rem',
      background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
      borderRadius: 10,
      marginBottom: '0.2rem',
    }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
        {rankIcon
          ? <span className="material-symbols-outlined" style={{ fontSize: '1.3rem', color: [BADGE_COLORS.Platinum, BADGE_COLORS.Gold, BADGE_COLORS.Silver][team.rank - 1] }}>{rankIcon}</span>
          : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', color: '#506070', fontWeight: 700 }}>#{team.rank}</span>
        }
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', color: '#273647', flexShrink: 0 }}>groups</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Inter',sans-serif" }}>{team.name}</div>
        <div style={{ color: '#506070', fontSize: '0.74rem' }}>{team.sport} · {team.members} members · {team.wins} wins</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: '#c3f400', fontWeight: 900, fontSize: '0.9rem', fontFamily: "'JetBrains Mono',monospace" }}>{team.points.toLocaleString()}</div>
        <span style={{ background: `${badgeColor}18`, border: `1px solid ${badgeColor}44`, color: badgeColor, padding: '0.12rem 0.45rem', borderRadius: 8, fontSize: '0.66rem', fontWeight: 700 }}>{team.badge}</span>
      </div>
    </div>
  );
}
TeamRow.propTypes = {
  team: PropTypes.shape({ rank: PropTypes.number, name: PropTypes.string, sport: PropTypes.string, members: PropTypes.number, wins: PropTypes.number, points: PropTypes.number, badge: PropTypes.string }).isRequired,
  index: PropTypes.number.isRequired,
};

const LeaderboardPage = () => {
  const [players, setPlayers] = useState([]);
  const [teams,   setTeams]   = useState([]);
  const [sport,   setSport]   = useState('All');
  const [period,  setPeriod]  = useState('All Time');
  const [tab,     setTab]     = useState('players');
  const [loading, setLoading] = useState(true);
  const [myRank,  setMyRank]  = useState(null);

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

  const top3 = players.slice(0, 3);
  const PODIUM_ORDER = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : [];
  const PODIUM_HEIGHTS  = [190, 230, 170];
  const PODIUM_ICONS    = ['workspace_premium', 'emoji_events', 'military_tech'];
  const PODIUM_COLORS   = [BADGE_COLORS.Gold, '#c3f400', BADGE_COLORS.Silver];

  return (
    <div style={{ minHeight: '100vh', background: '#051424', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
      {/* ambient orbs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle,rgba(195,244,0,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,94,7,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.2)', borderRadius: 20, padding: '0.35rem 1rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#c3f400' }}>emoji_events</span>
            <span style={{ fontSize: '0.78rem', color: '#c3f400', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Leaderboard</span>
          </div>
          <h1 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 900, fontSize: 'clamp(2rem,4vw,2.8rem)', color: '#f1f5f9', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            Top Performers
          </h1>
          <p style={{ color: '#506070', margin: 0, fontSize: '0.95rem' }}>Champions across every sport on the platform</p>
        </div>

        {/* My rank banner */}
        {myRank && (
          <div style={{ ...glass, borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(195,244,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: '#c3f400' }}>person</span>
              <div>
                <div style={{ color: '#c3f400', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Your Ranking</div>
                <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.4rem', fontFamily: "'JetBrains Mono',monospace" }}>#{myRank.rank}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#c3f400', fontWeight: 900, fontSize: '1.1rem', fontFamily: "'JetBrains Mono',monospace" }}>{myRank.points?.toLocaleString()} pts</div>
              <div style={{ color: '#506070', fontSize: '0.78rem' }}>{myRank.wins} wins</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {SPORTS.map(s => (
            <button key={s} type="button" onClick={() => setSport(s)} style={{ background: sport === s ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${sport === s ? 'rgba(195,244,0,0.4)' : 'rgba(255,255,255,0.07)'}`, color: sport === s ? '#c3f400' : '#506070', padding: '0.35rem 0.9rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem', fontWeight: sport === s ? 700 : 500 }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {PERIODS.map(p => (
            <button key={p} type="button" onClick={() => setPeriod(p)} style={{ background: period === p ? 'rgba(255,94,7,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${period === p ? 'rgba(255,94,7,0.4)' : 'rgba(255,255,255,0.07)'}`, color: period === p ? '#ff5e07' : '#506070', padding: '0.35rem 0.9rem', borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem', fontWeight: period === p ? 700 : 500 }}>{p}</button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem', ...glass, borderRadius: 12, padding: '0.3rem' }}>
          {[['players','person','Players'],['teams','groups','Teams']].map(([key, icon, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: tab === key ? 'rgba(195,244,0,0.12)' : 'transparent', border: `1px solid ${tab === key ? 'rgba(195,244,0,0.3)' : 'transparent'}`, color: tab === key ? '#c3f400' : '#506070', fontWeight: tab === key ? 700 : 500, padding: '0.55rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#506070', padding: '4rem', fontSize: '0.9rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem', opacity: 0.4 }}>hourglass_empty</span>
            <span>Loading rankings…</span>
          </div>
        ) : null}

        {!loading && tab === 'players' && (
          <>
            {PODIUM_ORDER.length === 3 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2.5rem' }}>
                {PODIUM_ORDER.map((p, idx) => (
                  <PodiumCard key={p.rank} player={p} height={PODIUM_HEIGHTS[idx]} crownIcon={PODIUM_ICONS[idx]} crownColor={PODIUM_COLORS[idx]} />
                ))}
              </div>
            )}
            <div style={{ ...glass, borderRadius: 16, padding: '1rem', marginBottom: '1.5rem' }}>
              {(players.length ? players : MOCK_PLAYERS).map((p, i) => (
                <PlayerRow key={p.rank} player={p} index={i} />
              ))}
            </div>
          </>
        )}

        {!loading && tab === 'teams' && (
          <div style={{ ...glass, borderRadius: 16, padding: '1rem' }}>
            {(teams.length ? teams : MOCK_TEAMS).map((t, i) => (
              <TeamRow key={t.rank} team={t} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
