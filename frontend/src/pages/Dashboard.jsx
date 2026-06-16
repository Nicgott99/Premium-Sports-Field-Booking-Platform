import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const QUOTES = [
  { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
  { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
  { text: 'It\'s not the will to win that matters — it\'s the will to prepare to win.', author: 'Bear Bryant' },
  { text: 'The more difficult the victory, the greater the happiness in winning.', author: 'Pelé' },
  { text: 'Do you know what my favorite part of the game is? The opportunity to play.', author: 'Mike Singletary' },
  { text: 'Hard work beats talent when talent doesn\'t work hard.', author: 'Tim Notke' },
];

const dailyQuote = QUOTES[new Date().getDay() % QUOTES.length];

const STATUS_STYLE = {
  confirmed: { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)'   },
  pending:   { color: '#ff5e07', bg: 'rgba(255,94,7,0.1)',    border: 'rgba(255,94,7,0.25)'    },
  cancelled: { color: '#506070', bg: 'rgba(80,96,112,0.1)',   border: 'rgba(80,96,112,0.25)'   },
  completed: { color: '#7dd3fc', bg: 'rgba(125,211,252,0.1)', border: 'rgba(125,211,252,0.25)' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const SPORTS = [['⚽','Football'],['🏏','Cricket'],['🏀','Basketball'],['🎾','Tennis'],['🏸','Badminton'],['🏐','Volleyball']];

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', backdropFilter:'blur(14px)', padding:'1.25rem 1.4rem', display:'flex', alignItems:'center', gap:'1rem' }}>
      <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span className="material-symbols-outlined" style={{ fontSize:'1.2rem', color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.2rem' }}>{label}</div>
        <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.5rem', color, lineHeight:1 }}>{value}</div>
      </div>
    </div>
  );
}
StatCard.propTypes = {
  icon:  PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    const raw   = localStorage.getItem('user');
    if (!token || !raw) { navigate('/login'); return; }
    setUser(JSON.parse(raw));

    try {
      const parsed = JSON.parse(raw);
      const [bRes, sRes] = await Promise.all([
        authFetch('/api/v1/bookings?limit=6'),
        authFetch(`/api/v1/users/${parsed._id ?? parsed.id}/stats`),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();
      if (bRes.ok && bData.success) setBookings(bData.data?.bookings || []);
      if (sRes.ok && sData.success) setStats(sData.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  if (!user) return null;

  const upcomingCount  = stats?.confirmedBookings ?? bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = stats?.completedBookings ?? bookings.filter(b => b.status === 'completed').length;
  const totalSpent     = stats?.totalSpent        ?? bookings.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
  const totalBookings  = stats?.totalBookings     ?? bookings.length;
  const fieldsOwned    = stats?.fieldsOwned       ?? 0;

  const isOwner      = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'fieldOwner';
  const nextBooking  = bookings.find(b => b.status === 'confirmed' && new Date(b.startTime) > new Date());
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const QUICK = [
    { icon:'stadium',       label:'Browse Fields',    sub:'Find and book a venue',       path:'/fields'    },
    { icon:'calendar_month',label:'My Bookings',      sub:'View all reservations',        path:'/bookings'  },
    { icon:'person',        label:'My Profile',       sub:'Update account details',       path:'/profile'   },
    { icon:'support_agent', label:'Contact Support',  sub:'Get help from our team',       path:'/contact'   },
    ...(isOwner ? [{ icon:'add_circle', label:'Add Field', sub:'List a new sports venue', path:'/add-field' }] : []),
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      {/* Orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(251,191,36,0.06),transparent 70%)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', bottom:'-5%', right:'-5%', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,94,7,0.07),transparent 70%)', filter:'blur(80px)' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:'1200px', margin:'0 auto', padding:'2rem 1.5rem 4rem', opacity:mounted?1:0, transform:mounted?'none':'translateY(20px)', transition:'opacity .5s, transform .5s' }}>

        {/* ── Welcome header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'2rem' }}>
          <div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Welcome back</span>
            <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.6rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>
              {user.firstName} {user.lastName}
            </h1>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ textDecoration:'none', padding:'0.6rem 1.25rem', borderRadius:'10px', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', color:'#FBBF24', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1rem' }}>admin_panel_settings</span><span>Admin Panel</span>
              </Link>
            )}
            <Link to="/fields" style={{ textDecoration:'none', padding:'0.6rem 1.4rem', borderRadius:'10px', background:'#FBBF24', color:'#111111', fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'0.88rem' }}>
              Book Now
            </Link>
          </div>
        </div>

        {/* ── Pending alert ── */}
        {pendingCount > 0 && (
          <div style={{ background:'rgba(255,94,7,0.06)', border:'1px solid rgba(255,94,7,0.2)', borderRadius:'14px', backdropFilter:'blur(14px)', padding:'0.9rem 1.25rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'1.1rem', color:'#ff5e07' }}>pending_actions</span>
              <span style={{ color:'#ff5e07', fontWeight:700, fontSize:'0.88rem' }}>
                You have <strong>{pendingCount}</strong> pending booking{pendingCount > 1 ? 's' : ''} awaiting confirmation.
              </span>
            </div>
            <Link to="/bookings" style={{ color:'#ff5e07', fontWeight:700, fontSize:'0.82rem', textDecoration:'none', flexShrink:0 }}>View →</Link>
          </div>
        )}

        {/* ── Stat strip ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          <StatCard icon="calendar_month"  label="Total Bookings" value={totalBookings}                      color="#FBBF24" />
          <StatCard icon="event_available" label="Upcoming"        value={upcomingCount}                      color="#7dd3fc" />
          <StatCard icon="check_circle"    label="Completed"       value={completedCount}                     color="#a78bfa" />
          <StatCard icon="payments"        label="Total Spent"     value={`৳${totalSpent.toLocaleString()}`}  color="#ff5e07" />
          {isOwner && <StatCard icon="stadium" label="Fields Owned" value={fieldsOwned} color="#22d3ee" />}
        </div>

        {/* ── Bento grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:'1.25rem', alignItems:'start' }}>

          {/* Left column */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* Next booking */}
            {nextBooking && (
              <div style={{ background:'rgba(251,191,36,0.04)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'16px', backdropFilter:'blur(14px)', padding:'1.4rem' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#FBBF24', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.6rem' }}>Next Upcoming</div>
                <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.05rem', color:'#f0f6ff', marginBottom:'0.35rem' }}>{nextBooking.field?.name || 'Field'}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', color:'#8ba3be', fontSize:'0.82rem', marginBottom:'1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'0.9rem' }}>schedule</span>
                  {fmtDate(nextBooking.startTime)} · {fmtTime(nextBooking.startTime)}
                </div>
                <Link to="/bookings" style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', padding:'0.6rem', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.25)', borderRadius:'10px', color:'#FBBF24', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.85rem' }}>
                  <span>View Details</span><span className="material-symbols-outlined" style={{ fontSize:'1rem' }}>arrow_forward</span>
                </Link>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', backdropFilter:'blur(14px)', padding:'1.4rem' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.85rem' }}>Quick Actions</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {QUICK.map(q => (
                  <Link key={q.path} to={q.path} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.75rem 0.9rem', borderRadius:'10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(251,191,36,0.06)'; e.currentTarget.style.borderColor='rgba(251,191,36,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'rgba(251,191,36,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'1.05rem', color:'#FBBF24' }}>{q.icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, color:'#f0f6ff', fontSize:'0.88rem' }}>{q.label}</div>
                      <div style={{ color:'#506070', fontSize:'0.74rem' }}>{q.sub}</div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize:'0.9rem', color:'#506070' }}>chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Daily quote */}
            <div style={{ background:'rgba(251,191,36,0.03)', border:'1px solid rgba(251,191,36,0.1)', borderRadius:'16px', backdropFilter:'blur(14px)', padding:'1.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'1.4rem', color:'#FBBF24', display:'block', marginBottom:'0.65rem' }}>format_quote</span>
              <p style={{ color:'#c8d8ea', fontStyle:'italic', fontSize:'0.9rem', fontWeight:600, lineHeight:1.6, margin:'0 0 0.5rem' }}>
                &ldquo;{dailyQuote.text}&rdquo;
              </p>
              <p style={{ fontFamily:"'JetBrains Mono',monospace", color:'#FBBF24', fontSize:'0.72rem', margin:0 }}>— {dailyQuote.author}</p>
            </div>

            {/* Browse by sport */}
            <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', backdropFilter:'blur(14px)', padding:'1.4rem' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.85rem' }}>Browse by Sport</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem' }}>
                {SPORTS.map(([icon, sport]) => (
                  <Link key={sport} to={`/fields?sport=${sport.toLowerCase()}`}
                    style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem', padding:'0.75rem 0.5rem', borderRadius:'10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(251,191,36,0.06)'; e.currentTarget.style.borderColor='rgba(251,191,36,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; }}>
                    <span style={{ fontSize:'1.3rem' }}>{icon}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#8ba3be', fontSize:'0.65rem', textAlign:'center' }}>{sport}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — Recent Bookings */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', backdropFilter:'blur(14px)', padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.2rem' }}>History</div>
                <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.1rem', color:'#f0f6ff', margin:0 }}>Recent Bookings</h2>
              </div>
              <Link to="/bookings" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'0.3rem', color:'#FBBF24', fontWeight:700, fontSize:'0.82rem' }}>
                <span>View All</span><span className="material-symbols-outlined" style={{ fontSize:'1rem' }}>arrow_forward</span>
              </Link>
            </div>

            {loading && (
              <div style={{ textAlign:'center', padding:'3rem 0', color:'#506070' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'2rem', display:'block', marginBottom:'0.5rem', opacity:0.5 }}>hourglass_empty</span>
                <div style={{ fontSize:'0.85rem' }}>Loading bookings…</div>
              </div>
            )}

            {!loading && bookings.length === 0 && (
              <div style={{ textAlign:'center', padding:'4rem 1rem', color:'#506070' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'3rem', display:'block', marginBottom:'0.75rem' }}>event_busy</span>
                <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#8ba3be', marginBottom:'0.5rem' }}>No bookings yet</div>
                <div style={{ fontSize:'0.85rem', marginBottom:'1.5rem' }}>Start by browsing premium fields near you.</div>
                <Link to="/fields" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.65rem 1.4rem', background:'#FBBF24', borderRadius:'10px', color:'#111111', fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'0.88rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'1rem' }}>stadium</span>
                  Browse Fields
                </Link>
              </div>
            )}

            {!loading && bookings.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
                {bookings.map(b => {
                  const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
                  return (
                    <div key={b._id} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.1rem', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px', flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:'160px' }}>
                        <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, color:'#f0f6ff', fontSize:'0.92rem', marginBottom:'0.2rem' }}>
                          {b.field?.name || 'Field'}
                        </div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.72rem' }}>
                          {fmtDate(b.startTime)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
                        <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.border}`, borderRadius:'999px', padding:'0.15rem 0.65rem', fontSize:'0.7rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                          {b.status}
                        </span>
                        <span style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, color:'#FBBF24', fontSize:'0.92rem' }}>
                          ৳{b.pricing?.totalAmount?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
