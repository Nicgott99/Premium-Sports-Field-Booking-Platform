import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ADMIN_EMAIL = 'hasibullah.khan.alvie@g.bracu.ac.bd';

/* ── Spinner helper ─── */
const Spin = () => <span className="spinner" style={{ width: '18px', height: '18px' }} />;

/* ── Step 1: credential form ─── */
function LoginForm({ onSuccess, onAdminStep }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        const { token, user } = data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        onSuccess(user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = formData.email === ADMIN_EMAIL;

  return (
    <form onSubmit={submit}>
      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      <div className="form-group">
        <label htmlFor="login-email" className="field-label">Email Address</label>
        <input id="login-email" type="email" name="email" value={formData.email}
          onChange={handleChange} className="input-field"
          placeholder="you@example.com" autoComplete="email" required />
      </div>

      <div className="form-group" style={{ position: 'relative' }}>
        <label htmlFor="login-password" className="field-label">Password</label>
        <input id="login-password" type={showPw ? 'text' : 'password'} name="password"
          value={formData.password} onChange={handleChange} className="input-field"
          placeholder="Enter your password" autoComplete="current-password"
          style={{ paddingRight: '3rem' }} required />
        <button type="button" onClick={() => setShowPw(v => !v)} style={styles.eyeBtn}>
          {showPw ? '🙈' : '👁️'}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <label htmlFor="remember-me" style={styles.checkLabel}>
          <input id="remember-me" type="checkbox" checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={{ accentColor: '#7c3aed', width: '15px', height: '15px' }} />
          <span>Remember me</span>
        </label>
        <span style={{ color: '#7c3aed', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
          Forgot password?
        </span>
      </div>

      {isAdmin && (
        <div style={styles.adminBanner}>
          👑 Admin account — extra verification will be required
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.85rem', marginBottom: '1.25rem' }}>
        {loading ? <Spin /> : '🚀 Sign In'}
      </button>

      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
        No account?{' '}
        <Link to="/register" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
        <button type="button" onClick={() => setFormData({ email: ADMIN_EMAIL, password: '' })}
          style={styles.quickBtn}>
          👑 Quick Admin (fill email only)
        </button>
      </div>
    </form>
  );
}
LoginForm.propTypes = {
  onSuccess:   PropTypes.func.isRequired,
  onAdminStep: PropTypes.func.isRequired,
};

/* ── Step 2: admin OTP form ─── */
function AdminVerifyForm({ email, onBack, onSuccess }) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/v1/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: code }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess('/admin');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      <div style={styles.adminBanner}>
        <strong>👑 Admin Security Verification</strong>
        <span style={{ display: 'block', fontSize: '0.83rem', marginTop: '0.25rem', color: '#d97706' }}>
          Check the backend terminal for your 6-digit code.
        </span>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label htmlFor="verify-code" className="field-label">Verification Code</label>
        <input id="verify-code" type="text" value={code}
          onChange={e => { setCode(e.target.value); setError(''); }}
          className="input-field" placeholder="000000" maxLength="6"
          style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.5em' }}
          required />
      </div>

      <button type="submit" disabled={loading || code.length !== 6}
        style={{ ...styles.goldBtn, opacity: (loading || code.length !== 6) ? 0.5 : 1 }}>
        {loading ? <Spin /> : '👑 Verify Admin Access'}
      </button>

      <button type="button" onClick={onBack}
        style={{ width: '100%', padding: '0.65rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.88rem', marginTop: '0.5rem' }}>
        ← Back to Login
      </button>
    </form>
  );
}
AdminVerifyForm.propTypes = {
  email:     PropTypes.string.isRequired,
  onBack:    PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

/* ── Shared styles object (avoids repetition) ─── */
const styles = {
  errorBox: {
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
    borderRadius: '10px', padding: '0.75rem 1rem', color: '#f87171',
    fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.5rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  adminBanner: {
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '10px', padding: '0.75rem 1rem', color: '#fbbf24',
    fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.25rem',
  },
  eyeBtn: {
    position: 'absolute', right: '1rem', bottom: '0.85rem',
    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
    fontSize: '1rem', lineHeight: 1,
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    cursor: 'pointer', color: '#94a3b8', fontSize: '0.88rem',
  },
  quickBtn: {
    width: '100%', padding: '0.65rem', borderRadius: '9px',
    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
    color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
  },
  goldBtn: {
    width: '100%', padding: '0.85rem', borderRadius: '12px',
    background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none',
    color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    marginTop: '0.5rem',
  },
};

/* ── Main page ─── */
const PremiumLogin = () => {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [adminEmail, setAdminEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem 2rem' }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.22),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.18),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition: 'opacity .5s ease, transform .5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 20px rgba(124,58,237,0.45)' }}>🏆</div>
            <span style={{ fontWeight: 900, fontSize: '1.2rem', background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PREMIUM SPORTS</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{step === 1 ? '🔐' : '👑'}</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9', marginBottom: '0.4rem' }}>
              {step === 1 ? 'Welcome Back' : 'Admin Verification'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              {step === 1 ? 'Sign in to your premium account' : 'Enter the 6-digit code from the terminal'}
            </p>
          </div>

          {step === 1
            ? <LoginForm onSuccess={path => navigate(path)} onAdminStep={email => { setAdminEmail(email); setStep(2); }} />
            : <AdminVerifyForm email={adminEmail} onBack={() => setStep(1)} onSuccess={path => navigate(path)} />
          }
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          © 2025 Premium Sports Platform · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default PremiumLogin;
