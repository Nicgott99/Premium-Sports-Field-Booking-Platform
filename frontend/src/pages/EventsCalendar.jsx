import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_EVENTS = {
  '2026-06-18': [{ id:1, title:'Football Match Day', sport:'Football', icon:'⚽', time:'5:00 PM', venue:'Bashundhara SC', type:'match', color:'#c3f400' }],
  '2026-06-20': [{ id:2, title:'Tennis Coaching', sport:'Tennis', icon:'🎾', time:'7:00 AM', venue:'Dhanmondi TC', type:'coaching', color:'#7dd3fc' }],
  '2026-06-22': [
    { id:3, title:'Cricket Practice', sport:'Cricket', icon:'🏏', time:'6:00 PM', venue:'Elite Cricket', type:'practice', color:'#ff5e07' },
    { id:4, title:'Team Meeting', sport:'Football', icon:'⚽', time:'8:00 PM', venue:'Online', type:'meeting', color:'#a78bfa' },
  ],
  '2026-06-25': [{ id:5, title:'Badminton Tournament', sport:'Badminton', icon:'🏸', time:'9:00 AM', venue:'Badminton Arena', type:'tournament', color:'#c3f400' }],
  '2026-06-28': [{ id:6, title:'3v3 Basketball Finals', sport:'Basketball', icon:'🏀', time:'3:00 PM', venue:'Mirpur Indoor', type:'tournament', color:'#ff5e07' }],
  '2026-06-30': [{ id:7, title:'Monthly Awards Night', sport:'Multi', icon:'🏆', time:'7:00 PM', venue:'Grand Ballroom', type:'ceremony', color:'#c3f400' }],
  '2026-07-05': [{ id:8, title:'Smash Open — Day 1', sport:'Tennis', icon:'🎾', time:'8:00 AM', venue:'Dhanmondi TC', type:'tournament', color:'#7dd3fc' }],
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TYPE_COLORS = { match:'#c3f400', coaching:'#7dd3fc', practice:'#ff5e07', meeting:'#a78bfa', tournament:'#22d3ee', ceremony:'#fb923c' };

function DotRow({ events }) {
  return (
    <div style={{ display:'flex', gap:'2px', justifyContent:'center', marginTop:'2px' }}>
      {events.slice(0,3).map(e => <div key={e.id} style={{ width:'5px', height:'5px', borderRadius:'50%', background:e.color }} />)}
    </div>
  );
}
DotRow.propTypes = { events: PropTypes.arrayOf(PropTypes.shape({ id:PropTypes.number, color:PropTypes.string })).isRequired };

function DayCell({ day, events, isToday, isSelected, onClick }) {
  const hasEvents = events && events.length > 0;
  return (
    <button type="button" onClick={onClick}
      style={{ aspectRatio:'1', borderRadius:'10px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background: isSelected ? 'rgba(195,244,0,0.15)' : isToday ? 'rgba(255,94,7,0.1)' : hasEvents ? 'rgba(255,255,255,0.03)' : 'transparent', border: isSelected ? '1px solid rgba(195,244,0,0.4)' : isToday ? '1px solid rgba(255,94,7,0.35)' : '1px solid transparent', cursor: day ? 'pointer' : 'default', transition:'all 0.15s', padding:'0.25rem' }}
      onMouseEnter={e => { if (day && !isSelected) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { if (day && !isSelected) e.currentTarget.style.background = hasEvents ? 'rgba(255,255,255,0.03)' : 'transparent'; }}>
      {day && (
        <>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.82rem', fontWeight: isToday || isSelected ? 700 : 400, color: isSelected ? '#c3f400' : isToday ? '#ff5e07' : hasEvents ? '#f0f6ff' : '#506070' }}>{day}</span>
          {hasEvents && <DotRow events={events} />}
        </>
      )}
    </button>
  );
}
DayCell.propTypes = {
  day: PropTypes.number,
  events: PropTypes.array,
  isToday: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const EventsCalendar = () => {
  const [events, setEvents] = useState({});
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [selectedDate, setSelectedDate] = useState('2026-06-22');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/events/calendar');
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setEvents(data.data ?? data);
      } catch {
        setEvents(MOCK_EVENTS);
      }
    };
    load();
  }, []);

  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const pad = n => String(n).padStart(2,'0');
  const dateKey = d => `${year}-${pad(month+1)}-${pad(d)}`;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const selectedEvents = events[selectedDate] ?? [];

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Schedule</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Events Calendar</h1>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.5rem', alignItems:'start' }}>

          {/* Calendar */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'1.75rem', backdropFilter:'blur(14px)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <button onClick={prevMonth} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#8ba3be', cursor:'pointer', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1.1rem' }}>chevron_left</span>
              </button>
              <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.2rem', color:'#f0f6ff', margin:0 }}>{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'#8ba3be', cursor:'pointer', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1.1rem' }}>chevron_right</span>
              </button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'0.5rem' }}>
              {DAYS.map(d => <div key={d} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textAlign:'center', padding:'0.25rem 0' }}>{d}</div>)}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'3px' }}>
              {cells.map((d, i) => {
                const key = d ? dateKey(d) : null;
                const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = key === selectedDate;
                return (
                  <DayCell key={i} day={d ?? undefined} events={key ? (events[key] ?? []) : []}
                    isToday={isToday} isSelected={isSelected}
                    onClick={() => { if (d) setSelectedDate(dateKey(d)); }} />
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginTop:'1.25rem', paddingTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:color }} />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.65rem', color:'#506070', textTransform:'capitalize' }}>{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day detail */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'1.5rem', backdropFilter:'blur(14px)', position:'sticky', top:'6rem' }}>
            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'uppercase', marginBottom:'0.3rem' }}>Selected Date</div>
              <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.2rem', color:'#f0f6ff', margin:0 }}>{selectedDate}</h2>
            </div>

            {selectedEvents.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {selectedEvents.map(ev => (
                  <div key={ev.id} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${ev.color}22`, borderLeft:`3px solid ${ev.color}`, borderRadius:'10px', padding:'1rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.4rem' }}>
                      <span style={{ fontSize:'1.2rem' }}>{ev.icon}</span>
                      <span style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.92rem', color:'#f0f6ff' }}>{ev.title}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                      {[['schedule', ev.time],['location_on', ev.venue],['sports', ev.sport]].map(([icon, val]) => (
                        <div key={icon} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize:'0.82rem', color:'#506070' }}>{icon}</span>
                          <span style={{ color:'#8ba3be', fontSize:'0.78rem' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <span style={{ display:'inline-block', marginTop:'0.5rem', padding:'0.12rem 0.6rem', background:`${ev.color}18`, border:`1px solid ${ev.color}33`, color:ev.color, borderRadius:'999px', fontSize:'0.65rem', fontWeight:800, textTransform:'capitalize' }}>{ev.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'2rem 0', color:'#506070' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'2.5rem', display:'block', marginBottom:'0.5rem' }}>event_busy</span>
                <div style={{ fontSize:'0.85rem' }}>No events this day</div>
              </div>
            )}

            <button style={{ width:'100%', marginTop:'1.25rem', padding:'0.7rem', background:'rgba(195,244,0,0.08)', border:'1px solid rgba(195,244,0,0.2)', borderRadius:'12px', color:'#c3f400', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.88rem', cursor:'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'1rem', verticalAlign:'middle', marginRight:'0.4rem' }}>add</span>
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsCalendar;
