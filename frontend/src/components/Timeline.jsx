import React from 'react';
import PropTypes from 'prop-types';

/**
 * Timeline Component
 * Premium Sports Field Booking Platform
 *
 * Renders a vertical timeline of events — ideal for booking history,
 * activity feeds, and order status tracking pages.
 * Each item supports an icon, title, description, timestamp, and status badge.
 *
 * @example
 * const events = [
 *   { id: 1, title: 'Booking confirmed', time: '10:30 AM', status: 'success',
 *     description: 'Your slot at Green Arena has been reserved.' },
 *   { id: 2, title: 'Payment processed', time: '10:31 AM', status: 'success' },
 *   { id: 3, title: 'Reminder sent', time: '2:00 PM', status: 'info' },
 * ];
 * <Timeline events={events} />
 */

const STATUS_COLORS = {
  success: { dot: 'bg-emerald-500',  badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  error:   { dot: 'bg-red-500',      badge: 'bg-red-500/10    text-red-400    border-red-500/30'    },
  warning: { dot: 'bg-amber-500',    badge: 'bg-amber-500/10  text-amber-400  border-amber-500/30'  },
  info:    { dot: 'bg-blue-500',     badge: 'bg-blue-500/10   text-blue-400   border-blue-500/30'   },
  pending: { dot: 'bg-gray-500',     badge: 'bg-gray-500/10   text-gray-400   border-gray-500/30'   },
};

const TimelineItem = ({ event, isLast }) => {
  const colors = STATUS_COLORS[event.status] ?? STATUS_COLORS.info;

  return (
    <div className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-800" />
      )}

      {/* Status dot */}
      <div className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${colors.dot} shadow-md`}>
        {event.icon ? (
          <span className="text-white text-[10px]">{event.icon}</span>
        ) : (
          <div className="h-2 w-2 rounded-full bg-white/80" />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 flex-1 min-w-0 ${isLast ? '' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <p className="font-semibold text-gray-100 text-sm">{event.title}</p>
          <div className="flex items-center gap-2 shrink-0">
            {event.status && (
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.badge}`}>
                {event.status}
              </span>
            )}
            {event.time && (
              <span className="text-xs text-gray-500 tabular-nums">{event.time}</span>
            )}
          </div>
        </div>
        {event.description && (
          <p className="text-sm text-gray-400 leading-relaxed">{event.description}</p>
        )}
      </div>
    </div>
  );
};

const Timeline = ({ events = [], className = '' }) => {
  if (!events.length) {
    return (
      <p className="text-center text-gray-500 text-sm py-8">No events to display.</p>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {events.map((event, index) => (
        <TimelineItem key={event.id ?? index} event={event} isLast={index === events.length - 1} />
      ))}
    </div>
  );
};

Timeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      time: PropTypes.string,
      status: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'pending']),
      icon: PropTypes.node,
    })
  ),
  className: PropTypes.string,
};

TimelineItem.propTypes = {
  event: PropTypes.object.isRequired,
  isLast: PropTypes.bool.isRequired,
};

export default Timeline;
