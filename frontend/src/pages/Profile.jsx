import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/* ── Password helpers ── */
const hasLen     = pw => pw.length >= 8;
const hasLower   = pw => /[a-z]/.test(pw);
const hasUpper   = pw => /[A-Z]/.test(pw);
const hasNum     = pw => /\d/.test(pw);
const hasSpecial = pw => /[@$!%*?&]/.test(pw);
const PW_REQS = [
  { fn: hasLen,     label: '8+ characters' },
  { fn: hasLower,   label: 'Lowercase (a-z)' },
  { fn: hasUpper,   label: 'Uppercase (A-Z)' },
  { fn: hasNum,     label: 'Number (0-9)' },
  { fn: hasSpecial, label: 'Special (@$!%*?&)' },
];

function pwStrength(pw) {
  if (!pw) return { pct: 0, label: '', color: '#334155' };
  const passed = PW_REQS.filter(r => r.fn(pw)).length;
  if (passed <= 1) return { pct: 20,  label: 'Weak',       color: '#ef4444' };
  if (passed === 2) return { pct: 40, label: 'Fair',       color: '#f59e0b' };
  if (passed === 3) return { pct: 60, label: 'Good',       color: '#3b82f6' };
  if (passed === 4) return { pct: 80, label: 'Strong',     color: '#8b5cf6' };
  return               { pct: 100,   label: 'Very Strong', color: '#10b981' };
}

/* ── Toast ── */
function ToastBar({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: 'fixed', top: '5.5rem', right: '1.25rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '340px' }}>
      {toasts.map(t => {
        const bg  = t.type === 'error' ? 'rgba(239,68,68,0.12)'   : 'rgba(16,185,129,0.12)';
        const bdr = t.type === 'error' ? 'rgba(239,68,68,0.35)'   : 'rgba(16,185,129,0.35)';
        const clr = t.type === 'error' ? '#f87171'                 : '#6ee7b7';
        return (
          <div key={t.id} style={{ background: bg, border: `1px solid ${bdr}`, borderRadius: '10px', padding: '0.7rem 1rem', color: clr, fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <span>{t.msg}</span>
            <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', color: clr, cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
ToastBar.propTypes = {
  toasts:   PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, msg: PropTypes.string, type: PropTypes.string })).isRequired,
  onRemove: PropTypes.func.isRequired,
};

/* ── InfoRow ── */
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.65rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.65rem' }}>
      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600, textAlign: 'right', maxWidth: '220px', wordBreak: 'break-word', textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}
InfoRow.propTypes  = { label: PropTypes.string.isRequired, value: PropTypes.string };
InfoRow.defaultProps = { value: '' };

/* ── ProfileDisplay ── */
function ProfileDisplay({ user }) {
  const dob = user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '';
  const since = user.createdAt  ? new Date(user.createdAt).toLocaleDateString()  : '';
  return (
    <div>
      <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>📋 Profile Information</h3>
      <InfoRow label="First Name"    value={user.firstName} />
      <InfoRow label="Last Name"     value={user.lastName} />
      <InfoRow label="Email"         value={user.email} />
      <InfoRow label="Phone"         value={user.phone} />
      <InfoRow label="Bio"           value={user.bio} />
      <InfoRow label="Gender"        value={user.gender} />
      <InfoRow label="Date of Birth" value={dob} />
      <InfoRow label="Member Since"  value={since} />
    </div>
  );
}
ProfileDisplay.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string, lastName: PropTypes.string, email: PropTypes.string,
    phone: PropTypes.string, bio: PropTypes.string, gender: PropTypes.string,
    dateOfBirth: PropTypes.string, createdAt: PropTypes.string,
  }).isRequired,
};

/* ── ProfileEditForm ── */
function ProfileEditForm({ form, saving, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label htmlFor="prof-fn" className="field-label">First Name</label>
          <input id="prof-fn" type="text" name="firstName" value={form.firstName} onChange={onChange} className="input-field" />
        </div>
        <div>
          <label htmlFor="prof-ln" className="field-label">Last Name</label>
          <input id="prof-ln" type="text" name="lastName" value={form.lastName} onChange={onChange} className="input-field" />
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="prof-phone" className="field-label">Phone</label>
        <input id="prof-phone" type="tel" name="phone" value={form.phone} onChange={onChange} className="input-field" placeholder="01XXXXXXXXX" />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="prof-bio" className="field-label">Bio</label>
        <textarea id="prof-bio" name="bio" value={form.bio} onChange={onChange} rows={3} className="input-field" style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label htmlFor="prof-gender" className="field-label">Gender</label>
          <select id="prof-gender" name="gender" value={form.gender} onChange={onChange} className="input-field">
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="prof-dob" className="field-label">Date of Birth</label>
          <input id="prof-dob" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} className="input-field" />
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        {saving ? 'Saving…' : '💾 Save Changes'}
      </button>
    </form>
  );
}
ProfileEditForm.propTypes = {
  form: PropTypes.shape({ firstName: PropTypes.string, lastName: PropTypes.string, phone: PropTypes.string, bio: PropTypes.string, gender: PropTypes.string, dateOfBirth: PropTypes.string }).isRequired,
  saving:   PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

/* ── PwReqRow ── */
function PwReqRow({ label, met }) {
  const clr    = met ? '#6ee7b7' : '#64748b';
  const mrkClr = met ? '#6ee7b7' : '#475569';
  const mrk    = met ? '✓' : '○';
  return (
    <div style={{ fontSize: '0.72rem', color: clr, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      <span style={{ color: mrkClr }}>{mrk}</span>
      {label}
    </div>
  );
}
PwReqRow.propTypes = { label: PropTypes.string.isRequired, met: PropTypes.bool.isRequired };

/* ── PasswordForm ── */
function PasswordForm({ pwForm, saving, onChange, onSubmit }) {
  const [showPw, setShowPw] = useState(false);
  const strength = pwStrength(pwForm.newPassword);
  const pwAllMet = PW_REQS.every(r => r.fn(pwForm.newPassword));
  const matchClr = pwForm.newPassword === pwForm.confirmPw ? '#10b981' : '#ef4444';
  const matchMsg = pwForm.newPassword === pwForm.confirmPw ? '✅ Passwords match' : '❌ Passwords do not match';

  return (
    <form onSubmit={onSubmit}>
      <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>🔒 Change Password</h3>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="pw-current" className="field-label">Current Password</label>
        <input id="pw-current" type="password" name="currentPassword" value={pwForm.currentPassword} onChange={onChange} className="input-field" placeholder="Enter current password" autoComplete="current-password" required />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="pw-new" className="field-label">New Password</label>
        <div style={{ position: 'relative' }}>
          <input id="pw-new" type={showPw ? 'text' : 'password'} name="newPassword" value={pwForm.newPassword} onChange={onChange} className="input-field" placeholder="e.g. MyPass@123" autoComplete="new-password" style={{ paddingRight: '3rem' }} required />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1rem' }}>
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
        {pwForm.newPassword && (
          <div style={{ marginTop: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: '9999px', transition: 'width 300ms,background 300ms' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strength.color, minWidth: '5rem' }}>{strength.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
              {PW_REQS.map(r => <PwReqRow key={r.label} label={r.label} met={r.fn(pwForm.newPassword)} />)}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="pw-confirm" className="field-label">Confirm New Password</label>
        <input id="pw-confirm" type="password" name="confirmPw" value={pwForm.confirmPw} onChange={onChange} className="input-field" placeholder="Re-enter new password" autoComplete="new-password" required />
        {pwForm.confirmPw && (
          <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: matchClr }}>{matchMsg}</p>
        )}
      </div>
      <button type="submit" disabled={saving || pwAllMet === false} className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', opacity: pwAllMet ? 1 : 0.6 }}>
        {saving ? 'Changing Password…' : '🔒 Change Password'}
      </button>
    </form>
  );
}
PasswordForm.propTypes = {
  pwForm: PropTypes.shape({ currentPassword: PropTypes.string, newPassword: PropTypes.string, confirmPw: PropTypes.string }).isRequired,
  saving:   PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

/* ── MyFieldsTab ── */
function MyFieldsTab({ authFetch, navigate }) {
  const [fields,  setFields]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res  = await authFetch('/api/v1/fields/owner/fields');
        const data = await res.json();
        if (res.ok && data.success) {
          setFields(data.data?.fields || []);
        } else {
          setErrMsg(data.message || 'Failed to load fields');
        }
      } catch {
        setErrMsg('Failed to load your fields');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authFetch]);

  const STATUS_COLOR = {
    active:   { bg: 'rgba(16,185,129,0.15)',  color: '#6ee7b7', border: 'rgba(16,185,129,0.3)'  },
    inactive: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
    pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#fcd34d', border: 'rgba(245,158,11,0.3)'  },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading your fields…</p>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ color: '#f87171', fontWeight: 700 }}>{errMsg}</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟️</div>
        <h3 style={{ color: '#f1f5f9', fontWeight: 800, marginBottom: '0.5rem' }}>No Fields Yet</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>You haven&apos;t listed any sports fields yet.</p>
        <button onClick={() => navigate('/add-field')} className="btn-primary">
          ➕ Add Your First Field
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', margin: 0 }}>
          🏟️ My Fields ({fields.length})
        </h3>
        <button onClick={() => navigate('/add-field')} className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.83rem' }}>
          ➕ Add Field
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {fields.map(f => {
          const st    = STATUS_COLOR[f.status] || STATUS_COLOR.pending;
          const sport = Array.isArray(f.sports) ? f.sports[0] : (f.sport || 'N/A');
          return (
            <div key={f._id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{f.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'capitalize' }}>{sport} · {f.location?.city || 'N/A'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {f.status || 'pending'}
                </span>
                <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.88rem' }}>
                  ৳{(f.pricing?.hourly || f.pricing?.basePrice || 0).toLocaleString()}/hr
                </span>
                {f.bookingCount > 0 && (
                  <span style={{ color: '#fcd34d', fontSize: '0.78rem', fontWeight: 700 }}>
                    📅 {f.bookingCount} bookings
                  </span>
                )}
                <button onClick={() => navigate(`/fields/${f._id}`)}
                  style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa', borderRadius: '8px', padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  View →
                </button>
                <button onClick={() => navigate(`/add-field?edit=${f._id}`)}
                  style={{ background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', borderRadius: '8px', padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
MyFieldsTab.propTypes = {
  authFetch: PropTypes.func.isRequired,
  navigate:  PropTypes.func.isRequired,
};

/* ── Profile ── */
const Profile = () => {
  const navigate = useNavigate();
  const [user,     setUser]     = useState(null);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [tab,      setTab]      = useState('info');
  const [toasts,   setToasts]   = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [form,   setForm]   = useState({ firstName: '', lastName: '', phone: '', bio: '', gender: '', dateOfBirth: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPw: '' });

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => removeToast(id), 3800);
  }, [removeToast]);

  const authFetch = useCallback((url, opts = {}) => {
    const token = localStorage.getItem('token');
    return fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res  = await authFetch('/api/v1/auth/profile');
      if (res.status === 401) { navigate('/login'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load profile');
      const u = data.data?.user ?? data.data;
      setUser(u);
      setForm({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', phone: u.phone ?? '', bio: u.bio ?? '', gender: u.gender ?? '', dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '' });
      const userId = u._id ?? u.id;
      if (userId) {
        const sRes  = await authFetch(`/api/v1/users/${userId}/stats`);
        const sData = await sRes.json();
        if (sRes.ok && sData.success) setStats(sData.data);
      }
    } catch (err) {
      toast(err.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, navigate, toast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePwChange = e => {
    const { name, value } = e.target;
    setPwForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await authFetch('/api/v1/auth/profile', { method: 'PUT', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      const u = data.data?.user ?? data.data;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
      setEditing(false);
      toast('Profile updated successfully');
    } catch (err) {
      toast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async e => {
    e.preventDefault();
    const allMet = PW_REQS.every(r => r.fn(pwForm.newPassword));
    if (!allMet) { toast('New password does not meet strength requirements', 'error'); return; }
    if (pwForm.newPassword !== pwForm.confirmPw) { toast('Passwords do not match', 'error'); return; }
    setPwSaving(true);
    try {
      const res  = await authFetch('/api/v1/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      setPwForm({ currentPassword: '', newPassword: '', confirmPw: '' });
      toast('Password changed successfully');
    } catch (err) {
      toast(err.message || 'Failed to change password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👤</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' }}>Loading Profile…</h2>
          <div className="spinner" style={{ width: '44px', height: '44px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171', marginBottom: '0.75rem' }}>Profile Not Found</h2>
          <button onClick={fetchProfile} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  const isOwner = user.role === 'admin' || user.role === 'manager' || user.role === 'fieldOwner';
  const displayName  = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  const verifiedBg   = user.isVerified ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)';
  const verifiedClr  = user.isVerified ? '#6ee7b7'               : '#fbbf24';
  const verifiedBdr  = user.isVerified ? 'rgba(16,185,129,0.4)'  : 'rgba(245,158,11,0.4)';
  const verifiedText = user.isVerified ? '✅ Verified'           : '⚠️ Unverified';
  const tabBase = { padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' };
  const tabStyle = active => ({ ...tabBase, background: active ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : '#94a3b8' });

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <ToastBar toasts={toasts} onRemove={removeToast} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👤</div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.4rem' }}>My Profile</h1>
          <p style={{ color: '#64748b' }}>Manage your account information</p>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {[
              { icon: '📅', label: 'Total Bookings',  value: stats.totalBookings  ?? 0, color: '#a78bfa' },
              { icon: '✅', label: 'Completed',        value: stats.completedBookings ?? 0, color: '#6ee7b7' },
              { icon: '💰', label: 'Total Spent',      value: `৳${(stats.totalSpent ?? 0).toLocaleString()}`, color: '#fcd34d' },
              ...(isOwner ? [{ icon: '🏟️', label: 'Fields Owned', value: stats.fieldsOwned ?? 0, color: '#f9a8d4' }] : []),
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.25rem 0.75rem' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '0.25rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Sidebar */}
          <div className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(124,58,237,0.45)' }}>
              {user.avatar?.url ? <img src={user.avatar.url} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{displayName}</h2>
            <p style={{ color: '#64748b', fontSize: '0.83rem', marginBottom: '0.65rem' }}>{user.email}</p>
            <div style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.25rem', background: verifiedBg, color: verifiedClr, border: `1px solid ${verifiedBdr}` }}>
              {verifiedText}
            </div>

            <div style={{ textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              {[['Role', user.role ?? 'user'], ['Phone', user.phone], ['Gender', user.gender]].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{k}</span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
                </div>
              ) : null)}
            </div>

            <button onClick={() => setEditing(prev => !prev)}
              style={{ width: '100%', padding: '0.6rem', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              {editing ? '✕ Cancel Edit' : '✏️ Edit Profile'}
            </button>

            {[['📅', 'My Bookings', '/bookings'], ['📊', 'Dashboard', '/dashboard'], ['🏟️', 'Browse Fields', '/fields']].map(([ico, lbl, path]) => (
              <button key={path} onClick={() => navigate(path)}
                style={{ width: '100%', padding: '0.55rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem', marginTop: '0.4rem', textAlign: 'left', paddingLeft: '0.85rem' }}>
                {ico} {lbl}
              </button>
            ))}

            {/* Danger zone */}
            <div style={{ borderTop: '1px solid rgba(239,68,68,0.15)', paddingTop: '1rem', marginTop: '1rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Danger Zone</p>
              <button
                onClick={() => {
                  if (globalThis.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    toast('Account deletion requested — please contact support.', 'error');
                  }
                }}
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                🗑️ Delete Account
              </button>
            </div>
          </div>

          {/* Main Panel */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => setTab('info')}     style={tabStyle(tab === 'info')}>Profile Info</button>
              <button onClick={() => setTab('password')} style={tabStyle(tab === 'password')}>Change Password</button>
              {isOwner && <button onClick={() => setTab('myFields')} style={tabStyle(tab === 'myFields')}>My Fields</button>}
            </div>

            {tab === 'info' && (
              editing
                ? <ProfileEditForm form={form} saving={saving} onChange={handleFormChange} onSubmit={handleSave} />
                : <ProfileDisplay user={user} />
            )}
            {tab === 'password' && (
              <PasswordForm pwForm={pwForm} saving={pwSaving} onChange={handlePwChange} onSubmit={handlePasswordSave} />
            )}
            {tab === 'myFields' && (
              <MyFieldsTab authFetch={authFetch} navigate={navigate} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
