import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  confirmed: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  pending:   { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
  completed: { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [bookings, setBookings]   = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [mounted, setMounted]     = useState(false);

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

  const upcomingCount  = stats?.confirmedBookings  ?? bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = stats?.completedBookings  ?? bookings.filter(b => b.status === 'completed').length;
  const totalSpent     = stats?.totalSpent         ?? bookings.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
  const totalBookings  = stats?.totalBookings      ?? bookings.length;
  const fieldsOwned    = stats?.fieldsOwned        ?? 0;

  const isOwner       = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'fieldOwner';
  const nextBooking   = bookings.find(b => b.status === 'confirmed' && new Date(b.startTime) > new Date());

  const QUICK = [
    { icon: '🏟️', label: 'Browse Fields',  sub: 'Find and book a venue',      path: '/fields',    grad: 'linear-gradient(135deg,#7c3aed,#6d28d9)' },
    { icon: '📅', label: 'My Bookings',    sub: 'View all reservations',       path: '/bookings',  grad: 'linear-gradient(135deg,#0891b2,#0e7490)' },
    { icon: '👤', label: 'My Profile',     sub: 'Update account details',      path: '/profile',   grad: 'linear-gradient(135deg,#059669,#047857)' },
    { icon: '📞', label: 'Contact Support', sub: 'Get help from our team',     path: '/contact',   grad: 'linear-gradient(135deg,#d97706,#b45309)' },
    ...(isOwner ? [{ icon: '➕', label: 'Add Field', sub: 'List a new sports venue', path: '/add-field', grad: 'linear-gradient(135deg,#ec4899,#be185d)' }] : []),
  ];

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem' }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.14),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.12),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '82rem', margin: '0 auto', padding: '2rem 1.5rem 4rem', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: 'opacity .5s, transform .5s' }}>

        {/* ── Welcome header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Welcome back</p>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
              {user.firstName} {user.lastName} <span style={{ fontSize: '1.5rem' }}>👋</span>
            </h1>
          </div>
          {user.role === 'admin' && (
            <Link to="/admin" style={{ textDecoration: 'none', padding: '0.65rem 1.4rem', borderRadius: '10px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(245,158,11,0.35)' }}>
              👑 Admin Panel
            </Link>
          )}
        </div>

        {/* ── Stat tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[
            { icon: '📅', label: 'Total Bookings',  value: totalBookings,   color: '#a78bfa' },
            { icon: '⏰', label: 'Upcoming',         value: upcomingCount,   color: '#6ee7b7' },
            { icon: '✅', label: 'Completed',        value: completedCount,  color: '#93c5fd' },
            { icon: '💰', label: 'Total Spent',      value: `৳${totalSpent.toLocaleString()}`, color: '#fcd34d' },
            ...(isOwner ? [{ icon: '🏟️', label: 'Fields Owned', value: fieldsOwned, color: '#f9a8d4' }] : []),
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '0.35rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Next booking highlight ── */}
        {nextBooking && (
          <div className="card" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.08))', borderColor: 'rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>⏰</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <p style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.2rem' }}>Next Upcoming Booking</p>
              <p style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.05rem', margin: '0 0 0.2rem' }}>{nextBooking.field?.name || 'Field'}</p>
              <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
                {fmtDate(nextBooking.startTime)} · {fmtTime(nextBooking.startTime)}
              </p>
            </div>
            <Link to="/bookings" style={{ textDecoration: 'none', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', borderRadius: '10px', padding: '0.5rem 1.1rem', fontSize: '0.83rem', fontWeight: 700, flexShrink: 0 }}>
              View Details →
            </Link>
          </div>
        )}

        {/* ── Daily motivation ── */}
        <div className="card" style={{ padding: '1.25rem 1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(236,72,153,0.08))', borderColor: 'rgba(124,58,237,0.25)' }}>
          <div style={{ fontSize: '2rem', flexShrink: 0 }}>💬</div>
          <div>
            <p style={{ color: '#e2e8f0', fontStyle: 'italic', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5, margin: '0 0 0.25rem' }}>
              &ldquo;{dailyQuote.text}&rdquo;
            </p>
            <p style={{ color: '#7c3aed', fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>— {dailyQuote.author}</p>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
            {QUICK.map(q => (
              <Link key={q.path} to={q.path} className="quick-action-card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: q.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{q.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem' }}>{q.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{q.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent bookings ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Recent Bookings</h2>
            <Link to="/bookings" style={{ color: '#7c3aed', fontSize: '0.88rem', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
          </div>

          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1rem' }} />
              <p style={{ color: '#64748b' }}>Loading bookings…</p>
            </div>
          )}
          {!loading && bookings.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ color: '#f1f5f9', fontWeight: 800, marginBottom: '0.5rem' }}>No bookings yet</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start by browsing premium fields near you.</p>
              <Link to="/fields" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem' }}>
                🏟️ Browse Fields
              </Link>
            </div>
          )}
          {!loading && bookings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookings.map(b => {
                const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
                return (
                  <div key={b._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1.25rem 1.5rem' }}>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1rem', marginBottom: '0.2rem' }}>
                        {b.field?.name || 'Field'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        {fmtDate(b.startTime)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {b.status}
                      </span>
                      <span style={{ fontWeight: 800, color: '#6ee7b7', fontSize: '0.95rem' }}>
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
  );
};

export default Dashboard;
