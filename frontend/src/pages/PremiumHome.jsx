import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/* ── Animated counter hook ─────────────────────────────────── */
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

/* ── Data ─────────────────────────────────────────────────── */
const STATS = [
  { value: 500,  suffix: '+', label: 'Premium Fields',  color: '#a78bfa', icon: '🏟️' },
  { value: 12,   suffix: 'K+',label: 'Active Players',  color: '#67e8f9', icon: '👥' },
  { value: 98,   suffix: '%', label: 'Satisfaction',    color: '#6ee7b7', icon: '⭐' },
  { value: 24,   suffix: '/7', label: 'Support',        color: '#fcd34d', icon: '🛎️' },
];

const SPORTS = [
  { name:'Football',   emoji:'⚽', color:'#22c55e', bg:'rgba(34,197,94,0.12)',   border:'rgba(34,197,94,0.25)'   },
  { name:'Cricket',    emoji:'🏏', color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)'  },
  { name:'Basketball', emoji:'🏀', color:'#f97316', bg:'rgba(249,115,22,0.12)',  border:'rgba(249,115,22,0.25)'  },
  { name:'Tennis',     emoji:'🎾', color:'#a3e635', bg:'rgba(163,230,53,0.12)',  border:'rgba(163,230,53,0.25)'  },
  { name:'Badminton',  emoji:'🏸', color:'#38bdf8', bg:'rgba(56,189,248,0.12)',  border:'rgba(56,189,248,0.25)'  },
  { name:'Volleyball', emoji:'🏐', color:'#c084fc', bg:'rgba(192,132,252,0.12)', border:'rgba(192,132,252,0.25)' },
];

const FEATURES = [
  { icon:'⚡', title:'Instant Booking',    desc:'Reserve any field in under 60 seconds. Real-time availability, zero waiting.', color:'#7c3aed', bg:'rgba(124,58,237,0.12)' },
  { icon:'🔒', title:'Secure Payments',   desc:'Bank-grade encryption on all transactions. Your money is always protected.', color:'#06b6d4', bg:'rgba(6,182,212,0.12)'   },
  { icon:'📱', title:'Mobile First',      desc:'Full-featured experience on any device. Book from anywhere, anytime.',         color:'#ec4899', bg:'rgba(236,72,153,0.12)'  },
  { icon:'⭐', title:'Verified Venues',   desc:'Every field is inspected and approved. We guarantee premium quality.',         color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
  { icon:'🎯', title:'Smart Scheduling', desc:'AI-assisted time slot suggestions based on your preferences and history.',      color:'#10b981', bg:'rgba(16,185,129,0.12)' },
  { icon:'🏆', title:'Loyalty Rewards',  desc:'Earn points with every booking. Redeem for free sessions and exclusive perks.', color:'#f87171', bg:'rgba(248,113,113,0.12)' },
];

const HOW = [
  { step:'01', title:'Create Account', desc:'Sign up in seconds with email verification for maximum security.', icon:'👤' },
  { step:'02', title:'Find Your Field', desc:'Browse premium venues by sport, location, date and price range.', icon:'🔍' },
  { step:'03', title:'Pick a Time Slot', desc:'Choose from available 2-hour slots, 8AM to midnight, every day.', icon:'📅' },
  { step:'04', title:'Play & Enjoy',    desc:'Show up, scan your QR code, and elevate your game!', icon:'🏆' },
];

/* ── Stat card with animated counter ─── */
function StatCard({ value, suffix, label, color, icon }) {
  const [count, ref] = useCounter(value);
  return (
    <div ref={ref} className="card" style={{ textAlign:'center', padding:'2rem 1rem' }}>
      <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>{icon}</div>
      <div style={{ fontSize:'2.8rem', fontWeight:900, lineHeight:1, color, marginBottom:'0.4rem' }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize:'0.82rem', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
    </div>
  );
}
StatCard.propTypes = {
  value:  PropTypes.number.isRequired,
  suffix: PropTypes.string.isRequired,
  label:  PropTypes.string.isRequired,
  color:  PropTypes.string.isRequired,
  icon:   PropTypes.string.isRequired,
};

/* ── FeaturedFieldCard ─────────────────────────────────────── */
function FeaturedFieldCard({ field, navigate }) {
  const img   = field.images?.[0]?.url;
  const sport = Array.isArray(field.sports) ? field.sports[0] : (field.sport || '');
  const city  = field.location?.city || '';
  const price = field.pricing?.hourly || 0;
  const avg   = field.rating?.average || 0;

  return (
    <div className="card featured-field-card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ height: '175px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(236,72,153,0.2))' }}>
        {img
          ? <img src={img} alt={field.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏟️</div>
        }
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.62)', borderRadius: '9999px', padding: '0.2rem 0.6rem', fontSize: '0.74rem', fontWeight: 700, color: '#fcd34d' }}>
          ⭐ {avg > 0 ? avg.toFixed(1) : 'New'}
        </div>
      </div>
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.98rem', margin: '0 0 0.3rem' }}>{field.name}</h3>
        <div style={{ color: '#64748b', fontSize: '0.81rem', marginBottom: '0.85rem', textTransform: 'capitalize' }}>
          {sport}{city ? ` · ${city}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '1.05rem' }}>৳{price.toLocaleString()}</span>
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>/hr</span>
          </div>
          <button onClick={() => navigate(`/fields/${field._id}`)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
FeaturedFieldCard.propTypes = {
  field: PropTypes.shape({
    _id:      PropTypes.string.isRequired,
    name:     PropTypes.string.isRequired,
    images:   PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
    sports:   PropTypes.arrayOf(PropTypes.string),
    sport:    PropTypes.string,
    location: PropTypes.shape({ city: PropTypes.string }),
    pricing:  PropTypes.shape({ hourly: PropTypes.number }),
    rating:   PropTypes.shape({ average: PropTypes.number }),
  }).isRequired,
  navigate: PropTypes.func.isRequired,
};

/* ── Main component ────────────────────────────────────────── */
const PremiumHome = () => {
  const navigate = useNavigate();
  const [heroVisible,     setHeroVisible]     = useState(false);
  const [featuredFields,  setFeaturedFields]  = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res  = await fetch('/api/v1/fields/featured?limit=6');
        const data = await res.json();
        if (res.ok && data.success) setFeaturedFields(data.data?.fields || []);
      } catch { /* silent */ }
      finally { setFeaturedLoading(false); }
    }
    loadFeatured();
  }, []);

  const SKELETON_KEYS = ['sk1', 'sk2', 'sk3'];

  const renderFeatured = () => {
    if (featuredLoading) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
          {SKELETON_KEYS.map(k => (
            <div key={k} className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ height: '175px', background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ padding: '1.25rem' }}>
                <div style={{ height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '0.5rem', width: '70%' }} />
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (featuredFields.length > 0) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
          {featuredFields.map(f => <FeaturedFieldCard key={f._id} field={f} navigate={navigate} />)}
        </div>
      );
    }
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟️</div>
        <p style={{ color: '#64748b', marginBottom: '1.25rem' }}>Featured fields coming soon.</p>
        <button className="btn-primary" onClick={() => navigate('/fields')}>Browse All Fields</button>
      </div>
    );
  };

  return (
    <div className="pg-bg" style={{ minHeight:'100vh' }}>

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        padding:'7rem 1.5rem 4rem', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'-10%', left:'-10%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)', filter:'blur(80px)' }} />
          <div style={{ position:'absolute', bottom:'-5%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(236,72,153,0.18),transparent 70%)', filter:'blur(80px)' }} />
          <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)', filter:'blur(60px)' }} />
        </div>

        <div style={{
          maxWidth:'860px', margin:'0 auto', position:'relative',
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'none' : 'translateY(30px)',
          transition:'opacity .7s ease, transform .7s ease',
        }}>
          {/* Tag */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 1.1rem', background:'rgba(124,58,237,0.14)', border:'1px solid rgba(124,58,237,0.35)', borderRadius:'9999px', color:'#c084fc', fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'1.5rem' }}>
            <span>✦</span> Bangladesh's #1 Sports Booking Platform
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize:'clamp(3rem,7vw,6rem)',
            fontWeight:900, lineHeight:1.05, letterSpacing:'-0.03em',
            color:'#f1f5f9', marginBottom:'1.5rem',
          }}>
            Book Premium{' '}
            <span style={{
              background:'linear-gradient(135deg,#a78bfa 0%,#f9a8d4 50%,#67e8f9 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundSize:'200% 200%',
              animation:'gradient-shift 4s ease infinite',
            }}>Sports Fields</span>
            <br />Like Never Before
          </h1>

          <p style={{ fontSize:'clamp(1rem,2.5vw,1.25rem)', color:'#94a3b8', lineHeight:1.7, maxWidth:'56ch', margin:'0 auto 2.5rem' }}>
            Discover, book, and enjoy 500+ premium sports facilities across Bangladesh. Real-time availability, instant confirmation, zero hassle.
          </p>

          {/* CTAs */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'center', marginBottom:'3rem' }}>
            <button className="btn-primary btn-xl" onClick={() => navigate('/fields')}>
              🏟️ Browse Fields
            </button>
            <button className="btn-ghost btn-xl" onClick={() => navigate('/register')}>
              Get Started Free →
            </button>
          </div>

          {/* Trust bar */}
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'2rem', color:'#64748b', fontSize:'0.82rem', fontWeight:600 }}>
            {['✅ Free to join','⚡ Instant booking','🔒 Secure payments','📱 Mobile ready'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SPORTS CATEGORIES
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:'4rem 1.5rem' }}>
        <div style={{ maxWidth:'82rem', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div className="section-tag">🏅 Sports We Cover</div>
            <h2 className="section-heading">Your Sport, Your Court</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'1rem' }}>
            {SPORTS.map(s => (
              <button key={s.name} onClick={() => navigate(`/fields?sport=${s.name.toLowerCase()}`)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:'0.75rem', padding:'1.75rem 1rem',
                background: s.bg, border:`1px solid ${s.border}`,
                borderRadius:'16px', cursor:'pointer',
                transition:'transform 200ms, box-shadow 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 30px ${s.bg}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
              >
                <span style={{ fontSize:'2.5rem' }}>{s.emoji}</span>
                <span style={{ fontWeight:700, color: s.color, fontSize:'0.9rem' }}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:'4rem 1.5rem' }}>
        <div style={{ maxWidth:'82rem', margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1.25rem' }}>
            {STATS.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURED FIELDS
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '82rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
            <div>
              <div className="section-tag">⭐ Top Venues</div>
              <h2 className="section-heading">Featured Fields</h2>
            </div>
            <button className="btn-ghost" onClick={() => navigate('/fields')}>View All Fields →</button>
          </div>
          {renderFeatured()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:'5rem 1.5rem' }}>
        <div style={{ maxWidth:'82rem', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div className="section-tag">💎 Platform Features</div>
            <h2 className="section-heading">Everything You Need</h2>
            <p className="section-sub" style={{ margin:'1rem auto 0' }}>Built with cutting-edge technology to give you the smoothest sports booking experience in Bangladesh.</p>
          </div>
          <div className="auto-grid-3">
            {FEATURES.map(f => (
              <div key={f.title} className="card feature-hover-card" style={{
                '--feat-color': f.color,
                display:'flex', flexDirection:'column', gap:'1rem',
                transition:'transform 250ms, border-color 250ms, box-shadow 250ms',
              }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight:800, fontSize:'1.05rem', color:'#f1f5f9', margin:0 }}>{f.title}</h3>
                <p style={{ color:'#64748b', fontSize:'0.88rem', lineHeight:1.6, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:'5rem 1.5rem' }}>
        <div style={{ maxWidth:'70rem', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <div className="section-tag">🚀 Simple Process</div>
            <h2 className="section-heading">Book in 4 Easy Steps</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1.5rem' }}>
            {HOW.map((h, i) => (
              <div key={h.step} className="card" style={{ position:'relative', overflow:'hidden' }}>
                {/* Step number watermark */}
                <div style={{
                  position:'absolute', top:'-0.5rem', right:'1rem',
                  fontSize:'5rem', fontWeight:900, color:'rgba(124,58,237,0.07)',
                  lineHeight:1, pointerEvents:'none', userSelect:'none',
                }}>{h.step}</div>

                <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>{h.icon}</div>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>Step {h.step}</div>
                <h3 style={{ fontWeight:800, fontSize:'1.1rem', color:'#f1f5f9', marginBottom:'0.5rem' }}>{h.title}</h3>
                <p style={{ color:'#64748b', fontSize:'0.88rem', lineHeight:1.6, margin:0 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:'5rem 1.5rem' }}>
        <div style={{ maxWidth:'60rem', margin:'0 auto' }}>
          <div style={{
            background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(236,72,153,0.15))',
            border:'1px solid rgba(124,58,237,0.3)',
            borderRadius:'24px', padding:'4rem 2.5rem',
            textAlign:'center', position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:'-30%', left:'-10%', width:'60%', height:'120%', background:'radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🏆</div>
              <h2 style={{ fontSize:'clamp(1.8rem,4vw,3rem)', fontWeight:900, color:'#f1f5f9', marginBottom:'1rem', letterSpacing:'-0.02em' }}>
                Ready to Elevate Your Game?
              </h2>
              <p style={{ color:'#94a3b8', fontSize:'1.05rem', lineHeight:1.7, marginBottom:'2.5rem', maxWidth:'48ch', margin:'0 auto 2.5rem' }}>
                Join 12,000+ athletes who trust Premium Sports for their bookings. Sign up free today.
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'center' }}>
                <button className="btn-primary btn-xl" onClick={() => navigate('/register')}>
                  ✨ Start for Free
                </button>
                <button className="btn-ghost btn-xl" onClick={() => navigate('/fields')}>
                  Browse Fields
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─── */}
      <footer style={{ padding:'3rem 1.5rem', borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
        <div style={{ maxWidth:'82rem', margin:'0 auto' }}>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'2rem', marginBottom:'2rem' }}>
            {[['Home','/'],['Fields','/fields'],['Book Now','/booking'],['About','/about'],['Contact','/contact']].map(([l,p]) => (
              <Link key={p} to={p} style={{ textDecoration:'none', color:'#475569', fontSize:'0.88rem', fontWeight:600, transition:'color 200ms' }}
              onMouseEnter={e=>e.target.style.color='#94a3b8'}
              onMouseLeave={e=>e.target.style.color='#475569'}
              >{l}</Link>
            ))}
          </div>
          <p style={{ color:'#334155', fontSize:'0.82rem' }}>© 2025 Premium Sports Platform · Built with ❤️ in Bangladesh</p>
        </div>
      </footer>

      <style>{`
        @keyframes gradient-shift {
          0%,100% { background-position:0% 50%; }
          50%      { background-position:100% 50%; }
        }
        .feature-hover-card:hover {
          transform: translateY(-4px);
          border-color: color-mix(in srgb, var(--feat-color) 33%, transparent) !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 30px color-mix(in srgb, var(--feat-color) 13%, transparent) !important;
        }
        .featured-field-card {
          transition: transform 250ms, box-shadow 250ms;
        }
        .featured-field-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.45) !important;
        }
      `}</style>
    </div>
  );
};

export default PremiumHome;
