import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const SPORTS = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Swimming', 'Baseball', 'Volleyball'];
const PAGE_SIZE    = 12;
const getFavorites  = () => { try { return JSON.parse(localStorage.getItem('favoriteFields') || '[]'); } catch { return []; } };
const saveFavorites = (ids) => localStorage.setItem('favoriteFields', JSON.stringify(ids));
const SPORT_ICONS   = { Football:'⚽', Basketball:'🏀', Tennis:'🎾', Cricket:'🏏', Badminton:'🏸', Swimming:'🏊', Baseball:'⚾', Volleyball:'🏐' };
const CITIES = ['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh'];

const S = {
  card:      { background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', overflow:'hidden', backdropFilter:'blur(14px)', transition:'all 280ms' },
  detailBtn: { padding:'0.38rem 0.85rem', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.25)', color:'#FBBF24', borderRadius:'8px', fontSize:'0.78rem', fontWeight:700, cursor:'pointer', transition:'all 150ms' },
  bookBtn:   { padding:'0.38rem 0.85rem', background:'#FBBF24', border:'none', color:'#111111', borderRadius:'8px', fontSize:'0.78rem', fontWeight:800, cursor:'pointer', fontFamily:"'Anybody',sans-serif", transition:'all 150ms' },
  chip: (active) => ({ padding:'0.38rem 1rem', borderRadius:'999px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', border:'1px solid', transition:'all 180ms', background: active ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#FBBF24' : '#506070', borderColor: active ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)' }),
  label: { display:'block', color:'#506070', fontSize:'0.72rem', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'0.4rem' },
  input: { width:'100%', background:'rgba(13,28,45,0.6)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'0.55rem 0.85rem', color:'#f0f6ff', fontSize:'0.875rem', outline:'none', fontFamily:"'Inter',sans-serif", boxSizing:'border-box' },
};

/* ── FieldCard ── */
function FieldCard({ field, onBook, onDetails, isFav, onToggleFav }) {
  const fieldId   = field._id || field.id;
  const fieldName = field.name ?? 'Unknown Field';
  const locRaw    = field.location;
  const location  = typeof locRaw === 'string' ? locRaw : (locRaw?.address ?? 'N/A');
  const sport     = field.sport ?? field.sports?.[0] ?? 'N/A';
  const price     = field.pricing?.basePrice ?? field.price ?? 0;
  const ratingRaw = field.rating?.average ?? field.rating ?? 0;
  const rating    = typeof ratingRaw === 'number' ? ratingRaw.toFixed(1) : ratingRaw;
  const imageUrl  = field.images?.[0]?.url ?? field.image ?? '';
  const features  = field.amenities ?? field.features ?? [];
  const openTime  = field.operatingHours?.open  ?? field.openTime  ?? '06:00';
  const closeTime = field.operatingHours?.close ?? field.closeTime ?? '22:00';
  const isAvail   = field.isActive !== false;

  return (
    <article style={S.card} className="field-card">
      <div style={{ position:'relative', height:'180px', overflow:'hidden' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={fieldName}
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s' }}
            className="field-card-img"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,rgba(251,191,36,0.08),rgba(255,94,7,0.06))', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'4rem', color:'rgba(251,191,36,0.3)' }}>stadium</span>
          </div>
        )}
        {/* Rating badge */}
        <div style={{ position:'absolute', top:'0.65rem', right:'0.65rem', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', padding:'0.2rem 0.55rem', borderRadius:'999px', display:'flex', alignItems:'center', gap:'0.3rem' }}>
          <span style={{ color:'#FBBF24', fontSize:'0.72rem' }}>★</span>
          <span style={{ color:'#f0f6ff', fontSize:'0.78rem', fontWeight:700 }}>{rating}</span>
        </div>
        {/* Availability badge */}
        <div style={{ position:'absolute', top:'0.65rem', left:'0.65rem' }}>
          <div style={{ background: isAvail ? 'rgba(251,191,36,0.2)' : 'rgba(255,94,7,0.2)', border:`1px solid ${isAvail ? 'rgba(251,191,36,0.4)' : 'rgba(255,94,7,0.4)'}`, padding:'0.18rem 0.55rem', borderRadius:'999px', color: isAvail ? '#FBBF24' : '#ff5e07', fontSize:'0.72rem', fontWeight:700 }}>
            {isAvail ? 'Available' : 'Unavailable'}
          </div>
        </div>
        {/* Favourite */}
        <button type="button" onClick={() => onToggleFav(fieldId)}
          style={{ position:'absolute', top:'0.55rem', right:'2.6rem', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', border:'none', borderRadius:'50%', width:'28px', height:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: isFav ? '#f87171' : 'rgba(255,255,255,0.55)', fontSize:'0.85rem', transition:'color .2s' }}
          aria-label={isFav ? 'Remove from saved' : 'Save field'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      <div style={{ padding:'1.1rem 1.2rem 1.25rem' }}>
        <h3 style={{ color:'#f0f6ff', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', marginBottom:'0.3rem' }}>{fieldName}</h3>
        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginBottom:'0.4rem', flexWrap:'wrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'0.85rem', color:'#506070' }}>location_on</span>
          <span style={{ color:'#8ba3be', fontSize:'0.82rem' }}>{location}</span>
          {(field.totalBookings ?? 0) > 0 && (
            <span style={{ background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.18)', color:'#FBBF24', fontSize:'0.68rem', fontWeight:700, padding:'0.1rem 0.45rem', borderRadius:'999px' }}>
              {field.totalBookings} bookings
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', marginBottom:'0.55rem' }}>
          <span style={{ fontSize:'0.85rem' }}>{SPORT_ICONS[sport] ?? '🏅'}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#506070', letterSpacing:'0.05em' }}>{sport}</span>
          <span style={{ color:'rgba(255,255,255,0.1)', margin:'0 0.1rem' }}>·</span>
          <span className="material-symbols-outlined" style={{ fontSize:'0.8rem', color:'#506070' }}>schedule</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#506070' }}>{openTime}–{closeTime}</span>
        </div>
        {field.description && (
          <p style={{ color:'#506070', fontSize:'0.8rem', marginBottom:'0.6rem', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', lineHeight:1.55 }}>
            {field.description}
          </p>
        )}
        {features.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', marginBottom:'0.75rem' }}>
            {features.slice(0,3).map(f => (
              <span key={f} style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.15)', color:'#8ba3be', padding:'0.1rem 0.45rem', borderRadius:'999px', fontSize:'0.68rem' }}>{f}</span>
            ))}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'0.25rem' }}>
          <div>
            <span style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.35rem', color:'#FBBF24' }}>৳{price}</span>
            <span style={{ color:'#506070', fontSize:'0.75rem' }}>/hr</span>
          </div>
          <div style={{ display:'flex', gap:'0.4rem' }}>
            <button onClick={() => onDetails(fieldId)} style={S.detailBtn}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(251,191,36,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(251,191,36,0.08)'; }}
            >Details</button>
            <button onClick={() => onBook(fieldId)} style={S.bookBtn}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; }}
            >Book</button>
          </div>
        </div>
      </div>
    </article>
  );
}

FieldCard.propTypes = {
  field: PropTypes.shape({
    _id: PropTypes.string, id: PropTypes.string, name: PropTypes.string,
    location: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({ address: PropTypes.string })]),
    sport: PropTypes.string, sports: PropTypes.arrayOf(PropTypes.string),
    price: PropTypes.number, pricing: PropTypes.shape({ basePrice: PropTypes.number }),
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({ average: PropTypes.number })]),
    images: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })), image: PropTypes.string,
    amenities: PropTypes.arrayOf(PropTypes.string), features: PropTypes.arrayOf(PropTypes.string),
    operatingHours: PropTypes.shape({ open: PropTypes.string, close: PropTypes.string }),
    openTime: PropTypes.string, closeTime: PropTypes.string, isActive: PropTypes.bool,
    description: PropTypes.string, totalBookings: PropTypes.number,
  }).isRequired,
  onBook:      PropTypes.func.isRequired,
  onDetails:   PropTypes.func.isRequired,
  isFav:       PropTypes.bool.isRequired,
  onToggleFav: PropTypes.func.isRequired,
};

/* ── Filter helpers ── */
function fieldMatchesSaved(field, favorites) {
  return favorites.includes(field._id || field.id);
}

function fieldMatchesFilters(field, lc, sport, city, priceMax) {
  const name   = (field.name ?? '').toLowerCase();
  const locRaw = field.location;
  const locStr = (typeof locRaw === 'string' ? locRaw : (locRaw?.address ?? '')).toLowerCase();
  const desc   = (field.description ?? '').toLowerCase();
  const fSport = field.sport ?? field.sports?.[0] ?? '';
  const fCity  = typeof locRaw === 'object' ? (locRaw?.city ?? '') : '';
  const price  = field.pricing?.basePrice ?? field.price ?? 0;
  return (
    (!lc    || name.includes(lc) || locStr.includes(lc) || desc.includes(lc)) &&
    (!sport || fSport === sport) &&
    (!city  || fCity  === city)  &&
    price <= priceMax
  );
}

function compareFields(a, b, sortBy) {
  const priceA = a.pricing?.basePrice ?? a.price ?? 0;
  const priceB = b.pricing?.basePrice ?? b.price ?? 0;
  if (sortBy === 'price')      return priceA - priceB;
  if (sortBy === 'rating')     return (b.rating?.average ?? b.rating ?? 0) - (a.rating?.average ?? a.rating ?? 0);
  if (sortBy === 'popularity') return (b.totalBookings ?? 0) - (a.totalBookings ?? 0);
  return (a.name ?? '').localeCompare(b.name ?? '');
}

const MANAGER_ROLES = new Set(['admin', 'manager', 'fieldOwner']);

/* ── WorkingFields ── */
const WorkingFields = () => {
  const navigate = useNavigate();
  const [fields,         setFields]        = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState('');
  const [searchTerm,     setSearchTerm]    = useState('');
  const [selectedSport,  setSelectedSport] = useState('');
  const [selectedCity,   setSelectedCity]  = useState('');
  const [priceMax,       setPriceMax]      = useState(10000);
  const [sortBy,         setSortBy]        = useState('name');
  const [viewMode,       setViewMode]      = useState('grid');
  const [pageUser,       setPageUser]      = useState(null);
  const [currentPage,    setCurrentPage]   = useState(1);
  const [totalCount,     setTotalCount]    = useState(0);
  const [favorites,      setFavorites]     = useState(getFavorites);
  const [showSaved,      setShowSaved]     = useState(false);

  const canManageFields = MANAGER_ROLES.has(pageUser?.role);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setPageUser(token && raw ? JSON.parse(raw) : null);
  }, []);

  const toggleFavorite = useCallback((fieldId) => {
    setFavorites(prev => {
      const next = prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId];
      saveFavorites(next);
      return next;
    });
  }, []);

  const fetchFields = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/v1/fields?limit=${PAGE_SIZE}&page=${page}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load fields');
      const list  = data.data?.fields ?? data.data ?? [];
      const total = data.data?.total  ?? data.total ?? list.length;
      setFields(list);
      setFilteredFields(list);
      setTotalCount(total);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFields(1); }, [fetchFields]);

  useEffect(() => {
    const lc = searchTerm.toLowerCase();
    const filterFn = showSaved
      ? f => fieldMatchesSaved(f, favorites)
      : f => fieldMatchesFilters(f, lc, selectedSport, selectedCity, priceMax);
    const filtered = fields.filter(filterFn).sort((a, b) => compareFields(a, b, sortBy));
    setFilteredFields(filtered);
  }, [fields, searchTerm, selectedSport, selectedCity, priceMax, sortBy, showSaved, favorites]);

  const handleBook    = useCallback((id) => { navigate(`/booking?field=${id}`); }, [navigate]);
  const handleDetails = useCallback((id) => { navigate(`/fields/${id}`); },       [navigate]);

  const clearFilters = () => { setSearchTerm(''); setSelectedSport(''); setSelectedCity(''); setPriceMax(10000); };

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#051424', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'4rem', color:'rgba(251,191,36,0.3)', display:'block', marginBottom:'1.5rem' }}>stadium</span>
          <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.8rem', color:'#f0f6ff', marginBottom:'1rem' }}>Loading Fields…</h2>
          <div style={{ width:'40px', height:'40px', border:'3px solid rgba(251,191,36,0.2)', borderTop:'3px solid #FBBF24', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight:'100vh', background:'#051424', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', maxWidth:'420px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'3rem', color:'#f87171', display:'block', marginBottom:'1rem' }}>error</span>
          <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.6rem', color:'#f87171', marginBottom:'0.75rem' }}>Failed to Load Fields</h2>
          <p style={{ color:'#506070', marginBottom:'1.5rem' }}>{error}</p>
          <button onClick={() => fetchFields(1)} style={{ background:'#FBBF24', color:'#111111', border:'none', borderRadius:'10px', padding:'0.7rem 1.75rem', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.9rem', cursor:'pointer' }}>Try Again</button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <style>{`
        .field-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,0.5),0 0 0 1px rgba(251,191,36,0.18); }
        .field-card:hover .field-card-img { transform:scale(1.06); }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 1.25rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Explore Venues</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(2rem,5vw,3.2rem)', color:'#f0f6ff', margin:'0.5rem 0 0.75rem', letterSpacing:'-0.025em' }}>Premium Sports Fields</h1>
          <p style={{ color:'#506070', fontSize:'1rem', marginBottom: canManageFields ? '1.25rem' : 0 }}>
            Discover and book the finest sports facilities in Bangladesh
          </p>
          {canManageFields && (
            <button onClick={() => navigate('/add-field')} style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', background:'#FBBF24', color:'#111111', border:'none', borderRadius:'10px', padding:'0.65rem 1.5rem', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.9rem', cursor:'pointer', boxShadow:'0 4px 20px rgba(251,191,36,0.3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'1rem' }}>add_location_alt</span>
              <span>Add New Field</span>
            </button>
          )}
        </div>

        {/* Sport chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1.25rem', justifyContent:'center' }}>
          <button onClick={() => setShowSaved(v => !v)} style={S.chip(showSaved)}>
            {showSaved ? '❤️' : '🤍'} Saved ({favorites.length})
          </button>
          <button onClick={() => setSelectedSport('')} style={S.chip(!selectedSport && !showSaved)}>
            🏟️ All Sports
          </button>
          {SPORTS.map(s => (
            <button key={s} onClick={() => setSelectedSport(selectedSport === s ? '' : s)} style={S.chip(selectedSport === s)}>
              {SPORT_ICONS[s] ?? '🏅'} {s}
            </button>
          ))}
        </div>

        {/* Filter panel */}
        <div style={{ background:'rgba(13,28,45,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem', marginBottom:'2rem', backdropFilter:'blur(16px)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
            <div>
              <label htmlFor="field-search" style={S.label}>Search</label>
              <input id="field-search" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Name, location…" style={S.input} />
            </div>
            <div>
              <label htmlFor="field-sport" style={S.label}>Sport</label>
              <select id="field-sport" value={selectedSport} onChange={e => setSelectedSport(e.target.value)} style={{ ...S.input, appearance:'none', cursor:'pointer' }}>
                <option value="">All Sports</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="field-city" style={S.label}>City</label>
              <select id="field-city" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ ...S.input, appearance:'none', cursor:'pointer' }}>
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="field-sort" style={S.label}>Sort By</label>
              <select id="field-sort" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...S.input, appearance:'none', cursor:'pointer' }}>
                <option value="name">Name A–Z</option>
                <option value="price">Price Low→High</option>
                <option value="rating">Rating High→Low</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom:'1.25rem' }}>
            <label htmlFor="price-range" style={S.label}>Max Price: ৳{priceMax.toLocaleString()}/hr</label>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.72rem' }}>৳0</span>
              <input id="price-range" type="range" min="500" max="10000" step="500" value={priceMax}
                onChange={e => setPriceMax(Number.parseInt(e.target.value, 10))}
                style={{ flex:1, accentColor:'#FBBF24', cursor:'pointer' }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.72rem' }}>৳10,000</span>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.78rem' }}>
              <span style={{ color:'#FBBF24', fontWeight:700 }}>{filteredFields.length}</span> of {fields.length} fields
            </span>
            <div style={{ display:'flex', gap:'0.4rem', alignItems:'center' }}>
              <button onClick={clearFilters} style={{ padding:'0.42rem 0.9rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#506070', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>Clear</button>
              <button onClick={() => setViewMode('grid')} style={{ padding:'0.42rem 0.75rem', borderRadius:'8px', border:'none', background: viewMode==='grid' ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)', color: viewMode==='grid' ? '#FBBF24' : '#506070', cursor:'pointer', fontSize:'0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1rem', display:'block' }}>grid_view</span>
              </button>
              <button onClick={() => setViewMode('list')} style={{ padding:'0.42rem 0.75rem', borderRadius:'8px', border:'none', background: viewMode==='list' ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)', color: viewMode==='list' ? '#FBBF24' : '#506070', cursor:'pointer', fontSize:'0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1rem', display:'block' }}>view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid / List */}
        {filteredFields.length > 0 ? (
          <div style={ viewMode === 'grid'
            ? { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.25rem' }
            : { display:'flex', flexDirection:'column', gap:'0.85rem' }
          }>
            {filteredFields.map(field => (
              <FieldCard key={field._id || field.id} field={field}
                onBook={handleBook} onDetails={handleDetails}
                isFav={favorites.includes(field._id || field.id)}
                onToggleFav={toggleFavorite} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'6rem 1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'4rem', color:'rgba(251,191,36,0.2)', display:'block', marginBottom:'1rem' }}>search_off</span>
            <h3 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1.5rem', color:'#f0f6ff', marginBottom:'0.5rem' }}>No Fields Found</h3>
            <p style={{ color:'#506070', marginBottom:'1.5rem' }}>Try adjusting your search or filters</p>
            <button onClick={clearFilters} style={{ background:'#FBBF24', color:'#111111', border:'none', borderRadius:'10px', padding:'0.65rem 1.5rem', fontFamily:"'Anybody',sans-serif", fontWeight:800, cursor:'pointer' }}>Clear Filters</button>
          </div>
        )}

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'0.75rem', marginTop:'3rem' }}>
            <button disabled={currentPage === 1} onClick={() => fetchFields(currentPage - 1)}
              style={{ padding:'0.5rem 1.25rem', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: currentPage===1 ? '#273647' : '#8ba3be', cursor: currentPage===1 ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'0.88rem', transition:'all 150ms' }}>
              ← Prev
            </button>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.82rem' }}>
              {currentPage} / {totalPages}
            </span>
            <button disabled={currentPage >= totalPages} onClick={() => fetchFields(currentPage + 1)}
              style={{ padding:'0.5rem 1.25rem', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color: currentPage>=totalPages ? '#273647' : '#8ba3be', cursor: currentPage>=totalPages ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'0.88rem', transition:'all 150ms' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingFields;
