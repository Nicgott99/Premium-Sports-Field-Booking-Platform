import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_ACHIEVEMENTS = [
  { id:1, title:'First Booking', desc:'Complete your first field booking', icon:'sports', xp:100, unlocked:true, unlockedDate:'2026-01-12', rarity:'common' },
  { id:2, title:'Hat-Trick Hero', desc:'Book 3 fields in a single week', icon:'emoji_events', xp:300, unlocked:true, unlockedDate:'2026-02-28', rarity:'rare' },
  { id:3, title:'On Fire', desc:'Maintain a 7-day booking streak', icon:'local_fire_department', xp:500, unlocked:true, unlockedDate:'2026-04-10', rarity:'epic' },
  { id:4, title:'Community Starter', desc:'Post your first community update', icon:'forum', xp:150, unlocked:true, unlockedDate:'2026-03-05', rarity:'common' },
  { id:5, title:'Speed Demon', desc:'Book within 5 minutes of a slot opening', icon:'bolt', xp:200, unlocked:true, unlockedDate:'2026-05-18', rarity:'rare' },
  { id:6, title:'Elite Reviewer', desc:'Write 10 verified reviews', icon:'rate_review', xp:400, unlocked:false, progress:6, total:10, rarity:'rare' },
  { id:7, title:'Century Club', desc:'Complete 100 bookings', icon:'military_tech', xp:1000, unlocked:false, progress:63, total:100, rarity:'legendary' },
  { id:8, title:'All-Rounder', desc:'Book 5 different sports', icon:'sports_score', xp:350, unlocked:false, progress:3, total:5, rarity:'epic' },
  { id:9, title:'Social Butterfly', desc:'Get 50 likes on community posts', icon:'favorite', xp:250, unlocked:false, progress:31, total:50, rarity:'rare' },
  { id:10, title:'Night Owl', desc:'Book 10 evening sessions (after 8PM)', icon:'nights_stay', xp:200, unlocked:false, progress:7, total:10, rarity:'common' },
  { id:11, title:'Weekend Warrior', desc:'Book every weekend for a month', icon:'calendar_month', xp:450, unlocked:false, progress:2, total:4, rarity:'epic' },
  { id:12, title:'Grand Master', desc:'Reach Elite rank', icon:'workspace_premium', xp:2000, unlocked:false, progress:0, total:1, rarity:'legendary' },
];

const RARITY_COLORS = {
  common:   { color:'#8ba3be', bg:'rgba(139,163,190,0.1)', border:'rgba(139,163,190,0.2)' },
  rare:     { color:'#7dd3fc', bg:'rgba(125,211,252,0.1)', border:'rgba(125,211,252,0.2)' },
  epic:     { color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.2)' },
  legendary:{ color:'#c3f400', bg:'rgba(195,244,0,0.1)',   border:'rgba(195,244,0,0.3)'   },
};

function Badge({ achievement }) {
  const rc = RARITY_COLORS[achievement.rarity];
  const pct = achievement.unlocked ? 100 : Math.round(((achievement.progress ?? 0) / (achievement.total ?? 1)) * 100);
  return (
    <article style={{ background:'rgba(13,28,45,0.72)', border:`1px solid ${achievement.unlocked ? rc.border : 'rgba(255,255,255,0.06)'}`, borderRadius:'16px', padding:'1.4rem', backdropFilter:'blur(14px)', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', opacity: achievement.unlocked ? 1 : 0.65, transition:'all 0.2s', position:'relative', overflow:'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = achievement.unlocked ? '1' : '0.65'; e.currentTarget.style.transform='none'; }}>
      {achievement.unlocked && <div style={{ position:'absolute', top:'0.5rem', right:'0.5rem', width:'18px', height:'18px', borderRadius:'50%', background:'#c3f400', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize:'0.7rem', color:'#0a1200', fontWeight:900 }}>check</span>
      </div>}
      <div style={{ width:'60px', height:'60px', borderRadius:'50%', background: achievement.unlocked ? rc.bg : 'rgba(255,255,255,0.04)', border:`2px solid ${achievement.unlocked ? rc.border : 'rgba(255,255,255,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0.85rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize:'1.6rem', color: achievement.unlocked ? rc.color : '#506070' }}>{achievement.icon}</span>
      </div>
      <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.9rem', color:'#f0f6ff', marginBottom:'0.3rem' }}>{achievement.title}</div>
      <div style={{ fontSize:'0.75rem', color:'#506070', lineHeight:1.4, marginBottom:'0.75rem' }}>{achievement.desc}</div>
      {!achievement.unlocked && (
        <>
          <div style={{ width:'100%', height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden', marginBottom:'0.3rem' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: rc.color, borderRadius:'999px', transition:'width 0.6s ease' }} />
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070' }}>{achievement.progress}/{achievement.total}</div>
        </>
      )}
      <div style={{ marginTop:'auto', paddingTop:'0.65rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', fontWeight:700, color: achievement.unlocked ? '#c3f400' : '#506070' }}>+{achievement.xp} XP</span>
        <span style={{ fontSize:'0.65rem', padding:'0.08rem 0.4rem', borderRadius:'999px', background:rc.bg, color:rc.color, border:`1px solid ${rc.border}`, fontWeight:700, textTransform:'capitalize' }}>{achievement.rarity}</span>
      </div>
    </article>
  );
}
Badge.propTypes = {
  achievement: PropTypes.shape({ id:PropTypes.number, title:PropTypes.string, desc:PropTypes.string, icon:PropTypes.string, xp:PropTypes.number, unlocked:PropTypes.bool, unlockedDate:PropTypes.string, rarity:PropTypes.string, progress:PropTypes.number, total:PropTypes.number }).isRequired,
};

const FILTERS = ['All', 'Unlocked', 'In Progress', 'Legendary'];

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/achievements', { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setAchievements(data.data ?? data);
      } catch {
        setAchievements(MOCK_ACHIEVEMENTS);
      }
    };
    load();
  }, []);

  const filtered = achievements.filter(a => {
    if (filter === 'Unlocked')   return a.unlocked;
    if (filter === 'In Progress') return !a.unlocked;
    if (filter === 'Legendary')  return a.rarity === 'legendary';
    return true;
  });

  const unlocked = achievements.filter(a => a.unlocked).length;
  const totalXp  = achievements.filter(a => a.unlocked).reduce((s,a) => s + a.xp, 0);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Milestones</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.4rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Achievements</h1>
        </div>

        {/* Progress summary */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem 2rem', marginBottom:'1.75rem', backdropFilter:'blur(14px)', display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'2.8rem', color:'#c3f400', lineHeight:1 }}>{unlocked}<span style={{ fontSize:'1.5rem', color:'#506070' }}>/{achievements.length}</span></div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.72rem', textTransform:'uppercase', marginTop:'0.25rem' }}>Achievements Unlocked</div>
          </div>
          <div style={{ flex:1, minWidth:'200px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#8ba3be' }}>Overall Progress</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400' }}>{Math.round((unlocked/Math.max(achievements.length,1))*100)}%</span>
            </div>
            <div style={{ height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.round((unlocked/Math.max(achievements.length,1))*100)}%`, background:'linear-gradient(90deg,#c3f400,#ff5e07)', borderRadius:'999px', transition:'width 0.8s ease' }} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'2.2rem', color:'#ff5e07', lineHeight:1 }}>{totalXp.toLocaleString()}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.72rem', textTransform:'uppercase', marginTop:'0.25rem' }}>XP Earned</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display:'flex', gap:'0.45rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'0.38rem 1rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', background: filter === f ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f ? '#c3f400' : '#506070', borderColor: filter === f ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>{f}</button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem' }}>
          {filtered.map(a => <Badge key={a.id} achievement={a} />)}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
