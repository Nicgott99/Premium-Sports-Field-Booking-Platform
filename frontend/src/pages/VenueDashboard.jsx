import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_VENUE = {
  name: 'Bashundhara Sports Complex',
  rating: 4.8,
  totalReviews: 312,
  location: 'Bashundhara, Dhaka',
  phone: '+880 1XXXXXXXXX',
  openHours: '6:00 AM – 11:00 PM',
  todayBookings: 18,
  monthRevenue: 142800,
  utilizationRate: 78,
  activeFields: 8,
};

const MOCK_FIELDS = [
  { id:1, name:'Field A — Football', sport:'Football', icon:'⚽', status:'occupied', currentBooking:'Team Alpha vs Beta', until:'7:00 PM', nextFree:'7:00 PM', capacity:22, pricePerHour:1800 },
  { id:2, name:'Field B — Football', sport:'Football', icon:'⚽', status:'available', currentBooking:null, until:null, nextFree:'Now', capacity:22, pricePerHour:1800 },
  { id:3, name:'Court 1 — Basketball', sport:'Basketball', icon:'🏀', status:'maintenance', currentBooking:'Floor resurfacing', until:'Tomorrow', nextFree:'Tomorrow 6AM', capacity:10, pricePerHour:1200 },
  { id:4, name:'Court 2 — Tennis', sport:'Tennis', icon:'🎾', status:'occupied', currentBooking:'Coach Nadia — Training', until:'6:30 PM', nextFree:'6:30 PM', capacity:4, pricePerHour:950 },
  { id:5, name:'Court 3 — Tennis', sport:'Tennis', icon:'🎾', status:'available', currentBooking:null, until:null, nextFree:'Now', capacity:4, pricePerHour:950 },
  { id:6, name:'Lane 1-6 — Swimming', sport:'Swimming', icon:'🏊', status:'occupied', currentBooking:'Ladies Session', until:'8:00 PM', nextFree:'8:00 PM', capacity:30, pricePerHour:2200 },
  { id:7, name:'Hall A — Badminton', sport:'Badminton', icon:'🏸', status:'available', currentBooking:null, until:null, nextFree:'Now', capacity:8, pricePerHour:600 },
  { id:8, name:'Hall B — Multi-Sport', sport:'Multi', icon:'🏋️', status:'occupied', currentBooking:'Fitness Class', until:'9:00 PM', nextFree:'9:00 PM', capacity:20, pricePerHour:800 },
];

const MOCK_UPCOMING = [
  { id:1, field:'Field A — Football', user:'Team Falcon', time:'7:00 PM – 9:00 PM', date:'Today', amount:3600, confirmed:true },
  { id:2, field:'Court 2 — Tennis', user:'Jakir Hossain', time:'6:30 PM – 7:30 PM', date:'Today', amount:950, confirmed:true },
  { id:3, field:'Field B — Football', user:'School Champions', time:'8:00 AM – 10:00 AM', date:'Tomorrow', amount:3600, confirmed:false },
  { id:4, field:'Hall A — Badminton', user:'Corporate League', time:'6:00 PM – 8:00 PM', date:'Tomorrow', amount:1200, confirmed:true },
];

const STATUS_STYLE = {
  available:   { color:'#c3f400', bg:'rgba(195,244,0,0.1)',  border:'rgba(195,244,0,0.25)',  label:'Available' },
  occupied:    { color:'#ff5e07', bg:'rgba(255,94,7,0.1)',   border:'rgba(255,94,7,0.25)',   label:'Occupied'  },
  maintenance: { color:'#506070', bg:'rgba(80,96,112,0.1)', border:'rgba(80,96,112,0.25)',  label:'Maintenance' },
};

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.35rem 1.5rem', backdropFilter:'blur(14px)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>{label}</div>
          <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.9rem', color: color ?? '#f0f6ff', letterSpacing:'-0.02em', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.4rem' }}>{sub}</div>}
        </div>
        <div style={{ width:'40px', height:'40px', borderRadius:'12px', background: `${color ?? '#506070'}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'1.2rem', color: color ?? '#506070' }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
KpiCard.propTypes = { icon:PropTypes.string.isRequired, label:PropTypes.string.isRequired, value:PropTypes.oneOfType([PropTypes.string,PropTypes.number]).isRequired, sub:PropTypes.string, color:PropTypes.string };

function FieldRow({ field }) {
  const ss = STATUS_STYLE[field.status];
  return (
    <div style={{ display:'flex', gap:'1rem', alignItems:'center', padding:'0.9rem 1rem', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:'12px' }}>
      <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{field.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:'#c8d8ea', fontWeight:600, fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{field.name}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.1rem' }}>
          {field.currentBooking ?? `Next free: ${field.nextFree}`}
          {field.until ? ` until ${field.until}` : ''}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <span style={{ background:ss.bg, border:`1px solid ${ss.border}`, color:ss.color, padding:'0.15rem 0.65rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:800 }}>{ss.label}</span>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.68rem', marginTop:'0.2rem' }}>৳{field.pricePerHour}/hr</div>
      </div>
    </div>
  );
}
FieldRow.propTypes = {
  field: PropTypes.shape({ id:PropTypes.number, name:PropTypes.string, sport:PropTypes.string, icon:PropTypes.string, status:PropTypes.string, currentBooking:PropTypes.string, until:PropTypes.string, nextFree:PropTypes.string, capacity:PropTypes.number, pricePerHour:PropTypes.number }).isRequired,
};

const VenueDashboard = () => {
  const [venue, setVenue] = useState(null);
  const [fields, setFields] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [tab, setTab] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/venue/dashboard', { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setVenue(data.venue ?? MOCK_VENUE);
        setFields(data.fields ?? MOCK_FIELDS);
        setUpcoming(data.upcoming ?? MOCK_UPCOMING);
      } catch {
        setVenue(MOCK_VENUE);
        setFields(MOCK_FIELDS);
        setUpcoming(MOCK_UPCOMING);
      }
    };
    load();
  }, []);

  const v = venue ?? MOCK_VENUE;
  const TABS = ['All', 'Available', 'Occupied', 'Maintenance'];
  const displayedFields = tab === 'All' ? fields : fields.filter(f => f.status === tab.toLowerCase());

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ marginBottom:'2rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Operations Center</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>{v.name}</h1>
          <div style={{ display:'flex', gap:'1rem', alignItems:'center', marginTop:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ color:'#c3f400', fontWeight:700, fontSize:'0.88rem' }}>★ {v.rating}</span>
            <span style={{ color:'#506070', fontSize:'0.82rem' }}>({v.totalReviews} reviews)</span>
            <span style={{ color:'#506070', fontSize:'0.82rem' }}>· {v.location}</span>
            <span style={{ color:'#506070', fontSize:'0.82rem' }}>· {v.openHours}</span>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem', marginBottom:'1.75rem' }}>
          <KpiCard icon="today" label="Today's Bookings" value={v.todayBookings} sub="Active reservations" color="#c3f400" />
          <KpiCard icon="payments" label="Monthly Revenue" value={`৳${v.monthRevenue.toLocaleString()}`} sub="June 2026" color="#ff5e07" />
          <KpiCard icon="donut_large" label="Utilization" value={`${v.utilizationRate}%`} sub="Average across fields" color="#7dd3fc" />
          <KpiCard icon="sports" label="Active Fields" value={v.activeFields} sub="Total venues managed" color="#a78bfa" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.5rem', alignItems:'start' }}>

          {/* Fields status */}
          <div>
            <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(14px)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.1rem', flexWrap:'wrap', gap:'0.5rem' }}>
                <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1rem', color:'#f0f6ff', margin:0 }}>Field Status</h2>
                <div style={{ display:'flex', gap:'0.35rem' }}>
                  {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      style={{ padding:'0.25rem 0.7rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.72rem', cursor:'pointer', background: tab === t ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.03)', color: tab === t ? '#c3f400' : '#506070', borderColor: tab === t ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.07)', transition:'all 0.15s' }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.55rem' }}>
                {displayedFields.map(f => <FieldRow key={f.id} field={f} />)}
              </div>
            </div>
          </div>

          {/* Upcoming bookings */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(14px)' }}>
            <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1rem', color:'#f0f6ff', marginBottom:'1.1rem' }}>Upcoming Bookings</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {upcoming.map(b => (
                <div key={b.id} style={{ padding:'0.9rem', background:'rgba(255,255,255,0.02)', border:`1px solid ${b.confirmed ? 'rgba(195,244,0,0.1)' : 'rgba(255,94,7,0.1)'}`, borderRadius:'12px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.4rem' }}>
                    <div style={{ color:'#c8d8ea', fontWeight:700, fontSize:'0.85rem' }}>{b.user}</div>
                    <span style={{ padding:'0.1rem 0.5rem', borderRadius:'999px', background: b.confirmed ? 'rgba(195,244,0,0.08)' : 'rgba(255,94,7,0.08)', color: b.confirmed ? '#c3f400' : '#ff5e07', fontSize:'0.65rem', fontWeight:800, border: `1px solid ${b.confirmed ? 'rgba(195,244,0,0.2)' : 'rgba(255,94,7,0.2)'}` }}>{b.confirmed ? 'Confirmed' : 'Pending'}</span>
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginBottom:'0.2rem' }}>{b.field}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#8ba3be', fontSize:'0.78rem' }}>{b.date} · {b.time}</span>
                    <span style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, color:'#c3f400', fontSize:'0.88rem' }}>৳{b.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDashboard;
