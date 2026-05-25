import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const STATUS_COLOR = {
  confirmed: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  pending:   { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
  completed: { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

/* Generate 2-hour time slots 06:00–22:00 */
const ALL_SLOTS = (() => {
  const slots = [];
  for (let h = 6; h < 22; h += 2) {
    const start = `${String(h).padStart(2,'0')}:00`;
    const end   = `${String(h + 2).padStart(2,'0')}:00`;
    slots.push({ startTime: start, endTime: end, key: `${start}-${end}` });
  }
  return slots;
})();

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/* ── Toast ── */
const ToastBar = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    {toasts.map(t => (
      <div key={t.id} style={{ background: t.type === 'error' ? 'rgba(239,68,68,0.92)' : 'rgba(16,185,129,0.92)', backdropFilter: 'blur(12px)', color: '#fff', fontWeight: 700, padding: '0.8rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', boxShadow: '0 4px 20px rgba(0,0,0,0.35)', minWidth: '240px' }}>
        {t.type === 'error' ? '❌' : '✅'} {t.msg}
      </div>
    ))}
  </div>
);
ToastBar.propTypes = { toasts: PropTypes.array.isRequired };

/* ── Step indicator ── */
const Step = ({ n, label, active, done }) => {
  let bg = 'rgba(255,255,255,0.06)';
  if (active) bg = '#7c3aed';
  if (done)   bg = '#10b981';
  const col = (done || active) ? '#fff' : '#475569';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: col, flexShrink: 0, transition: 'background .3s' }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: active ? '#f1f5f9' : '#475569' }}>{label}</span>
    </div>
  );
};
Step.propTypes = { n: PropTypes.number.isRequired, label: PropTypes.string.isRequired, active: PropTypes.bool.isRequired, done: PropTypes.bool.isRequired };

const PremiumBooking = () => {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [mounted, setMounted]         = useState(false);
  const [toasts, setToasts]           = useState([]);

  const [fields, setFields]             = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [search, setSearch]             = useState('');

  const [selectedField, setSelectedField] = useState(null);
  const [selectedDate, setSelectedDate]   = useState('');
  const [bookedSlots, setBookedSlots]     = useState([]);
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [selectedSlot, setSelectedSlot]   = useState(null);
  const [participants, setParticipants]   = useState(1);
  const [notes, setNotes]                 = useState('');
  const [booking, setBooking]             = useState(false);
  const [confirmed, setConfirmed]         = useState(null);

  const [myBookings, setMyBookings]       = useState([]);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw   = localStorage.getItem('user');
    if (!token || !raw) { navigate('/login'); return; }
    setUser(JSON.parse(raw));
  }, [navigate]);

  const loadFields = useCallback(async () => {
    setFieldsLoading(true);
    try {
      const res  = await fetch('/api/v1/fields?limit=50&status=active');
      const data = await res.json();
      if (data.success) {
        const list = data.data?.fields || data.data || [];
        setFields(list);
        const presetId = new URLSearchParams(globalThis.location.search).get('field');
        if (presetId) {
          const match = list.find(f => (f._id || f.id) === presetId);
          if (match) setSelectedField(match);
        }
      }
    } catch { /* ignore */ }
    finally { setFieldsLoading(false); }
  }, []);

  const loadMyBookings = useCallback(async () => {
    try {
      const res  = await authFetch('/api/v1/bookings?limit=5');
      const data = await res.json();
      if (data.success) setMyBookings(data.data?.bookings || []);
    } catch { /* ignore */ }
  }, []);

  const loadSlots = useCallback(async (fieldId, date) => {
    setSlotsLoading(true);
    setBookedSlots([]);
    try {
      const res  = await fetch(`/api/v1/fields/${fieldId}/availability?date=${date}`);
      const data = await res.json();
      if (data.success) {
        const raw = data.data?.bookedSlots || data.data?.slots || [];
        setBookedSlots(raw);
      }
    } catch { /* ignore */ }
    finally { setSlotsLoading(false); }
  }, []);

  useEffect(() => { if (user) { loadFields(); loadMyBookings(); } }, [user, loadFields, loadMyBookings]);

  useEffect(() => {
    if (selectedField && selectedDate) loadSlots(selectedField._id, selectedDate);
  }, [selectedField, selectedDate, loadSlots]);

  const pickField = (f) => { setSelectedField(f); setSelectedSlot(null); setConfirmed(null); };
  const pickDate  = (d) => { setSelectedDate(d);  setSelectedSlot(null); setConfirmed(null); };

  const isSlotBooked = (slot) => bookedSlots.some(b => {
    const bs = typeof b === 'string' ? b : b.startTime;
    return bs === slot.startTime;
  });

  const confirmBooking = async () => {
    if (!selectedField || !selectedDate || !selectedSlot) { toast('Please select field, date, and time slot', 'error'); return; }
    setBooking(true);
    try {
      const res  = await authFetch('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({ fieldId: selectedField._id, date: selectedDate, timeSlot: selectedSlot.key, duration: 2, participants, userNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmed(data.data);
        toast('Booking confirmed successfully!');
        setSelectedSlot(null);
        loadSlots(selectedField._id, selectedDate);
        loadMyBookings();
      } else {
        toast(data.message || 'Booking failed', 'error');
      }
    } catch { toast('Network error. Please try again.', 'error'); }
    finally { setBooking(false); }
  };

  if (!user) return null;

  const filteredFields = fields.filter(f => !search || (f.name + ' ' + (f.location?.address || f.location || '')).toLowerCase().includes(search.toLowerCase()));

  let step = 1;
  if (selectedField) step = 2;
  if (selectedField && selectedDate) step = 3;
  if (selectedField && selectedDate && selectedSlot) step = 4;

  const pricePerHour = selectedField?.pricing?.hourly || selectedField?.pricing?.pricePerHour || 2000;

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem' }}>
      <ToastBar toasts={toasts} />

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.14),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.12),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '82rem', margin: '0 auto', padding: '2rem 1.5rem 4rem', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: 'opacity .5s, transform .5s' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Reserve Your Spot</p>
          <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>🏟️ Book a Field</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.3rem' }}>Welcome, {user.firstName} — let&apos;s get you on the field</p>
        </div>

        {/* Steps */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Step n={1} label="Choose Field" active={step === 1} done={step > 1} />
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)', minWidth: '20px' }} />
          <Step n={2} label="Pick Date"    active={step === 2} done={step > 2} />
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)', minWidth: '20px' }} />
          <Step n={3} label="Select Slot"  active={step === 3} done={step > 3} />
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)', minWidth: '20px' }} />
          <Step n={4} label="Confirm"      active={step === 4} done={!!confirmed} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── Step 1: Fields ── */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  {selectedField ? `✅ ${selectedField.name}` : '1. Choose a Field'}
                </h2>
                {selectedField && (
                  <button onClick={() => { setSelectedField(null); setSelectedDate(''); setSelectedSlot(null); }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Change
                  </button>
                )}
              </div>

              {!selectedField && (
                <>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fields by name or location…"
                    className="input-field" style={{ marginBottom: '1rem', fontSize: '0.88rem' }} />
                  {fieldsLoading && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }} /></div>}
                  {!fieldsLoading && filteredFields.length === 0 && (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No fields found. <Link to="/fields" style={{ color: '#a78bfa' }}>Browse all fields</Link></p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
                    {filteredFields.map(f => (
                      <button key={f._id} onClick={() => pickField(f)}
                        style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1.1rem', cursor: 'pointer', transition: 'border-color .2s, background .2s' }}
                        className="field-select-btn">
                        <div style={{ fontWeight: 800, color: '#f1f5f9', marginBottom: '0.25rem' }}>{f.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.5rem' }}>{f.type} · {f.location?.address || f.location || '—'}</div>
                        <div style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.9rem' }}>৳{(f.pricing?.hourly || f.pricing?.pricePerHour || 2000).toLocaleString()}/hr</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selectedField && (
                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#f1f5f9' }}>{selectedField.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{selectedField.type} · {selectedField.location?.address || selectedField.location || '—'}</div>
                  </div>
                  <div style={{ color: '#6ee7b7', fontWeight: 900, fontSize: '1.1rem' }}>৳{pricePerHour.toLocaleString()}/hr</div>
                </div>
              )}
            </div>

            {/* ── Step 2: Date ── */}
            {selectedField && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>
                  {selectedDate ? `✅ ${fmtDate(selectedDate + 'T00:00')}` : '2. Pick a Date'}
                </h2>
                <input type="date" value={selectedDate} min={todayStr()} onChange={e => pickDate(e.target.value)}
                  className="input-field" style={{ maxWidth: '280px' }} />
              </div>
            )}

            {/* ── Step 3: Slots ── */}
            {selectedField && selectedDate && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>
                  3. Select Time Slot <span style={{ fontWeight: 400, fontSize: '0.8rem', textTransform: 'none' }}>(2-hour blocks)</span>
                </h2>
                {slotsLoading && <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto' }} /></div>}
                {!slotsLoading && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.75rem' }}>
                    {ALL_SLOTS.map(slot => {
                      const booked   = isSlotBooked(slot);
                      const selected = selectedSlot?.key === slot.key;
                      let slotBg  = 'rgba(255,255,255,0.03)';
                      if (selected) slotBg = 'rgba(124,58,237,0.2)';
                      if (booked)   slotBg = 'rgba(239,68,68,0.08)';
                      let slotBdr = 'rgba(255,255,255,0.1)';
                      if (selected) slotBdr = '#7c3aed';
                      if (booked)   slotBdr = 'rgba(239,68,68,0.3)';
                      let slotColor = '#f1f5f9';
                      if (selected) slotColor = '#a78bfa';
                      if (booked)   slotColor = '#ef4444';
                      const slotCursor  = booked ? 'not-allowed' : 'pointer';
                      const slotOpacity = booked ? 0.6 : 1;
                      return (
                        <button key={slot.key} disabled={booked} onClick={() => setSelectedSlot(slot)}
                          style={{ padding: '0.85rem 0.5rem', borderRadius: '12px', border: `1.5px solid ${slotBdr}`, background: slotBg, cursor: slotCursor, transition: 'all .2s', opacity: slotOpacity }}>
                          <div style={{ fontWeight: 800, color: slotColor, fontSize: '0.85rem' }}>{slot.startTime}</div>
                          <div style={{ color: '#64748b', fontSize: '0.72rem' }}>to {slot.endTime}</div>
                          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: booked ? '#ef4444' : '#6ee7b7', fontWeight: 700 }}>
                            {booked ? 'Booked' : `৳${(pricePerHour * 2).toLocaleString()}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4: Confirm ── */}
            {selectedSlot && !confirmed && (
              <div className="card" style={{ padding: '1.5rem', border: '1px solid rgba(16,185,129,0.25)' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1.25rem' }}>4. Confirm Booking</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    ['Field',    selectedField.name],
                    ['Date',     fmtDate(selectedDate + 'T00:00')],
                    ['Time',     `${selectedSlot.startTime} – ${selectedSlot.endTime}`],
                    ['Duration', '2 hours'],
                    ['Amount',   `৳${(pricePerHour * 2).toLocaleString()}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                      <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>{k}</div>
                      <div style={{ color: '#f1f5f9', fontWeight: 700 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label htmlFor="book-participants" className="field-label">Participants</label>
                    <input id="book-participants" type="number" min={1} max={22} value={participants} onChange={e => setParticipants(Number(e.target.value))}
                      className="input-field" style={{ fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label htmlFor="book-notes" className="field-label">Notes (optional)</label>
                    <input id="book-notes" type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      className="input-field" placeholder="Any special requests…" style={{ fontSize: '0.88rem' }} />
                  </div>
                </div>
                <button onClick={confirmBooking} disabled={booking} className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}>
                  {booking ? <><span className="spinner" style={{ width: '18px', height: '18px' }} /> Processing…</> : '🎯 Confirm & Book Now'}
                </button>
              </div>
            )}

            {/* ── Success ── */}
            {confirmed && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                <h2 style={{ color: '#6ee7b7', fontWeight: 900, marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Your booking ID: <span style={{ color: '#a78bfa', fontWeight: 700 }}>{confirmed._id?.slice(-8)}</span></p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/bookings" className="btn-primary" style={{ textDecoration: 'none', padding: '0.65rem 1.4rem' }}>📋 View My Bookings</Link>
                  <button onClick={() => { setConfirmed(null); setSelectedSlot(null); }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', borderRadius: '12px', padding: '0.65rem 1.4rem', cursor: 'pointer', fontWeight: 700 }}>
                    Book Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar: Recent Bookings ── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1.25rem' }}>My Recent Bookings</h2>
            {myBookings.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.88rem' }}>No bookings yet</p>}
            {myBookings.map(b => {
              const st = STATUS_COLOR[b.status] || STATUS_COLOR.pending;
              return (
                <div key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.9rem', marginBottom: '0.9rem' }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.88rem' }}>{b.field?.name || 'Field'}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.15rem 0' }}>{fmtDate(b.startTime)}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: '9999px', padding: '0.15rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>{b.status}</span>
                    <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.82rem' }}>৳{b.pricing?.totalAmount?.toLocaleString() || 0}</span>
                  </div>
                </div>
              );
            })}
            <Link to="/bookings" style={{ display: 'block', textAlign: 'center', color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', marginTop: '0.5rem' }}>View all →</Link>
          </div>
        </div>
      </div>

      <style>{`
        .field-select-btn:hover { border-color: rgba(124,58,237,0.5) !important; background: rgba(124,58,237,0.06) !important; }
      `}</style>
    </div>
  );
};

export default PremiumBooking;
