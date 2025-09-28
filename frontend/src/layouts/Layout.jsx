import React from 'react';
import PremiumNavbarComplete from '../components/PremiumNavbarComplete';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen">
      <PremiumNavbarComplete />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;