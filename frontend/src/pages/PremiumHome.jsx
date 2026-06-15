import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';

function useCounter(target, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.floor(p * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [val, ref];
}

const STATS = [
  { value: 500, suffix: '+',  label: 'Premium Fields',  icon: 'stadium'     },
  { value: 12,  suffix: 'K+', label: 'Active Players',  icon: 'group'       },
  { value: 98,  suffix: '%',  label: 'Satisfaction',    icon: 'star'        },
  { value: 24,  suffix: '/7', label: 'Always Open',     icon: 'schedule'    },
];

const SPORTS = [
  { name: 'Football',   icon: '⚽', sport: 'football'   },
  { name: 'Cricket',    icon: '🏏', sport: 'cricket'    },
  { name: 'Basketball', icon: '🏀', sport: 'basketball' },
  { name: 'Tennis',     icon: '🎾', sport: 'tennis'     },
  { name: 'Badminton',  icon: '🏸', sport: 'badminton'  },
  { name: 'Volleyball', icon: '🏐', sport: 'volleyball' },
];

const FEATURES = [
  { icon: 'bolt',              title: 'Instant Booking',   desc: 'Reserve any field in under 60 seconds. Real-time availability, zero waiting.'              },
  { icon: 'lock',              title: 'Secure Payments',   desc: 'Bank-grade encryption on all transactions. Your money is always protected.'                },
  { icon: 'smartphone',        title: 'Mobile First',      desc: 'Full-featured experience on any device. Book from anywhere, anytime.'                      },
  { icon: 'verified',          title: 'Verified Venues',   desc: 'Every field is inspected and approved. We guarantee premium quality.'                      },
  { icon: 'auto_awesome',      title: 'Smart Scheduling',  desc: 'AI-assisted time slot suggestions based on your preferences and history.'                  },
  { icon: 'stars',             title: 'Loyalty Rewards',   desc: 'Earn points with every booking. Redeem for free sessions and exclusive perks.'             },
];

const TESTIMONIALS = [
  { name: 'Rafique Islam',  sport: 'Football',   text: "Booked my team's weekly match in under 2 minutes. The field was exactly as advertised — floodlit, premium turf.", init: 'R' },
  { name: 'Priya Sharma',   sport: 'Tennis',     text: "Finally a platform that shows real availability. No more calling around. I use it every week!",               init: 'P' },
  { name: 'Tanvir Ahmed',   sport: 'Basketball', text: "The QR check-in is brilliant. Just scan at the gate and you're in. Zero hassle, premium experience.",          init: 'T' },
  { name: 'Nusrat Jahan',   sport: 'Badminton',  text: "Found a court near my office with parking and changing rooms. The verified venues give you peace of mind.",     init: 'N' },
];

function StatCard({ value, suffix, label, icon }) {
  const [count, ref] = useCounter(value);
  return (
    <article ref={ref} style={{
      background: 'rgba(18,33,49,0.6)',
      border: '1px solid rgba(195,244,0,0.12)',
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      backdropFilter: 'blur(12px)',
      transition: 'all 300ms',
    }}
    onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(195,244,0,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
    onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(195,244,0,0.12)'; e.currentTarget.style.transform = 'none'; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#c3f400', display: 'block', marginBottom: '0.5rem' }}>{icon}</span>
      <div style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: '2.2rem', color: '#f0f6ff', lineHeight: 1 }}>
        {count}{suffix}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#506070', marginTop: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
    </article>
  );
}

StatCard.propTypes = {
  value:  PropTypes.number.isRequired,
  suffix: PropTypes.string.isRequired,
  label:  PropTypes.string.isRequired,
  icon:   PropTypes.string.isRequired,
};

export default function PremiumHome() {
  const navigate  = useNavigate();
  const [search, setSearch] = useState('');
  const [sport, setSport]   = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (sport)  params.set('sport', sport);
    navigate(`/fields?${params.toString()}`);
  };

  return (
    <div style={{ background: '#051424', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Ambient orbs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(195,244,0,0.07) 0%,transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,94,7,0.06) 0%,transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '45%', left: '40%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(195,244,0,0.04) 0%,transparent 65%)', filter: 'blur(50px)' }} />
      </div>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, paddingTop: 'clamp(6rem,14vh,10rem)', paddingBottom: 'clamp(4rem,8vh,7rem)', textAlign: 'center', padding: 'clamp(6rem,14vh,10rem) 1.5rem clamp(4rem,8vh,7rem)' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '99px', background: 'rgba(195,244,0,0.1)', border: '1px solid rgba(195,244,0,0.25)', marginBottom: '2rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c3f400', display: 'inline-block', animation: 'pulse-lime 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#c3f400', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bangladesh #1 Sports Platform</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Anybody', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
          color: '#f0f6ff',
          marginBottom: '1.5rem',
          maxWidth: '900px',
          margin: '0 auto 1.5rem',
        }}>
          Book Premium
          <br />
          <span style={{ color: '#c3f400', display: 'inline-block', position: 'relative' }}>
            Sports Fields
            <svg style={{ position: 'absolute', bottom: '-8px', left: 0, right: 0, width: '100%' }} viewBox="0 0 400 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 9C80 3 160 1 200 3C240 5 320 9 398 5" stroke="#c3f400" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </span>
          <br />
          Instantly
        </h1>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(1rem,2vw,1.2rem)', color: '#8ba3be', maxWidth: '560px', margin: '0 auto 3rem', lineHeight: 1.7 }}>
          Find, compare, and book the best sports venues near you. Real-time availability, instant confirmation, and loyalty rewards.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '640px', margin: '0 auto 2.5rem', background: 'rgba(13,28,45,0.8)', border: '1px solid rgba(195,244,0,0.2)', borderRadius: '14px', padding: '0.4rem', backdropFilter: 'blur(16px)' }}>
          <span className="material-symbols-outlined" style={{ color: '#506070', fontSize: '1.1rem', alignSelf: 'center', marginLeft: '0.5rem' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by location, sport, or venue..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f0f6ff', fontSize: '0.95rem', fontFamily: "'Inter', sans-serif", padding: '0.5rem 0.3rem' }}
          />
          <select
            value={sport}
            onChange={e => setSport(e.target.value)}
            style={{ background: 'rgba(195,244,0,0.08)', border: 'none', outline: 'none', color: '#c3f400', fontSize: '0.85rem', padding: '0.4rem 0.7rem', borderRadius: '8px', fontFamily: "'Inter', sans-serif", cursor: 'pointer' }}
          >
            <option value="">All Sports</option>
            {SPORTS.map(s => <option key={s.sport} value={s.sport}>{s.name}</option>)}
          </select>
          <button type="submit" style={{ background: '#c3f400', color: '#0a1200', border: 'none', borderRadius: '10px', padding: '0.6rem 1.3rem', fontFamily: "'Anybody', sans-serif", fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >Search</button>
        </form>

        {/* CTA group */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/fields" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem', background: '#c3f400', color: '#0a1200', borderRadius: '10px', textDecoration: 'none', fontFamily: "'Anybody', sans-serif", fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 8px 32px rgba(195,244,0,0.35)', transition: 'all 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(195,244,0,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(195,244,0,0.35)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>explore</span>
            <span>Browse Fields</span>
          </Link>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem', background: 'transparent', color: '#f0f6ff', borderRadius: '10px', textDecoration: 'none', fontFamily: "'Anybody', sans-serif", fontWeight: 700, fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.15)', transition: 'all 200ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>person_add</span>
            <span>Join Free</span>
          </Link>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 5rem', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── SPORTS CAROUSEL ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 6rem', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#c3f400', letterSpacing: '0.12em', textTransform: 'uppercase' }}>What we offer</span>
          <h2 style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#f0f6ff', margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>Pick Your Sport</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '0.75rem' }}>
          {SPORTS.map(s => (
            <Link
              key={s.sport}
              to={`/fields?sport=${s.sport}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                padding: '1.5rem 0.5rem',
                background: 'rgba(18,33,49,0.55)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px', textDecoration: 'none',
                transition: 'all 250ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(195,244,0,0.3)'; e.currentTarget.style.background = 'rgba(195,244,0,0.06)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(18,33,49,0.55)'; e.currentTarget.style.transform = 'none'; }}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{s.icon}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#8ba3be' }}>{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 7rem', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#c3f400', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Why Kinetic Elite</span>
          <h2 style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#f0f6ff', margin: '0.5rem 0 0.75rem', letterSpacing: '-0.02em' }}>Built for Athletes</h2>
          <p style={{ color: '#506070', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>Every feature designed with the player experience first. Fast, reliable, premium.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
          {FEATURES.map((f, i) => (
            <article key={f.title} style={{
              background: 'rgba(18,33,49,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '1.75rem',
              backdropFilter: 'blur(12px)',
              transition: 'all 300ms',
              animationDelay: `${i * 60}ms`,
            }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(195,244,0,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(18,33,49,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(18,33,49,0.6)'; }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(195,244,0,0.1)', border: '1px solid rgba(195,244,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#c3f400', fontSize: '1.2rem' }}>{f.icon}</span>
              </div>
              <h3 style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#f0f6ff', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: '#506070', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 7rem', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#c3f400', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Simple Process</span>
          <h2 style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#f0f6ff', margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>Book in 3 Steps</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem' }}>
          {[
            { step: '01', icon: 'search', title: 'Find Your Field',  desc: 'Search by sport, location, or availability. Filter to your exact needs.' },
            { step: '02', icon: 'event',  title: 'Pick Your Slot',   desc: 'See live availability. Choose date and time that works for you.'          },
            { step: '03', icon: 'check_circle', title: 'Confirm & Play', desc: 'Instant booking confirmation. Get QR code for contactless entry.'   },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: '#c3f400', fontSize: '1.3rem' }}>{item.icon}</span>
                </div>
              </div>
              <div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#506070', letterSpacing: '0.1em' }}>{item.step}</span>
                <h3 style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#f0f6ff', margin: '0.15rem 0 0.4rem' }}>{item.title}</h3>
                <p style={{ color: '#506070', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 7rem', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#c3f400', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Real Players</span>
          <h2 style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#f0f6ff', margin: '0.5rem 0 0', letterSpacing: '-0.02em' }}>What Athletes Say</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
          {TESTIMONIALS.map(t => (
            <article key={t.name} style={{
              background: 'rgba(18,33,49,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '1.5rem',
              backdropFilter: 'blur(12px)',
              transition: 'all 250ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(195,244,0,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; }}
            >
              <div style={{ color: '#c3f400', fontSize: '1.2rem', marginBottom: '0.75rem' }}>★★★★★</div>
              <p style={{ color: '#8ba3be', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 1.25rem', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#c3f400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: '0.9rem', color: '#0a1200', flexShrink: 0 }}>{t.init}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f0f6ff', fontSize: '0.875rem' }}>{t.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#506070', letterSpacing: '0.05em' }}>{t.sport}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 8rem', maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(195,244,0,0.08) 0%, rgba(255,94,7,0.06) 100%)',
          border: '1px solid rgba(195,244,0,0.2)',
          borderRadius: '24px', padding: 'clamp(2.5rem,6vw,4rem)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(195,244,0,0.1) 0%,transparent 65%)', pointerEvents: 'none' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#c3f400', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>Get Started Today</span>
          <h2 style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#f0f6ff', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>Ready to Play?</h2>
          <p style={{ color: '#8ba3be', maxWidth: '420px', margin: '0 auto 2rem', lineHeight: 1.7 }}>Join thousands of athletes who book smarter. Create your free account today.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2.2rem', background: '#c3f400', color: '#0a1200', borderRadius: '10px', textDecoration: 'none', fontFamily: "'Anybody', sans-serif", fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 8px 32px rgba(195,244,0,0.35)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>rocket_launch</span>
              <span>Create Free Account</span>
            </Link>
            <Link to="/fields" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2.2rem', background: 'transparent', color: '#f0f6ff', borderRadius: '10px', textDecoration: 'none', fontFamily: "'Anybody', sans-serif", fontWeight: 700, fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>explore</span>
              <span>Explore Fields</span>
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse-lime {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
