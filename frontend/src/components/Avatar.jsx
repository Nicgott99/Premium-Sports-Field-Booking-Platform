import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Avatar Component
 * Premium Sports Field Booking Platform
 *
 * A reusable avatar component that displays an image.
 * If the image fails to load or is not provided, it falls back to
 * displaying the user's initials on a generated colored background.
 */
const Avatar = ({ src, alt, name, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  // Size mappings
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const sizeClass = sizes[size] || sizes.md;

  // Generate initials from name
  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    const parts = nameStr.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate a consistent background color based on name string
  const generateColor = (str) => {
    if (!str) return 'bg-gray-600';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
      'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
      'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
      'bg-pink-500', 'bg-rose-500'
    ];
    // Ensure positive index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleError = () => {
    setImageError(true);
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        onError={handleError}
      />
    );
  }

  // Fallback to initials
  const initials = getInitials(name);
  const bgColorClass = generateColor(name);

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-medium select-none ${bgColorClass} ${sizeClass} ${className}`}
      title={name || alt}
    >
      {initials}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  className: PropTypes.string,
};

export default Avatar;
