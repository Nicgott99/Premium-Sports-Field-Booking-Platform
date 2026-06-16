import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_FIELDS = [
  { _id: 'f1', name: 'Dhaka Sports Arena',    sport: 'Football',   pricePerHour: 1200, status: 'active',      bookingsToday: 4, revenue30d: 48000, rating: 4.8, image: '🏟️' },
  { _id: 'f2', name: 'Gulshan Cricket Hub',   sport: 'Cricket',    pricePerHour: 900,  status: 'active',      bookingsToday: 2, revenue30d: 27000, rating: 4.6, image: '🏏' },
  { _id: 'f3', name: 'Dhanmondi Court',       sport: 'Basketball', pricePerHour: 700,  status: 'maintenance', bookingsToday: 0, revenue30d: 14000, rating: 4.5, image: '🏀' },
];

const MOCK_BOOKINGS = [
  { _id: 'b1', fieldName: 'Dhaka Sports Arena', user: 'Arman H.', date: '2026-06-16', startTime: '18:00', duration: 2, amount: 2400, status: 'confirmed' },
  { _id: 'b2', fieldName: 'Gulshan Cricket Hub', user: 'Nadia R.', date: '2026-06-16', startTime: '09:00', duration: 3, amount: 2700, status: 'confirmed' },
  { _id: 'b3', fieldName: 'Dhaka Sports Arena', user: 'Karim U.', date: '2026-06-17', startTime: '16:00', duration: 1, amount: 1200, status: 'pending'   },
  { _id: 'b4', fieldName: 'Dhaka Sports Arena', user: 'Sultana B.', date: '2026-06-17', startTime: '20:00', duration: 2, amount: 2400, status: 'confirmed' },
];

const STATUS_STYLE = {
  active:      { color: '#c3f400', bg: 'rgba(195,244,0,0.1)',  border: 'rgba(195,244,0,0.25)'  },
  maintenance: { color: '#ff5e07', bg: 'rgba(255,94,7,0.1)',   border: 'rgba(255,94,7,0.25)'   },
  inactive:    { color: '#506070', bg: 'rgba(80,96,112,0.1)',  border: 'rgba(80,96,112,0.25)'  },
  confirmed:   { color: '#c3f400', bg: 'rgba(195,244,0,0.1)',  border: 'rgba(195,244,0,0.25)'  },
  pending:     { color: '#ff5e07', bg: 'rgba(255,94,7,0.1)',   border: 'rgba(255,94,7,0.25)'   },
};

const glass = { background: 'rgba(13,28,45,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.07)' };

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ ...glass, borderRadius: 16, padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color }}>{icon}</span>
        <span style={{ color: '#506070', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.7rem', fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
      {sub && <div style={{ color: '#506070', fontSize: '0.75rem', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}
StatCard.propTypes = {
  icon: PropTypes.string.isRequired, label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string, color: PropTypes.string.isRequired,
};

function FieldRow({ field }) {
  const st = STATUS_STYLE[field.status] ?? STATUS_STYLE.inactive;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginBottom: '0.6rem' }}>
      <span style={{ fontSize: '2rem', flexShrink: 0 }}>{field.image}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.15rem' }}>{field.name}</div>
        <div style={{ color: '#506070', fontSize: '0.75rem' }}>{field.sport} · ৳{field.pricePerHour}/hr · ⭐{field.rating}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color, padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>{field.status}</span>
        <div style={{ color: '#c3f400', fontWeight: 900, fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>৳{field.revenue30d.toLocaleString()}<span style={{ color: '#506070', fontWeight: 400, fontSize: '0.68rem' }}> /30d</span></div>
      </div>
    </div>
  );
}
FieldRow.propTypes = {
  field: PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string, image: PropTypes.string, sport: PropTypes.string, pricePerHour: PropTypes.number, status: PropTypes.string, rating: PropTypes.number, revenue30d: PropTypes.number }).isRequired,
};

function BookingRow({ booking }) {
  const st = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#273647', flexShrink: 0 }}>calendar_today</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem' }}>{booking.user}</div>
        <div style={{ color: '#506070', fontSize: '0.72rem' }}>{booking.fieldName} · {booking.date} {booking.startTime} · {booking.duration}h</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: '#c3f400', fontWeight: 800, fontSize: '0.85rem', fontFamily: "'JetBrains Mono',monospace" }}>৳{booking.amount.toLocaleString()}</div>
        <span style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color, padding: '0.12rem 0.45rem', borderRadius: 8, fontSize: '0.66rem', fontWeight: 700 }}>{booking.status}</span>
      </div>
    </div>
  );
}
BookingRow.propTypes = {
  booking: PropTypes.shape({ _id: PropTypes.string, user: PropTypes.string, fieldName: PropTypes.string, date: PropTypes.string, startTime: PropTypes.string, duration: PropTypes.number, amount: PropTypes.number, status: PropTypes.string }).isRequired,
};

const FieldOwnerPortal = () => {
  const navigate  = useNavigate();
  const [fields,   setFields]   = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [owner,    setOwner]    = useState(null);

  const load = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const raw = localStorage.getItem('user');
    if (raw) setOwner(JSON.parse(raw));

    setLoading(true);
    Promise.all([
      authFetch('/api/v1/fields/my-fields').then(r => r.json()).catch(() => null),
      authFetch('/api/v1/bookings?role=owner&limit=10').then(r => r.json()).catch(() => null),
    ]).then(([fd, bd]) => {
      setFields(fd?.success ? fd.data : MOCK_FIELDS);
      setBookings(bd?.success ? bd.data : MOCK_BOOKINGS);
    }).finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue   = fields.reduce((s, f) => s + (f.revenue30d ?? 0), 0);
  const activeFields   = fields.filter(f => f.status === 'active').length;
  const todayBookings  = fields.reduce((s, f) => s + (f.bookingsToday ?? 0), 0);
  const avgRating      = fields.length ? (fields.reduce((s, f) => s + (f.rating ?? 0), 0) / fields.length).toFixed(1) : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#051424', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(195,244,0,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-8%', right: '-5%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,94,7,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.2)', borderRadius: 20, padding: '0.3rem 0.9rem', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#c3f400' }}>business</span>
              <span style={{ fontSize: '0.75rem', color: '#c3f400', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Owner Portal</span>
            </div>
            <h1 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 900, fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
              {owner ? `${owner.name?.split(' ')[0]}'s Fields` : 'My Fields'}
            </h1>
          </div>
          <Link to="/fields/add" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#c3f400', border: 'none', borderRadius: 10, padding: '0.7rem 1.25rem', color: '#051424', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add_circle</span>
            <span>Add Field</span>
          </Link>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard icon="payments"       label="Revenue (30d)"   value={`৳${totalRevenue.toLocaleString()}`} sub="All fields combined" color="#c3f400" />
          <StatCard icon="stadium"        label="Active Fields"   value={activeFields}                         sub={`of ${fields.length} total`}           color="#ff5e07" />
          <StatCard icon="calendar_month" label="Bookings Today"  value={todayBookings}                        sub="Across all fields"                     color="#7dd3fc" />
          <StatCard icon="star"           label="Avg Rating"      value={avgRating}                            sub="Customer satisfaction"                 color="#f59e0b" />
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Fields list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#e2e8f0', margin: 0 }}>Your Fields</h2>
              <Link to="/venue-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#506070', fontSize: '0.8rem', textDecoration: 'none' }}>
                <span>Full Dashboard</span>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_forward</span>
              </Link>
            </div>
            {loading ? (
              <div style={{ ...glass, borderRadius: 16, padding: '3rem', textAlign: 'center', color: '#506070' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.4, display: 'block', marginBottom: '0.5rem' }}>hourglass_empty</span>
                <span>Loading fields…</span>
              </div>
            ) : fields.length === 0 ? (
              <div style={{ ...glass, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#273647', display: 'block', marginBottom: '1rem' }}>stadium</span>
                <p style={{ color: '#506070', marginBottom: '1.25rem' }}>No fields yet. Add your first one!</p>
                <Link to="/fields/add" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#c3f400', padding: '0.7rem 1.25rem', borderRadius: 10, color: '#051424', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add_circle</span>
                  <span>Add Field</span>
                </Link>
              </div>
            ) : (
              <div style={{ ...glass, borderRadius: 16, padding: '1rem' }}>
                {fields.map(f => <FieldRow key={f._id} field={f} />)}
              </div>
            )}
          </div>

          {/* Recent bookings sidebar */}
          <div>
            <h2 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#e2e8f0', margin: '0 0 1rem' }}>Recent Bookings</h2>
            <div style={{ ...glass, borderRadius: 16, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#506070', fontSize: '0.85rem' }}>Loading…</div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#506070', fontSize: '0.85rem' }}>No bookings yet</div>
              ) : (
                bookings.map(b => <BookingRow key={b._id} booking={b} />)
              )}
              <div style={{ padding: '0.75rem 1rem' }}>
                <Link to="/reservations" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#506070', fontSize: '0.8rem', textDecoration: 'none' }}>
                  <span>View all reservations</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Quick actions */}
            <h2 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#e2e8f0', margin: '1.5rem 0 0.75rem' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { to: '/venue-dashboard', icon: 'bar_chart',      label: 'Analytics'           },
                { to: '/reservations',    icon: 'event_available', label: 'Manage Reservations' },
                { to: '/fields/add',      icon: 'add_circle',      label: 'Add New Field'       },
                { to: '/settings',        icon: 'tune',            label: 'Field Settings'      },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', ...glass, borderRadius: 10, textDecoration: 'none', color: '#e2e8f0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#506070' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.87rem', fontWeight: 600 }}>{item.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#273647', marginLeft: 'auto' }}>chevron_right</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldOwnerPortal;
