import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * OtpInput Component
 * Premium Sports Field Booking Platform
 *
 * A premium, accessible 6-digit OTP / PIN input with auto-focus,
 * auto-advance on keystroke, paste support, and backspace navigation.
 * Used for phone verification and two-factor authentication flows.
 *
 * @example
 * const [otp, setOtp] = useState('');
 * <OtpInput length={6} onChange={setOtp} onComplete={handleVerify} />
 */
const OtpInput = ({
  length = 6,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className = '',
  inputClassName = '',
}) => {
  const [values, setValues] = useState(Array(length).fill(''));
  const refs = useRef([]);

  const focusAt = (index) => refs.current[index]?.focus();

  const updateValues = (next) => {
    setValues(next);
    const joined = next.join('');
    onChange?.(joined);
    if (joined.length === length && !next.includes('')) {
      onComplete?.(joined);
    }
  };

  const handleChange = (e, index) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    const char = raw.slice(-1);
    const next = [...values];
    next[index] = char;
    updateValues(next);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...values];
      if (next[index]) {
        next[index] = '';
        updateValues(next);
      } else if (index > 0) {
        next[index - 1] = '';
        updateValues(next);
        focusAt(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusAt(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill('');
    pasted.split('').forEach((char, i) => { next[i] = char; });
    updateValues(next);
    focusAt(Math.min(pasted.length, length - 1));
  };

  const baseCls = `
    w-11 h-12 text-center text-lg font-bold rounded-xl border-2 bg-gray-900 text-gray-100
    outline-none transition-all duration-200 caret-amber-500
    focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-700 hover:border-gray-600'}
    ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-text'}
  `;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label={`${length}-digit verification code`}
    >
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={val}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          className={`${baseCls} ${inputClassName}`}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
};

OtpInput.propTypes = {
  length: PropTypes.number,
  onChange: PropTypes.func,
  onComplete: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};

export default OtpInput;
