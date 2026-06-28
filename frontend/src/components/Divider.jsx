import React from 'react';
import PropTypes from 'prop-types';

/**
 * Divider Component
 * Premium Sports Field Booking Platform
 *
 * A reusable divider/separator component that can optionally contain text in the middle.
 * Useful for separating sections or for "OR" separators in login forms.
 */
const Divider = ({ 
  text = '', 
  orientation = 'horizontal', 
  className = '',
  textClassName = 'text-gray-400',
  lineClassName = 'border-gray-700'
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <div className={`flex-grow border-l ${lineClassName}`}></div>
        {text && (
          <span className={`my-2 px-1 text-xs font-medium uppercase tracking-wider ${textClassName}`}>
            {text}
          </span>
        )}
        <div className={`flex-grow border-l ${lineClassName}`}></div>
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className={`relative flex items-center w-full py-4 ${className}`}>
      <div className={`flex-grow border-t ${lineClassName}`}></div>
      {text && (
        <span className={`flex-shrink-0 mx-4 text-sm font-medium ${textClassName}`}>
          {text}
        </span>
      )}
      <div className={`flex-grow border-t ${lineClassName}`}></div>
    </div>
  );
};

Divider.propTypes = {
  text: PropTypes.node,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  className: PropTypes.string,
  textClassName: PropTypes.string,
  lineClassName: PropTypes.string,
};

export default Divider;
