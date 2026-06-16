import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: 'home',          label: 'Home'    },
  { to: '/fields',     icon: 'stadium',        label: 'Fields'  },
  { to: '/quick-book', icon: 'bolt',           label: 'Book'    },
  { to: '/bookings',   icon: 'calendar_month', label: 'Bookings'},
  { to: '/profile',    icon: 'person',         label: 'Profile' },
];

function NavItem({ item, active }) {
  return (
    <NavLink
      to={item.to}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', textDecoration: 'none', padding: '0.5rem 0', position: 'relative' }}
    >
      {item.label === 'Book' ? (
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(251,191,36,0.4)', marginTop: '-1.4rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: '#051424', fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
        </div>
      ) : (
        <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: active ? '#FBBF24' : '#506070', fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0", transition: 'color 0.15s' }}>{item.icon}</span>
      )}
      <span style={{ fontSize: '0.65rem', color: item.label === 'Book' ? '#FBBF24' : active ? '#FBBF24' : '#506070', fontWeight: active || item.label === 'Book' ? 700 : 500, fontFamily: "'Inter',sans-serif" }}>{item.label}</span>
    </NavLink>
  );
}
NavItem.propTypes = {
  item: PropTypes.shape({ to: PropTypes.string, icon: PropTypes.string, label: PropTypes.string }).isRequired,
  active: PropTypes.bool.isRequired,
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      background: 'rgba(5,20,36,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      alignItems: 'center',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV_ITEMS.map(item => (
        <NavItem key={item.to} item={item} active={pathname.startsWith(item.to)} />
      ))}
    </nav>
  );
};

export default MobileBottomNav;
