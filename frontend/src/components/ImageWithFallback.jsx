import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ImageWithFallback Component
 * Premium Sports Field Booking Platform
 *
 * A drop-in replacement for <img> that gracefully handles broken or missing
 * images by rendering a styled placeholder with an optional icon and alt text.
 * Supports lazy loading, aspect-ratio locking, and smooth fade-in on load.
 *
 * @example
 * <ImageWithFallback src={field.coverImage} alt={field.name} aspectRatio="16/9" />
 */
const ImageWithFallback = ({
  src,
  alt = '',
  fallbackSrc = '',
  aspectRatio = '',
  className = '',
  imgClassName = '',
  objectFit = 'cover',
  lazy = true,
  rounded = 'xl',
}) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'

  const roundedMap = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };
  const roundedClass = roundedMap[rounded] ?? 'rounded-xl';

  const wrapperStyle = aspectRatio ? { aspectRatio } : {};
  const fitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit] ?? 'object-cover';

  const showFallback = status === 'error' && !fallbackSrc;

  return (
    <div
      className={`relative overflow-hidden bg-gray-800 ${roundedClass} ${className}`}
      style={wrapperStyle}
    >
      {/* Shimmer skeleton while loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
      )}

      {/* Fallback placeholder when no fallback src */}
      {showFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M3 3h18M3.75 3v1.5M20.25 3v1.5" />
          </svg>
          {alt && <span className="text-xs text-gray-500 text-center px-2 truncate max-w-full">{alt}</span>}
        </div>
      )}

      {/* Actual image (or fallback src) */}
      {!showFallback && (
        <img
          src={status === 'error' ? fallbackSrc : src}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`
            w-full h-full transition-opacity duration-300
            ${fitClass} ${roundedClass}
            ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}
            ${imgClassName}
          `}
        />
      )}
    </div>
  );
};

ImageWithFallback.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  fallbackSrc: PropTypes.string,
  aspectRatio: PropTypes.string,
  className: PropTypes.string,
  imgClassName: PropTypes.string,
  objectFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none']),
  lazy: PropTypes.bool,
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full']),
};

export default ImageWithFallback;
