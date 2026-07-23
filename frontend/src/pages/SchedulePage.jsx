import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM – 10 PM
const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SPORT_COLORS = {
  Football: '#10b981', Cricket: '#f59e0b', Badminton: '#7c3aed',
  Basketball: '#ec4899', Tennis: '#06b6d4', Volleyball: '#f97316'
};

const getWeekDates = (base) => {
  const d   = new Date(base);
  const day = d.getDay();
  const sun = new Date(d); sun.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(sun); x.setDate(sun.getDate() + i); return x; });
};

const fmt = (date) => date.toISOString().split('T')[0];
const fmtLabel = (date) => date.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });

const MOCK_BOOKINGS = [
  { _id: 'b1', fieldName: 'Champions Arena', sport: 'Football',  date: fmt(new Date()), startHour: 8,  duration: 2, status: 'confirmed' },
  { _id: 'b2', fieldName: 'Badminton Palace', sport: 'Badminton', date: fmt(new Date()), startHour: 17, duration: 1, status: 'confirmed' },
  { _id: 'b3', fieldName: 'Elite Turf',       sport: 'Football',  date: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return fmt(d); })(), startHour: 10, duration: 3, status: 'pending' },
  { _id: 'b4', fieldName: 'Tennis Hub',       sport: 'Tennis',    date: (() => { const d = new Date(); d.setDate(d.getDate() + 4); return fmt(d); })(), startHour: 7,  duration: 1, status: 'confirmed' }
];

const SchedulePage = () => {
  const navigate   = useNavigate();
  const [baseDate, setBaseDate]  = useState(new Date());
  const [bookings, setBookings]  = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [view,     setView]      = useState('week');
  const [selected, setSelected]  = useState(null);

  const weekDates = getWeekDates(baseDate);

  useEffect(() => {
    setLoading(true);
    const raw = localStorage.getItem('user');
    const uid = raw ? (JSON.parse(raw)._id ?? JSON.parse(raw).id) : null;
    if (!uid) { setBookings(MOCK_BOOKINGS); setLoading(false); return; }
    const start = fmt(weekDates[0]);
    const end   = fmt(weekDates[6]);
    authFetch(`/api/v1/bookings?userId=${uid}&startDate=${start}&endDate=${end}`)
      .then(r => r.json())
      .then(d => setBookings(d.success ? (d.data?.bookings ?? d.data ?? []) : MOCK_BOOKINGS))
      .catch(() => setBookings(MOCK_BOOKINGS))
      .finally(() => setLoading(false));
  }, [baseDate]);

  const prevWeek = () => { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); };
  const nextWeek = () => { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); };
  const today    = () => setBaseDate(new Date());

  const bookingsOn = (date, hour) =>
    bookings.filter(b => b.date === fmt(date) && b.startHour <= hour && b.startHour + b.duration > hour);

  const todayStr = fmt(new Date());

  const S = {
    page:    { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:    { maxWidth: 1100, margin: '0 auto' },
    title:   { fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    navBar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' },
    navBtn:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem' },
    todayBtn:{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem' },
    grid:    { display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' },
    dayHead: (isToday) => ({ padding: '0.75rem 0.25rem', textAlign: 'center', background: isToday ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', borderRight: '1px solid rgba(255,255,255,0.05)' }),
    hourCell:{ padding: '0.25rem 0.5rem', textAlign: 'right', color: '#475569', fontSize: '0.7rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', minHeight: 48 },
    cell:    (isToday) => ({ borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)', background: isToday ? 'rgba(124,58,237,0.04)' : 'transparent', minHeight: 48, position: 'relative', padding: '2px' }),
    booking: (color, status) => ({ background: `${color}22`, border: `1px solid ${color}66`, borderRadius: '6px', padding: '2px 5px', fontSize: '0.65rem', fontWeight: 700, color, opacity: status === 'pending' ? 0.7 : 1, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
    modal:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    mCard:   { background: '#0d0525', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: 420 }
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={S.title}>📅 My Schedule</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Your weekly booking calendar</p>
        </div>

        <div style={S.navBar}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button style={S.navBtn} onClick={prevWeek}>← Prev</button>
            <button style={S.todayBtn} onClick={today}>Today</button>
            <button style={S.navBtn} onClick={nextWeek}>Next →</button>
          </div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' }}>
            {fmtLabel(weekDates[0])} – {fmtLabel(weekDates[6])}, {weekDates[0].getFullYear()}
          </div>
          <button
            style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.5rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem' }}
            onClick={() => navigate('/booking')}
          >
            + New Booking
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {Object.entries(SPORT_COLORS).map(([s, c]) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />{s}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem' }}>Loading schedule…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 680 }}>
              <div style={S.grid}>
                {/* Header row */}
                <div style={{ ...S.hourCell, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: 'auto', padding: '0.75rem 0.5rem', justifyContent: 'center', color: '#475569', fontSize: '0.65rem' }}>TIME</div>
                {weekDates.map((d, i) => {
                  const isToday = fmt(d) === todayStr;
                  return (
                    <div key={i} style={S.dayHead(isToday)}>
                      <div style={{ color: isToday ? '#a78bfa' : '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{DAYS[d.getDay()]}</div>
                      <div style={{ color: isToday ? '#f1f5f9' : '#94a3b8', fontSize: '1rem', fontWeight: 900 }}>{d.getDate()}</div>
                    </div>
                  );
                })}

                {/* Hour rows */}
                {HOURS.map(hour => (
                  <React.Fragment key={hour}>
                    <div style={S.hourCell}>
                      {hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                    {weekDates.map((d, di) => {
                      const isToday = fmt(d) === todayStr;
                      const slots   = bookingsOn(d, hour);
                      return (
                        <div key={di} style={S.cell(isToday)}>
                          {slots.map(b => (
                            <div
                              key={b._id}
                              style={S.booking(SPORT_COLORS[b.sport] ?? '#7c3aed', b.status)}
                              onClick={() => setSelected(b)}
                              title={`${b.fieldName} · ${b.sport}`}
                            >
                              {b.fieldName}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming list */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Upcoming Bookings</h3>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '2rem' }}>
              No bookings this week. <button style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/booking')}>Book a field →</button>
            </div>
          ) : (
            bookings.slice().sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour).map(b => {
              const color = SPORT_COLORS[b.sport] ?? '#7c3aed';
              const hLabel = (h) => h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
              return (
                <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '0.85rem 1.1rem', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => setSelected(b)}>
                  <div style={{ width: 4, height: 40, background: color, borderRadius: '4px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem' }}>{b.fieldName}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{b.date} · {hLabel(b.startHour)} – {hLabel(b.startHour + b.duration)}</div>
                  </div>
                  <span style={{ background: b.status === 'confirmed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${b.status === 'confirmed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, color: b.status === 'confirmed' ? '#6ee7b7' : '#fcd34d', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {b.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.mCard} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: '#f1f5f9', fontWeight: 800, margin: 0 }}>{selected.fieldName}</h3>
              <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }} onClick={() => setSelected(null)}>×</button>
            </div>
            {[
              ['Sport',   selected.sport],
              ['Date',    selected.date],
              ['Time',    `${selected.startHour}:00 – ${selected.startHour + selected.duration}:00`],
              ['Duration',`${selected.duration} hour${selected.duration !== 1 ? 's' : ''}`],
              ['Status',  selected.status]
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{l}</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontWeight: 700, padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setSelected(null)}>Cancel Booking</button>
              <button style={{ flex: 1, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 700, padding: '0.6rem', borderRadius: '10px', cursor: 'pointer' }} onClick={() => { navigate('/bookings'); setSelected(null); }}>View Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
