import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const QUICK_LINKS = [
  { icon: '🏠', label: 'Home',       to: '/' },
  { icon: '🏟️', label: 'Fields',     to: '/fields' },
  { icon: '📅', label: 'My Bookings', to: '/bookings' },
  { icon: '📞', label: 'Contact',    to: '/contact' },
];

const NotFound = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/fields?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.25rem 3rem' }}>
      {/* ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(248,113,113,0.15),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.12),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '580px', width: '100%' }}>
        {/* 404 */}
        <h1 style={{ fontSize: 'clamp(6rem,20vw,10rem)', fontWeight: 900, lineHeight: 1, marginBottom: '0.5rem', background: 'linear-gradient(135deg,#f87171,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </h1>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f1f5f9', marginBottom: '0.75rem' }}>Page Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.<br />
          Try searching for a sports field or use one of the links below.
        </p>

        {/* Quick search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', maxWidth: '420px', margin: '0 auto 2rem' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a sports field…"
            className="input-field"
            style={{ flex: 1, fontSize: '0.9rem' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', flexShrink: 0 }}>
            Search
          </button>
        </form>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
          {QUICK_LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{ textDecoration: 'none', display: 'block', transition: 'transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              <div className="card" style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{l.icon}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700 }}>{l.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
