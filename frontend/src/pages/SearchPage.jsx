import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const SPORTS  = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Swimming', 'Baseball', 'Volleyball'];
const CITIES  = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];
const SORT_OPTIONS = [
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'bookings',   label: 'Most Popular' },
  { value: 'newest',     label: 'Newest' },
];
const SPORT_ICONS = { Football:'⚽', Basketball:'🏀', Tennis:'🎾', Cricket:'🏏', Badminton:'🏸', Swimming:'🏊', Baseball:'⚾', Volleyball:'🏐' };
const PAGE_SIZE = 9;

const S = {
  page:        { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
  header:      { maxWidth: 1200, margin: '0 auto 2rem', textAlign: 'center' },
  title:       { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
  sub:         { color: '#94a3b8', fontSize: '1rem', margin: '0 0 1.5rem' },
  searchBar:   { display: 'flex', gap: '0.5rem', maxWidth: 640, margin: '0 auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: '50px', padding: '0.45rem 0.45rem 0.45rem 1.25rem', alignItems: 'center' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '1rem', placeholder: '#64748b' },
  searchBtn:   { background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 700, padding: '0.55rem 1.4rem', borderRadius: '50px', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' },
  layout:      { display: 'grid', gridTemplateColumns: '252px 1fr', gap: '1.5rem', maxWidth: 1200, margin: '0 auto', alignItems: 'start' },
  sidebar:     { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.4rem', position: 'sticky', top: '1rem' },
  sLabel:      { color: '#a78bfa', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.55rem', display: 'block' },
  select:      { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '8px', color: '#f1f5f9', padding: '0.5rem 0.7rem', fontSize: '0.875rem', marginBottom: '1.1rem', outline: 'none', boxSizing: 'border-box' },
  priceRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.1rem' },
  priceInput:  { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '8px', color: '#f1f5f9', padding: '0.5rem 0.7rem', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  ratingRow:   { display: 'flex', gap: '0.4rem', marginBottom: '1.1rem', flexWrap: 'wrap' },
  clearBtn:    { width: '100%', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },
  resultTop:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' },
  countText:   { color: '#94a3b8', fontSize: '0.875rem' },
  sortSel:     { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '8px', color: '#f1f5f9', padding: '0.4rem 0.7rem', fontSize: '0.85rem', outline: 'none' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.1rem' },
  card:        { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s,transform 0.2s' },
  empty:       { textAlign: 'center', padding: '4rem 2rem', color: '#64748b' },
  pagination:  { display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '2rem' },
};

const ratingBtnStyle = (active) => ({
  background: active ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${active ? '#7c3aed' : 'rgba(255,255,255,0.11)'}`,
  color: active ? '#c4b5fd' : '#94a3b8',
  padding: '0.3rem 0.6rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: 600,
});
const pageBtnStyle = (active) => ({
  background: active ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
  color: '#f1f5f9',
  width: 36,
  height: 36,
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: active ? 700 : 400,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.9rem',
});

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fields,  setFields]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState({
    q:         searchParams.get('q')         || '',
    sport:     searchParams.get('sport')     || '',
    city:      searchParams.get('city')      || '',
    minPrice:  searchParams.get('minPrice')  || '',
    maxPrice:  searchParams.get('maxPrice')  || '',
    minRating: searchParams.get('minRating') || '',
    available: searchParams.get('available') || '',
    sort:      searchParams.get('sort')      || 'rating',
  });

  const doSearch = useCallback(async (f, pg) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (f.q)         p.set('search',    f.q);
      if (f.sport)     p.set('sport',     f.sport);
      if (f.city)      p.set('city',      f.city);
      if (f.minPrice)  p.set('minPrice',  f.minPrice);
      if (f.maxPrice)  p.set('maxPrice',  f.maxPrice);
      if (f.minRating) p.set('minRating', f.minRating);
      if (f.available) p.set('available', f.available);
      if (f.sort)      p.set('sort',      f.sort);
      p.set('page', pg); p.set('limit', PAGE_SIZE);
      const res  = await fetch(`/api/v1/fields?${p}`);
      const data = await res.json();
      if (data.success) {
        setFields(data.data?.fields || data.data || []);
        setTotal(data.total || data.data?.total || data.results || 0);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { doSearch(filters, page); }, [filters, page, doSearch]);

  const setFilter = (key, val) => {
    const next = { ...filters, [key]: val };
    setFilters(next); setPage(1);
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v) p.set(k, v); });
    setSearchParams(p);
  };

  const clearAll = () => {
    const blank = { q: '', sport: '', city: '', minPrice: '', maxPrice: '', minRating: '', available: '', sort: 'rating' };
    setFilters(blank); setPage(1); setSearchParams({});
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Find Your Perfect Field</h1>
        <p style={S.sub}>Search from hundreds of premium sports venues near you</p>
        <div style={S.searchBar}>
          <input
            style={S.searchInput}
            placeholder="Search by name, sport or location…"
            value={filters.q}
            onChange={e => setFilter('q', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(filters, 1)}
          />
          <button style={S.searchBtn} onClick={() => doSearch(filters, 1)}>Search</button>
        </div>
      </div>

      <div style={S.layout}>
        {/* ── Sidebar ── */}
        <aside style={S.sidebar}>
          <span style={S.sLabel}>Sport Type</span>
          <select style={S.select} value={filters.sport} onChange={e => setFilter('sport', e.target.value)}>
            <option value="">All Sports</option>
            {SPORTS.map(s => <option key={s} value={s}>{SPORT_ICONS[s]} {s}</option>)}
          </select>

          <span style={S.sLabel}>City</span>
          <select style={S.select} value={filters.city} onChange={e => setFilter('city', e.target.value)}>
            <option value="">All Cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <span style={S.sLabel}>Price Range (৳/hr)</span>
          <div style={S.priceRow}>
            <input style={S.priceInput} placeholder="Min" type="number" min="0" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} />
            <input style={S.priceInput} placeholder="Max" type="number" min="0" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} />
          </div>

          <span style={S.sLabel}>Min Rating</span>
          <div style={S.ratingRow}>
            {[{ v: '', l: 'Any' }, { v: '3', l: '⭐ 3+' }, { v: '4', l: '⭐ 4+' }, { v: '4.5', l: '⭐ 4.5+' }].map(r => (
              <button key={r.v} style={ratingBtnStyle(filters.minRating === r.v)} onClick={() => setFilter('minRating', r.v)}>{r.l}</button>
            ))}
          </div>

          <span style={S.sLabel}>Availability</span>
          <select style={S.select} value={filters.available} onChange={e => setFilter('available', e.target.value)}>
            <option value="">All Fields</option>
            <option value="true">Available Now</option>
          </select>

          <button style={S.clearBtn} onClick={clearAll}>✕ Clear All Filters</button>
        </aside>

        {/* ── Results ── */}
        <div>
          <div style={S.resultTop}>
            <span style={S.countText}>
              {loading ? 'Searching…' : `${total.toLocaleString()} field${total !== 1 ? 's' : ''} found`}
            </span>
            <select style={S.sortSel} value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={S.empty}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>🔍</div>
              <p>Finding the best fields for you…</p>
            </div>
          ) : fields.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟️</div>
              <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No fields found</p>
              <p>Try adjusting or clearing your filters</p>
            </div>
          ) : (
            <div style={S.grid}>
              {fields.map(field => {
                const id       = field._id || field.id;
                const price    = field.pricing?.basePrice ?? field.price ?? 0;
                const rating   = Number(field.rating?.average ?? field.rating ?? 0).toFixed(1);
                const location = typeof field.location === 'string' ? field.location : (field.location?.city ?? field.location?.address ?? 'N/A');
                const sport    = field.sport ?? field.sports?.[0] ?? 'N/A';
                const img      = field.images?.[0]?.url ?? field.image ?? '';
                const isAvail  = field.isActive !== false;
                return (
                  <div
                    key={id}
                    style={S.card}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}
                    onClick={() => navigate(`/fields/${id}`)}
                  >
                    <div style={{ height: 160, background: img ? `url(${img}) center/cover no-repeat` : 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', position: 'relative' }}>
                      {!img && (SPORT_ICONS[sport] || '🏟️')}
                      <div style={{ position: 'absolute', top: 8, left: 8, background: isAvail ? '#10b981' : '#f59e0b', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
                        {isAvail ? 'Available' : 'Busy'}
                      </div>
                      <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
                        ⭐ {rating}
                      </div>
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ margin: '0 0 0.3rem', color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' }}>{field.name}</h3>
                      <p  style={{ margin: '0 0 0.2rem', color: '#94a3b8', fontSize: '0.8rem' }}>📍 {location}</p>
                      <p  style={{ margin: '0 0 0.8rem', color: '#94a3b8', fontSize: '0.8rem' }}>🏅 {sport}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <span style={{ fontWeight: 900, fontSize: '1.15rem', background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>৳{price}</span>
                          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>/hr</span>
                        </span>
                        <button
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', padding: '0.38rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                          onClick={e => { e.stopPropagation(); navigate(`/booking?fieldId=${id}`); }}
                        >Book Now</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={S.pagination}>
              <button style={pageBtnStyle(false)} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const num = Math.max(1, Math.min(page - 3 + i, totalPages - 6 + i));
                return <button key={num} style={pageBtnStyle(num === page)} onClick={() => setPage(num)}>{num}</button>;
              })}
              <button style={pageBtnStyle(false)} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
