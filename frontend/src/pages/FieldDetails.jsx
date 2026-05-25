import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/* ── ReviewCard ── */
function ReviewCard({ review }) {
  const initials = `${review.user?.firstName?.[0] ?? '?'}${review.user?.lastName?.[0] ?? ''}`.toUpperCase();
  const name     = `${review.user?.firstName ?? ''} ${review.user?.lastName ?? ''}`.trim() || 'Anonymous';
  const date     = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '';
  const stars    = Math.round(review.rating ?? 0);
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.88rem' }}>{name}</span>
            <span style={{ color: '#64748b', fontSize: '0.76rem' }}>{date}</span>
          </div>
          <div style={{ color: '#fbbf24', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </div>
        </div>
      </div>
      {review.comment && <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{review.comment}</p>}
    </div>
  );
}
ReviewCard.propTypes = {
  review: PropTypes.shape({
    user: PropTypes.shape({ firstName: PropTypes.string, lastName: PropTypes.string }),
    rating: PropTypes.number,
    comment: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
};

/* ── DetailRow ── */
function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.5rem' }}>
      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}
DetailRow.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string };
DetailRow.defaultProps = { value: '' };

/* ── FieldDetails ── */
const FieldDetails = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [field,   setField]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [imgIdx,  setImgIdx]  = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [fRes, rRes] = await Promise.all([
        fetch(`/api/v1/fields/${id}`),
        fetch(`/api/v1/fields/${id}/reviews`),
      ]);
      const [fData, rData] = await Promise.all([fRes.json(), rRes.json()]);
      if (fRes.ok === false) throw new Error(fData.message || 'Failed to load field');
      setField(fData.data?.field ?? fData.data);
      setReviews(rData.data?.reviews ?? rData.data ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load field');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏟️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' }}>Loading Field…</h2>
          <div className="spinner" style={{ width: '44px', height: '44px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171', marginBottom: '0.75rem' }}>Field Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => navigate('/fields')} className="btn-primary">Browse Fields</button>
        </div>
      </div>
    );
  }

  const images      = field.images ?? [];
  const imgUrl      = images[imgIdx]?.url ?? images[0]?.url ?? '';
  const locAddress  = field.location?.address ?? '';
  const locCity     = field.location?.city    ?? '';
  const locText     = [locAddress, locCity].filter(Boolean).join(', ') || 'N/A';
  const sport       = field.sport ?? field.sports?.[0] ?? 'N/A';
  const price       = field.pricing?.basePrice ?? field.pricing?.hourly ?? 0;
  const avgRating   = field.rating?.average ?? 0;
  const reviewCount = field.rating?.count ?? reviews.length;
  const openTime    = field.operatingHours?.open  ?? '06:00';
  const closeTime   = field.operatingHours?.close ?? '22:00';
  const amenities   = Array.isArray(field.amenities)
    ? field.amenities
    : Object.keys(field.amenities ?? {}).filter(k => field.amenities[k]);
  const isAvail     = field.isActive !== false;
  const availClr    = isAvail ? '#10b981' : '#f59e0b';

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Back */}
        <button onClick={() => navigate('/fields')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.5rem', padding: 0 }}>
          ← Back to Fields
        </button>

        {/* Hero image */}
        <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '18px', overflow: 'hidden', marginBottom: '1.75rem', background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(59,130,246,0.2))' }}>
          {imgUrl ? (
            <img src={imgUrl} alt={field.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>🏟️</div>
          )}
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.4rem' }}>
              {images.map((img, i) => (
                <button key={img.url ?? i} onClick={() => setImgIdx(i)}
                  style={{ width: '8px', height: '8px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: i === imgIdx ? '#a78bfa' : 'rgba(255,255,255,0.4)', padding: 0 }} />
              ))}
            </div>
          )}
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: availClr, color: '#fff', padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>
            {isAvail ? 'Available' : 'Unavailable'}
          </div>
        </div>

        {/* Grid: main + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '1.5rem', alignItems: 'start' }}>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Header info */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <h1 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.6rem', marginBottom: '0.3rem' }}>{field.name}</h1>
                  <span style={{ background: 'rgba(124,58,237,0.22)', color: '#c4b5fd', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize' }}>{sport}</span>
                </div>
                {avgRating > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>⭐ {avgRating.toFixed(1)}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{reviewCount} review{reviewCount === 1 ? '' : 's'}</div>
                  </div>
                )}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>📍 {locText}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: field.description ? '1rem' : 0 }}>🕒 Open: {openTime} – {closeTime}</p>
              {field.description && <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.7 }}>{field.description}</p>}
            </div>

            {/* Details */}
            {(field.surface || field.fieldType || field.capacity?.max) && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>📋 Field Details</h2>
                <DetailRow label="Surface"  value={field.surface} />
                <DetailRow label="Type"     value={field.fieldType} />
                <DetailRow label="Capacity" value={field.capacity?.max ? `${field.capacity.max} players` : ''} />
                <DetailRow label="Size"     value={field.size} />
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>🏆 Amenities</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.5rem' }}>
                  {amenities.map(a => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                      <span style={{ textTransform: 'capitalize' }}>{typeof a === 'string' ? a.replaceAll('_', ' ') : a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>
                💬 Reviews {reviews.length > 0 && <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.85rem' }}>({reviews.length})</span>}
              </h2>
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {reviews.slice(0, 8).map((r, i) => <ReviewCard key={r._id ?? i} review={r} />)}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No reviews yet. Be the first to book and review!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Price + CTA */}
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>৳{price.toLocaleString()}</div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>per hour</p>
              <button onClick={() => navigate(`/booking?field=${id}`)} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.85rem', marginBottom: '0.65rem' }}>
                🎯 Book This Field
              </button>
              <button onClick={() => navigate('/fields')}
                style={{ width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                ← Browse Fields
              </button>
            </div>

            {/* Hours mini-card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>🕒 Operating Hours</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Open daily: <strong style={{ color: '#e2e8f0' }}>{openTime} – {closeTime}</strong></p>
            </div>

            {/* Owner */}
            {field.owner && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>🏢 Owner</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  {field.owner.firstName} {field.owner.lastName}
                </p>
                {field.owner.phone && <p style={{ color: '#64748b', fontSize: '0.8rem' }}>📞 {field.owner.phone}</p>}
              </div>
            )}

            {/* Location */}
            {locText !== 'N/A' && (
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>📍 Location</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{locText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetails;
