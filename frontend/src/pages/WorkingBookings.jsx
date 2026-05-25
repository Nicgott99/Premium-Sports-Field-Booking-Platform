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
  const fieldName = booking.field?.name ?? booking.fieldName ?? 'N/A';
  const sport     = booking.sport ?? 'N/A';
  const price     = booking.pricing?.totalAmount ?? booking.price ?? 'N/A';
  const location  = booking.field?.location?.address ?? booking.location ?? 'N/A';
  const timeSlot  = booking.timeSlot ?? `${booking.startTime ?? ''} – ${booking.endTime ?? ''}`;
  const rows = [
    ['Field',     fieldName],
    ['Sport',     sport],
    ['Date',      booking.date ?? 'N/A'],
    ['Time',      timeSlot],
    ['Location',  location],
    ['Price',     `৳${price}`],
    ['Slots',     booking.duration ? `${booking.duration}h` : 'N/A'],
    ['Status',    (booking.status ?? 'N/A').toUpperCase()],
    ['Booking ID', booking._id ?? booking.id ?? 'N/A'],
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'rgba(15,15,25,0.96)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '2rem', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📋</div>
            <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.2rem', margin: 0 }}>Booking Details</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.83rem', fontWeight: 600 }}>{k}</span>
              <span style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 700, textAlign: 'right', maxWidth: '220px', wordBreak: 'break-all' }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>Close</button>
      </div>
    </div>
  );
}
DetailModal.propTypes = {
  booking: PropTypes.shape({
    _id: PropTypes.string, id: PropTypes.string,
    field: PropTypes.shape({ name: PropTypes.string, location: PropTypes.shape({ address: PropTypes.string }) }),
    fieldName: PropTypes.string, sport: PropTypes.string,
    pricing: PropTypes.shape({ totalAmount: PropTypes.number }), price: PropTypes.number,
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

/* ── WorkingBookings ── */
const WorkingBookings = () => {
  const navigate = useNavigate();
  const [bookings,       setBookings]      = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState('');
  const [filter,         setFilter]        = useState('all');
  const [sortBy,         setSortBy]        = useState('date');
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

  const filteredBookings = bookings.filter(b => {
    if (filter === 'upcoming')  return b.status === 'confirmed' && new Date(b.date) >= new Date();
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date')  return new Date(b.date) - new Date(a.date);
    if (sortBy === 'price') return (b.pricing?.totalAmount ?? b.price ?? 0) - (a.pricing?.totalAmount ?? a.price ?? 0);
    return (a.field?.name ?? a.fieldName ?? '').localeCompare(b.field?.name ?? b.fieldName ?? '');
  });

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

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.75rem', padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
          </div>
          <span style={{ color: '#64748b', fontSize: '0.88rem' }}>
            Showing <strong style={{ color: '#a78bfa' }}>{filteredBookings.length}</strong> bookings
          </span>
        </div>

        {/* Bookings list */}
        {filteredBookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {filteredBookings.map(booking => {
              const bookingId  = booking._id || booking.id;
              const fieldName  = booking.field?.name ?? booking.fieldName ?? 'Unknown Field';
              const sport      = booking.sport ?? 'N/A';
              const price      = booking.pricing?.totalAmount ?? booking.price ?? 0;
              const location   = booking.field?.location?.address ?? booking.location ?? 'N/A';
              const timeSlot   = booking.timeSlot ?? `${booking.startTime ?? ''} – ${booking.endTime ?? ''}`;
              const stStyle    = getStatusStyle(booking.status);

              return (
                <div key={bookingId} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem 1.5rem', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem', margin: 0 }}>{fieldName}</h3>
                        <span style={{ background: stStyle.bg, color: stStyle.color, border: `1px solid ${stStyle.bdr}`, padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {(booking.status ?? 'unknown').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1.5rem' }}>
                        {[['🏅', 'Sport',    sport],
                          ['📅', 'Date',     booking.date ?? 'N/A'],
                          ['🕒', 'Time',     timeSlot],
                          ['📍', 'Location', location]].map(([ico, lbl, val]) => (
                          <p key={lbl} style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                            <span>{ico} </span><strong style={{ color: '#cbd5e1' }}>{lbl}:</strong> {val}
                          </p>
                        ))}
                        <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, gridColumn: '1/-1' }}>
                          <span>💰 </span><strong style={{ color: '#cbd5e1' }}>Price:</strong> <span style={{ fontWeight: 800, color: '#a78bfa' }}>৳{price}</span>
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'center' }}>
                      <button onClick={() => setDetailBooking(booking)}
                        style={{ padding: '0.45rem 0.9rem', background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        View Details
                      </button>
                      {booking.status === 'confirmed' && (
                        <button onClick={() => setCancelConfirm(booking)}
                          style={{ padding: '0.45rem 0.9rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>No Bookings Found</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              {filter === 'all' ? 'You have no bookings yet.' : `No ${filter} bookings found.`}
            </p>
            <button onClick={() => navigate('/fields')} className="btn-primary">Book Your First Field</button>
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
