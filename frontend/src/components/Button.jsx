import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Button Component
 * Premium Sports Field Booking Platform
 *
 * A versatile, accessible button with multiple visual variants, sizes,
 * loading state with spinner, icon slots, and full disabled handling.
 * Built as forwardRef for use with form libraries and imperative focus.
 *
 * @example
 * <Button variant="primary" size="md" loading={isSubmitting}>Book Now</Button>
 * <Button variant="outline" leftIcon={<PlusIcon />}>Add Field</Button>
 * <Button variant="ghost" size="sm">Cancel</Button>
 */
const VARIANTS = {
  primary: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 border-transparent shadow-md shadow-amber-500/20',
  secondary: 'bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-gray-100 border-transparent',
  outline: 'bg-transparent hover:bg-gray-800 active:bg-gray-900 text-gray-200 border-gray-600 hover:border-gray-500',
  ghost: 'bg-transparent hover:bg-gray-800/60 active:bg-gray-700 text-gray-300 border-transparent',
  danger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-transparent shadow-md shadow-red-500/20',
  success: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-transparent',
};

const SIZES = {
  xs:  'h-7  px-2.5 text-xs  gap-1.5 rounded-lg',
  sm:  'h-8  px-3   text-sm  gap-1.5 rounded-lg',
  md:  'h-10 px-4   text-sm  gap-2   rounded-xl',
  lg:  'h-11 px-5   text-base gap-2   rounded-xl',
  xl:  'h-12 px-6   text-base gap-2.5 rounded-2xl',
};

const SPINNER = (
  <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  type = 'button',
  className = '',
  ...rest
}, ref) => {
  const isDisabled = disabled || loading;

  const base = `
    inline-flex items-center justify-center font-semibold border
    transition-all duration-150 focus:outline-none
    focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
    select-none cursor-pointer
    disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
    ${VARIANTS[variant] ?? VARIANTS.primary}
    ${SIZES[size] ?? SIZES.md}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={base}
      {...rest}
    >
      {loading ? SPINNER : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger', 'success']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  fullWidth: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};

export default Button;
