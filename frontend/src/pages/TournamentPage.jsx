import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_TOURNAMENTS = [
  { id:1, name:'Dhaka Premier League — Football', sport:'Football', icon:'⚽', status:'ongoing', teams:16, registered:16, prize:'৳80,000', startDate:'2026-06-01', endDate:'2026-06-30', venue:'Bashundhara Sports Complex', format:'Round Robin + Knockout', entryFee:5000, description:'The most prestigious football tournament in the city with 16 elite teams competing across 4 weeks.' },
  { id:2, name:'3v3 Basketball Showdown', sport:'Basketball', icon:'🏀', status:'open', teams:8, registered:5, prize:'৳25,000', startDate:'2026-06-25', endDate:'2026-06-26', venue:'Mirpur Indoor Stadium', format:'Single Elimination', entryFee:1500, description:'Fast-paced 3v3 street basketball tournament on professional courts.' },
  { id:3, name:'Smash Open — Tennis Championship', sport:'Tennis', icon:'🎾', status:'open', teams:32, registered:24, prize:'৳40,000', startDate:'2026-07-05', endDate:'2026-07-12', venue:'Dhanmondi Tennis Club', format:'Double Elimination', entryFee:3000, description:'Open singles and doubles tennis championship with players from all over Bangladesh.' },
  { id:4, name:'T10 Cricket Blitz', sport:'Cricket', icon:'🏏', status:'upcoming', teams:12, registered:0, prize:'৳60,000', startDate:'2026-07-20', endDate:'2026-07-21', venue:'Elite Cricket Centre', format:'Group Stage + Final', entryFee:4000, description:'High-intensity T10 format cricket tournament — 12 teams, 2 days, one champion.' },
  { id:5, name:'Badminton Grand Prix', sport:'Badminton', icon:'🏸', status:'completed', teams:20, registered:20, prize:'৳30,000', startDate:'2026-05-10', endDate:'2026-05-12', venue:'Badminton Arena Dhaka', format:'Round Robin', entryFee:2000, description:'Past tournament. Won by Team Falcon from Uttara.' },
];

const STATUS_STYLE = {
  ongoing:  { color:'#c3f400', bg:'rgba(195,244,0,0.12)', border:'rgba(195,244,0,0.3)',  label:'LIVE' },
  open:     { color:'#7dd3fc', bg:'rgba(125,211,252,0.12)', border:'rgba(125,211,252,0.3)', label:'Open' },
  upcoming: { color:'#ff5e07', bg:'rgba(255,94,7,0.12)', border:'rgba(255,94,7,0.3)',  label:'Upcoming' },
  completed:{ color:'#506070', bg:'rgba(80,96,112,0.12)', border:'rgba(80,96,112,0.3)',  label:'Ended' },
};

function TournamentCard({ t, onSelect, selected }) {
  const ss = STATUS_STYLE[t.status];
  const spotsLeft = t.teams - t.registered;
  const fillPct = Math.round((t.registered / t.teams) * 100);
  return (
    <button type="button" onClick={() => onSelect(t)} style={{ background:'rgba(13,28,45,0.72)', border:`1px solid ${selected ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'16px', padding:'1.4rem 1.5rem', backdropFilter:'blur(14px)', cursor:'pointer', transition:'all 0.2s', width:'100%', textAlign:'left', display:'block' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(195,244,0,0.25)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = selected ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform='none'; }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
          <span style={{ fontSize:'1.8rem' }}>{t.icon}</span>
          <div>
            <h3 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.95rem', color:'#f0f6ff', margin:0, lineHeight:1.3 }}>{t.name}</h3>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.2rem' }}>{t.venue}</div>
          </div>
        </div>
        <span style={{ background:ss.bg, border:`1px solid ${ss.border}`, color:ss.color, padding:'0.18rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:800, whiteSpace:'nowrap', fontFamily:"'JetBrains Mono',monospace" }}>{ss.label}</span>
      </div>
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'0.85rem' }}>
        {[['emoji_events', t.prize],['group', `${t.registered}/${t.teams} teams`],['event', t.startDate]].map(([icon, val]) => (
          <span key={icon} style={{ display:'flex', alignItems:'center', gap:'0.3rem', color:'#506070', fontSize:'0.78rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'0.9rem' }}>{icon}</span>
            <span>{val}</span>
          </span>
        ))}
      </div>
      <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${fillPct}%`, background: fillPct >= 100 ? '#ff5e07' : '#c3f400', borderRadius:'999px' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.35rem' }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070' }}>{fillPct}% filled</span>
        {t.status === 'open' && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color: spotsLeft <= 2 ? '#ff5e07' : '#c3f400' }}>{spotsLeft} spots left</span>}
      </div>
    </button>
  );
}
TournamentCard.propTypes = {
  t: PropTypes.shape({ id:PropTypes.number, name:PropTypes.string, sport:PropTypes.string, icon:PropTypes.string, status:PropTypes.string, teams:PropTypes.number, registered:PropTypes.number, prize:PropTypes.string, startDate:PropTypes.string, endDate:PropTypes.string, venue:PropTypes.string, format:PropTypes.string, entryFee:PropTypes.number, description:PropTypes.string }).isRequired,
  onSelect: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

const FILTERS = ['All','Ongoing','Open','Upcoming','Completed'];

const TournamentPage = () => {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/tournaments');
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        const list = data.data ?? data;
        setTournaments(list);
        setSelected(list[0] ?? null);
      } catch {
        setTournaments(MOCK_TOURNAMENTS);
        setSelected(MOCK_TOURNAMENTS[0]);
      }
    };
    load();
  }, []);

  const displayed = filter === 'All' ? tournaments : tournaments.filter(t => t.status === filter.toLowerCase());

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Compete</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Tournaments</h1>
        </div>

        <div style={{ display:'flex', gap:'0.45rem', marginBottom:'1.75rem', justifyContent:'center', flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'0.38rem 1rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', background: filter === f ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f ? '#c3f400' : '#506070', borderColor: filter === f ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>{f}</button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'1.5rem', alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {displayed.map(t => <TournamentCard key={t.id} t={t} onSelect={setSelected} selected={selected?.id === t.id} />)}
          </div>

          {selected && (
            <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(195,244,0,0.15)', borderRadius:'20px', padding:'2rem', backdropFilter:'blur(14px)', position:'sticky', top:'6rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>{selected.icon}</div>
              <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.2rem', color:'#f0f6ff', marginBottom:'0.35rem' }}>{selected.name}</h2>
              <p style={{ color:'#8ba3be', fontSize:'0.85rem', lineHeight:1.6, marginBottom:'1.25rem' }}>{selected.description}</p>
              {[['emoji_events','Prize Pool', selected.prize],['event','Dates',`${selected.startDate} → ${selected.endDate}`],['location_on','Venue', selected.venue],['sports','Format', selected.format],['paid','Entry Fee',`৳${selected.entryFee.toLocaleString()}`]].map(([icon, label, val]) => (
                <div key={label} style={{ display:'flex', gap:'0.65rem', marginBottom:'0.7rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'1rem', color:'#506070', flexShrink:0, marginTop:'1px' }}>{icon}</span>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.65rem', color:'#506070', textTransform:'uppercase' }}>{label}</div>
                    <div style={{ color:'#c8d8ea', fontSize:'0.88rem', fontWeight:600 }}>{val}</div>
                  </div>
                </div>
              ))}
              {selected.status === 'open' && (
                <button style={{ width:'100%', padding:'0.75rem', background:'#c3f400', border:'none', borderRadius:'12px', color:'#0a1200', fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'0.95rem', cursor:'pointer', marginTop:'1rem' }}>
                  Register Team
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
