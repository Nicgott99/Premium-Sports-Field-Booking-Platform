import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Accordion Component
 * Premium Sports Field Booking Platform
 *
 * A reusable Accordion (Disclosure) component. Useful for FAQs or collapsible detail sections.
 */
const Accordion = ({ title, children, defaultOpen = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-800 bg-gray-900/40 rounded-xl overflow-hidden backdrop-blur-sm ${className}`}>
      <button
        type="button"
        className={`flex justify-between items-center w-full px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors duration-200 ${isOpen ? 'bg-gray-800/60' : 'hover:bg-gray-800/40'}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-100">{title}</span>
        <span className={`transform transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </span>
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
        aria-hidden={!isOpen}
      >
        <div className="px-5 py-4 text-gray-300 border-t border-gray-800/50">
          {children}
        </div>
      </div>
    </div>
  );
};

Accordion.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  defaultOpen: PropTypes.bool,
  className: PropTypes.string,
};

export default Accordion;
