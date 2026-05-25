import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ADMIN_EMAIL = 'hasibullah.khan.alvie@g.bracu.ac.bd';

const Spin = () => <span className="spinner" style={{ width: '18px', height: '18px' }} />;

/* ── Password helpers ── */
const hasLen     = (pw) => pw.length >= 8;
const hasLower   = (pw) => /[a-z]/.test(pw);
const hasUpper   = (pw) => /[A-Z]/.test(pw);
const hasNum     = (pw) => /\d/.test(pw);
const hasSpecial = (pw) => /[@$!%*?&]/.test(pw);

const pwStrength = (pw) => {
  if (!pw) return { pct: 0, label: '', color: '#334155' };
  const passed = [hasLen(pw), hasLower(pw), hasUpper(pw), hasNum(pw), hasSpecial(pw)].filter(Boolean).length;
  if (passed <= 1) return { pct: 20,  label: 'Weak',      color: '#ef4444' };
  if (passed === 2) return { pct: 40, label: 'Fair',      color: '#f59e0b' };
  if (passed === 3) return { pct: 60, label: 'Good',      color: '#3b82f6' };
  if (passed === 4) return { pct: 80, label: 'Strong',    color: '#8b5cf6' };
  return               { pct: 100,   label: 'Very Strong', color: '#10b981' };
};

const REQ = [
  { fn: hasLen,     label: '8+ characters' },
  { fn: hasLower,   label: 'Lowercase (a-z)' },
  { fn: hasUpper,   label: 'Uppercase (A-Z)' },
  { fn: hasNum,     label: 'Number (0-9)' },
  { fn: hasSpecial, label: 'Special char (@$!%*?&)' },
];

/* ── Register form ── */
function RegisterForm({ onDone }) {
  const [form, setForm]     = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPw, setShowPw] = useState(false);

  const change = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    const allMet = REQ.every(r => r.fn(form.password));
    if (!allMet) { setError('Password must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&).'); return; }

    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        const { token, user } = data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        onDone(user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        const firstErr = data.errors?.[0]?.msg || data.message || 'Registration failed';
        setError(firstErr);
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const strength  = pwStrength(form.password);
  const isAdmin   = form.email === ADMIN_EMAIL;
  const pwReady   = REQ.every(r => r.fn(form.password));

  return (
    <form onSubmit={submit}>
      {error && <div style={S.errorBox}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label htmlFor="reg-fn" className="field-label">First Name</label>
          <input id="reg-fn" type="text" name="firstName" value={form.firstName}
            onChange={change} className="input-field" placeholder="First name"
            autoComplete="given-name" required />
        </div>
        <div>
          <label htmlFor="reg-ln" className="field-label">Last Name</label>
          <input id="reg-ln" type="text" name="lastName" value={form.lastName}
            onChange={change} className="input-field" placeholder="Last name"
            autoComplete="family-name" required />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reg-email" className="field-label">Email Address</label>
        <input id="reg-email" type="email" name="email" value={form.email}
          onChange={change} className="input-field" placeholder="you@example.com"
          autoComplete="email" required />
        {isAdmin && <p style={{ color: '#fbbf24', fontSize: '0.8rem', marginTop: '0.3rem' }}>👑 Admin account detected</p>}
      </div>

      <div className="form-group">
        <label htmlFor="reg-phone" className="field-label">Phone Number</label>
        <input id="reg-phone" type="tel" name="phone" value={form.phone}
          onChange={change} className="input-field" placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
          autoComplete="tel" required />
        <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.3rem' }}>
          Bangladesh format: 01XXXXXXXXX
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="reg-pw" className="field-label">Password</label>
        <div style={{ position: 'relative' }}>
          <input id="reg-pw" type={showPw ? 'text' : 'password'} name="password" value={form.password}
            onChange={change} className="input-field" placeholder="e.g. MyPass@123"
            autoComplete="new-password" style={{ paddingRight: '3rem' }} required />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem' }}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
        {form.password && (
          <div style={{ marginTop: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: '9999px', transition: 'width 300ms, background 300ms' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strength.color, minWidth: '5rem' }}>{strength.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
              {REQ.map(r => {
                const met = r.fn(form.password);
                return (
                  <div key={r.label} style={{ fontSize: '0.72rem', color: met ? '#6ee7b7' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: met ? '#6ee7b7' : '#475569' }}>{met ? '✓' : '○'}</span>
                    {r.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="reg-confirm" className="field-label">Confirm Password</label>
        <input id="reg-confirm" type="password" name="confirmPassword" value={form.confirmPassword}
          onChange={change} className="input-field" placeholder="Re-enter password"
          autoComplete="new-password" required />
        {form.confirmPassword && (
          <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: form.password === form.confirmPassword ? '#10b981' : '#ef4444' }}>
            {form.password === form.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
          </p>
        )}
      </div>

      <button type="submit" disabled={loading || !pwReady} className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.85rem', marginBottom: '1.25rem', opacity: (!pwReady && !loading) ? 0.6 : 1 }}>
        {loading ? <Spin /> : '🚀 Create Account'}
      </button>

      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
      </div>
    </form>
  );
}
RegisterForm.propTypes = { onDone: PropTypes.func.isRequired };

const S = {
  errorBox: {
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
    borderRadius: '10px', padding: '0.75rem 1rem', color: '#f87171',
    fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.5rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
};

/* ── Page ── */
const PremiumRegister = () => {
  const navigate          = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem 2rem' }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.2),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '520px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition: 'opacity .5s ease, transform .5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 4px 20px rgba(124,58,237,0.45)' }}>🏆</div>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PREMIUM SPORTS</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9', marginBottom: '0.4rem' }}>Create Your Account</h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Join 12,000+ athletes on Premium Sports</p>
          </div>

          <RegisterForm onDone={path => navigate(path)} />
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          © 2025 Premium Sports Platform · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default PremiumRegister;
