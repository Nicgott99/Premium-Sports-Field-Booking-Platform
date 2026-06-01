import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/* ── Toast ── */
function ToastBar({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: 'fixed', top: '5.5rem', right: '1.25rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '340px' }}>
      {toasts.map(t => {
        const bg  = t.type === 'error' ? 'rgba(239,68,68,0.12)'   : 'rgba(16,185,129,0.12)';
        const bdr = t.type === 'error' ? 'rgba(239,68,68,0.35)'   : 'rgba(16,185,129,0.35)';
        const clr = t.type === 'error' ? '#f87171'                 : '#6ee7b7';
        return (
          <div key={t.id} style={{ background: bg, border: `1px solid ${bdr}`, borderRadius: '10px', padding: '0.7rem 1rem', color: clr, fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <span>{t.msg}</span>
            <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', color: clr, cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
ToastBar.propTypes = {
  toasts:   PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, msg: PropTypes.string, type: PropTypes.string })).isRequired,
  onRemove: PropTypes.func.isRequired,
};

/* ── StatTile ── */
function StatTile({ icon, value, label, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{icon}</div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.2rem' }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
StatTile.propTypes = { icon: PropTypes.string.isRequired, value: PropTypes.number.isRequired, label: PropTypes.string.isRequired, color: PropTypes.string.isRequired };

/* ── DetailModal ── */
function DetailModal({ booking, onClose }) {
  if (!booking) return null;

  const fieldName  = booking.field?.name ?? booking.fieldName ?? 'N/A';
  const sport      = booking.sport ?? booking.field?.sports?.[0] ?? 'N/A';
  const totalPrice = booking.pricing?.totalAmount ?? booking.price ?? 0;
  const basePrice  = booking.pricing?.basePrice   ?? 0;
  const city       = booking.field?.location?.city    ?? '';
  const address    = booking.field?.location?.address ?? booking.location ?? 'N/A';
  const locText    = [address, city].filter(Boolean).join(', ');
  const startDt    = booking.startTime ? new Date(booking.startTime) : null;
  const endDt      = booking.endTime   ? new Date(booking.endTime)   : null;
  const dateStr    = startDt ? startDt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : (booking.date ?? 'N/A');
  const timeStr    = startDt && endDt
    ? `${startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${endDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    : (booking.timeSlot ?? 'N/A');
  const rating     = booking.field?.rating?.average ?? 0;
  const st         = getStatusStyle(booking.status);

  const durationSuffix = booking.duration > 1 ? 's' : '';
  const durationLabel  = booking.duration ? `${booking.duration} hour${durationSuffix}` : 'N/A';
  const basePriceRow  = basePrice > 0 ? [['💵 Base Price', `৳${basePrice.toLocaleString()}`]] : [];

  const rows = [
    ['📍 Location',   locText],
    ['📅 Date',       dateStr],
    ['⏰ Time',       timeStr],
    ['⏱️ Duration',   durationLabel],
    ...basePriceRow,
    ['💰 Total Paid', `৳${totalPrice.toLocaleString()}`],
    ['🆔 Booking ID', (booking._id ?? booking.id ?? 'N/A').slice(-12)],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'rgba(15,15,25,0.97)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '2rem', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.25rem', margin: '0 0 0.2rem' }}>{fieldName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{sport}</span>
              {rating > 0 && <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 700 }}>⭐ {rating.toFixed(1)}</span>}
              <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.bdr}`, padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{booking.status}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.45rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>{k}</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.87rem', fontWeight: 700, textAlign: 'right', maxWidth: '220px', wordBreak: 'break-word' }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Close</button>
      </div>
    </div>
  );
}
DetailModal.propTypes = {
  booking: PropTypes.shape({
    _id: PropTypes.string, id: PropTypes.string,
    field: PropTypes.shape({
      name: PropTypes.string,
      sports: PropTypes.arrayOf(PropTypes.string),
      rating: PropTypes.shape({ average: PropTypes.number }),
      location: PropTypes.shape({ address: PropTypes.string, city: PropTypes.string }),
    }),
    fieldName: PropTypes.string, sport: PropTypes.string,
    pricing: PropTypes.shape({ totalAmount: PropTypes.number, basePrice: PropTypes.number }),
    price: PropTypes.number,
    location: PropTypes.string, timeSlot: PropTypes.string, startTime: PropTypes.string, endTime: PropTypes.string,
    date: PropTypes.string, duration: PropTypes.number, status: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};
DetailModal.defaultProps = { booking: null };

/* ── getStatusStyle ── */
function getStatusStyle(status) {
  if (status === 'confirmed')  return { bg: 'rgba(16,185,129,0.2)', color: '#6ee7b7', bdr: 'rgba(16,185,129,0.4)' };
  if (status === 'completed')  return { bg: 'rgba(59,130,246,0.2)',  color: '#93c5fd', bdr: 'rgba(59,130,246,0.4)' };
  if (status === 'cancelled')  return { bg: 'rgba(239,68,68,0.2)',   color: '#f87171', bdr: 'rgba(239,68,68,0.4)' };
  return { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8', bdr: 'rgba(100,116,139,0.4)' };
}

/* ── GroupSection ── */
function GroupSection({ title, icon, count, accent, children }) {
  if (count === 0) return null;
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: `1px solid ${accent}33` }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
        <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{title}</h2>
        <span style={{ background: `${accent}22`, border: `1px solid ${accent}44`, color: accent, borderRadius: '9999px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {children}
      </div>
    </div>
  );
}
GroupSection.propTypes = {
  title:    PropTypes.string.isRequired,
  icon:     PropTypes.string.isRequired,
  count:    PropTypes.number.isRequired,
  accent:   PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

/* ── renderBookingCard ── */
function renderBookingCard(booking, setDetailBooking, setCancelConfirm, navigate) {
  const bookingId  = booking._id || booking.id;
  const fieldName  = booking.field?.name ?? booking.fieldName ?? 'Unknown Field';
  const sport      = booking.sport ?? (Array.isArray(booking.field?.sports) ? booking.field.sports[0] : '') ?? '';
  const location   = booking.field?.location?.city ?? booking.field?.location?.address ?? booking.location ?? '';
  const price      = booking.pricing?.totalAmount ?? booking.price ?? 0;
  const startDt    = booking.startTime ? new Date(booking.startTime) : null;
  const endDt      = booking.endTime   ? new Date(booking.endTime)   : null;
  const dateStr    = startDt ? startDt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : (booking.date ?? '—');
  const timeStr    = startDt && endDt
    ? `${startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${endDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    : (booking.timeSlot ?? '—');
  const st         = getStatusStyle(booking.status);
  const canCancel  = ['confirmed', 'pending'].includes(booking.status) && (!startDt || startDt > new Date());

  return (
    <div key={bookingId} className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        <div>
          <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{fieldName}</div>
          {sport && <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>{sport}</div>}
        </div>
        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.bdr}`, borderRadius: '9999px', padding: '0.25rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
          {booking.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.5rem 1rem', marginBottom: '1rem' }}>
        {[
          { icon: '📅', label: dateStr },
          { icon: '⏰', label: timeStr },
          ...(location ? [{ icon: '📍', label: location }] : []),
          { icon: '💰', label: `৳${Number(price).toLocaleString()}` },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.83rem' }}>
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button onClick={() => setDetailBooking(booking)}
          style={{ padding: '0.45rem 1rem', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
          View Details
        </button>
        {canCancel && (
          <button onClick={() => setCancelConfirm(booking)}
            style={{ padding: '0.45rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
            Cancel
          </button>
        )}
        {['completed', 'cancelled'].includes(booking.status) && (booking.field?._id ?? booking.field) && (
          <button onClick={() => navigate(`/booking?field=${booking.field?._id ?? booking.field}`)}
            style={{ padding: '0.45rem 1rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
            🔄 Book Again
          </button>
        )}
      </div>
    </div>
  );
}

/* ── WorkingBookings ── */
const WorkingBookings = () => {
  const navigate = useNavigate();
  const [bookings,       setBookings]      = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState('');
  const [filter,         setFilter]        = useState('all');
  const [sortBy,         setSortBy]        = useState('date');
  const [viewMode,       setViewMode]      = useState('grouped');
  const [toasts,         setToasts]        = useState([]);
  const [detailBooking,  setDetailBooking] = useState(null);
  const [cancelConfirm,  setCancelConfirm] = useState(null);
  const [cancelling,     setCancelling]    = useState(false);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const authFetch = useCallback((url, opts = {}) => {
    const token = localStorage.getItem('token');
    return fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/v1/bookings');
      if (res.status === 401) { navigate('/login'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load bookings');
      setBookings(data.data?.bookings ?? data.data ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [authFetch, navigate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const now = new Date();

  const filteredBookings = bookings.filter(b => {
    if (filter === 'upcoming')  return ['confirmed','pending'].includes(b.status) && new Date(b.startTime) >= now;
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date')  return new Date(b.startTime || b.date) - new Date(a.startTime || a.date);
    if (sortBy === 'price') return (b.pricing?.totalAmount ?? b.price ?? 0) - (a.pricing?.totalAmount ?? a.price ?? 0);
    return (a.field?.name ?? a.fieldName ?? '').localeCompare(b.field?.name ?? b.fieldName ?? '');
  });

  const upcomingBookings = bookings.filter(b => ['confirmed','pending'].includes(b.status) && new Date(b.startTime) >= now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const pastBookings = bookings.filter(b => !['confirmed','pending'].includes(b.status) || new Date(b.startTime) < now)
    .sort((a, b) => new Date(b.startTime || b.date) - new Date(a.startTime || a.date));

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelConfirm) return;
    const bookingId = cancelConfirm._id || cancelConfirm.id;
    setCancelling(true);
    try {
      const res  = await authFetch(`/api/v1/bookings/${bookingId}`, { method: 'DELETE', body: JSON.stringify({ reason: 'Cancelled by user' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel booking');
      setBookings(prev => prev.map(b => (b._id || b.id) === bookingId ? { ...b, status: 'cancelled' } : b));
      toast('Booking cancelled successfully');
    } catch (err) {
      toast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
      setCancelConfirm(null);
    }
  }, [cancelConfirm, authFetch, toast]);

  const totalCount    = bookings.length;
  const upcomingCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' }}>Loading Your Bookings…</h2>
          <div className="spinner" style={{ width: '44px', height: '44px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f87171', marginBottom: '0.75rem' }}>Failed to Load Bookings</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchBookings} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  const selBase = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', borderRadius: '10px', padding: '0.5rem 0.85rem', fontSize: '0.88rem', cursor: 'pointer', appearance: 'none' };

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <ToastBar toasts={toasts} onRemove={removeToast} />
      <DetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />

      {/* Cancel confirm overlay */}
      {cancelConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'rgba(15,15,25,0.96)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '18px', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>❌</div>
            <h3 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.15rem', marginBottom: '0.5rem' }}>Cancel Booking?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Cancel <strong style={{ color: '#e2e8f0' }}>{cancelConfirm.field?.name ?? cancelConfirm.fieldName}</strong> on {cancelConfirm.date}? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setCancelConfirm(null)} disabled={cancelling}
                style={{ flex: 1, padding: '0.7rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                Keep Booking
              </button>
              <button onClick={handleCancelConfirm} disabled={cancelling}
                style={{ flex: 1, padding: '0.7rem', background: 'rgba(239,68,68,0.85)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>📅</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.4rem' }}>My Bookings</h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Manage your sports field reservations</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatTile icon="📊" value={totalCount}    label="Total"     color="linear-gradient(135deg,#60a5fa,#22d3ee)" />
          <StatTile icon="⏰" value={upcomingCount}  label="Upcoming"  color="linear-gradient(135deg,#34d399,#10b981)" />
          <StatTile icon="✅" value={completedCount} label="Completed" color="linear-gradient(135deg,#a78bfa,#8b5cf6)" />
          <StatTile icon="❌" value={cancelledCount} label="Cancelled" color="linear-gradient(135deg,#f87171,#ec4899)" />
        </div>

        {/* Filters + view toggle */}
        <div className="card" style={{ marginBottom: '1.75rem', padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {viewMode === 'list' && (
              <>
                <div>
                  <label htmlFor="filter-status" className="field-label" style={{ marginBottom: '0.4rem' }}>Status</label>
                  <select id="filter-status" value={filter} onChange={e => setFilter(e.target.value)} style={selBase}>
                    <option value="all">All Bookings</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sort-by" className="field-label" style={{ marginBottom: '0.4rem' }}>Sort By</label>
                  <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)} style={selBase}>
                    <option value="date">Date</option>
                    <option value="price">Price</option>
                    <option value="field">Field Name</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>View:</span>
            <button onClick={() => setViewMode('grouped')}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, background: viewMode === 'grouped' ? '#7c3aed' : 'rgba(255,255,255,0.07)', color: viewMode === 'grouped' ? '#fff' : '#94a3b8' }}>
              Grouped
            </button>
            <button onClick={() => setViewMode('list')}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, background: viewMode === 'list' ? '#7c3aed' : 'rgba(255,255,255,0.07)', color: viewMode === 'list' ? '#fff' : '#94a3b8' }}>
              List
            </button>
          </div>
        </div>

        {/* Bookings: grouped or list */}
        {viewMode === 'grouped' ? (
          <div style={{ marginBottom: '2rem' }}>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>No Bookings Yet</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start by booking a premium sports field.</p>
                <button onClick={() => navigate('/fields')} className="btn-primary">Book Your First Field</button>
              </div>
            ) : (
              <>
                <GroupSection title="Upcoming Bookings" icon="⏰" count={upcomingBookings.length} accent="#6ee7b7">
                  {upcomingBookings.map(booking => renderBookingCard(booking, setDetailBooking, setCancelConfirm, navigate))}
                </GroupSection>
                <GroupSection title="Past Bookings" icon="🗂️" count={pastBookings.length} accent="#a78bfa">
                  {pastBookings.map(booking => renderBookingCard(booking, setDetailBooking, setCancelConfirm, navigate))}
                </GroupSection>
                {upcomingBookings.length === 0 && pastBookings.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#64748b' }}>No bookings to display.</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '2rem' }}>
            {filteredBookings.length > 0
              ? filteredBookings.map(booking => renderBookingCard(booking, setDetailBooking, setCancelConfirm, navigate))
              : (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>No Bookings Found</h3>
                  <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    {filter === 'all' ? 'You have no bookings yet.' : `No ${filter} bookings found.`}
                  </p>
                  <button onClick={() => navigate('/fields')} className="btn-primary">Book Your First Field</button>
                </div>
              )
            }
          </div>
        )}

        {/* Quick Actions */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/fields')}
              style={{ flex: 1, minWidth: '140px', padding: '0.75rem 1rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              🏟️ Book New Field
            </button>
            <button onClick={fetchBookings}
              style={{ flex: 1, minWidth: '140px', padding: '0.75rem 1rem', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingBookings;
