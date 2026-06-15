import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/fields',      label: 'Fields'      },
  { path: '/tournaments', label: 'Tournaments'  },
  { path: '/leaderboard', label: 'Leaderboard'  },
  { path: '/community',   label: 'Community'    },
];

const MORE_LINKS = [
  { path: '/training',   label: 'Training Center', icon: 'fitness_center' },
  { path: '/live',       label: 'Live Sessions',   icon: 'sensors'        },
  { path: '/events',     label: 'Events',           icon: 'event'          },
  { path: '/coaches',    label: 'Coach Connect',    icon: 'sports'         },
  { path: '/stats',      label: 'Sports Stats',     icon: 'bar_chart'      },
  { path: '/map',        label: 'Field Map',        icon: 'map'            },
];

const S = {
  nav: (scrolled) => ({
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
    transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
    background: scrolled ? 'rgba(5,20,36,0.97)' : 'rgba(5,20,36,0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${scrolled ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.06)'}`,
    boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.6)' : 'none',
  }),
  inner: {
    maxWidth: '88rem', margin: '0 auto', padding: '0 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px',
  },
  logo: {
    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0,
  },
  logoMark: {
    width: '38px', height: '38px',
    background: '#c3f400',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Anybody', sans-serif",
    fontWeight: 900,
    fontSize: '1.05rem',
    letterSpacing: '-0.01em',
    color: '#f0f6ff',
    lineHeight: 1.1,
  },
  logoSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.58rem',
    color: '#c3f400',
    letterSpacing: '0.12em',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};

export default function PremiumNavbarComplete() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser]         = useState(null);
  const [userMenu, setUserMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const userRef   = useRef(null);
  const moreRef   = useRef(null);

  useEffect(() => {
    const load = () => {
      const token = localStorage.getItem('token');
      const raw   = localStorage.getItem('user');
      setUser(token && raw ? JSON.parse(raw) : null);
    };
    load();
    globalThis.addEventListener('storage', load);
    return () => globalThis.removeEventListener('storage', load);
  }, [location]);

  useEffect(() => {
    const h = () => setScrolled(globalThis.scrollY > 12);
    globalThis.addEventListener('scroll', h, { passive: true });
    return () => globalThis.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setOpen(false); setUserMenu(false); setMoreMenu(false); }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (path, label) => (
    <Link
      key={path}
      to={path}
      style={{
        textDecoration: 'none',
        padding: '0.4rem 0.85rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: isActive(path) ? 700 : 500,
        color: isActive(path) ? '#c3f400' : '#8ba3be',
        background: isActive(path) ? 'rgba(195,244,0,0.1)' : 'transparent',
        transition: 'all 200ms',
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!isActive(path)) {
          e.currentTarget.style.color = '#f0f6ff';
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive(path)) {
          e.currentTarget.style.color = '#8ba3be';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >{label}</Link>
  );

  const dropdownItem = (path, icon, label) => (
    <Link
      key={path}
      to={path}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: '0.55rem 0.85rem', borderRadius: '8px',
        textDecoration: 'none',
        color: isActive(path) ? '#c3f400' : '#8ba3be',
        background: isActive(path) ? 'rgba(195,244,0,0.08)' : 'transparent',
        fontSize: '0.875rem', fontWeight: 500,
        transition: 'all 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#f0f6ff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = isActive(path) ? 'rgba(195,244,0,0.08)' : 'transparent'; e.currentTarget.style.color = isActive(path) ? '#c3f400' : '#8ba3be'; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span>
      {label}
    </Link>
  );

  return (
    <nav style={S.nav(scrolled)}>
      <div style={S.inner}>

        {/* Logo */}
        <Link to="/" style={S.logo}>
          <div style={S.logoMark}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" fill="#051424"/>
            </svg>
          </div>
          <div>
            <div style={S.logoText}>KINETIC<span style={{ color: '#c3f400' }}>ELITE</span></div>
            <div style={S.logoSub}>Sports Platform</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
          {NAV_LINKS.map(l => navLink(l.path, l.label))}

          {/* More dropdown */}
          <div ref={moreRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMoreMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.4rem 0.85rem', borderRadius: '8px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 500,
                color: moreMenu ? '#f0f6ff' : '#8ba3be',
                transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f0f6ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!moreMenu) { e.currentTarget.style.color = '#8ba3be'; e.currentTarget.style.background = 'transparent'; } }}
            >
              <span>More</span>
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', transition: 'transform 200ms', transform: moreMenu ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </button>

            {moreMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '200px',
                background: 'rgba(13,28,45,0.98)',
                border: '1px solid rgba(195,244,0,0.15)',
                borderRadius: '14px', padding: '0.4rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(20px)',
                animation: 'fade-up 0.15s ease both',
              }}>
                {MORE_LINKS.map(l => dropdownItem(l.path, l.icon, l.label))}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

          {/* Quick Book CTA */}
          <Link to="/booking" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 1.1rem',
            background: '#c3f400',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#0a1200',
            fontFamily: "'Anybody', sans-serif",
            fontWeight: 800, fontSize: '0.82rem',
            letterSpacing: '0.02em',
            boxShadow: '0 4px 20px rgba(195,244,0,0.3)',
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(195,244,0,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(195,244,0,0.3)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>bolt</span>
            <span>Book Now</span>
          </Link>

          {user ? (
            <div ref={userRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.35rem 0.35rem 0.35rem 0.5rem',
                  background: 'rgba(195,244,0,0.08)',
                  border: '1px solid rgba(195,244,0,0.2)',
                  borderRadius: '10px',
                  color: '#f0f6ff',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#c3f400',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 900, color: '#0a1200',
                }}>
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.firstName || 'Account'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#8ba3be', transition: 'transform 200ms', transform: userMenu ? 'rotate(180deg)' : 'none' }}>expand_more</span>
              </button>

              {userMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: '210px',
                  background: 'rgba(13,28,45,0.98)',
                  border: '1px solid rgba(195,244,0,0.15)',
                  borderRadius: '14px', padding: '0.5rem',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(20px)',
                  animation: 'fade-up 0.15s ease both',
                }}>
                  {/* User info */}
                  <div style={{ padding: '0.5rem 0.85rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f6ff' }}>{user.firstName} {user.lastName}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#506070', marginTop: '0.15rem' }}>{user.email}</div>
                  </div>

                  <div style={{ padding: '0.4rem 0' }}>
                    {[
                      { to: '/dashboard',   icon: 'grid_view',      label: 'Dashboard'   },
                      { to: '/profile',     icon: 'person',         label: 'My Profile'   },
                      { to: '/bookings',    icon: 'calendar_month', label: 'My Bookings' },
                      { to: '/wallet',      icon: 'account_balance_wallet', label: 'Wallet' },
                      { to: '/loyalty',     icon: 'stars',          label: 'Loyalty Points' },
                      { to: '/notifications', icon: 'notifications', label: 'Notifications' },
                    ].map(item => dropdownItem(item.to, item.icon, item.label))}

                    {(user.role === 'admin' || user.role === 'manager' || user.role === 'fieldOwner') && (
                      <>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.4rem 0' }} />
                        {dropdownItem('/add-field', 'add_location_alt', 'Add Field')}
                        {dropdownItem('/venue-dashboard', 'store', 'Venue Dashboard')}
                      </>
                    )}
                    {user.role === 'admin' && dropdownItem('/admin', 'admin_panel_settings', 'Admin Panel')}
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />
                  <button
                    onClick={logout}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.55rem',
                      padding: '0.55rem 0.85rem', borderRadius: '8px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#f87171', fontSize: '0.875rem', fontWeight: 500,
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" style={{
                textDecoration: 'none', padding: '0.45rem 1rem',
                borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600,
                color: '#8ba3be', transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f0f6ff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8ba3be'; e.currentTarget.style.background = 'transparent'; }}
              >Log In</Link>
              <Link to="/register" style={{
                textDecoration: 'none', padding: '0.45rem 1rem',
                borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700,
                background: 'rgba(195,244,0,0.1)',
                border: '1px solid rgba(195,244,0,0.25)',
                color: '#c3f400', transition: 'all 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(195,244,0,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(195,244,0,0.1)'; }}
              >Sign Up</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              display: 'none', // shown via CSS below
              flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              gap: '5px', width: '38px', height: '38px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            <span style={{ display: 'block', width: '18px', height: '2px', background: '#f0f6ff', borderRadius: '2px', transition: 'all 200ms', transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ display: 'block', width: '18px', height: '2px', background: '#f0f6ff', borderRadius: '2px', transition: 'all 200ms', opacity: open ? 0 : 1 }} />
            <span style={{ display: 'block', width: '18px', height: '2px', background: '#f0f6ff', borderRadius: '2px', transition: 'all 200ms', transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          borderTop: '1px solid rgba(195,244,0,0.1)',
          background: 'rgba(5,20,36,0.99)',
          padding: '1rem 1.5rem 1.5rem',
          backdropFilter: 'blur(20px)',
          animation: 'slide-down 0.2s ease both',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[...NAV_LINKS, ...MORE_LINKS].map(l => (
              <Link key={l.path} to={l.path} style={{
                textDecoration: 'none', padding: '0.65rem 0.85rem',
                borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
                color: isActive(l.path) ? '#c3f400' : '#8ba3be',
                background: isActive(l.path) ? 'rgba(195,244,0,0.08)' : 'transparent',
                transition: 'all 150ms',
              }}>{l.label}</Link>
            ))}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0' }} />
            {user ? (
              <button onClick={logout} style={{ width:'100%', padding:'0.7rem', borderRadius:'8px', border:'1px solid rgba(248,113,113,0.25)', background:'rgba(248,113,113,0.08)', color:'#f87171', fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}>Sign Out</button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to="/login" style={{ flex:1, textAlign:'center', padding:'0.7rem', borderRadius:'8px', textDecoration:'none', color:'#8ba3be', border:'1px solid rgba(255,255,255,0.08)', fontWeight:600 }}>Log In</Link>
                <Link to="/register" style={{ flex:1, textAlign:'center', padding:'0.7rem', borderRadius:'8px', textDecoration:'none', color:'#0a1200', background:'#c3f400', fontWeight:800, fontFamily:"'Anybody',sans-serif" }}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 901px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @keyframes slide-down {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </nav>
  );
}
