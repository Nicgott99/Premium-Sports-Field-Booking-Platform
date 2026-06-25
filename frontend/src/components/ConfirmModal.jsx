import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * ConfirmModal Component
 *
 * A fully accessible, animated confirmation dialog for the Premium Sports Platform.
 * Supports multiple intent variants (danger, warning, info, success),
 * custom messages, and keyboard/focus-trap interactions.
 *
 * Usage:
 *   <ConfirmModal
 *     isOpen={showModal}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowModal(false)}
 *     title="Delete Booking?"
 *     message="This action cannot be undone."
 *     intent="danger"
 *     confirmLabel="Yes, Delete"
 *   />
 */

const intentConfig = {
  danger: {
    icon: 'delete_forever',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
  },
  warning: {
    icon: 'warning',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-white',
  },
  info: {
    icon: 'info',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
  },
  success: {
    icon: 'check_circle',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    confirmBtn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
  },
  primary: {
    icon: 'help',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-white',
  },
};

const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  intent = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
}) => {
  const cancelBtnRef = useRef(null);
  const config = intentConfig[intent] || intentConfig.primary;

  // Auto-focus the cancel button for safety when modal opens
  useEffect(() => {
    if (isOpen && cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-modal-in">
        {/* Icon */}
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${config.iconBg} mb-4`}>
          <span className={`material-symbols-outlined text-3xl ${config.iconColor}`}>
            {config.icon}
          </span>
        </div>

        {/* Title */}
        <h3
          id="confirm-modal-title"
          className="text-center text-lg font-semibold text-gray-900 mb-2"
        >
          {title}
        </h3>

        {/* Message */}
        <p
          id="confirm-modal-desc"
          className="text-center text-sm text-gray-500 mb-6"
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors disabled:opacity-70 ${config.confirmBtn}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>

      {/* Keyframe animation via inline style */}
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out both;
        }
      `}</style>
    </div>
  );
};

ConfirmModal.propTypes = {
  isOpen:        PropTypes.bool.isRequired,
  onConfirm:     PropTypes.func.isRequired,
  onCancel:      PropTypes.func.isRequired,
  title:         PropTypes.string,
  message:       PropTypes.string,
  intent:        PropTypes.oneOf(['danger', 'warning', 'info', 'success', 'primary']),
  confirmLabel:  PropTypes.string,
  cancelLabel:   PropTypes.string,
  isLoading:     PropTypes.bool,
};

export default ConfirmModal;
