import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Input Component
 * Premium Sports Field Booking Platform
 *
 * A premium, accessible, fully-featured form input that handles labels,
 * helper text, error states, left/right icons, and disabled states.
 * Built as a forwardRef so it works with react-hook-form.
 *
 * @example
 * <Input
 *   label="Email address"
 *   type="email"
 *   placeholder="you@example.com"
 *   leftIcon={<MailIcon />}
 *   error={errors.email?.message}
 * />
 */
const Input = forwardRef(({
  label = '',
  type = 'text',
  placeholder = '',
  helperText = '',
  error = '',
  leftIcon = null,
  rightIcon = null,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  id,
  ...rest
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;

  const baseInput = `
    w-full bg-gray-900 text-gray-100 placeholder-gray-500 text-sm rounded-xl border
    px-4 py-2.5 outline-none transition-all duration-200
    focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500
    disabled:opacity-40 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-700 hover:border-gray-600'}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${inputClassName}
  `;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-400" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={baseInput}
          {...rest}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm-.75-4.75a.75.75 0 001.5 0v-3.5a.75.75 0 00-1.5 0v3.5zm.75-6a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
          </svg>
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Input;
