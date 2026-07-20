import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Select Component
 * Premium Sports Field Booking Platform
 *
 * A styled, accessible native <select> element that matches the premium
 * dark-theme design system. Supports label, helper text, error state,
 * placeholder option, disabled state, and forwardRef for react-hook-form.
 *
 * @example
 * <Select
 *   label="Sport Type"
 *   name="sport"
 *   options={[{ value: 'football', label: 'Football' }, { value: 'cricket', label: 'Cricket' }]}
 *   placeholder="Select a sport"
 *   error={errors.sport?.message}
 * />
 */
const Select = forwardRef(({
  label = '',
  options = [],
  placeholder = 'Select an option',
  helperText = '',
  error = '',
  disabled = false,
  required = false,
  className = '',
  selectClassName = '',
  id,
  ...rest
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 7)}`;

  const base = `
    w-full bg-gray-900 text-sm text-gray-100 rounded-xl border px-4 py-2.5 pr-10
    appearance-none outline-none transition-all duration-200
    focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500
    disabled:opacity-40 disabled:cursor-not-allowed
    ${error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
      : 'border-gray-700 hover:border-gray-600'}
    ${selectClassName}
  `;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-400" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={base}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-500">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-gray-900">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom chevron */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z"/>
          </svg>
        </span>
      </div>

      {error && (
        <p id={`${selectId}-error`} role="alert" className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm-.75-4.75a.75.75 0 001.5 0v-3.5a.75.75 0 00-1.5 0v3.5zm.75-6a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
          </svg>
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${selectId}-helper`} className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
  })),
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  selectClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Select;
