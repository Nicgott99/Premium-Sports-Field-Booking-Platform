import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_COLORS = { available:'#FBBF24', booked:'#ff5e07', pending:'#7dd3fc' };

const MOCK_BOOKINGS = {
  '2026-06-10':{ status:'booked',   field:'Bashundhara SC',     time:'6:00 PM',  sport:'Football' },
  '2026-06-12':{ status:'booked',   field:'Mirpur Indoor',      time:'5:00 PM',  sport:'Basketball' },
  '2026-06-15':{ status:'pending',  field:'Dhanmondi Tennis',   time:'9:00 AM',  sport:'Tennis' },
  '2026-06-20':{ status:'booked',   field:'Elite Cricket Ctr',  time:'3:00 PM',  sport:'Cricket' },
  '2026-06-22':{ status:'available',field:'Bashundhara SC',     time:'7:00 PM',  sport:'Football' },
  '2026-06-25':{ status:'booked',   field:'Badminton Arena',    time:'8:00 AM',  sport:'Badminton' },
};

function DayCell({ day, booking, isToday, isSelected, onClick }) {
  const hasEvent = !!booking;
  const dotColor = booking ? STATUS_COLORS[booking.status] : null;
  return (
    <button onClick={() => onClick(day)}
      style={{ aspectRatio:'1', borderRadius:'10px', border: isSelected ? '1px solid rgba(251,191,36,0.5)' : '1px solid transparent', background: isSelected ? 'rgba(251,191,36,0.12)' : isToday ? 'rgba(255,94,7,0.08)' : 'transparent', color: isToday ? '#ff5e07' : '#c8d8ea', fontWeight: isToday || isSelected ? 800 : 400, fontSize:'0.85rem', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px', position:'relative', transition:'all 0.15s', padding:'0.2rem' }}>
      <span>{day}</span>
      {hasEvent && <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:dotColor, flexShrink:0 }} />}
    </button>
  );
}
DayCell.propTypes = {
  day: PropTypes.number.isRequired,
  booking: PropTypes.object,
  isToday: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const BookingCalendar = () => {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const [bookings, setBookings] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/bookings/calendar', { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setBookings(data.data ?? data);
      } catch {
        setBookings(MOCK_BOOKINGS);
      }
    };
    load();
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  const toKey = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const selectedKey = selected ? toKey(selected) : null;
  const selectedBooking = selectedKey ? bookings[selectedKey] : null;

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Schedule</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.4rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Booking Calendar</h1>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.5rem' }}>
          {/* Calendar */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'1.75rem', backdropFilter:'blur(14px)' }}>
            {/* Nav */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <button onClick={prevMonth} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#8ba3be', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1.1rem' }}>chevron_left</span>
              </button>
              <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1.15rem', color:'#f0f6ff', margin:0 }}>{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#8ba3be', borderRadius:'8px', width:'34px', height:'34px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1.1rem' }}>chevron_right</span>
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'0.4rem' }}>
              {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', padding:'0.3rem 0', textTransform:'uppercase', letterSpacing:'0.06em' }}>{d}</div>)}
            </div>

            {/* Days grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const key = toKey(d);
                return (
                  <DayCell key={d} day={d} booking={bookings[key]} isToday={key === todayKey} isSelected={selected === d} onClick={setSelected} />
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:'1.25rem', marginTop:'1.25rem', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.06)', justifyContent:'center' }}>
              {Object.entries(STATUS_COLORS).map(([s, c]) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
                  <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:c, flexShrink:0 }} />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'capitalize' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'1.75rem', backdropFilter:'blur(14px)', display:'flex', flexDirection:'column' }}>
            {selected ? (
              <>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.25rem' }}>
                  {MONTHS[month]} {selected}, {year}
                </div>
                {selectedBooking ? (
                  <>
                    <span style={{ display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.72rem', fontWeight:700, background:`rgba(${selectedBooking.status === 'booked' ? '255,94,7' : selectedBooking.status === 'pending' ? '125,211,252' : '195,244,0'},0.12)`, color: STATUS_COLORS[selectedBooking.status], border:`1px solid ${STATUS_COLORS[selectedBooking.status]}40`, marginBottom:'1.25rem', width:'fit-content' }}>
                      {selectedBooking.status}
                    </span>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                      {[['sports', selectedBooking.field],['schedule', selectedBooking.time],['sports_soccer', selectedBooking.sport]].map(([icon, val]) => (
                        <div key={icon} style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize:'1.1rem', color:'#506070' }}>{icon}</span>
                          <span style={{ color:'#c8d8ea', fontSize:'0.9rem' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <button style={{ marginTop:'auto', paddingTop:'1.5rem', padding:'0.65rem', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'10px', color:'#FBBF24', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', fontFamily:"'Anybody',sans-serif" }}>
                      View Details
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ color:'#506070', fontSize:'0.88rem', marginTop:'0.5rem' }}>No booking on this date.</p>
                    <button style={{ marginTop:'auto', padding:'0.65rem', background:'#FBBF24', border:'none', borderRadius:'10px', color:'#111111', fontWeight:800, fontSize:'0.88rem', cursor:'pointer', fontFamily:"'Anybody',sans-serif" }}>
                      Book This Day
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', textAlign:'center', gap:'0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'2.5rem', color:'rgba(251,191,36,0.2)' }}>touch_app</span>
                <p style={{ color:'#506070', fontSize:'0.88rem' }}>Select a date to see booking details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
