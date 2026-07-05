import React from 'react';
import PropTypes from 'prop-types';

/**
 * ProgressBar Component
 * Premium Sports Field Booking Platform
 *
 * A reusable, animated progress bar for dashboards, profile completion,
 * booking steps, and skill/stat indicators. Styled for the premium dark theme.
 *
 * @example
 * <ProgressBar value={72} label="Profile completion" showValue />
 * <ProgressBar value={45} color="amber" size="lg" animated />
 */
const ProgressBar = ({
  value = 0,
  max = 100,
  label = '',
  showValue = false,
  color = 'amber',
  size = 'md',
  animated = true,
  className = '',
}) => {
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = Math.round((clamped / max) * 100);

  const colorMap = {
    amber:   'bg-amber-500',
    green:   'bg-emerald-500',
    blue:    'bg-blue-500',
    red:     'bg-red-500',
    purple:  'bg-violet-500',
    gray:    'bg-gray-500',
  };

  const sizeMap = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
    xl: 'h-6',
  };

  const barColor = colorMap[color] ?? colorMap.amber;
  const barHeight = sizeMap[size] ?? sizeMap.md;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-300">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-semibold text-gray-400 tabular-nums">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        className={`w-full bg-gray-800 rounded-full overflow-hidden ${barHeight}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${percentage}%`}
      >
        <div
          className={`${barHeight} ${barColor} rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  label: PropTypes.string,
  showValue: PropTypes.bool,
  color: PropTypes.oneOf(['amber', 'green', 'blue', 'red', 'purple', 'gray']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  animated: PropTypes.bool,
  className: PropTypes.string,
};

export default ProgressBar;
