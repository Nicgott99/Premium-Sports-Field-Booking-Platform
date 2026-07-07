import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Switch (Toggle) Component
 * Premium Sports Field Booking Platform
 *
 * An accessible iOS-style toggle switch for boolean settings.
 * Supports labels, disabled state, and size variants.
 *
 * @example
 * const [enabled, setEnabled] = useState(false);
 * <Switch checked={enabled} onChange={setEnabled} label="Email notifications" />
 */
const Switch = ({
  checked = false,
  onChange,
  label = '',
  description = '',
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const id = useId();

  const sizeMap = {
    sm: { track: 'w-8 h-4',   thumb: 'w-3 h-3',   translate: 'translate-x-4' },
    md: { track: 'w-11 h-6',  thumb: 'w-5 h-5',   translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7',  thumb: 'w-6 h-6',   translate: 'translate-x-7' },
  };
  const { track, thumb, translate } = sizeMap[size] ?? sizeMap.md;

  const handleChange = () => {
    if (!disabled && onChange) onChange(!checked);
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Hidden native checkbox for form compatibility */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleChange}
        className={`
          relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
          ${track}
          ${checked ? 'bg-amber-500' : 'bg-gray-700'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            inline-block rounded-full bg-white shadow-md ring-0
            transition-transform duration-200 ease-in-out
            ${thumb}
            ${checked ? translate : 'translate-x-0.5'}
          `}
        />
      </button>

      {(label || description) && (
        <label
          htmlFor={id}
          className={`flex flex-col cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={handleChange}
        >
          {label && (
            <span className="text-sm font-medium text-gray-200 leading-snug">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-gray-500 mt-0.5 leading-snug">
              {description}
            </span>
          )}
        </label>
      )}
    </div>
  );
};

Switch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string,
  description: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default Switch;
