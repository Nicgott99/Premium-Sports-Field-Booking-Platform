import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/fields',  label: 'Browse Fields' },
  { path: '/booking', label: 'Book Now'       },
  { path: '/about',   label: 'About'          },
  { path: '/contact', label: 'Contact'        },
];

const SPORTS_EMOJI = { football:'⚽', cricket:'🏏', basketball:'🏀', tennis:'🎾', badminton:'🏸', volleyball:'🏐' };

const PremiumNavbar = () => {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser]       = useState(null);
  const [userMenu, setUserMenu] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const menuRef   = useRef(null);

  /* ── Auth state ─── */
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

  /* ── Scroll ─── */
  useEffect(() => {
    const h = () => setScrolled(globalThis.scrollY > 12);
    globalThis.addEventListener('scroll', h, { passive: true });
    return () => globalThis.removeEventListener('scroll', h);
  }, []);

  /* ── Close user menu on outside click ─── */
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Close mobile on route change ─── */
  useEffect(() => { setOpen(false); setUserMenu(false); }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
        transition: 'all 300ms ease',
        background: scrolled
          ? 'rgba(3,7,18,0.92)'
          : 'rgba(3,7,18,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(124,58,237,0.25)' : '1px solid rgba(255,255,255,0.05)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div style={{ maxWidth:'82rem', margin:'0 auto', padding:'0 1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'72px' }}>

          {/* ── Logo ─── */}
          <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{
              width:'42px', height:'42px',
              background:'linear-gradient(135deg,#7c3aed,#ec4899)',
              borderRadius:'12px',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.3rem',
              boxShadow:'0 4px 20px rgba(124,58,237,0.45)',
              flexShrink: 0,
            }}>🏆</div>
            <div>
              <div style={{
                fontWeight:900, fontSize:'1.1rem', letterSpacing:'-0.02em',
                background:'linear-gradient(135deg,#a78bfa,#f9a8d4)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                lineHeight:1.1,
              }}>PREMIUM SPORTS</div>
              <div style={{ fontSize:'0.62rem', color:'#64748b', letterSpacing:'0.1em', fontWeight:600, textTransform:'uppercase' }}>Elite Booking Platform</div>
            </div>
          </Link>

          {/* ── Desktop nav ─── */}
          <div style={{ alignItems:'center', gap:'0.25rem' }} className="desktop-nav">
            {NAV_LINKS.map(l => (
              <Link key={l.path} to={l.path} style={{
                textDecoration:'none',
                padding:'0.45rem 0.85rem',
                borderRadius:'8px',
                fontSize:'0.88rem',
                fontWeight: isActive(l.path) ? 700 : 600,
                color: isActive(l.path) ? '#e2d9f3' : '#94a3b8',
                background: isActive(l.path) ? 'rgba(124,58,237,0.18)' : 'transparent',
                transition:'all 200ms',
              }}
              onMouseEnter={e => { if (!isActive(l.path)) { e.currentTarget.style.color='#e2e8f0'; e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}}
              onMouseLeave={e => { if (!isActive(l.path)) { e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.background='transparent'; }}}
              >{l.label}</Link>
            ))}
            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'fieldOwner') && (
              <Link to="/add-field" style={{
                textDecoration:'none', padding:'0.45rem 0.85rem', borderRadius:'8px',
                fontSize:'0.88rem', fontWeight:700,
                color: isActive('/add-field') ? '#34d399' : '#94a3b8',
                background: isActive('/add-field') ? 'rgba(52,211,153,0.12)' : 'transparent',
                transition:'all 200ms',
              }}>+ Add Field</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" style={{
                textDecoration:'none', padding:'0.45rem 0.85rem', borderRadius:'8px',
                fontSize:'0.88rem', fontWeight:700,
                color: isActive('/admin') ? '#fbbf24' : '#94a3b8',
                background: isActive('/admin') ? 'rgba(245,158,11,0.15)' : 'transparent',
                transition:'all 200ms',
              }}>👑 Admin</Link>
            )}
          </div>

          {/* ── Right side ─── */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            {user ? (
              <div ref={menuRef} style={{ position:'relative' }}>
                <button
                  onClick={() => setUserMenu(v => !v)}
                  style={{
                    display:'flex', alignItems:'center', gap:'0.6rem',
                    padding:'0.45rem 1rem',
                    background:'rgba(124,58,237,0.15)',
                    border:'1px solid rgba(124,58,237,0.35)',
                    borderRadius:'10px',
                    color:'#e2d9f3',
                    fontWeight:700, fontSize:'0.88rem',
                    cursor:'pointer',
                    transition:'all 200ms',
                  }}
                >
                  <span style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:900 }}>
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </span>
                  <span>{user.firstName || 'Account'}</span>
                  <span style={{ fontSize:'0.7rem', opacity:0.6, transform: userMenu ? 'rotate(180deg)' : 'none', transition:'transform 200ms' }}>▼</span>
                </button>

                {/* Dropdown */}
                {userMenu && (
                  <div style={{
                    position:'absolute', top:'calc(100% + 8px)', right:0,
                    minWidth:'200px',
                    background:'rgba(13,13,31,0.98)',
                    border:'1px solid rgba(124,58,237,0.25)',
                    borderRadius:'14px',
                    padding:'0.5rem',
                    boxShadow:'0 20px 60px rgba(0,0,0,0.6)',
                    backdropFilter:'blur(20px)',
                    zIndex:100,
                    animation:'fade-up 0.15s ease both',
                  }}>
                    {[
                      { to:'/dashboard', icon:'📊', label:'Dashboard' },
                      { to:'/profile',   icon:'👤', label:'My Profile'  },
                      { to:'/bookings',  icon:'📅', label:'My Bookings' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} style={{
                        display:'flex', alignItems:'center', gap:'0.6rem',
                        padding:'0.6rem 0.9rem',
                        borderRadius:'8px',
                        textDecoration:'none',
                        color:'#94a3b8',
                        fontSize:'0.88rem',
                        fontWeight:600,
                        transition:'all 150ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.12)'; e.currentTarget.style.color='#e2d9f3'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8'; }}
                      ><span>{item.icon}</span>{item.label}</Link>
                    ))}
                    <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.07)', margin:'0.4rem 0' }} />
                    <button
                      onClick={logout}
                      style={{
                        width:'100%', display:'flex', alignItems:'center', gap:'0.6rem',
                        padding:'0.6rem 0.9rem', borderRadius:'8px',
                        background:'transparent', border:'none', cursor:'pointer',
                        color:'#f87171', fontSize:'0.88rem', fontWeight:600,
                        transition:'all 150ms', textAlign:'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
                    >🚪 Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={{
                  textDecoration:'none', padding:'0.5rem 1.1rem',
                  borderRadius:'9px', fontSize:'0.88rem', fontWeight:700,
                  color:'#94a3b8', border:'1px solid rgba(255,255,255,0.1)',
                  transition:'all 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.color='#e2e8f0'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.background='transparent'; }}
                >Sign In</Link>
                <Link to="/register" style={{
                  textDecoration:'none', padding:'0.5rem 1.25rem',
                  borderRadius:'9px', fontSize:'0.88rem', fontWeight:700,
                  background:'linear-gradient(135deg,#7c3aed,#ec4899)',
                  color:'#fff',
                  boxShadow:'0 4px 15px rgba(124,58,237,0.4)',
                  transition:'all 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 25px rgba(124,58,237,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 15px rgba(124,58,237,0.4)'; }}
                >Get Started</Link>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu"
              style={{
                display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
                gap:'5px', width:'38px', height:'38px',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'8px', cursor:'pointer',
              }}
            >
              {[0,1,2].map(i => (
                <span key={i} style={{
                  display:'block', width:'18px', height:'1.5px',
                  background:'#94a3b8',
                  borderRadius:'2px',
                  transition:'all 250ms',
                  transform: open
                    ? i === 0 ? 'rotate(45deg) translateY(6.5px)'
                    : i === 2 ? 'rotate(-45deg) translateY(-6.5px)'
                    : 'scaleX(0)'
                    : 'none',
                  opacity: open && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ─── */}
      <div style={{
        maxHeight: open ? '600px' : '0',
        overflow: 'hidden',
        transition: 'max-height 350ms cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{
          borderTop:'1px solid rgba(255,255,255,0.07)',
          padding: open ? '1rem 1.5rem 1.5rem' : '0 1.5rem',
          display:'flex', flexDirection:'column', gap:'0.35rem',
        }}>
          {NAV_LINKS.map(l => (
            <Link key={l.path} to={l.path} style={{
              textDecoration:'none', display:'block',
              padding:'0.75rem 1rem',
              borderRadius:'10px',
              fontSize:'0.95rem', fontWeight:600,
              color: isActive(l.path) ? '#e2d9f3' : '#94a3b8',
              background: isActive(l.path) ? 'rgba(124,58,237,0.15)' : 'transparent',
              transition:'all 200ms',
            }}>{l.label}</Link>
          ))}
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'fieldOwner') && (
            <Link to="/add-field" style={{ textDecoration:'none', display:'block', padding:'0.75rem 1rem', borderRadius:'10px', fontSize:'0.95rem', fontWeight:700, color:'#34d399' }}>+ Add Field</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ textDecoration:'none', display:'block', padding:'0.75rem 1rem', borderRadius:'10px', fontSize:'0.95rem', fontWeight:700, color:'#fbbf24' }}>👑 Admin</Link>
          )}
          <hr style={{ border:'none', borderTop:'1px solid rgba(255,255,255,0.07)', margin:'0.5rem 0' }} />
          {user ? (
            <>
              {['/dashboard','/profile','/bookings'].map((path,i) => (
                <Link key={path} to={path} style={{ textDecoration:'none', display:'block', padding:'0.75rem 1rem', borderRadius:'10px', fontSize:'0.95rem', fontWeight:600, color:'#94a3b8' }}>
                  {['📊 Dashboard','👤 Profile','📅 My Bookings'][i]}
                </Link>
              ))}
              <button onClick={logout} style={{ width:'100%', textAlign:'left', padding:'0.75rem 1rem', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontWeight:700, fontSize:'0.95rem', cursor:'pointer', marginTop:'0.25rem' }}>
                🚪 Sign Out
              </button>
            </>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.25rem' }}>
              <Link to="/login"    style={{ textDecoration:'none', padding:'0.8rem 1rem', borderRadius:'10px', textAlign:'center', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', fontWeight:700 }}>Sign In</Link>
              <Link to="/register" style={{ textDecoration:'none', padding:'0.8rem 1rem', borderRadius:'10px', textAlign:'center', background:'linear-gradient(135deg,#7c3aed,#ec4899)', color:'#fff', fontWeight:700 }}>Get Started</Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .desktop-nav { display:none; }
        @media(min-width:1024px) {
          .desktop-nav { display:flex !important; }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </nav>
  );
};

export default PremiumNavbar;
