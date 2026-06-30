import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkeletonText Component
 * Premium Sports Field Booking Platform
 *
 * A reusable placeholder component for text that is loading.
 * Provides a clean pulse animation and blends with the dark theme.
 */
const SkeletonText = ({ lines = 1, className = '' }) => {
  const renderLines = () => {
    const skeletonLines = [];
    for (let i = 0; i < lines; i++) {
      // Vary the width of the lines slightly for a more natural text look
      // Usually, the last line is shorter.
      let widthClass = 'w-full';
      if (lines > 1 && i === lines - 1) {
        widthClass = 'w-2/3';
      } else if (lines > 1 && i % 2 !== 0) {
        widthClass = 'w-11/12';
      }

      skeletonLines.push(
        <div
          key={i}
          className={`h-4 bg-gray-700/50 rounded-md animate-pulse mb-2.5 last:mb-0 ${widthClass} ${className}`}
        />
      );
    }
    return skeletonLines;
  };

  return <div className="w-full flex flex-col">{renderLines()}</div>;
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string,
};

export default SkeletonText;
