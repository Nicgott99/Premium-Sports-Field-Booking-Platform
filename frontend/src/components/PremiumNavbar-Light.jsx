import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const PremiumNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: '🏠 Home' },
    { path: '/fields', label: '🏟️ Fields' },
    { path: '/bookings', label: '📅 Bookings' },
    { path: '/about', label: '📖 About' },
    { path: '/contact', label: '📞 Contact' },
  ];

  const authLinks = [
    { path: '/login', label: '🔐 Login' },
    { path: '/register', label: '✨ Register' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-3xl border-b border-gray-200 shadow-lg' 
        : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* PREMIUM LOGO */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-black text-white">🏆</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                PREMIUM SPORTS
              </h1>
              <p className="text-xs text-gray-600 font-medium tracking-wide">Elite Platform</p>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION - ONLY SHOW ON LARGE SCREENS */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  location.pathname === link.path
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-300 shadow-lg'
                    : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50 hover:border hover:border-blue-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* DESKTOP AUTH LINKS - ONLY SHOW ON LARGE SCREENS */}
          <div className="hidden lg:flex items-center space-x-3">
            {authLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                  link.path === '/register'
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-blue-500/50 transform hover:scale-105'
                    : 'text-gray-700 hover:text-blue-700 border border-gray-300 hover:bg-blue-50 hover:backdrop-blur-sm'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* MOBILE MENU BUTTON - ONLY SHOW ON SMALL SCREENS */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300"
              aria-label="Toggle navigation menu"
            >
              <div className="w-6 h-6 relative">
                <span className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
                }`}></span>
                <span className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`absolute h-0.5 w-6 bg-current transform transition-all duration-300 ${
                  isOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION MENU - ONLY SHOW ON SMALL SCREENS WHEN OPEN */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-6 bg-white/95 backdrop-blur-xl rounded-2xl mt-4 border border-gray-200 shadow-lg">
              {/* Main Navigation */}
              <div className="space-y-2 mb-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                      location.pathname === link.path
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-300'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-4"></div>
              
              {/* Auth Links */}
              <div className="space-y-2">
                {authLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                      link.path === '/register'
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-300'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50 border border-gray-300'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
    </nav>
  );
};

export default PremiumNavbar;