import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const SPORTS = ['Football', 'Basketball', 'Tennis', 'Cricket', 'Badminton', 'Swimming', 'Baseball', 'Volleyball'];
const SPORT_ICONS = { Football: '⚽', Basketball: '🏀', Tennis: '🎾', Cricket: '🏏', Badminton: '🏸', Swimming: '🏊', Baseball: '⚾', Volleyball: '🏐' };
const CITIES  = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];

/* ── FieldCard ── */
function FieldCard({ field, onBook, onDetails }) {
  const fieldId    = field._id || field.id;
  const fieldName  = field.name ?? 'Unknown Field';
  const locRaw     = field.location;
  const location   = typeof locRaw === 'string' ? locRaw : (locRaw?.address ?? 'N/A');
  const sport      = field.sport ?? field.sports?.[0] ?? 'N/A';
  const price      = field.pricing?.basePrice ?? field.price ?? 0;
  const ratingRaw  = field.rating?.average ?? field.rating ?? 0;
  const rating     = typeof ratingRaw === 'number' ? ratingRaw.toFixed(1) : ratingRaw;
  const imageUrl   = field.images?.[0]?.url ?? field.image ?? '';
  const features   = field.amenities ?? field.features ?? [];
  const openTime   = field.operatingHours?.open  ?? field.openTime  ?? '06:00';
  const closeTime  = field.operatingHours?.close ?? field.closeTime ?? '22:00';
  const isAvail    = field.isActive !== false;
  const availBg    = isAvail ? '#10b981' : '#f59e0b';

  return (
    <div style={S.card} className="field-card">
      <div style={{ position: 'relative', height: '176px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={fieldName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            className="field-card-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(59,130,246,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🏟️</div>
        )}
        <div style={{ position: 'absolute', top: '0.7rem', right: '0.7rem', background: 'rgba(0,0,0,0.72)', padding: '0.2rem 0.55rem', borderRadius: '999px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>⭐ {rating}</div>
        <div style={{ position: 'absolute', top: '0.7rem', left: '0.7rem', background: availBg, padding: '0.2rem 0.55rem', borderRadius: '999px', color: '#fff', fontSize: '0.73rem', fontWeight: 700 }}>
          {isAvail ? 'Available' : 'Unavailable'}
        </div>
      </div>
      <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
        <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem' }}>{fieldName}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>📍 {location}</span>
          {field.totalBookings > 0 && (
            <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
              {field.totalBookings} bookings
            </span>
          )}
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.83rem', marginBottom: '0.55rem' }}>🏅 {sport}</p>
        {field.description && (
          <p style={{ color: '#64748b', fontSize: '0.77rem', marginBottom: '0.65rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {field.description}
          </p>
        )}
        {features.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28rem', marginBottom: '0.65rem' }}>
            {features.slice(0, 3).map(f => (
              <span key={f} style={{ background: 'rgba(124,58,237,0.22)', color: '#c4b5fd', padding: '0.12rem 0.45rem', borderRadius: '999px', fontSize: '0.7rem' }}>{f}</span>
            ))}
          </div>
        )}
        <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '1rem' }}>🕒 {openTime} – {closeTime}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>৳{price}</span>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>/hr</span>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <button onClick={() => onDetails(fieldId)} style={S.detailBtn}>Details</button>
            <button onClick={() => onBook(fieldId)}    style={S.bookBtn}>Book Now</button>
          </div>
        </div>
      </div>
    </div>
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
    openTime: PropTypes.string, closeTime: PropTypes.string, isActive: PropTypes.bool, description: PropTypes.string,
    totalBookings: PropTypes.number,
  }).isRequired,
  onBook: PropTypes.func.isRequired,
  onDetails: PropTypes.func.isRequired,
};

/* ── Filter / sort helpers (outside component to keep cognitive complexity low) ── */
function fieldMatchesFilters(field, lc, sport, city, priceMax) {
  const name   = (field.name   ?? '').toLowerCase();
  const locRaw = field.location;
  const locStr = (typeof locRaw === 'string' ? locRaw : (locRaw?.address ?? '')).toLowerCase();
  const desc   = (field.description ?? '').toLowerCase();
  const fSport = field.sport ?? field.sports?.[0] ?? '';
  const fCity  = typeof locRaw === 'object' ? (locRaw?.city ?? '') : '';
  const price  = field.pricing?.basePrice ?? field.price ?? 0;

  return (
    (!lc || name.includes(lc) || locStr.includes(lc) || desc.includes(lc)) &&
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
  if (sortBy === 'popularity') return (b.totalBookings ?? b.bookings ?? 0) - (a.totalBookings ?? a.bookings ?? 0);
  return (a.name ?? '').localeCompare(b.name ?? '');
}

/* ── WorkingFields ── */
const WorkingFields = () => {
  const navigate = useNavigate();
  const [fields,          setFields]         = useState([]);
  const [filteredFields,  setFilteredFields] = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [error,           setError]          = useState('');
  const [searchTerm,      setSearchTerm]     = useState('');
  const [selectedSport,   setSelectedSport]  = useState('');
  const [selectedCity,    setSelectedCity]   = useState('');
  const [priceMax,        setPriceMax]       = useState(10000);
  const [sortBy,          setSortBy]         = useState('name');
  const [viewMode,        setViewMode]       = useState('grid');
  const [pageUser,        setPageUser]       = useState(null);
  const [currentPage,     setCurrentPage]    = useState(1);
  const [totalCount,      setTotalCount]     = useState(0);
  const PAGE_SIZE = 12;

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setPageUser(token && raw ? JSON.parse(raw) : null);
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
      setError(err.message || 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, [PAGE_SIZE]);

  useEffect(() => { fetchFields(1); }, [fetchFields]);

  useEffect(() => {
    const lc       = searchTerm.toLowerCase();
    const filtered = fields
      .filter(f => fieldMatchesFilters(f, lc, selectedSport, selectedCity, priceMax))
      .sort((a, b) => compareFields(a, b, sortBy));
    setFilteredFields(filtered);
  }, [fields, searchTerm, selectedSport, selectedCity, priceMax, sortBy]);

  const handleBook    = useCallback((id) => { navigate(`/booking?field=${id}`); }, [navigate]);
  const handleDetails = useCallback((id) => { navigate(`/fields/${id}`); },   [navigate]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSport('');
    setSelectedCity('');
    setPriceMax(10000);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🏟️</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' }}>Loading Premium Fields…</h2>
          <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f87171', marginBottom: '0.75rem' }}>Failed to Load Fields</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => fetchFields(1)} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  const gridStyle   = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' };
  const listStyle   = { display: 'flex', flexDirection: 'column', gap: '1rem' };
  const viewBtnBase = { padding: '0.45rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' };

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <style>{`
        .field-card { transition: transform 0.22s, box-shadow 0.22s; }
        .field-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(124,58,237,0.22); }
        .field-card:hover .field-card-img { transform: scale(1.06); }
        .filter-select { appearance: none; }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>🏟️</div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
            Premium Sports Fields
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '1.25rem' }}>Discover and book the finest sports facilities</p>
          {(pageUser?.role === 'admin' || pageUser?.role === 'manager' || pageUser?.role === 'fieldOwner') && (
            <button
              onClick={() => navigate('/add-field')}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}
            >
              ➕ Add New Field
            </button>
          )}
        </div>

        {/* Sport quick-filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem', justifyContent: 'center' }}>
          <button onClick={() => setSelectedSport('')}
            style={{ padding: '0.45rem 1.1rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', border: '1px solid', transition: 'all .18s', background: selectedSport ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#7c3aed,#ec4899)', color: selectedSport ? '#94a3b8' : '#fff', borderColor: selectedSport ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
            🏟️ All Sports
          </button>
          {SPORTS.map(s => (
            <button key={s} onClick={() => setSelectedSport(selectedSport === s ? '' : s)}
              style={{ padding: '0.45rem 1.1rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', border: '1px solid', transition: 'all .18s', background: selectedSport === s ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(255,255,255,0.04)', color: selectedSport === s ? '#fff' : '#94a3b8', borderColor: selectedSport === s ? 'transparent' : 'rgba(255,255,255,0.1)' }}>
              {SPORT_ICONS[s] ?? '🏅'} {s}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem' }}>🔍 Search &amp; Filter</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>

            <div>
              <label htmlFor="field-search" className="field-label">Search</label>
              <input id="field-search" type="text" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Name, location…"
                className="input-field" />
            </div>

            <div>
              <label htmlFor="field-sport" className="field-label">Sport</label>
              <select id="field-sport" value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className="input-field filter-select">
                <option value="">All Sports</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="field-city" className="field-label">City</label>
              <select id="field-city" value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="input-field filter-select">
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="field-sort" className="field-label">Sort By</label>
              <select id="field-sort" value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input-field filter-select">
                <option value="name">Name</option>
                <option value="price">Price (Low→High)</option>
                <option value="rating">Rating (High→Low)</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="price-range" className="field-label">
              Max Price: ৳{priceMax.toLocaleString()}/hr
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>৳0</span>
              <input id="price-range" type="range" min="500" max="10000" step="500"
                value={priceMax}
                onChange={e => setPriceMax(Number.parseInt(e.target.value, 10))}
                style={{ flex: 1, accentColor: '#7c3aed', cursor: 'pointer' }} />
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>৳10,000</span>
            </div>
          </div>

          {/* Footer row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Showing <strong style={{ color: '#a78bfa' }}>{filteredFields.length}</strong> of {fields.length} fields
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={clearFilters}
                style={{ ...viewBtnBase, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Clear Filters
              </button>
              <button onClick={() => setViewMode('grid')}
                style={{ ...viewBtnBase, background: viewMode === 'grid' ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: viewMode === 'grid' ? '#fff' : '#94a3b8' }}>
                ⊞ Grid
              </button>
              <button onClick={() => setViewMode('list')}
                style={{ ...viewBtnBase, background: viewMode === 'list' ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: viewMode === 'list' ? '#fff' : '#94a3b8' }}>
                ☰ List
              </button>
            </div>
          </div>
        </div>

        {/* Fields */}
        {filteredFields.length > 0 ? (
          <div style={viewMode === 'grid' ? gridStyle : listStyle}>
            {filteredFields.map(field => (
              <FieldCard key={field._id || field.id} field={field} onBook={handleBook} onDetails={handleDetails} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.5rem' }}>No Fields Found</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Try adjusting your search criteria</p>
            <button onClick={clearFilters} className="btn-primary">Clear All Filters</button>
          </div>
        )}

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => fetchFields(currentPage - 1)}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: currentPage === 1 ? '#334155' : '#94a3b8', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
              ← Prev
            </button>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Page {currentPage} of {Math.ceil(totalCount / PAGE_SIZE)}
            </span>
            <button
              disabled={currentPage >= Math.ceil(totalCount / PAGE_SIZE)}
              onClick={() => fetchFields(currentPage + 1)}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? '#334155' : '#94a3b8', cursor: currentPage >= Math.ceil(totalCount / PAGE_SIZE) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.88rem' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const S = {
  card:      { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(12px)' },
  detailBtn: { padding: '0.38rem 0.75rem', background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  bookBtn:   { padding: '0.38rem 0.75rem', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
};

export default WorkingFields;
