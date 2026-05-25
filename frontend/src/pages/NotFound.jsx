import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{
          fontSize: '9rem',
          fontWeight: '900',
          lineHeight: 1,
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #f87171, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </h1>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#fff', marginBottom: '1.5rem' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: '#fff',
            padding: '0.875rem 2.5rem',
            borderRadius: '9999px',
            fontWeight: '700',
            fontSize: '1rem',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
