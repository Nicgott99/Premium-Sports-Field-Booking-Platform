import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_STATS = {
  totalRevenue: 284500,
  totalBookings: 1243,
  activeUsers: 538,
  fieldUtilization: 73,
  revenueByMonth: [
    { month:'Jan', value:18400 },{ month:'Feb', value:21300 },{ month:'Mar', value:19800 },
    { month:'Apr', value:26500 },{ month:'May', value:31200 },{ month:'Jun', value:38700 },
    { month:'Jul', value:29400 },{ month:'Aug', value:34100 },{ month:'Sep', value:22800 },
    { month:'Oct', value:28600 },{ month:'Nov', value:31700 },{ month:'Dec', value:42500 },
  ],
  topSports: [
    { sport:'Football', bookings:512, pct:41 },
    { sport:'Cricket', bookings:287, pct:23 },
    { sport:'Basketball', bookings:213, pct:17 },
    { sport:'Tennis', bookings:137, pct:11 },
    { sport:'Badminton', bookings:94, pct:8 },
  ],
  peakHours: [
    { hour:'6AM', load:12 },{ hour:'8AM', load:45 },{ hour:'10AM', load:67 },
    { hour:'12PM', load:82 },{ hour:'2PM', load:58 },{ hour:'4PM', load:91 },
    { hour:'6PM', load:100 },{ hour:'8PM', load:88 },{ hour:'10PM', load:31 },
  ],
};

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <article style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(14px)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', borderRadius:'50%', background:`radial-gradient(circle,${color}15 0%,transparent 70%)` }} />
      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.85rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize:'1.3rem', color }}>{icon}</span>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
      </div>
      <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'2.2rem', color:'#f0f6ff', lineHeight:1, marginBottom:'0.3rem' }}>{value}</div>
      <div style={{ fontSize:'0.78rem', color:'#506070' }}>{sub}</div>
    </article>
  );
}
KpiCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  sub: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

const maxRevenue = Math.max(...MOCK_STATS.revenueByMonth.map(m => m.value));

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('12m');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/reports/overview', { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error('api');
        const json = await res.json();
        setData(json.data ?? json);
      } catch {
        setData(MOCK_STATS);
      }
    };
    load();
  }, []);

  const d = data ?? MOCK_STATS;

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 1.25rem' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Overview</span>
            <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.4rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Analytics Dashboard</h1>
          </div>
          <div style={{ display:'flex', gap:'0.4rem' }}>
            {['7d','30d','12m'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{ padding:'0.35rem 0.85rem', borderRadius:'999px', border:'1px solid', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.75rem', fontWeight:700, cursor:'pointer', background: range === r ? 'rgba(195,244,0,0.15)' : 'transparent', color: range === r ? '#c3f400' : '#506070', borderColor: range === r ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>{r}</button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          <KpiCard icon="payments" label="Total Revenue" value={`৳${(d.totalRevenue/1000).toFixed(0)}K`} sub="+18.4% vs last period" color="#c3f400" />
          <KpiCard icon="calendar_month" label="Bookings" value={d.totalBookings.toLocaleString()} sub="+12.1% vs last period" color="#ff5e07" />
          <KpiCard icon="group" label="Active Users" value={d.activeUsers.toLocaleString()} sub="+7.9% vs last period" color="#7dd3fc" />
          <KpiCard icon="speed" label="Utilization" value={`${d.fieldUtilization}%`} sub="Avg field occupancy rate" color="#a78bfa" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>
          {/* Revenue chart */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.75rem', backdropFilter:'blur(14px)' }}>
            <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', marginBottom:'1.5rem' }}>Revenue Over Time</h2>
            <div style={{ display:'flex', alignItems:'flex-end', gap:'0.5rem', height:'160px' }}>
              {d.revenueByMonth.map(m => (
                <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.35rem' }}>
                  <div style={{ width:'100%', background:'linear-gradient(180deg,#c3f400,rgba(195,244,0,0.2))', borderRadius:'4px 4px 0 0', height:`${Math.round((m.value/maxRevenue)*100)}%`, minHeight:'4px', transition:'height 0.6s ease' }} />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.6rem', color:'#506070' }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top sports */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.75rem', backdropFilter:'blur(14px)' }}>
            <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', marginBottom:'1.25rem' }}>Top Sports</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
              {d.topSports.map((s, i) => (
                <div key={s.sport}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                    <span style={{ color:'#c8d8ea', fontSize:'0.82rem', fontWeight:600 }}>{s.sport}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#506070' }}>{s.pct}%</span>
                  </div>
                  <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${s.pct}%`, background: i === 0 ? '#c3f400' : i === 1 ? '#ff5e07' : 'rgba(195,244,0,0.4)', borderRadius:'999px', transition:'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak hours heatmap */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.75rem', backdropFilter:'blur(14px)' }}>
          <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', marginBottom:'1.25rem' }}>Peak Booking Hours</h2>
          <div style={{ display:'flex', gap:'0.65rem', alignItems:'flex-end' }}>
            {d.peakHours.map(h => (
              <div key={h.hour} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem' }}>
                <div style={{ width:'100%', height:'80px', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                  <div style={{ width:'80%', background: h.load > 80 ? '#c3f400' : h.load > 50 ? 'rgba(195,244,0,0.5)' : 'rgba(195,244,0,0.2)', borderRadius:'4px 4px 0 0', height:`${h.load}%`, transition:'height 0.6s ease' }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', color:'#506070', whiteSpace:'nowrap' }}>{h.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
