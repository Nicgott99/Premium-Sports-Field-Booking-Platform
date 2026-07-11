import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Notification Toast System
 * Premium Sports Field Booking Platform
 *
 * A lightweight, self-contained context-based toast notification system.
 * No external library needed. Supports success, error, warning, and info
 * variants with auto-dismiss and manual close.
 *
 * Exports:
 *   - NotificationProvider  → wrap your app (or page) with this
 *   - useNotification       → call addToast() anywhere inside the tree
 *
 * @example
 * // In App.jsx:
 * <NotificationProvider><App /></NotificationProvider>
 *
 * // In any component:
 * const { addToast } = useNotification();
 * addToast({ type: 'success', message: 'Booking confirmed!' });
 * addToast({ type: 'error', message: 'Payment failed.', duration: 8000 });
 */

const NotificationContext = createContext(null);

const COLORS = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/40    bg-red-500/10    text-red-300',
  warning: 'border-amber-500/40  bg-amber-500/10  text-amber-300',
  info:    'border-blue-500/40   bg-blue-500/10   text-blue-300',
};

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

let nextId = 0;

// ─── Provider ────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', message, title = '', duration = 4500 }) => {
      const id = ++nextId;

      setToasts((prev) => {
        const updated = [{ id, type, message, title }, ...prev];
        return updated.slice(0, maxToasts);
      });

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`
              pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm
              shadow-xl backdrop-blur-md animate-slide-in-right
              ${COLORS[toast.type] ?? COLORS.info}
            `}
          >
            <span className="mt-0.5 text-base font-bold leading-none shrink-0">
              {ICONS[toast.type]}
            </span>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="font-semibold mb-0.5 truncate">{toast.title}</p>
              )}
              <p className="opacity-90 break-words">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slideInRight 0.25s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  maxToasts: PropTypes.number,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used inside <NotificationProvider>');
  return ctx;
};

export default NotificationProvider;
