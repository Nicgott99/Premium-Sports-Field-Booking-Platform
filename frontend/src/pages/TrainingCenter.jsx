import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_PROGRAMS = [
  { id:1, title:'Football Elite — Speed & Agility', coach:'Coach Rahim Uddin', level:'Advanced', sport:'Football', sessions:12, price:4500, rating:4.9, enrolled:234, icon:'⚽', duration:'6 weeks', skills:['Sprint drills','Cone agility','1v1 defending'] },
  { id:2, title:'Basketball Fundamentals', coach:'Coach Marcus James', level:'Beginner', sport:'Basketball', sessions:8, price:2800, rating:4.7, enrolled:189, icon:'🏀', duration:'4 weeks', skills:['Dribbling','Shooting form','Court vision'] },
  { id:3, title:'Tennis Serve & Return Clinic', coach:'Coach Sara Begum', level:'Intermediate', sport:'Tennis', sessions:10, price:3600, rating:4.8, enrolled:97, icon:'🎾', duration:'5 weeks', skills:['Flat serve','Topspin','Net play'] },
  { id:4, title:'Cricket Batting Masterclass', coach:'Coach Shakib', level:'Advanced', sport:'Cricket', sessions:16, price:6000, rating:5.0, enrolled:312, icon:'🏏', duration:'8 weeks', skills:['Power hitting','Technique','Mental game'] },
  { id:5, title:'Badminton Speed Footwork', coach:'Coach Ananya', level:'Intermediate', sport:'Badminton', sessions:6, price:2200, rating:4.6, enrolled:78, icon:'🏸', duration:'3 weeks', skills:['Court movement','Smash','Drop shots'] },
  { id:6, title:'Swimming: Competitive Freestyle', coach:'Coach Tanvir', level:'Beginner', sport:'Swimming', sessions:10, price:3200, rating:4.5, enrolled:52, icon:'🏊', duration:'5 weeks', skills:['Breathing rhythm','Flip turns','Race pace'] },
];

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const LEVEL_COLORS = { Beginner:'#22d3ee', Intermediate:'#ff5e07', Advanced:'#FBBF24' };

function ProgramCard({ program }) {
  const [enrolled, setEnrolled] = useState(false);
  return (
    <article style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', overflow:'hidden', backdropFilter:'blur(14px)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'1.5rem 1.5rem 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.85rem' }}>
          <span style={{ fontSize:'2.5rem' }}>{program.icon}</span>
          <span style={{ background:`rgba(${program.level === 'Advanced' ? '195,244,0' : program.level === 'Intermediate' ? '255,94,7' : '34,211,238'},0.1)`, border:`1px solid rgba(${program.level === 'Advanced' ? '195,244,0' : program.level === 'Intermediate' ? '255,94,7' : '34,211,238'},0.25)`, color: LEVEL_COLORS[program.level], padding:'0.18rem 0.6rem', borderRadius:'999px', fontSize:'0.72rem', fontWeight:700 }}>{program.level}</span>
        </div>
        <h3 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', marginBottom:'0.3rem' }}>{program.title}</h3>
        <div style={{ color:'#8ba3be', fontSize:'0.82rem', marginBottom:'0.75rem' }}>{program.coach}</div>
        <div style={{ display:'flex', gap:'1rem', marginBottom:'0.85rem', flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', color:'#506070', fontSize:'0.78rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'0.9rem' }}>calendar_month</span>
            <span>{program.duration}</span>
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', color:'#506070', fontSize:'0.78rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'0.9rem' }}>school</span>
            <span>{program.sessions} sessions</span>
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', color:'#506070', fontSize:'0.78rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'0.9rem' }}>group</span>
            <span>{program.enrolled} enrolled</span>
          </span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', marginBottom:'1rem' }}>
          {program.skills.map(s => <span key={s} style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.14)', color:'#8ba3be', padding:'0.1rem 0.45rem', borderRadius:'999px', fontSize:'0.68rem' }}>{s}</span>)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'1.25rem' }}>
          <span style={{ color:'#FBBF24', fontSize:'0.85rem' }}>★ {program.rating}</span>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
          <span style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.3rem', color:'#FBBF24' }}>৳{program.price.toLocaleString()}</span>
        </div>
      </div>
      <div style={{ marginTop:'auto', padding:'0 1.5rem 1.5rem' }}>
        <button onClick={() => setEnrolled(v => !v)}
          style={{ width:'100%', padding:'0.65rem', background: enrolled ? 'rgba(251,191,36,0.1)' : '#FBBF24', color: enrolled ? '#FBBF24' : '#111111', border: enrolled ? '1px solid rgba(251,191,36,0.3)' : 'none', borderRadius:'10px', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.88rem', cursor:'pointer', transition:'all 0.2s' }}>
          {enrolled ? '✓ Enrolled' : 'Enroll Now'}
        </button>
      </div>
    </article>
  );
}
ProgramCard.propTypes = {
  program: PropTypes.shape({ id:PropTypes.number, title:PropTypes.string, coach:PropTypes.string, level:PropTypes.string, sport:PropTypes.string, sessions:PropTypes.number, price:PropTypes.number, rating:PropTypes.number, enrolled:PropTypes.number, icon:PropTypes.string, duration:PropTypes.string, skills:PropTypes.arrayOf(PropTypes.string) }).isRequired,
};

const TrainingCenter = () => {
  const [programs, setPrograms] = useState([]);
  const [level, setLevel]       = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/v1/training/programs');
        const data = await res.json();
        if (!res.ok) throw new Error('api');
        setPrograms(data.data ?? data);
      } catch {
        setPrograms(MOCK_PROGRAMS);
      }
    };
    load();
  }, []);

  const filtered = level === 'All' ? programs : programs.filter(p => p.level === level);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Level Up</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.4rem 0 0.5rem', letterSpacing:'-0.02em' }}>Training Center</h1>
          <p style={{ color:'#506070', fontSize:'0.95rem' }}>Expert-led programs to elevate your game to the next level</p>
        </div>

        {/* Level filter */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'2rem', justifyContent:'center', flexWrap:'wrap' }}>
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)}
              style={{ padding:'0.38rem 1rem', borderRadius:'999px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', border:'1px solid', background: level === l ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)', color: level === l ? '#FBBF24' : '#506070', borderColor: level === l ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.25rem' }}>
          {filtered.map(p => <ProgramCard key={p.id} program={p} />)}
        </div>
      </div>
    </div>
  );
};

export default TrainingCenter;
