import React from 'react';
import PropTypes from 'prop-types';

/**
 * Alert Component
 * Premium Sports Field Booking Platform
 *
 * A reusable inline alert/notification banner for displaying contextual
 * messages: success confirmations, warnings, errors, and info notes.
 * Styled for the dark premium theme with amber, green, red, and blue variants.
 *
 * @example
 * <Alert type="success" title="Booking confirmed!" message="Your slot has been reserved." />
 * <Alert type="error" message="Payment failed. Please try again." dismissible />
 */
const ICONS = {
  success: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
};

const STYLES = {
  success: {
    wrapper: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
  },
  error: {
    wrapper: 'bg-red-500/10 border-red-500/30 text-red-400',
    icon: 'text-red-400',
    title: 'text-red-300',
  },
  warning: {
    wrapper: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: 'text-amber-400',
    title: 'text-amber-300',
  },
  info: {
    wrapper: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    icon: 'text-blue-400',
    title: 'text-blue-300',
  },
};

const Alert = ({
  type = 'info',
  title = '',
  message,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const style = STYLES[type] ?? STYLES.info;

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-xl border p-4 text-sm ${style.wrapper} ${className}`}
    >
      <span className={style.icon}>{ICONS[type]}</span>

      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold mb-0.5 ${style.title}`}>{title}</p>
        )}
        {message && <p className="leading-relaxed opacity-90">{message}</p>}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="ml-auto -mr-1 -mt-1 shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-current"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.node,
  dismissible: PropTypes.bool,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export default Alert;
