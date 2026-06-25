import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge / Chip UI Component
 *
 * A versatile, reusable badge component for the Premium Sports Platform.
 * Supports multiple variants, sizes, icons, and dismissible chips.
 *
 * Usage:
 *   <Badge variant="success" size="sm">Active</Badge>
 *   <Badge variant="warning" icon="warning" dismissible onDismiss={() => {}}>Pending</Badge>
 */

const variantStyles = {
  default:   'bg-gray-100 text-gray-700 border border-gray-200',
  primary:   'bg-amber-100 text-amber-800 border border-amber-200',
  success:   'bg-green-100 text-green-800 border border-green-200',
  warning:   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  danger:    'bg-red-100 text-red-800 border border-red-200',
  info:      'bg-blue-100 text-blue-800 border border-blue-200',
  premium:   'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900 border-0 shadow-sm',
  dark:      'bg-gray-800 text-gray-100 border border-gray-700',
  outline:   'bg-transparent text-amber-600 border border-amber-400',
};

const sizeStyles = {
  xs:  'text-xs px-1.5 py-0.5 rounded',
  sm:  'text-xs px-2 py-0.5 rounded-md',
  md:  'text-sm px-2.5 py-1 rounded-md',
  lg:  'text-base px-3 py-1.5 rounded-lg',
};

const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  dismissible = false,
  onDismiss,
  dot = false,
  pulse = false,
  className = '',
  title,
}) => {
  const base = 'inline-flex items-center gap-1 font-medium select-none whitespace-nowrap';
  const variantClass = variantStyles[variant] || variantStyles.default;
  const sizeClass = sizeStyles[size] || sizeStyles.sm;

  const dotColor = {
    default: 'bg-gray-500',
    primary: 'bg-amber-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger:  'bg-red-500',
    info:    'bg-blue-500',
    premium: 'bg-gray-900',
    dark:    'bg-gray-300',
    outline: 'bg-amber-500',
  }[variant] || 'bg-gray-500';

  return (
    <span
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      title={title}
      role="status"
      aria-label={title || (typeof children === 'string' ? children : undefined)}
    >
      {/* Status dot */}
      {dot && (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      )}

      {/* Material Symbol icon */}
      {icon && !dot && (
        <span className="material-symbols-outlined" style={{ fontSize: '14px', lineHeight: 1 }}>
          {icon}
        </span>
      )}

      {children}

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-0.5 rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current transition-colors"
          aria-label="Remove badge"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '12px', lineHeight: 1 }}>
            close
          </span>
        </button>
      )}
    </span>
  );
};

Badge.propTypes = {
  children:    PropTypes.node.isRequired,
  variant:     PropTypes.oneOf(['default','primary','success','warning','danger','info','premium','dark','outline']),
  size:        PropTypes.oneOf(['xs','sm','md','lg']),
  icon:        PropTypes.string,
  dismissible: PropTypes.bool,
  onDismiss:   PropTypes.func,
  dot:         PropTypes.bool,
  pulse:       PropTypes.bool,
  className:   PropTypes.string,
  title:       PropTypes.string,
};

export default Badge;
