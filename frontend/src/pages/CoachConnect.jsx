import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_COACHES = [
  { id:1, name:'Coach Rahim Uddin', sport:'Football', avatar:'🧑‍🏫', rating:4.9, reviews:128, exp:'12 years', sessions:640, price:800, badge:'Elite', speciality:'Striker Training & Tactical Positioning', availability:['Mon','Wed','Fri'], location:'Bashundhara', bio:'Former national team player with UEFA B coaching license. Specializes in developing attacking players and match strategy.', achievements:['National U-19 Coach (2018-2021)','UEFA B License','500+ trained players'] },
  { id:2, name:'Nadia Islam', sport:'Tennis', avatar:'👩‍🏫', rating:4.8, reviews:94, exp:'8 years', sessions:410, price:950, badge:'Pro', speciality:'Serve Mechanics & Match Strategy', availability:['Tue','Thu','Sat'], location:'Dhanmondi', bio:'ITF-certified coach and former national women\'s champion. Specializes in technical refinement and mental game coaching.', achievements:['ITF Certified Coach','National Women\'s Champion 2017','WTA Pro Circuit Experience'] },
  { id:3, name:'Karim Hossain', sport:'Cricket', avatar:'🧑‍⚽', rating:4.7, reviews:76, exp:'10 years', sessions:320, price:700, badge:'Pro', speciality:'Fast Bowling & Batting Technique', availability:['Mon','Tue','Sat'], location:'Mirpur', bio:'BPL-experienced cricketer turned coach. Deep expertise in fast bowling mechanics and power hitting technique.', achievements:['BPL Player (2015-2020)','BCB Certified Coach','200+ wickets in first-class cricket'] },
  { id:4, name:'Sara Begum', sport:'Badminton', avatar:'👩‍🎓', rating:4.6, reviews:52, exp:'6 years', sessions:280, price:600, badge:'Rising', speciality:'Footwork & Smash Accuracy', availability:['Wed','Thu','Sun'], location:'Gulshan', bio:'BWF certified coach with a passion for youth development. Training players from beginner to competitive level.', achievements:['BWF Level 2 Certified','Youth Development Specialist','National Junior Circuit Coach'] },
];

const BADGE_STYLE = {
  Elite:   { color:'#c3f400', bg:'rgba(195,244,0,0.12)',  border:'rgba(195,244,0,0.3)'  },
  Pro:     { color:'#7dd3fc', bg:'rgba(125,211,252,0.12)', border:'rgba(125,211,252,0.3)' },
  Rising:  { color:'#ff5e07', bg:'rgba(255,94,7,0.12)',   border:'rgba(255,94,7,0.3)'   },
};

const SPORTS = ['All', 'Football', 'Tennis', 'Cricket', 'Badminton'];

function StarBar({ rating }) {
  return (
    <div style={{ display:'flex', gap:'1px', alignItems:'center' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= Math.floor(rating) ? '#c3f400' : s - 0.5 <= rating ? '#c3f400' : 'rgba(255,255,255,0.12)', fontSize:'0.78rem' }}>★</span>
      ))}
    </div>
  );
}
StarBar.propTypes = { rating: PropTypes.number.isRequired };

function CoachCard({ coach, onSelect, selected }) {
  const bs = BADGE_STYLE[coach.badge] ?? BADGE_STYLE.Rising;
  return (
    <button type="button" onClick={() => onSelect(coach)}
      style={{ width:'100%', textAlign:'left', display:'block', background:'rgba(13,28,45,0.72)', border:`1px solid ${selected ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'16px', padding:'1.4rem', backdropFilter:'blur(14px)', cursor:'pointer', transition:'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(195,244,0,0.22)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = selected ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform='none'; }}>
      <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(195,244,0,0.08)', border:'2px solid rgba(195,244,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', flexShrink:0 }}>{coach.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'0.4rem' }}>
            <div>
              <h3 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', margin:0 }}>{coach.name}</h3>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.15rem' }}>{coach.sport} · {coach.location}</div>
            </div>
            <span style={{ background:bs.bg, border:`1px solid ${bs.border}`, color:bs.color, padding:'0.15rem 0.6rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:800 }}>{coach.badge}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', margin:'0.5rem 0' }}>
            <StarBar rating={coach.rating} />
            <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#c3f400', fontSize:'0.75rem', fontWeight:700 }}>{coach.rating}</span>
            <span style={{ color:'#506070', fontSize:'0.72rem' }}>({coach.reviews} reviews)</span>
          </div>
          <div style={{ fontFamily:"'Inter',sans-serif", color:'#8ba3be', fontSize:'0.8rem', marginBottom:'0.75rem', lineHeight:1.45 }}>{coach.speciality}</div>
          <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
            {[['workspace_premium', coach.exp],['event_available', `${coach.sessions}+ sessions`],['payments', `৳${coach.price}/hr`]].map(([icon, val]) => (
              <span key={icon} style={{ display:'flex', alignItems:'center', gap:'0.3rem', color:'#506070', fontSize:'0.78rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'0.9rem' }}>{icon}</span>
                <span>{val}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
CoachCard.propTypes = {
  coach: PropTypes.shape({ id:PropTypes.number, name:PropTypes.string, sport:PropTypes.string, avatar:PropTypes.string, rating:PropTypes.number, reviews:PropTypes.number, exp:PropTypes.string, sessions:PropTypes.number, price:PropTypes.number, badge:PropTypes.string, speciality:PropTypes.string, availability:PropTypes.arrayOf(PropTypes.string), location:PropTypes.string, bio:PropTypes.string, achievements:PropTypes.arrayOf(PropTypes.string) }).isRequired,
  onSelect: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

const CoachConnect = () => {
  const [coaches, setCoaches] = useState([]);
  const [sport, setSport] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/coaches');
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        const list = data.data ?? data;
        setCoaches(list);
        setSelected(list[0] ?? null);
      } catch {
        setCoaches(MOCK_COACHES);
        setSelected(MOCK_COACHES[0]);
      }
    };
    load();
  }, []);

  const displayed = sport === 'All' ? coaches : coaches.filter(c => c.sport === sport);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Expert Guidance</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Coach Connect</h1>
          <p style={{ color:'#506070', fontSize:'0.95rem', marginTop:'0.5rem' }}>Find certified coaches and book 1-on-1 training sessions</p>
        </div>

        <div style={{ display:'flex', gap:'0.45rem', marginBottom:'1.75rem', justifyContent:'center', flexWrap:'wrap' }}>
          {SPORTS.map(s => (
            <button key={s} onClick={() => setSport(s)}
              style={{ padding:'0.38rem 1rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', background: sport === s ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.04)', color: sport === s ? '#c3f400' : '#506070', borderColor: sport === s ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>{s}</button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'1.5rem', alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {displayed.map(c => <CoachCard key={c.id} coach={c} onSelect={setSelected} selected={selected?.id === c.id} />)}
          </div>

          {selected && (
            <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(195,244,0,0.15)', borderRadius:'20px', padding:'2rem', backdropFilter:'blur(14px)', position:'sticky', top:'6rem' }}>
              <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
                <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(195,244,0,0.1)', border:'2px solid rgba(195,244,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem', margin:'0 auto 0.75rem' }}>{selected.avatar}</div>
                <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.15rem', color:'#f0f6ff', margin:0 }}>{selected.name}</h2>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.2rem' }}>{selected.sport} · {selected.location}</div>
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'0.4rem', marginTop:'0.5rem' }}>
                  <StarBar rating={selected.rating} />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#c3f400', fontSize:'0.78rem' }}>{selected.rating} ({selected.reviews})</span>
                </div>
              </div>
              <p style={{ color:'#8ba3be', fontSize:'0.85rem', lineHeight:1.65, marginBottom:'1.25rem' }}>{selected.bio}</p>
              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.5rem' }}>Achievements</div>
                {selected.achievements.map(a => (
                  <div key={a} style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start', marginBottom:'0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:'0.85rem', color:'#c3f400', flexShrink:0, marginTop:'1px' }}>check_circle</span>
                    <span style={{ color:'#c8d8ea', fontSize:'0.82rem' }}>{a}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.5rem' }}>Available Days</div>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                  {selected.availability.map(d => (
                    <span key={d} style={{ padding:'0.2rem 0.65rem', background:'rgba(195,244,0,0.08)', border:'1px solid rgba(195,244,0,0.18)', color:'#c3f400', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700 }}>{d}</span>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', padding:'0.85rem 1rem', background:'rgba(255,255,255,0.03)', borderRadius:'10px' }}>
                <span style={{ color:'#8ba3be', fontSize:'0.88rem' }}>Session Rate</span>
                <span style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.3rem', color:'#c3f400' }}>৳{selected.price}<span style={{ fontSize:'0.75rem', color:'#506070', fontWeight:400 }}>/hr</span></span>
              </div>
              <button style={{ width:'100%', padding:'0.8rem', background:'#c3f400', border:'none', borderRadius:'12px', color:'#0a1200', fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'0.95rem', cursor:'pointer' }}>
                Book a Session
              </button>
              <button style={{ width:'100%', padding:'0.65rem', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#8ba3be', fontFamily:"'Anybody',sans-serif", fontWeight:700, fontSize:'0.88rem', cursor:'pointer', marginTop:'0.65rem' }}>
                Send Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachConnect;
