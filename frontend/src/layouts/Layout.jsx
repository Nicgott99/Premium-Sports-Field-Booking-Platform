import React from 'react';
import PropTypes from 'prop-types';
import PremiumNavbarComplete from '../components/PremiumNavbarComplete';

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <PremiumNavbarComplete />
      <main>
        {children}
      </main>
    </div>
  );
};

Layout.propTypes = { children: PropTypes.node.isRequired };

export default Layout;