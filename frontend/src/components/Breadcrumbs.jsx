import React from 'react';
import PropTypes from 'prop-types';

/**
 * Breadcrumbs Component
 * Premium Sports Field Booking Platform
 *
 * A reusable component to display navigation breadcrumbs.
 */
const Breadcrumbs = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex text-sm text-gray-400 font-medium ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <svg className="w-4 h-4 mx-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              )}
              {isLast || !item.href ? (
                <span className="text-gray-200" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a 
                  href={item.href} 
                  className="inline-flex items-center hover:text-amber-500 transition-colors duration-200"
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      href: PropTypes.string,
      icon: PropTypes.node,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default Breadcrumbs;
