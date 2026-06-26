import React from 'react';
import PropTypes from 'prop-types';

/**
 * LoadingSpinner Component
 * Premium Sports Booking Platform
 *
 * A polished, versatile loading indicator component.
 * Supports multiple sizes, variants, optional overlay, and accessible labels.
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner size="lg" variant="amber" label="Booking your field..." />
 *   <LoadingSpinner overlay />   ← Full-screen centered overlay
 *   <LoadingSpinner type="dots" size="sm" />
 */

// ─── Spinner Sizes ─────────────────────────────────────────────────────────
const sizeMap = {
  xs:  { outer: 'h-4 w-4',   border: 'border-2',  dot: 'h-1.5 w-1.5'  },
  sm:  { outer: 'h-6 w-6',   border: 'border-2',  dot: 'h-2 w-2'      },
  md:  { outer: 'h-10 w-10', border: 'border-3',  dot: 'h-2.5 w-2.5'  },
  lg:  { outer: 'h-16 w-16', border: 'border-4',  dot: 'h-3 w-3'      },
  xl:  { outer: 'h-24 w-24', border: 'border-4',  dot: 'h-4 w-4'      },
};

// ─── Color Variants ────────────────────────────────────────────────────────
const variantMap = {
  amber:  'border-amber-400 border-t-transparent',
  white:  'border-white border-t-transparent',
  gray:   'border-gray-400 border-t-transparent',
  green:  'border-green-500 border-t-transparent',
  blue:   'border-blue-500 border-t-transparent',
  red:    'border-red-500 border-t-transparent',
};

const dotVariantMap = {
  amber: 'bg-amber-400',
  white: 'bg-white',
  gray:  'bg-gray-400',
  green: 'bg-green-500',
  blue:  'bg-blue-500',
  red:   'bg-red-500',
};

// ─── Ring Spinner ──────────────────────────────────────────────────────────
const RingSpinner = ({ size, variant }) => {
  const s = sizeMap[size] || sizeMap.md;
  const v = variantMap[variant] || variantMap.amber;
  return (
    <div
      className={`${s.outer} ${s.border} rounded-full animate-spin ${v}`}
      style={{ borderTopColor: 'transparent' }}
    />
  );
};

// ─── Dots Spinner ─────────────────────────────────────────────────────────
const DotsSpinner = ({ size, variant }) => {
  const s = sizeMap[size] || sizeMap.md;
  const dotColor = dotVariantMap[variant] || dotVariantMap.amber;
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${s.dot} ${dotColor} rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};

// ─── Pulse Spinner ────────────────────────────────────────────────────────
const PulseSpinner = ({ size, variant }) => {
  const s = sizeMap[size] || sizeMap.md;
  const dotColor = dotVariantMap[variant] || dotVariantMap.amber;
  return (
    <div className={`${s.outer} ${dotColor} rounded-full animate-pulse opacity-75`} />
  );
};

// ─── Main Component ───────────────────────────────────────────────────────
const LoadingSpinner = ({
  type     = 'ring',
  size     = 'md',
  variant  = 'amber',
  label    = '',
  overlay  = false,
  className = '',
}) => {
  const spinnerNode = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
    >
      {type === 'ring'  && <RingSpinner  size={size} variant={variant} />}
      {type === 'dots'  && <DotsSpinner  size={size} variant={variant} />}
      {type === 'pulse' && <PulseSpinner size={size} variant={variant} />}

      {label && (
        <p
          className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse"
          aria-hidden="true"
        >
          {label}
        </p>
      )}

      {/* Screen-reader only text */}
      <span className="sr-only">{label || 'Loading, please wait…'}</span>
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        aria-modal="true"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl px-10 py-8">
          {spinnerNode}
        </div>
      </div>
    );
  }

  return spinnerNode;
};

LoadingSpinner.propTypes = {
  type:      PropTypes.oneOf(['ring', 'dots', 'pulse']),
  size:      PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  variant:   PropTypes.oneOf(['amber', 'white', 'gray', 'green', 'blue', 'red']),
  label:     PropTypes.string,
  overlay:   PropTypes.bool,
  className: PropTypes.string,
};

// ─── Page-level Fallback ──────────────────────────────────────────────────
/**
 * PageLoader: Full-page centered loading state (used in React Suspense fallbacks).
 */
export const PageLoader = ({ label = 'Loading page…' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <LoadingSpinner size="lg" variant="amber" label={label} />
  </div>
);

PageLoader.propTypes = {
  label: PropTypes.string,
};

export default LoadingSpinner;
