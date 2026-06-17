import React from 'react';

export const CardSkeleton = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          background: 'rgba(13,28,45,0.72)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          height: '300px',
          animation: 'pulse 1.5s infinite',
        }}
      />
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `}</style>
  </>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div style={{ width: '100%', animation: 'pulse 1.5s infinite' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '1rem',
          padding: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {Array.from({ length: cols }).map((_, j) => (
          <div
            key={j}
            style={{
              height: '20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
            }}
          />
        ))}
      </div>
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `}</style>
  </div>
);

export const TextSkeleton = ({ lines = 3, width = '100%' }) => (
  <div style={{ animation: 'pulse 1.5s infinite' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
          height: '16px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          marginBottom: '0.5rem',
          width: i === lines - 1 ? '80%' : width,
        }}
      />
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `}</style>
  </div>
);

export const AvatarSkeleton = ({ size = '40px' }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      animation: 'pulse 1.5s infinite',
    }}
  >
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `}</style>
  </div>
);
