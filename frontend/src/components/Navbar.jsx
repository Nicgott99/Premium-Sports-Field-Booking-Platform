import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
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
    { path: '/profile', label: '👤 Profile' },
    { path: '/dashboard', label: '📊 Dashboard' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-black/30 backdrop-blur-2xl border-b border-white/10 shadow-2xl' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-black text-white">🏆</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                PREMIUM SPORTS
              </h1>
              <p className="text-xs text-gray-400 font-medium tracking-wide">Elite Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation - Only visible on md screens and up */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={`desktop-${link.path}`}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    location.pathname === link.path
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white border border-purple-400/50 shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm hover:border hover:border-white/20'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth Links - Only visible on md screens and up */}
          <div className="hidden md:flex items-center space-x-3">
            {authLinks.slice(0, 2).map((link) => (
              <Link
                key={`desktop-auth-${link.path}`}
                to={link.path}
                className={`px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                  link.path === '/register'
                    ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/50 transform hover:scale-105'
                    : 'text-gray-300 hover:text-white border border-white/20 hover:bg-white/10 hover:backdrop-blur-sm'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button - Only visible on small screens */}
          <div className="md:hidden block">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 relative z-50"
              aria-label="Toggle mobile menu"
            >
              <span className="sr-only">Open main menu</span>
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

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-500 overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pt-2 pb-6 bg-black/20 backdrop-blur-xl rounded-2xl mt-4 border border-white/10">
            {/* Main Navigation Links */}
            <div className="space-y-2 mb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                    location.pathname === link.path
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white border border-purple-400/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4"></div>
            
            {/* Auth Links */}
            <div className="space-y-2">
              {authLinks.slice(0, 2).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                    link.path === '/register'
                      ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-white border border-cyan-400/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/20'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Premium gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
    </nav>
  );
};

export default Navbar;