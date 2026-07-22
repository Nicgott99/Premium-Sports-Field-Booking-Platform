import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Textarea Component
 * Premium Sports Field Booking Platform
 *
 * A premium, accessible textarea that matches the Input and Select design
 * system. Supports auto-resize, character count, label, error/helper text,
 * and forwardRef for react-hook-form compatibility.
 *
 * @example
 * <Textarea
 *   label="Booking notes"
 *   name="notes"
 *   placeholder="Any special requirements..."
 *   maxLength={300}
 *   showCount
 *   rows={4}
 *   error={errors.notes?.message}
 * />
 */
import { forwardRef, useState } from 'react';

const Textarea = forwardRef(({
  label = '',
  placeholder = '',
  helperText = '',
  error = '',
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  showCount = false,
  autoResize = false,
  className = '',
  textareaClassName = '',
  id,
  onChange,
  ...rest
}, ref) => {
  const autoId = useId();
  const textareaId = id || autoId;
  const [charCount, setCharCount] = useState(rest.defaultValue?.length ?? rest.value?.length ?? 0);

  const handleChange = (e) => {
    setCharCount(e.target.value.length);
    if (autoResize) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
    onChange?.(e);
  };

  const base = `
    w-full bg-gray-900 text-gray-100 placeholder-gray-500 text-sm rounded-xl border
    px-4 py-3 outline-none transition-all duration-200 resize-none
    focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500
    disabled:opacity-40 disabled:cursor-not-allowed
    ${error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
      : 'border-gray-700 hover:border-gray-600'}
    ${textareaClassName}
  `;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-400" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${textareaId}-error`
          : helperText ? `${textareaId}-helper`
          : undefined
        }
        className={base}
        onChange={handleChange}
        {...rest}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {error && (
            <p id={`${textareaId}-error`} role="alert" className="text-xs text-red-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm-.75-4.75a.75.75 0 001.5 0v-3.5a.75.75 0 00-1.5 0v3.5zm.75-6a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
              </svg>
              {error}
            </p>
          )}
          {!error && helperText && (
            <p id={`${textareaId}-helper`} className="text-xs text-gray-500">{helperText}</p>
          )}
        </div>

        {showCount && maxLength && (
          <p className={`text-xs tabular-nums shrink-0 ${charCount >= maxLength ? 'text-red-400' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  showCount: PropTypes.bool,
  autoResize: PropTypes.bool,
  className: PropTypes.string,
  textareaClassName: PropTypes.string,
  id: PropTypes.string,
  onChange: PropTypes.func,
};

export default Textarea;
