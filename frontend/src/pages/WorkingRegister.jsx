import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Spin = () => <span className="spinner" style={{ width: '18px', height: '18px' }} />;

const checks = [
  { fn: (pw) => pw.length >= 8,          label: '8+ characters' },
  { fn: (pw) => /[a-z]/.test(pw),        label: 'Lowercase (a-z)' },
  { fn: (pw) => /[A-Z]/.test(pw),        label: 'Uppercase (A-Z)' },
  { fn: (pw) => /\d/.test(pw),           label: 'Number (0-9)' },
  { fn: (pw) => /[@$!%*?&]/.test(pw),    label: 'Special (@$!%*?&)' },
];

const pwStrength = (pw) => {
  if (!pw) return { pct: 0, color: '#334155', label: '' };
  const n = checks.filter(c => c.fn(pw)).length;
  if (n <= 1) return { pct: 20,  color: '#ef4444', label: 'Weak' };
  if (n === 2) return { pct: 40, color: '#f59e0b', label: 'Fair' };
  if (n === 3) return { pct: 60, color: '#3b82f6', label: 'Good' };
  if (n === 4) return { pct: 80, color: '#8b5cf6', label: 'Strong' };
  return              { pct: 100, color: '#10b981', label: 'Very Strong' };
};

const SPORT_OPTS = [
  { id: 'football',   label: '⚽ Football' },
  { id: 'cricket',    label: '🏏 Cricket' },
  { id: 'basketball', label: '🏀 Basketball' },
  { id: 'tennis',     label: '🎾 Tennis' },
  { id: 'badminton',  label: '🏸 Badminton' },
  { id: 'volleyball', label: '🏐 Volleyball' },
];

const WorkingRegister = () => {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', agreeTerms: false });
  const [sports, setSports]     = useState([]);
  const toggleSport = (id) => setSports(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!checks.every(c => c.fn(form.password))) { setError('Password must meet all strength requirements.'); return; }
    if (!form.agreeTerms) { setError('Please agree to the Terms and Conditions.'); return; }

    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password, sports }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const strength = pwStrength(form.password);
  const pwMatch  = form.confirmPassword ? form.password === form.confirmPassword : null;

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', padding: '5rem 1rem 3rem' }}>
      {/* ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.18),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition: 'opacity .5s ease, transform .5s ease' }}>

        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '46px', height: '46px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 4px 18px rgba(124,58,237,0.45)' }}>🏆</div>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PREMIUM SPORTS</span>
          </Link>
          <div style={{ marginTop: '1rem' }}>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 0.3rem' }}>Create Your Account</h1>
            <p style={{ color: '#64748b', fontSize: '0.93rem', margin: 0 }}>Join thousands of sports enthusiasts on our platform</p>
          </div>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          <form onSubmit={submit}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.87rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            {/* name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="wr-first" className="field-label">First Name</label>
                <input id="wr-first" type="text" name="firstName" value={form.firstName}
                  onChange={change} className="input-field" placeholder="First name"
                  autoComplete="given-name" required />
              </div>
              <div className="form-group">
                <label htmlFor="wr-last" className="field-label">Last Name</label>
                <input id="wr-last" type="text" name="lastName" value={form.lastName}
                  onChange={change} className="input-field" placeholder="Last name"
                  autoComplete="family-name" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="wr-email" className="field-label">Email Address</label>
              <input id="wr-email" type="email" name="email" value={form.email}
                onChange={change} className="input-field" placeholder="you@example.com"
                autoComplete="email" required />
            </div>

            <div className="form-group">
              <label htmlFor="wr-phone" className="field-label">Phone Number</label>
              <input id="wr-phone" type="tel" name="phone" value={form.phone}
                onChange={change} className="input-field" placeholder="+880 1xxx xxxxxx"
                autoComplete="tel" required />
            </div>

            {/* Sports interests */}
            <div className="form-group">
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                Sports Interests <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SPORT_OPTS.map(s => (
                  <button key={s.id} type="button" onClick={() => toggleSport(s.id)}
                    style={{ padding: '0.35rem 0.9rem', borderRadius: '999px', border: `1px solid ${sports.includes(s.id) ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`, background: sports.includes(s.id) ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', color: sports.includes(s.id) ? '#c4b5fd' : '#94a3b8', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all .15s' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* password row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="wr-pw" className="field-label">Password</label>
                <input id="wr-pw" type={showPw ? 'text' : 'password'} name="password"
                  value={form.password} onChange={change} className="input-field"
                  placeholder="Min 8 characters" autoComplete="new-password"
                  style={{ paddingRight: '3rem' }} required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '1rem', bottom: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="wr-cpw" className="field-label">Confirm Password</label>
                <input id="wr-cpw" type={showCPw ? 'text' : 'password'} name="confirmPassword"
                  value={form.confirmPassword} onChange={change} className="input-field"
                  placeholder="Repeat password" autoComplete="new-password"
                  style={{ paddingRight: '3rem' }} required />
                <button type="button" onClick={() => setShowCPw(v => !v)}
                  style={{ position: 'absolute', right: '1rem', bottom: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem' }}>
                  {showCPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* strength bar */}
            {form.password && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                  <div style={{ width: `${strength.pct}%`, height: '100%', background: strength.color, borderRadius: '999px', transition: 'width .3s, background .3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: strength.color, fontSize: '0.78rem', fontWeight: 700 }}>{strength.label}</span>
                  {pwMatch !== null && (
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pwMatch ? '#10b981' : '#ef4444' }}>
                      {pwMatch ? '✓ Passwords match' : '✗ Passwords differ'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {checks.map(c => (
                    <span key={c.label} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: c.fn(form.password) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: c.fn(form.password) ? '#6ee7b7' : '#475569', border: `1px solid ${c.fn(form.password) ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`, fontWeight: 600 }}>
                      {c.fn(form.password) ? '✓' : '○'} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* terms */}
            <label htmlFor="wr-terms" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
              <input id="wr-terms" type="checkbox" name="agreeTerms" checked={form.agreeTerms}
                onChange={change} style={{ accentColor: '#7c3aed', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} required />
              <span style={{ color: '#94a3b8', fontSize: '0.87rem', lineHeight: 1.5 }}>
                I agree to the <span style={{ color: '#a78bfa', fontWeight: 700, cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: '#a78bfa', fontWeight: 700, cursor: 'pointer' }}>Privacy Policy</span>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.9rem' }}>
              {loading ? <Spin /> : '🚀 Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.87rem', marginTop: '1.5rem', marginBottom: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Sign in here</Link>
          </p>
        </div>

        {/* perks */}
        <div className="card" style={{ marginTop: '1.25rem', padding: '1.5rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', textAlign: 'center' }}>What you get for free</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
            {[
              ['🏟️', 'Premium Fields',  'Access top-tier facilities'],
              ['⚡', 'Instant Booking', 'Reserve in seconds'],
              ['🏆', 'Tournaments',     'Join competitive events'],
              ['📊', 'Analytics',       'Track your progress'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.83rem' }}>{title}</div>
                  <div style={{ color: '#475569', fontSize: '0.75rem' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '1.25rem' }}>
          © 2025 Premium Sports Platform · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default WorkingRegister;
