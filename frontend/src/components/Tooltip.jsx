import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Tooltip Component
 * Premium Sports Field Booking Platform
 *
 * A reusable, fully accessible tooltip component.
 * Supports positioning (top, bottom, left, right), dark premium styling,
 * keyboard accessibility (triggers on focus), and smooth transitions.
 */
const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const idRef = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Position specific CSS classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || positionClasses.top;

  // Small pointer arrows configuration
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent',
  }[position] || arrowClasses.top;

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {/* Target Element */}
      {React.cloneElement(React.Children.only(children), {
        'aria-describedby': isVisible ? idRef.current : undefined,
      })}

      {/* Tooltip Content Panel */}
      {isVisible && content && (
        <div
          id={idRef.current}
          role="tooltip"
          className={`absolute z-50 px-3 py-1.5 text-xs font-semibold text-gray-200 bg-gray-900 border border-gray-800 rounded-lg shadow-xl whitespace-nowrap animate-fade-in ${positionClasses}`}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute border-4 ${arrowClasses}`}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Embedded fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) ${position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'}; }
          to { opacity: 1; transform: scale(1) ${position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'}; }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.element.isRequired,
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  delay: PropTypes.number,
  className: PropTypes.string,
};

export default Tooltip;
