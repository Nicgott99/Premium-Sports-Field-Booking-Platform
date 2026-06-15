import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_RESERVATIONS = [
  { id:'RES-2841', user:'Team Falcon', field:'Field A — Football', venue:'Bashundhara SC', date:'2026-06-22', time:'5:00 PM – 7:00 PM', amount:3600, status:'confirmed', sport:'Football', icon:'⚽', bookedAt:'2026-06-15' },
  { id:'RES-2840', user:'Jakir Hossain', field:'Court 2 — Tennis', venue:'Dhanmondi TC', date:'2026-06-22', time:'6:30 PM – 7:30 PM', amount:950, status:'confirmed', sport:'Tennis', icon:'🎾', bookedAt:'2026-06-15' },
  { id:'RES-2839', user:'School Champions', field:'Field B — Football', venue:'Bashundhara SC', date:'2026-06-23', time:'8:00 AM – 10:00 AM', amount:3600, status:'pending', sport:'Football', icon:'⚽', bookedAt:'2026-06-14' },
  { id:'RES-2838', user:'Corporate League', field:'Hall A — Badminton', venue:'Badminton Arena', date:'2026-06-23', time:'6:00 PM – 8:00 PM', amount:1200, status:'pending', sport:'Badminton', icon:'🏸', bookedAt:'2026-06-14' },
  { id:'RES-2837', user:'Nusrat Jahan', field:'Lane 1-6 — Swimming', venue:'Bashundhara SC', date:'2026-06-20', time:'7:00 AM – 8:00 AM', amount:2200, status:'completed', sport:'Swimming', icon:'🏊', bookedAt:'2026-06-10' },
  { id:'RES-2836', user:'Sara Malik', field:'Court 1 — Tennis', venue:'Dhanmondi TC', date:'2026-06-18', time:'9:00 AM – 10:00 AM', amount:950, status:'cancelled', sport:'Tennis', icon:'🎾', bookedAt:'2026-06-11' },
  { id:'RES-2835', user:'Rafi Ahmed', field:'Hall B — Multi-Sport', venue:'Bashundhara SC', date:'2026-06-17', time:'4:00 PM – 6:00 PM', amount:1600, status:'completed', sport:'Multi', icon:'🏋️', bookedAt:'2026-06-09' },
];

const STATUS_STYLE = {
  confirmed: { color:'#c3f400', bg:'rgba(195,244,0,0.1)',  border:'rgba(195,244,0,0.25)'  },
  pending:   { color:'#ff5e07', bg:'rgba(255,94,7,0.1)',   border:'rgba(255,94,7,0.25)'   },
  completed: { color:'#7dd3fc', bg:'rgba(125,211,252,0.1)', border:'rgba(125,211,252,0.25)' },
  cancelled: { color:'#506070', bg:'rgba(80,96,112,0.1)', border:'rgba(80,96,112,0.25)'  },
};

const STATUS_TABS = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'];

function ReservationRow({ res, onAction }) {
  const ss = STATUS_STYLE[res.status];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:'1rem', alignItems:'center', padding:'1rem 1.25rem', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px' }}>
      <span style={{ fontSize:'1.6rem' }}>{res.icon}</span>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.2rem' }}>
          <span style={{ color:'#f0f6ff', fontWeight:700, fontSize:'0.9rem' }}>{res.user}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.68rem' }}>{res.id}</span>
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.72rem' }}>{res.field} · {res.venue}</div>
        <div style={{ color:'#8ba3be', fontSize:'0.78rem', marginTop:'0.15rem' }}>{res.date} · {res.time}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#c3f400' }}>৳{res.amount.toLocaleString()}</div>
        <span style={{ background:ss.bg, border:`1px solid ${ss.border}`, color:ss.color, padding:'0.1rem 0.55rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:800, textTransform:'capitalize' }}>{res.status}</span>
      </div>
      <div style={{ display:'flex', gap:'0.4rem' }}>
        {res.status === 'pending' && (
          <button type="button" onClick={() => onAction(res, 'confirm')}
            style={{ background:'rgba(195,244,0,0.1)', border:'1px solid rgba(195,244,0,0.25)', color:'#c3f400', borderRadius:'8px', padding:'0.3rem 0.65rem', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>Confirm</button>
        )}
        {(res.status === 'confirmed' || res.status === 'pending') && (
          <button type="button" onClick={() => onAction(res, 'cancel')}
            style={{ background:'rgba(255,94,7,0.08)', border:'1px solid rgba(255,94,7,0.2)', color:'#ff5e07', borderRadius:'8px', padding:'0.3rem 0.65rem', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>Cancel</button>
        )}
      </div>
    </div>
  );
}
ReservationRow.propTypes = {
  res: PropTypes.shape({ id:PropTypes.string, user:PropTypes.string, field:PropTypes.string, venue:PropTypes.string, date:PropTypes.string, time:PropTypes.string, amount:PropTypes.number, status:PropTypes.string, sport:PropTypes.string, icon:PropTypes.string, bookedAt:PropTypes.string }).isRequired,
  onAction: PropTypes.func.isRequired,
};

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/reservations', { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setReservations(data.data ?? data);
      } catch {
        setReservations(MOCK_RESERVATIONS);
      }
    };
    load();
  }, []);

  const handleAction = (res, action) => {
    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: newStatus } : r));
  };

  const filtered = reservations.filter(r => {
    const matchTab = tab === 'All' || r.status === tab.toLowerCase();
    const matchSearch = !search || r.user.toLowerCase().includes(search.toLowerCase()) || r.field.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = { All: reservations.length, Confirmed: reservations.filter(r => r.status==='confirmed').length, Pending: reservations.filter(r => r.status==='pending').length, Completed: reservations.filter(r => r.status==='completed').length, Cancelled: reservations.filter(r => r.status==='cancelled').length };
  const totalRevenue = reservations.filter(r => r.status==='completed' || r.status==='confirmed').reduce((s,r) => s+r.amount, 0);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ marginBottom:'2rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Manage Bookings</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Reservations</h1>
        </div>

        {/* Summary strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'0.85rem', marginBottom:'1.75rem' }}>
          {[['Total','event_note', reservations.length, '#f0f6ff'],['Revenue','payments',`৳${totalRevenue.toLocaleString()}`,'#c3f400'],['Pending','pending_actions',counts.Pending,'#ff5e07'],['Confirmed','check_circle',counts.Confirmed,'#7dd3fc']].map(([label, icon, val, color]) => (
            <div key={label} style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'1rem 1.25rem', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'1.3rem', color }}>{icon}</span>
              <div>
                <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.25rem', color }}>{val}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.68rem', textTransform:'uppercase' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:'0.85rem', marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
            <span className="material-symbols-outlined" style={{ position:'absolute', left:'0.65rem', top:'50%', transform:'translateY(-50%)', fontSize:'1rem', color:'#506070' }}>search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, field, ID…"
              style={{ width:'100%', background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#f0f6ff', fontSize:'0.85rem', fontFamily:"'Inter',sans-serif", padding:'0.5rem 0.75rem 0.5rem 2.2rem', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap' }}>
            {STATUS_TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:'0.38rem 0.85rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', background: tab === t ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.04)', color: tab === t ? '#c3f400' : '#506070', borderColor: tab === t ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.15s' }}>
                {t} {t !== 'All' && <span style={{ fontSize:'0.65rem', opacity:0.7 }}>({counts[t]})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(14px)' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            {filtered.length > 0 ? filtered.map(r => <ReservationRow key={r.id} res={r} onAction={handleAction} />) : (
              <div style={{ textAlign:'center', padding:'3rem 0', color:'#506070' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'2.5rem', display:'block', marginBottom:'0.5rem' }}>event_busy</span>
                <div style={{ fontSize:'0.9rem' }}>No reservations found</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationManagement;
