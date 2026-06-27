import React from 'react';
import PropTypes from 'prop-types';

/**
 * EmptyState Component
 * Premium Sports Field Booking Platform
 *
 * A reusable, premium empty state component used when list queries return no items
 * (e.g., empty booking list, search results, notifications, or team lists).
 * Integrates with the Kinetic Elite Design System with amber accents.
 */
const EmptyState = ({
  icon = 'inbox',
  title = 'No Data Available',
  description = 'There is currently nothing to show here. Try refining your filters or creating a new item.',
  actionLabel = '',
  onAction = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm max-w-md mx-auto ${className}`}>
      {/* Icon Wrapper */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6 animate-pulse">
        <span className="material-symbols-outlined text-3xl select-none" aria-hidden="true">
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        {description}
      </p>

      {/* Optional Action Button */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-gray-950 hover:bg-amber-400 active:bg-amber-600 font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string,
};

export default EmptyState;
