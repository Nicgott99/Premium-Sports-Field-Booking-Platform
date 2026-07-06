import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * StarRating Component
 * Premium Sports Field Booking Platform
 *
 * Reusable interactive star rating widget for field and venue reviews.
 * Supports read-only display mode and controlled/uncontrolled usage.
 *
 * @example
 * // Interactive
 * const [rating, setRating] = useState(0);
 * <StarRating value={rating} onChange={setRating} />
 *
 * // Read-only display
 * <StarRating value={4.5} readOnly size="sm" />
 */
const StarRating = ({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  readOnly = false,
  showValue = false,
  className = '',
}) => {
  const [hovered, setHovered] = useState(null);

  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };
  const starSize = sizeMap[size] ?? sizeMap.md;

  const displayValue = hovered !== null ? hovered : value;

  const handleClick = (starIndex) => {
    if (readOnly || !onChange) return;
    // Clicking the same star a second time clears the rating
    onChange(starIndex === value ? 0 : starIndex);
  };

  const renderStar = (index) => {
    const filled = index <= displayValue;
    const halfFilled = !filled && index - 0.5 <= displayValue;

    const fill = filled
      ? '#f59e0b'           // amber-400 – full
      : halfFilled
      ? 'url(#half)'        // gradient – half
      : 'transparent';      // empty

    return (
      <span
        key={index}
        role={readOnly ? 'img' : 'button'}
        aria-label={`${index} star${index !== 1 ? 's' : ''}`}
        tabIndex={readOnly ? -1 : 0}
        className={`inline-block ${readOnly ? '' : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/60 rounded'}`}
        onMouseEnter={() => !readOnly && setHovered(index)}
        onMouseLeave={() => !readOnly && setHovered(null)}
        onClick={() => handleClick(index)}
        onKeyDown={(e) => e.key === 'Enter' && handleClick(index)}
      >
        <svg
          className={`${starSize} transition-colors duration-100`}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {halfFilled && (
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={fill}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  };

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Rating: ${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => renderStar(i + 1))}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold text-amber-400 tabular-nums">
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
};

StarRating.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
  max: PropTypes.number,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  readOnly: PropTypes.bool,
  showValue: PropTypes.bool,
  className: PropTypes.string,
};

export default StarRating;
