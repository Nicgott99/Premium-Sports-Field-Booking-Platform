import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_SESSIONS = [
  { id:1, title:'Elite Football Drills — Live', host:'Coach Rahim', sport:'Football', viewers:312, duration:'38:14', thumbnail:'⚽', status:'live', tags:['Dribbling','Speed'] },
  { id:2, title:'3v3 Basketball Scrimmage — Mirpur', host:'BallKings Club', sport:'Basketball', viewers:87, duration:'1:12:05', thumbnail:'🏀', status:'live', tags:['Scrimmage','Fun'] },
  { id:3, title:'Pro Tennis Serve Masterclass', host:'Coach Sara', sport:'Tennis', viewers:204, duration:'22:44', thumbnail:'🎾', status:'live', tags:['Technique','Serve'] },
  { id:4, title:'Cricket Batting: T20 Shots', host:'Shakib Academy', sport:'Cricket', viewers:520, duration:'45:30', thumbnail:'🏏', status:'live', tags:['Batting','T20'] },
  { id:5, title:'Morning Badminton — Open Rally', host:'Dhaka Badminton Club', sport:'Badminton', viewers:43, duration:'14:02', thumbnail:'🏸', status:'upcoming', startTime:'07:00 AM', tags:['Open','Rally'] },
  { id:6, title:'Swimming Technique: Freestyle', host:'Coach Tanvir', sport:'Swimming', viewers:0, duration:'—', thumbnail:'🏊', status:'upcoming', startTime:'09:00 AM', tags:['Freestyle','Technique'] },
];

function SessionCard({ session }) {
  const isLive = session.status === 'live';
  return (
    <article style={{ background:'rgba(13,28,45,0.72)', border:`1px solid ${isLive ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'16px', overflow:'hidden', backdropFilter:'blur(14px)', transition:'transform 0.25s,box-shadow 0.25s', cursor:'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
      {/* Thumbnail */}
      <div style={{ height:'140px', background:'linear-gradient(135deg,rgba(13,28,45,0.9),rgba(18,33,49,0.95))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3.5rem', position:'relative' }}>
        {session.thumbnail}
        {isLive && (
          <div style={{ position:'absolute', top:'0.6rem', left:'0.6rem', background:'#ef4444', color:'#fff', fontWeight:800, fontSize:'0.72rem', padding:'0.18rem 0.55rem', borderRadius:'999px', display:'flex', alignItems:'center', gap:'0.3rem', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.05em' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'pulse 1.2s ease-in-out infinite' }} />
            <span>LIVE</span>
          </div>
        )}
        {!isLive && (
          <div style={{ position:'absolute', top:'0.6rem', left:'0.6rem', background:'rgba(251,191,36,0.15)', color:'#FBBF24', fontWeight:700, fontSize:'0.72rem', padding:'0.18rem 0.55rem', borderRadius:'999px', border:'1px solid rgba(251,191,36,0.3)', fontFamily:"'JetBrains Mono',monospace" }}>
            {session.startTime}
          </div>
        )}
        {isLive && (
          <div style={{ position:'absolute', bottom:'0.6rem', right:'0.6rem', background:'rgba(0,0,0,0.7)', color:'#f0f6ff', fontSize:'0.72rem', padding:'0.18rem 0.55rem', borderRadius:'6px', fontFamily:"'JetBrains Mono',monospace" }}>
            {session.duration}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:'1rem 1.1rem' }}>
        <h3 style={{ color:'#f0f6ff', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.95rem', marginBottom:'0.3rem', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{session.title}</h3>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.55rem' }}>
          <span style={{ color:'#8ba3be', fontSize:'0.8rem' }}>{session.host}</span>
          {isLive && (
            <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', color:'#506070', fontSize:'0.78rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'0.9rem' }}>visibility</span>
              <span>{session.viewers.toLocaleString()}</span>
            </span>
          )}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
          {session.tags.map(t => <span key={t} style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.14)', color:'#8ba3be', padding:'0.1rem 0.45rem', borderRadius:'999px', fontSize:'0.68rem' }}>{t}</span>)}
        </div>
      </div>
    </article>
  );
}
SessionCard.propTypes = {
  session: PropTypes.shape({ id:PropTypes.number, title:PropTypes.string, host:PropTypes.string, sport:PropTypes.string, viewers:PropTypes.number, duration:PropTypes.string, thumbnail:PropTypes.string, status:PropTypes.string, startTime:PropTypes.string, tags:PropTypes.arrayOf(PropTypes.string) }).isRequired,
};

const LiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [tab, setTab]           = useState('live');

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/v1/sessions/live');
        const data = await res.json();
        if (!res.ok) throw new Error('api');
        setSessions(data.data ?? data);
      } catch {
        setSessions(MOCK_SESSIONS);
      }
    };
    load();
  }, []);

  const displayed = sessions.filter(s => s.status === tab);
  const liveCount = sessions.filter(s => s.status === 'live').length;

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Watch Now</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.4rem 0 0.5rem', letterSpacing:'-0.02em' }}>Live Sessions</h1>
          <p style={{ color:'#506070', fontSize:'0.95rem' }}>Watch matches, training sessions and masterclasses live</p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'2rem', justifyContent:'center' }}>
          <button onClick={() => setTab('live')}
            style={{ padding:'0.5rem 1.5rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', background: tab === 'live' ? '#ef4444' : 'transparent', color: tab === 'live' ? '#fff' : '#506070', borderColor: tab === 'live' ? '#ef4444' : 'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:'0.4rem', transition:'all 0.18s' }}>
            {tab === 'live' && <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'pulse 1.2s ease-in-out infinite' }} />}
            <span>Live Now ({liveCount})</span>
          </button>
          <button onClick={() => setTab('upcoming')}
            style={{ padding:'0.5rem 1.5rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', background: tab === 'upcoming' ? 'rgba(251,191,36,0.15)' : 'transparent', color: tab === 'upcoming' ? '#FBBF24' : '#506070', borderColor: tab === 'upcoming' ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>
            Upcoming
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.25rem' }}>
          {displayed.map(s => <SessionCard key={s.id} session={s} />)}
        </div>

        {displayed.length === 0 && (
          <div style={{ textAlign:'center', padding:'5rem 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'3.5rem', color:'rgba(251,191,36,0.2)', display:'block', marginBottom:'1rem' }}>live_tv</span>
            <p style={{ color:'#506070' }}>{tab === 'live' ? 'No live sessions right now. Check back soon!' : 'No upcoming sessions scheduled.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessions;
