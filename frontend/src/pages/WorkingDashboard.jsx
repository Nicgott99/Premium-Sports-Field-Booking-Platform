import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_CLR = {
  confirmed: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  pending:   { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
  completed: { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
};

const QUICK = [
  { icon: '🏟️', label: 'Browse Fields',  sub: 'Find a field',        path: '/fields' },
  { icon: '📅', label: 'My Bookings',    sub: 'Manage reservations',  path: '/bookings' },
  { icon: '👤', label: 'Profile',        sub: 'Edit your account',    path: '/profile' },
  { icon: '📞', label: 'Support',        sub: 'Get help',             path: '/contact' },
];

const WorkingDashboard = () => {
  const navigate = useNavigate();
  const [user,     setUser]     = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    const raw   = localStorage.getItem('user');
    if (!token) { navigate('/login'); return; }

    try {
      const parsed = JSON.parse(raw || '{}');
      const [bRes, sRes] = await Promise.all([
        authFetch('/api/v1/bookings?limit=5'),
        authFetch(`/api/v1/users/${parsed._id ?? parsed.id ?? 'me'}/stats`),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();
      if (bRes.status === 401) { navigate('/login'); return; }
      if (bRes.ok && bData.success) setBookings(bData.data?.bookings || []);
      if (sRes.ok && sData.success) setStats(sData.data);
      setUser(parsed);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' }}>Loading Dashboard…</h2>
          <div className="spinner" style={{ width: '44px', height: '44px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const displayName  = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User';
  const totalBooks   = stats?.totalBookings   ?? bookings.length;
  const upcoming     = stats?.confirmedBookings ?? bookings.filter(b => b.status === 'confirmed').length;
  const totalSpent   = stats?.totalSpent      ?? 0;
  const completedBks = stats?.completedBookings ?? 0;

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem', opacity: mounted ? 1 : 0, transition: 'opacity .5s' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Dashboard</p>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
              Welcome back, <span style={{ background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{displayName}</span> 👋
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link to="/fields" className="btn-primary" style={{ textDecoration: 'none', padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>🏟️ Browse Fields</Link>
            <button onClick={logout} style={{ padding: '0.6rem 1.25rem', borderRadius: '11px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[
            { icon: '📅', label: 'Total Bookings',  value: totalBooks,    color: '#a78bfa' },
            { icon: '⏰', label: 'Upcoming',         value: upcoming,      color: '#6ee7b7' },
            { icon: '✅', label: 'Completed',        value: completedBks,  color: '#93c5fd' },
            { icon: '💰', label: 'Total Spent',      value: `৳${totalSpent.toLocaleString()}`, color: '#fcd34d' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Recent bookings */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', margin: 0 }}>📅 Recent Bookings</h2>
              <Link to="/bookings" style={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
            </div>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>No bookings yet</p>
                <Link to="/fields" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.55rem 1.1rem' }}>Book a Field</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookings.map(b => {
                  const st = STATUS_CLR[b.status] ?? STATUS_CLR.pending;
                  return (
                    <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                      <div style={{ flex: 1, minWidth: '140px' }}>
                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{b.field?.name || 'Field'}</div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{fmtDate(b.startTime)} · {fmtTime(b.startTime)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{b.status}</span>
                        <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.88rem' }}>৳{(b.pricing?.totalAmount ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h2 style={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Quick Actions</h2>
            {QUICK.map(q => (
              <Link key={q.path} to={q.path} style={{ textDecoration: 'none', display: 'block', transition: 'transform .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                <div className="card" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{q.icon}</span>
                  <div>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.88rem' }}>{q.label}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{q.sub}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingDashboard;
