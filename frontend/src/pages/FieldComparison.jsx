import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_FIELDS = [
  { _id: 'm1', name: 'Champions Arena', sport: 'Football', location: 'Gulshan, Dhaka', pricePerHour: 1200, rating: 4.8, reviewCount: 142, capacity: 22, surface: 'Artificial Grass', lighting: true, parking: true, changing: true, showers: true, cafeteria: true, accessibility: false, size: '100×64m', openHours: '6 AM – 11 PM', images: [], amenities: ['WiFi', 'CCTV', 'Locker Room', 'First Aid'] },
  { _id: 'm2', name: 'Victory Ground',   sport: 'Football', location: 'Dhanmondi, Dhaka', pricePerHour: 900, rating: 4.5, reviewCount: 98, capacity: 18, surface: 'Natural Grass', lighting: true, parking: false, changing: true, showers: false, cafeteria: false, accessibility: true, size: '90×60m', openHours: '7 AM – 10 PM', images: [], amenities: ['CCTV', 'Locker Room'] },
  { _id: 'm3', name: 'Elite Turf',       sport: 'Football', location: 'Banani, Dhaka', pricePerHour: 1500, rating: 4.9, reviewCount: 211, capacity: 22, surface: 'Hybrid Grass', lighting: true, parking: true, changing: true, showers: true, cafeteria: true, accessibility: true, size: '105×68m', openHours: '5 AM – 12 AM', images: [], amenities: ['WiFi', 'CCTV', 'Locker Room', 'First Aid', 'Massage Room', 'Pro Shop'] },
  { _id: 'm4', name: 'Badminton Palace', sport: 'Badminton', location: 'Uttara, Dhaka', pricePerHour: 500, rating: 4.6, reviewCount: 76, capacity: 4, surface: 'Wooden Court', lighting: true, parking: true, changing: true, showers: false, cafeteria: true, accessibility: false, size: '13.4×6.1m', openHours: '6 AM – 10 PM', images: [], amenities: ['WiFi', 'Equipment Rental'] },
  { _id: 'm5', name: 'Tennis Hub',       sport: 'Tennis', location: 'Mirpur, Dhaka', pricePerHour: 700, rating: 4.3, reviewCount: 54, capacity: 4, surface: 'Hard Court', lighting: true, parking: false, changing: false, showers: false, cafeteria: false, accessibility: true, size: '23.8×8.2m', openHours: '7 AM – 9 PM', images: [], amenities: ['Ball Machine'] },
];

const ROWS = [
  { key: 'sport',        label: 'Sport' },
  { key: 'location',     label: 'Location' },
  { key: 'pricePerHour', label: 'Price / Hour', fmt: (v) => `৳${v?.toLocaleString()}` },
  { key: 'rating',       label: 'Rating', fmt: (v) => `⭐ ${v} / 5.0` },
  { key: 'reviewCount',  label: 'Reviews', fmt: (v) => `${v} verified` },
  { key: 'capacity',     label: 'Capacity', fmt: (v) => `${v} players` },
  { key: 'surface',      label: 'Surface Type' },
  { key: 'size',         label: 'Field Size' },
  { key: 'openHours',    label: 'Open Hours' },
  { key: 'lighting',     label: 'Floodlights',    bool: true },
  { key: 'parking',      label: 'Parking',         bool: true },
  { key: 'changing',     label: 'Changing Rooms',  bool: true },
  { key: 'showers',      label: 'Showers',         bool: true },
  { key: 'cafeteria',    label: 'Cafeteria',        bool: true },
  { key: 'accessibility',label: 'Accessibility',   bool: true },
];

const MAX_COMPARE = 3;

const FieldComparison = () => {
  const navigate    = useNavigate();
  const [fields,    setFields]    = useState([]);
  const [selected,  setSelected]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [sportFilt, setSportFilt] = useState('All');

  useEffect(() => {
    setLoading(true);
    authFetch('/api/v1/fields?limit=50')
      .then(r => r.json())
      .then(d => setFields((d.success ? (d.data?.fields ?? d.data) : null) || MOCK_FIELDS))
      .catch(() => setFields(MOCK_FIELDS))
      .finally(() => setLoading(false));
  }, []);

  const sports    = ['All', ...new Set(fields.map(f => f.sport).filter(Boolean))];
  const displayed = fields.filter(f =>
    (sportFilt === 'All' || f.sport === sportFilt) &&
    (!search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.location?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (field) => {
    setSelected(prev => {
      if (prev.find(f => f._id === field._id)) return prev.filter(f => f._id !== field._id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, field];
    });
  };

  const isSelected = (id) => selected.some(f => f._id === id);

  const getBest = (key) => {
    if (selected.length < 2) return null;
    const vals = selected.map(f => typeof f[key] === 'number' ? f[key] : null);
    if (vals.some(v => v === null)) return null;
    const isBetter = key === 'pricePerHour' ? Math.min(...vals) : Math.max(...vals);
    return isBetter;
  };

  const S = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:   { maxWidth: 1100, margin: '0 auto' },
    title:  { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#ec4899,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    search: { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#f1f5f9', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
    chip:   (a) => ({ background: a ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${a ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, color: a ? '#f1f5f9' : '#94a3b8', padding: '0.35rem 0.85rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: a ? 700 : 500 }),
    card:   (sel) => ({ background: sel ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.18s', marginBottom: '0.5rem' }),
    addBtn: (sel, full) => ({ background: sel ? 'rgba(239,68,68,0.15)' : full ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.2)', border: `1px solid ${sel ? 'rgba(239,68,68,0.4)' : full ? 'rgba(255,255,255,0.08)' : 'rgba(124,58,237,0.4)'}`, color: sel ? '#f87171' : full ? '#475569' : '#a78bfa', fontWeight: 700, padding: '0.4rem 0.85rem', borderRadius: '8px', cursor: sel || !full ? 'pointer' : 'not-allowed', fontSize: '0.78rem', flexShrink: 0 }),
    tbl:    { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
    th:     (i) => ({ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800, color: i === 0 ? '#64748b' : '#f1f5f9', background: i === 0 ? 'transparent' : 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: i === 0 ? '0.75rem' : '0.9rem', textTransform: i === 0 ? 'uppercase' : 'none', letterSpacing: i === 0 ? '0.05em' : 'normal' }),
    td:     (highlight) => ({ padding: '0.7rem 1rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', color: highlight ? '#6ee7b7' : '#f1f5f9', fontWeight: highlight ? 800 : 500, background: highlight ? 'rgba(16,185,129,0.06)' : 'transparent' }),
    tdLeft: { padding: '0.7rem 1rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 },
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={S.title}>⚖️ Field Comparison</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Select up to {MAX_COMPARE} fields to compare side by side</p>
        </div>

        {/* Selected banner */}
        {selected.length > 0 && (
          <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '14px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.875rem' }}>Comparing:</span>
            {selected.map(f => (
              <span key={f._id} style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {f.name}
                <button onClick={(e) => { e.stopPropagation(); setSelected(prev => prev.filter(x => x._id !== f._id)); }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '0.9rem' }}>×</button>
              </span>
            ))}
            {selected.length < MAX_COMPARE && (
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({MAX_COMPARE - selected.length} more slot{MAX_COMPARE - selected.length !== 1 ? 's' : ''} available)</span>
            )}
          </div>
        )}

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input style={{ ...S.search, flex: 1, minWidth: 200 }} placeholder="🔍 Search fields by name or location…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {sports.map(s => <button key={s} style={S.chip(sportFilt === s)} onClick={() => setSportFilt(s)}>{s}</button>)}
        </div>

        {/* Field list */}
        <div style={{ marginBottom: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading fields…</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>No fields found</div>
          ) : (
            displayed.map(field => {
              const sel  = isSelected(field._id);
              const full = selected.length >= MAX_COMPARE && !sel;
              return (
                <div key={field._id} style={S.card(sel)} onClick={() => !full && toggle(field)}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.2rem' }}>{field.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{field.sport} · {field.location} · ৳{field.pricePerHour}/hr · ⭐ {field.rating}</div>
                  </div>
                  <button style={S.addBtn(sel, full)} onClick={(e) => { e.stopPropagation(); if (!full || sel) toggle(field); }}>
                    {sel ? '− Remove' : full ? 'Full' : '+ Add'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Comparison table */}
        {selected.length >= 2 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden', marginBottom: '2rem' }}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.1rem', padding: '1.25rem 1.5rem', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>📊 Comparison</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.tbl}>
                <thead>
                  <tr>
                    <th style={S.th(0)}>Feature</th>
                    {selected.map((f, i) => <th key={f._id} style={S.th(i + 1)}>{f.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(row => {
                    const best = getBest(row.key);
                    return (
                      <tr key={row.key}>
                        <td style={S.tdLeft}>{row.label}</td>
                        {selected.map(f => {
                          const val       = f[row.key];
                          const highlight = typeof val === 'number' && best !== null && val === best;
                          let display;
                          if (row.bool)      display = val ? <span style={{ color: '#6ee7b7' }}>✓</span> : <span style={{ color: '#475569' }}>✕</span>;
                          else if (row.fmt)  display = row.fmt(val);
                          else               display = val ?? '—';
                          return <td key={f._id} style={S.td(highlight)}>{display}</td>;
                        })}
                      </tr>
                    );
                  })}
                  <tr>
                    <td style={S.tdLeft}>Amenities</td>
                    {selected.map(f => (
                      <td key={f._id} style={{ padding: '0.7rem 1rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center' }}>
                          {(f.amenities || []).map(a => <span key={a} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem' }}>{a}</span>)}
                          {(!f.amenities || f.amenities.length === 0) && <span style={{ color: '#475569' }}>—</span>}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={S.tdLeft}></td>
                    {selected.map(f => (
                      <td key={f._id} style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem' }}
                          onClick={() => navigate(f._id.startsWith('m') ? '/booking' : `/fields/${f._id}`)}
                        >
                          Book Now →
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected.length === 1 && (
          <div style={{ textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '2rem' }}>
            Select at least one more field to see the comparison table
          </div>
        )}

        {selected.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
            <p>Select 2–3 fields above to start comparing</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldComparison;
