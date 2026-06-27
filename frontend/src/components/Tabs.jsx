import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Tabs Component
 * Premium Sports Field Booking Platform
 *
 * A reusable accessible Tabs component.
 * Supports dynamic rendering of tab headers and content panels.
 */
const Tabs = ({ tabs, defaultTab = 0, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers */}
      <div 
        className="flex space-x-1 rounded-xl bg-gray-900/50 p-1 border border-gray-800 backdrop-blur-sm"
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <button
              key={index}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${index}`}
              id={`tab-${index}`}
              tabIndex={isActive ? 0 : -1}
              className={`
                w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-amber-500/50
                ${
                  isActive
                    ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
              `}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <div
              key={index}
              role="tabpanel"
              id={`panel-${index}`}
              aria-labelledby={`tab-${index}`}
              className={`
                rounded-xl bg-gray-900/40 p-4 border border-gray-800
                focus:outline-none focus:ring-2 focus:ring-amber-500/50
                ${isActive ? 'block animate-fade-in' : 'hidden'}
              `}
              tabIndex={isActive ? 0 : undefined}
            >
              {tab.content}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
  defaultTab: PropTypes.number,
  className: PropTypes.string,
};

export default Tabs;
