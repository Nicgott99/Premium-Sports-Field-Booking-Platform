import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Spin = () => <span className="spinner" style={{ width: '18px', height: '18px' }} />;

const WorkingLogin = () => {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const change = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        navigate(data.data.user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => setForm({ email: 'demo@sportspro.com', password: '' });

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem 2rem' }}>
      {/* ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.22),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.18),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)', transition: 'opacity .5s ease, transform .5s ease' }}>

        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '46px', height: '46px', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 4px 18px rgba(124,58,237,0.45)' }}>🏆</div>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PREMIUM SPORTS</span>
          </Link>
        </div>

        <div className="card" style={{ padding: '2.5rem' }}>
          {/* heading */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.6rem' }}>🔐</div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 0.35rem' }}>Welcome Back</h1>
            <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>Sign in to your premium account</p>
          </div>

          <form onSubmit={submit}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.87rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="wl-email" className="field-label">Email Address</label>
              <input id="wl-email" type="email" name="email" value={form.email}
                onChange={change} className="input-field"
                placeholder="you@example.com" autoComplete="email" required />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="wl-password" className="field-label">Password</label>
              <input id="wl-password" type={showPw ? 'text' : 'password'} name="password"
                value={form.password} onChange={change} className="input-field"
                placeholder="Enter your password" autoComplete="current-password"
                style={{ paddingRight: '3rem' }} required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: '1rem', bottom: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem' }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <label htmlFor="wl-remember" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.87rem' }}>
                <input id="wl-remember" type="checkbox" checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#7c3aed', width: '15px', height: '15px' }} />
                <span>Remember me</span>
              </label>
              <span style={{ color: '#7c3aed', fontSize: '0.87rem', fontWeight: 600, cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '0.85rem', marginBottom: '0.75rem' }}>
              {loading ? <Spin /> : '🚀 Sign In'}
            </button>

            <button type="button" onClick={fillDemo}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '11px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
              🎮 Fill Demo Credentials
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1.5rem 0', textAlign: 'center' }}>
            <span style={{ background: 'transparent', padding: '0 0.75rem', color: '#475569', fontSize: '0.85rem' }}>or continue with</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[['🔍', 'Google'], ['📘', 'Facebook']].map(([icon, name]) => (
              <button key={name} type="button"
                style={{ padding: '0.7rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {icon} {name}
              </button>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.87rem', margin: 0 }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
          </p>
        </div>

        {/* feature chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.6rem', marginTop: '1.5rem' }}>
          {[['🏟️','Premium Fields'],['⚡','Instant Book'],['🏆','Tournaments'],['📊','Analytics']].map(([icon, label]) => (
            <div key={label} className="card" style={{ padding: '0.9rem 0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{icon}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '1.25rem' }}>
          © 2025 Premium Sports Platform · All rights reserved
        </p>
      </div>
    </div>
  );
};

export default WorkingLogin;
