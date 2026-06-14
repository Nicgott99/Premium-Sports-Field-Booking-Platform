import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_FIELDS = [
  { _id: 'm1', name: 'Green Valley FC',      sport: 'Football',   area: 'Gulshan',      price: 800,  rating: 4.8, available: true,  lat: 23.7930, lng: 90.4145, img: '🟢' },
  { _id: 'm2', name: 'Mirpur Cricket Ground',sport: 'Cricket',    area: 'Mirpur',       price: 1200, rating: 4.6, available: true,  lat: 23.8103, lng: 90.3664, img: '🏏' },
  { _id: 'm3', name: 'Dhanmondi Sports Hub', sport: 'Badminton',  area: 'Dhanmondi',    price: 500,  rating: 4.9, available: false, lat: 23.7461, lng: 90.3742, img: '🏸' },
  { _id: 'm4', name: 'Bashundhara Arena',    sport: 'Football',   area: 'Bashundhara',  price: 1000, rating: 4.7, available: true,  lat: 23.8103, lng: 90.4237, img: '⚽' },
  { _id: 'm5', name: 'Uttara Turf Club',     sport: 'Football',   area: 'Uttara',       price: 900,  rating: 4.5, available: true,  lat: 23.8759, lng: 90.3795, img: '🏟️' },
  { _id: 'm6', name: 'Wari Basketball Court',sport: 'Basketball', area: 'Old Dhaka',    price: 600,  rating: 4.3, available: true,  lat: 23.7194, lng: 90.4072, img: '🏀' },
  { _id: 'm7', name: 'Mohakhali Tennis Club',sport: 'Tennis',     area: 'Mohakhali',    price: 700,  rating: 4.6, available: false, lat: 23.7762, lng: 90.4014, img: '🎾' },
  { _id: 'm8', name: 'Agargaon Volleyball',  sport: 'Volleyball', area: 'Agargaon',     price: 450,  rating: 4.2, available: true,  lat: 23.7768, lng: 90.3780, img: '🏐' },
];

const SPORT_COLORS = { Football: '#10b981', Cricket: '#f59e0b', Badminton: '#7c3aed', Basketball: '#ec4899', Tennis: '#06b6d4', Volleyball: '#f97316' };
const SPORTS = ['All', 'Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Volleyball'];
const AREAS  = ['All', 'Gulshan', 'Mirpur', 'Dhanmondi', 'Bashundhara', 'Uttara', 'Old Dhaka', 'Mohakhali', 'Agargaon'];

/* Simulated SVG map using lat/lng projected to a bounding box of Dhaka */
const MAP_BOUNDS = { latMin: 23.70, latMax: 23.90, lngMin: 90.35, lngMax: 90.45 };

const project = (lat, lng, w, h) => {
  const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * w;
  const y = h - ((lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * h;
  return { x, y };
};

const MapView = () => {
  const navigate  = useNavigate();
  const svgRef    = useRef(null);
  const [fields,  setFields]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [sport,   setSport]   = useState('All');
  const [area,    setArea]    = useState('All');
  const [avail,   setAvail]   = useState(false);
  const [selected,setSelected]= useState(null);
  const [dims,    setDims]    = useState({ w: 700, h: 440 });

  useEffect(() => {
    authFetch('/api/v1/fields?limit=50&includeLocation=true')
      .then(r => r.json())
      .then(d => setFields(d.success && d.data?.length ? d.data : MOCK_FIELDS))
      .catch(() => setFields(MOCK_FIELDS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDims({ w: rect.width || 700, h: 440 });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const filtered = fields.filter(f =>
    (sport === 'All' || f.sport === sport) &&
    (area  === 'All' || f.area  === area)  &&
    (!avail || f.available)
  );

  const handlePin = useCallback((f) => {
    setSelected(prev => prev?._id === f._id ? null : f);
  }, []);

  const S = {
    page:  { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:  { maxWidth: 1050, margin: '0 auto' },
    title: { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    chip:  (a, c='rgba(124,58,237,0.3)', b='rgba(124,58,237,0.5)') => ({ background: a ? c : 'rgba(255,255,255,0.04)', border: `1px solid ${a ? b : 'rgba(255,255,255,0.08)'}`, color: a ? '#f1f5f9' : '#94a3b8', padding: '0.3rem 0.75rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: a ? 700 : 500 }),
    card:  { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1rem' },
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={S.title}>🗺️ Field Map</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Find sports fields near you across Dhaka</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {SPORTS.map(s => <button key={s} style={S.chip(sport === s)} onClick={() => setSport(s)}>{s}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem', alignItems: 'center' }}>
          {AREAS.map(a => <button key={a} style={S.chip(area === a)} onClick={() => setArea(a)}>{a}</button>)}
          <button
            style={{ ...S.chip(avail, 'rgba(16,185,129,0.2)', 'rgba(16,185,129,0.5)'), marginLeft: 'auto' }}
            onClick={() => setAvail(v => !v)}
          >
            {avail ? '✓ ' : ''}Available Only
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
          {/* SVG MAP */}
          <div style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '18px', overflow: 'hidden', position: 'relative' }}>
            {loading ? (
              <div style={{ height: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading map…</div>
            ) : (
              <svg ref={svgRef} width="100%" height="440" style={{ display: 'block', cursor: 'crosshair' }}>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map(t => (
                  <g key={t}>
                    <line x1={`${t * 100}%`} y1="0" x2={`${t * 100}%`} y2="100%" stroke="rgba(6,182,212,0.08)" strokeWidth="1" />
                    <line x1="0" y1={`${t * 100}%`} x2="100%" y2={`${t * 100}%`} stroke="rgba(6,182,212,0.08)" strokeWidth="1" />
                  </g>
                ))}
                {/* Area labels */}
                {[
                  { name: 'Gulshan',     lat: 23.793, lng: 90.414 },
                  { name: 'Mirpur',      lat: 23.810, lng: 90.366 },
                  { name: 'Dhanmondi',   lat: 23.746, lng: 90.374 },
                  { name: 'Bashundhara', lat: 23.810, lng: 90.424 },
                  { name: 'Uttara',      lat: 23.876, lng: 90.380 },
                ].map(a => {
                  const p = project(a.lat, a.lng, dims.w, 440);
                  return <text key={a.name} x={p.x} y={p.y - 24} textAnchor="middle" fill="rgba(6,182,212,0.35)" fontSize="10" fontFamily="Inter,sans-serif">{a.name}</text>;
                })}
                {/* Field pins */}
                {filtered.map(f => {
                  const p   = project(f.lat, f.lng, dims.w, 440);
                  const col = SPORT_COLORS[f.sport] ?? '#7c3aed';
                  const isSel = selected?._id === f._id;
                  return (
                    <g key={f._id} onClick={() => handlePin(f)} style={{ cursor: 'pointer' }}>
                      {isSel && <circle cx={p.x} cy={p.y} r="22" fill={`${col}22`} stroke={col} strokeWidth="1" />}
                      <circle cx={p.x} cy={p.y} r={isSel ? 12 : 9} fill={f.available ? col : '#475569'} stroke="#030712" strokeWidth="2" />
                      <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={isSel ? "9" : "8"} fill="#030712" fontWeight="bold">{f.img}</text>
                      {isSel && <text x={p.x} y={p.y + 22} textAnchor="middle" fontSize="9" fill={col} fontWeight="700">{f.name.split(' ')[0]}</text>}
                    </g>
                  );
                })}
              </svg>
            )}
            {/* Legend */}
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(3,7,18,0.85)', borderRadius: '10px', padding: '0.5rem 0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {Object.entries(SPORT_COLORS).map(([s, c]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  {s}
                </div>
              ))}
            </div>
            {/* Count badge */}
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(124,58,237,0.8)', borderRadius: '20px', padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}>
              {filtered.length} field{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 480, overflowY: 'auto', paddingRight: '0.25rem' }}>
            {selected ? (
              <div style={{ ...S.card, border: `1px solid ${SPORT_COLORS[selected.sport] ?? '#7c3aed'}44` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ color: SPORT_COLORS[selected.sport] ?? '#a78bfa', fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.2rem' }}>{selected.sport} · {selected.area}</div>
                    <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem' }}>{selected.name}</div>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }} onClick={() => setSelected(null)}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={S.card}><div style={{ color: '#f59e0b', fontWeight: 800 }}>৳{selected.price}/hr</div><div style={{ color: '#64748b', fontSize: '0.7rem' }}>Price</div></div>
                  <div style={S.card}><div style={{ color: '#f1f5f9', fontWeight: 800 }}>⭐ {selected.rating}</div><div style={{ color: '#64748b', fontSize: '0.7rem' }}>Rating</div></div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ background: selected.available ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${selected.available ? '#10b981' : '#ef4444'}44`, color: selected.available ? '#6ee7b7' : '#fca5a5', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {selected.available ? '● Available' : '○ Occupied'}
                  </span>
                </div>
                {selected.available && (
                  <button
                    style={{ width: '100%', marginTop: '0.75rem', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.65rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem' }}
                    onClick={() => navigate(selected._id.startsWith('m') ? '/booking' : `/fields/${selected._id}`)}
                  >
                    Book Now →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: 'center', color: '#475569', fontSize: '0.82rem', padding: '1.5rem' }}>
                Click a pin on the map to see field details
              </div>
            )}

            {/* Field list */}
            {filtered.map(f => {
              const col = SPORT_COLORS[f.sport] ?? '#7c3aed';
              const isSel = selected?._id === f._id;
              return (
                <div
                  key={f._id}
                  style={{ ...S.card, cursor: 'pointer', border: `1px solid ${isSel ? col + '55' : 'rgba(255,255,255,0.08)'}`, background: isSel ? `${col}0a` : 'rgba(255,255,255,0.02)' }}
                  onClick={() => handlePin(f)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.available ? col : '#475569', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{f.area} · ৳{f.price}/hr</div>
                    </div>
                    <div style={{ color: '#f59e0b', fontSize: '0.72rem', flexShrink: 0 }}>⭐ {f.rating}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
