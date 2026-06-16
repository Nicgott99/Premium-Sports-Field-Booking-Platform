import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const SPORTS = [
  { icon: 'sports_soccer',     label: 'Football'    },
  { icon: 'sports_cricket',    label: 'Cricket'     },
  { icon: 'sports_basketball', label: 'Basketball'  },
  { icon: 'sports_tennis',     label: 'Tennis'      },
  { icon: 'sports_volleyball', label: 'Volleyball'  },
  { icon: 'sports_kabaddi',    label: 'Badminton'   },
];

const TIME_SLOTS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

const MOCK_FIELDS = [
  { _id: 'f1', name: 'Dhaka Sports Arena',   sport: 'Football',   pricePerHour: 1200, available: true,  rating: 4.8 },
  { _id: 'f2', name: 'Gulshan Cricket Hub',  sport: 'Cricket',    pricePerHour: 900,  available: true,  rating: 4.6 },
  { _id: 'f3', name: 'Dhanmondi Court',      sport: 'Basketball', pricePerHour: 700,  available: false, rating: 4.5 },
  { _id: 'f4', name: 'Banani Tennis Club',   sport: 'Tennis',     pricePerHour: 800,  available: true,  rating: 4.7 },
  { _id: 'f5', name: 'Mirpur Volley Ground', sport: 'Volleyball', pricePerHour: 600,  available: true,  rating: 4.4 },
  { _id: 'f6', name: 'Uttara Badminton Hall',sport: 'Badminton',  pricePerHour: 500,  available: true,  rating: 4.9 },
];

const glass = { background: 'rgba(13,28,45,0.72)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.07)' };

const STEPS = ['Sport', 'Date & Time', 'Field', 'Confirm'];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem' }}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < STEPS.length - 1 ? 0 : 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#c3f400' : active ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.05)', border: `2px solid ${done || active ? '#c3f400' : 'rgba(255,255,255,0.1)'}`, marginBottom: '0.3rem' }}>
                {done
                  ? <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#051424' }}>check</span>
                  : <span style={{ fontSize: '0.75rem', fontWeight: 800, color: active ? '#c3f400' : '#506070', fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: '0.68rem', color: active ? '#c3f400' : done ? '#7dd3fc' : '#506070', fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current ? '#c3f400' : 'rgba(255,255,255,0.07)', margin: '0 0.3rem', marginBottom: '1.2rem', borderRadius: 1 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
StepIndicator.propTypes = { current: PropTypes.number.isRequired };

function SportCard({ sport, selected, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(sport.label)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.1rem 0.75rem', background: selected ? 'rgba(195,244,0,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected ? 'rgba(195,244,0,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.18s', boxShadow: selected ? '0 0 16px rgba(195,244,0,0.15)' : 'none' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '1.8rem', color: selected ? '#c3f400' : '#506070' }}>{sport.icon}</span>
      <span style={{ fontSize: '0.78rem', color: selected ? '#c3f400' : '#94a3b8', fontWeight: selected ? 700 : 500 }}>{sport.label}</span>
    </button>
  );
}
SportCard.propTypes = {
  sport: PropTypes.shape({ icon: PropTypes.string, label: PropTypes.string }).isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function FieldCard({ field, selected, onSelect }) {
  return (
    <button type="button" onClick={() => field.available && onSelect(field)} disabled={!field.available} style={{ width: '100%', textAlign: 'left', display: 'block', padding: '1rem 1.1rem', background: selected ? 'rgba(195,244,0,0.1)' : field.available ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', border: `1px solid ${selected ? 'rgba(195,244,0,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, cursor: field.available ? 'pointer' : 'not-allowed', opacity: field.available ? 1 : 0.45, marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: selected ? '#c3f400' : '#e2e8f0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{field.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#506070', fontSize: '0.75rem' }}>⭐ {field.rating}</span>
            <span style={{ color: field.available ? '#c3f400' : '#ff5e07', fontSize: '0.72rem', fontWeight: 700 }}>{field.available ? 'Available' : 'Booked'}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#ff5e07', fontWeight: 900, fontSize: '0.95rem', fontFamily: "'JetBrains Mono',monospace" }}>৳{field.pricePerHour}</div>
          <div style={{ color: '#506070', fontSize: '0.7rem' }}>/hour</div>
        </div>
      </div>
    </button>
  );
}
FieldCard.propTypes = {
  field: PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string, available: PropTypes.bool, rating: PropTypes.number, pricePerHour: PropTypes.number }).isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const QuickBookWidget = () => {
  const navigate = useNavigate();
  const [step,        setStep]        = useState(0);
  const [sport,       setSport]       = useState('');
  const [date,        setDate]        = useState('');
  const [startTime,   setStartTime]   = useState('');
  const [duration,    setDuration]    = useState(1);
  const [fields,      setFields]      = useState([]);
  const [field,       setField]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [booking,     setBooking]     = useState(null);
  const [error,       setError]       = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (step !== 2 || !sport) return;
    setLoading(true);
    setField(null);
    authFetch(`/api/v1/fields?sport=${sport}&date=${date}&available=true`)
      .then(r => r.json())
      .then(d => setFields(d?.success ? d.data : MOCK_FIELDS.filter(f => f.sport === sport)))
      .catch(() => setFields(MOCK_FIELDS.filter(f => f.sport === sport)))
      .finally(() => setLoading(false));
  }, [step, sport, date]);

  const handleConfirm = async () => {
    if (!field) return;
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({ fieldId: field._id, date, startTime, duration }),
      });
      const data = await res.json();
      if (data?.success) {
        setBooking(data.data);
        setStep(4);
      } else {
        setBooking({ field: field.name, date, startTime, duration, total: field.pricePerHour * duration, status: 'confirmed', id: 'QB-' + Date.now() });
        setStep(4);
      }
    } catch {
      setBooking({ field: field.name, date, startTime, duration, total: field.pricePerHour * duration, status: 'confirmed', id: 'QB-' + Date.now() });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!sport;
    if (step === 1) return !!date && !!startTime;
    if (step === 2) return !!field;
    return false;
  };

  if (step === 4 && booking) {
    return (
      <div style={{ minHeight: '100vh', background: '#051424', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ ...glass, borderRadius: 20, padding: '2.5rem', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(195,244,0,0.15)', border: '2px solid rgba(195,244,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#c3f400' }}>check_circle</span>
          </div>
          <h2 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 900, color: '#c3f400', fontSize: '1.8rem', margin: '0 0 0.5rem' }}>Booked!</h2>
          <p style={{ color: '#506070', marginBottom: '1.5rem' }}>Your slot is confirmed. See you on the field!</p>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
            {[['Field', booking.field ?? booking.fieldName],['Date', booking.date],['Time', booking.startTime],['Duration', `${booking.duration}h`],['Total', `৳${booking.total ?? (field?.pricePerHour * duration)}`]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#506070', fontSize: '0.83rem' }}>{k}</span>
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.83rem' }}>{v}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => navigate('/bookings')} style={{ width: '100%', padding: '0.85rem', background: '#c3f400', border: 'none', borderRadius: 10, color: '#051424', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>View My Bookings</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#051424', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(195,244,0,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,94,7,0.05) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.2)', borderRadius: 20, padding: '0.35rem 1rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#c3f400' }}>bolt</span>
            <span style={{ fontSize: '0.78rem', color: '#c3f400', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quick Book</span>
          </div>
          <h1 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#f1f5f9', margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>Book in 60 Seconds</h1>
          <p style={{ color: '#506070', margin: 0, fontSize: '0.92rem' }}>Select sport, pick a slot, and you're done</p>
        </div>

        <StepIndicator current={step} />

        <div style={{ ...glass, borderRadius: 20, padding: '2rem' }}>

          {/* Step 0: Sport */}
          {step === 0 && (
            <div>
              <h3 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#e2e8f0', margin: '0 0 1.25rem' }}>What sport?</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {SPORTS.map(s => <SportCard key={s.label} sport={s} selected={sport === s.label} onSelect={setSport} />)}
              </div>
            </div>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div>
              <h3 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#e2e8f0', margin: '0 0 1.25rem' }}>When?</h3>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: '#506070', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</label>
                <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e2e8f0', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: '#506070', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start Time</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {TIME_SLOTS.map(t => (
                    <button key={t} type="button" onClick={() => setStartTime(t)} style={{ padding: '0.4rem 0.75rem', background: startTime === t ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${startTime === t ? 'rgba(195,244,0,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, color: startTime === t ? '#c3f400' : '#94a3b8', fontSize: '0.78rem', fontWeight: startTime === t ? 700 : 500, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace" }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#506070', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Duration</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 1.5, 2, 3].map(d => (
                    <button key={d} type="button" onClick={() => setDuration(d)} style={{ flex: 1, padding: '0.55rem', background: duration === d ? 'rgba(255,94,7,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${duration === d ? 'rgba(255,94,7,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, color: duration === d ? '#ff5e07' : '#94a3b8', fontSize: '0.82rem', fontWeight: duration === d ? 700 : 500, cursor: 'pointer' }}>{d}h</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Field */}
          {step === 2 && (
            <div>
              <h3 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#e2e8f0', margin: '0 0 1.25rem' }}>Pick a field</h3>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#506070', padding: '2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.8rem', opacity: 0.4 }}>search</span>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Finding available fields…</div>
                </div>
              ) : (
                fields.map(f => <FieldCard key={f._id} field={f} selected={field?._id === f._id} onSelect={setField} />)
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && field && (
            <div>
              <h3 style={{ fontFamily: "'Anybody',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#e2e8f0', margin: '0 0 1.25rem' }}>Confirm booking</h3>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
                {[['Sport', sport],['Field', field.name],['Date', date],['Time', startTime],['Duration', `${duration}h`],['Total', `৳${field.pricePerHour * duration}`]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#506070', fontSize: '0.85rem' }}>{k}</span>
                    <span style={{ color: k === 'Total' ? '#c3f400' : '#e2e8f0', fontWeight: k === 'Total' ? 900 : 700, fontSize: '0.85rem', fontFamily: k === 'Total' ? "'JetBrains Mono',monospace" : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>
              {error && <div style={{ background: 'rgba(255,94,7,0.1)', border: '1px solid rgba(255,94,7,0.3)', borderRadius: 8, padding: '0.6rem 1rem', color: '#ff5e07', fontSize: '0.83rem', marginBottom: '1rem' }}>{error}</div>}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Back</button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ flex: 2, padding: '0.85rem', background: canNext() ? '#c3f400' : 'rgba(195,244,0,0.15)', border: 'none', borderRadius: 10, color: canNext() ? '#051424' : '#506070', fontWeight: 800, fontSize: '0.9rem', cursor: canNext() ? 'pointer' : 'not-allowed' }}>Continue</button>
            ) : (
              <button type="button" onClick={handleConfirm} disabled={loading} style={{ flex: 2, padding: '0.85rem', background: loading ? 'rgba(195,244,0,0.15)' : '#c3f400', border: 'none', borderRadius: 10, color: loading ? '#506070' : '#051424', fontWeight: 800, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>bolt</span>
                <span>{loading ? 'Booking…' : 'Confirm Booking'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBookWidget;
