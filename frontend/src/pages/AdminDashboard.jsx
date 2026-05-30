import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const STATUS_COLOR = {
  confirmed: { bg: 'rgba(16,185,129,0.15)',  color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  pending:   { bg: 'rgba(245,158,11,0.15)',  color: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  cancelled: { bg: 'rgba(239,68,68,0.15)',   color: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
  completed: { bg: 'rgba(59,130,246,0.15)',  color: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
  active:    { bg: 'rgba(16,185,129,0.15)',  color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  inactive:  { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  suspended: { bg: 'rgba(239,68,68,0.15)',   color: '#fca5a5', border: 'rgba(239,68,68,0.3)'  },
  admin:     { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
  user:      { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
};

const TD = { padding: '1rem', color: '#cbd5e1', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.06)' };
const TH = { padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' };

/* ── Shared sub-components ── */

const StatusPill = ({ status }) => {
  const s = STATUS_COLOR[status?.toLowerCase()] || STATUS_COLOR.pending;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {status || 'unknown'}
    </span>
  );
};
StatusPill.propTypes = { status: PropTypes.string };
StatusPill.defaultProps = { status: 'unknown' };

const Tile = ({ icon, label, value, color }) => (
  <div className="card" style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, marginBottom: '0.35rem' }}>{value}</div>
    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
  </div>
);
Tile.propTypes = {
  icon:  PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
};

const Spinner = () => <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }} />;

const PageNav = ({ page, total, limit, onChange }) => {
  const pages      = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const prevDis    = page === 1;
  const nextDis    = page >= pages;
  const prevColor  = prevDis ? '#334155' : '#94a3b8';
  const prevCursor = prevDis ? 'not-allowed' : 'pointer';
  const nextColor  = nextDis ? '#334155' : '#94a3b8';
  const nextCursor = nextDis ? 'not-allowed' : 'pointer';
  const btnBase    = { padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', fontWeight: 700 };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
      <button disabled={prevDis} onClick={() => onChange(page - 1)}
        style={{ ...btnBase, color: prevColor, cursor: prevCursor }}>←</button>
      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Page {page} of {pages}</span>
      <button disabled={nextDis} onClick={() => onChange(page + 1)}
        style={{ ...btnBase, color: nextColor, cursor: nextCursor }}>→</button>
    </div>
  );
};
PageNav.propTypes = {
  page: PropTypes.number.isRequired, total: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired, onChange: PropTypes.func.isRequired,
};

const ToastBar = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    {toasts.map(t => (
      <div key={t.id} style={{ background: t.type === 'error' ? 'rgba(239,68,68,0.92)' : 'rgba(16,185,129,0.92)', backdropFilter: 'blur(12px)', color: '#fff', fontWeight: 700, padding: '0.8rem 1.25rem', borderRadius: '12px', fontSize: '0.88rem', boxShadow: '0 4px 20px rgba(0,0,0,0.35)', minWidth: '240px' }}>
        {t.type === 'error' ? '❌' : '✅'} {t.msg}
      </div>
    ))}
  </div>
);
ToastBar.propTypes = { toasts: PropTypes.array.isRequired };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

/* ── Tab: Overview ── */
const OverviewTab = ({ data, loading, onRetry }) => {
  const H2 = { fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1.25rem' };
  if (loading) return <div className="card" style={{ textAlign: 'center', padding: '3rem' }}><Spinner /></div>;
  if (!data) return (
    <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
      <p style={{ color: '#64748b' }}>Could not load stats.{' '}
        <button onClick={onRetry} style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
      </p>
    </div>
  );
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <Tile icon="👥" label="Total Users"    value={data.totalUsers    ?? 0} color="#a78bfa" />
        <Tile icon="🏟️" label="Total Fields"   value={data.totalFields   ?? 0} color="#6ee7b7" />
        <Tile icon="📅" label="Total Bookings" value={data.totalBookings  ?? 0} color="#93c5fd" />
        <Tile icon="💰" label="Total Revenue"  value={`৳${(data.totalRevenue ?? 0).toLocaleString()}`} color="#fcd34d" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={H2}>Recent Bookings</h2>
          {(data.recentBookings || []).length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem 0' }}>No bookings yet</p>}
          {(data.recentBookings || []).map(b => (
            <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.88rem' }}>{b.field?.name || 'Field'}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{b.user?.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <StatusPill status={b.status} />
                <span style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.85rem' }}>৳{b.pricing?.totalAmount?.toLocaleString() || 0}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={H2}>Recent Users</h2>
          {(data.recentUsers || []).length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem 0' }}>No users yet</p>}
          {(data.recentUsers || []).map(u => (
            <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.88rem' }}>{u.firstName} {u.lastName}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{u.email}</div>
              </div>
              <StatusPill status={u.role || 'user'} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
OverviewTab.propTypes = {
  data:    PropTypes.object,
  loading: PropTypes.bool.isRequired,
  onRetry: PropTypes.func.isRequired,
};
OverviewTab.defaultProps = { data: null };

/* ── Tab: Users ── */
const UsersTab = ({ users, total, page, loading, query, onQueryChange, onSearch, onPageChange, onAction }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Users ({total})</h2>
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Search name / email…"
          onKeyDown={e => { if (e.key === 'Enter') onSearch(); }}
          className="input-field" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', maxWidth: '240px' }} />
        <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={onSearch}>Search</button>
      </div>
    </div>
    <div className="card" style={{ overflow: 'auto' }}>
      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner /></div>}
      {!loading && (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '660px' }}>
          <thead><tr>{['Name','Email','Phone','Role','Joined','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '3rem' }}>No users found</td></tr>}
            {users.map(u => (
              <tr key={u._id}>
                <td style={TD}><span style={{ fontWeight: 700, color: '#f1f5f9' }}>{u.firstName} {u.lastName}</span></td>
                <td style={TD}>{u.email}</td>
                <td style={TD}>{u.phone || '—'}</td>
                <td style={TD}><StatusPill status={u.role || 'user'} /></td>
                <td style={TD}>{fmtDate(u.createdAt)}</td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {u.role !== 'admin' && u.isActive !== false && (
                      <button onClick={() => onAction(u._id, 'suspend')}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)', color: '#fcd34d', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Suspend
                      </button>
                    )}
                    {u.role !== 'admin' && u.isActive !== false && (
                      <button onClick={() => onAction(u._id, 'ban')}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Ban
                      </button>
                    )}
                    {u.isActive === false && (
                      <button onClick={() => onAction(u._id, 'activate')}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Activate
                      </button>
                    )}
                    {!u.isVerified && u.role !== 'admin' && (
                      <button onClick={() => onAction(u._id, 'verify')}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)', color: '#93c5fd', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Verify
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PageNav page={page} total={total} limit={10} onChange={onPageChange} />
    </div>
  </div>
);
UsersTab.propTypes = {
  users: PropTypes.array.isRequired, total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired, loading: PropTypes.bool.isRequired,
  query: PropTypes.string.isRequired, onQueryChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired, onPageChange: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired,
};

/* ── Tab: Fields ── */
const FieldsTab = ({ fields, total, page, loading, onPageChange, onAction }) => (
  <div>
    <div style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Fields ({total})</h2>
    </div>
    <div className="card" style={{ overflow: 'auto' }}>
      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner /></div>}
      {!loading && (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
          <thead><tr>{['Name','Type','Location','Price/hr','Owner','Status','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {fields.length === 0 && <tr><td colSpan={7} style={{ ...TD, textAlign: 'center', padding: '3rem' }}>No fields found</td></tr>}
            {fields.map(f => (
              <tr key={f._id}>
                <td style={TD}><span style={{ fontWeight: 700, color: '#f1f5f9' }}>{f.name}</span></td>
                <td style={TD}>{f.type || '—'}</td>
                <td style={TD}>{f.location?.address || (typeof f.location === 'string' ? f.location : '—')}</td>
                <td style={{ ...TD, color: '#6ee7b7', fontWeight: 700 }}>৳{f.pricing?.pricePerHour ?? f.pricePerHour ?? 0}</td>
                <td style={TD}>{f.owner ? `${f.owner.firstName} ${f.owner.lastName}` : '—'}</td>
                <td style={TD}><StatusPill status={f.status || 'active'} /></td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {f.status !== 'active' && (
                      <button onClick={() => onAction(f._id, 'approve')}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Approve
                      </button>
                    )}
                    {f.status === 'active' && (
                      <button onClick={() => onAction(f._id, 'deactivate')}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(100,116,139,0.4)', background: 'rgba(100,116,139,0.08)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PageNav page={page} total={total} limit={10} onChange={onPageChange} />
    </div>
  </div>
);
FieldsTab.propTypes = {
  fields: PropTypes.array.isRequired, total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired, loading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired, onAction: PropTypes.func.isRequired,
};

/* ── Tab: Bookings ── */
const BookingsTab = ({ bookings, total, page, statusFilter, loading, onStatusChange, onPageChange, onCancel, onConfirm }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Bookings ({total})</h2>
      <select value={statusFilter} onChange={e => onStatusChange(e.target.value)}
        className="input-field" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', maxWidth: '180px' }}>
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div className="card" style={{ overflow: 'auto' }}>
      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner /></div>}
      {!loading && (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead><tr>{['Field','User','Date & Time','Amount','Status','Action'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {bookings.length === 0 && <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '3rem' }}>No bookings found</td></tr>}
            {bookings.map(b => (
              <tr key={b._id}>
                <td style={TD}><span style={{ fontWeight: 700, color: '#f1f5f9' }}>{b.field?.name || 'Field'}</span></td>
                <td style={TD}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{b.user ? `${b.user.firstName} ${b.user.lastName}` : '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.user?.email}</div>
                </td>
                <td style={TD}>
                  <div>{fmtDate(b.startTime)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fmtTime(b.startTime)} – {fmtTime(b.endTime)}</div>
                </td>
                <td style={{ ...TD, color: '#6ee7b7', fontWeight: 700 }}>৳{b.pricing?.totalAmount?.toLocaleString() || 0}</td>
                <td style={TD}><StatusPill status={b.status} /></td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {b.status === 'pending' && (
                      <button onClick={() => onConfirm(b._id)}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Confirm
                      </button>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button onClick={() => onCancel(b._id)}
                        style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PageNav page={page} total={total} limit={10} onChange={onPageChange} />
    </div>
  </div>
);
BookingsTab.propTypes = {
  bookings: PropTypes.array.isRequired, total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired, statusFilter: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired, onStatusChange: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

/* ── Tab: Pending Fields ── */
const PendingFieldsTab = ({ fields, total, page, loading, onPageChange, onAction }) => (
  <div>
    <div style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
        Pending Approval ({total})
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.83rem', marginTop: '0.3rem' }}>Fields submitted by owners waiting for admin review</p>
    </div>
    <div className="card" style={{ overflow: 'auto' }}>
      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner /></div>}
      {!loading && (
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead><tr>{['Field Name','Sports','Location','Owner','Submitted','Actions'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {fields.length === 0 && (
              <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '3.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <div style={{ color: '#6ee7b7', fontWeight: 700 }}>All caught up — no pending fields</div>
              </td></tr>
            )}
            {fields.map(f => (
              <tr key={f._id}>
                <td style={TD}><span style={{ fontWeight: 700, color: '#f1f5f9' }}>{f.name}</span></td>
                <td style={TD}>{Array.isArray(f.sports) ? f.sports.join(', ') : (f.sport || '—')}</td>
                <td style={TD}>{f.location?.city || f.location?.address || (typeof f.location === 'string' ? f.location : '—')}</td>
                <td style={TD}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{f.owner ? `${f.owner.firstName} ${f.owner.lastName}` : '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.owner?.email}</div>
                </td>
                <td style={TD}>{fmtDate(f.createdAt)}</td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => onAction(f._id, 'approve')}
                      style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                      ✓ Approve
                    </button>
                    <button onClick={() => onAction(f._id, 'reject')}
                      style={{ padding: '0.28rem 0.65rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700 }}>
                      ✕ Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <PageNav page={page} total={total} limit={10} onChange={onPageChange} />
    </div>
  </div>
);
PendingFieldsTab.propTypes = {
  fields: PropTypes.array.isRequired, total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired, loading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired, onAction: PropTypes.func.isRequired,
};

/* ── Main AdminDashboard ── */
const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'users',    label: '👥 Users' },
  { id: 'fields',   label: '🏟️ Fields' },
  { id: 'bookings', label: '📅 Bookings' },
  { id: 'pending',  label: '⏳ Pending Fields' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [tab, setTab]             = useState('overview');
  const [mounted, setMounted]     = useState(false);
  const [toasts, setToasts]       = useState([]);

  const [overview, setOverview]   = useState(null);
  const [ovLoading, setOvLoading] = useState(false);

  const [users, setUsers]           = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage]   = useState(1);
  const [usersQ, setUsersQ]         = useState('');
  const [usLoading, setUsLoading]   = useState(false);

  const [fields, setFields]           = useState([]);
  const [fieldsTotal, setFieldsTotal] = useState(0);
  const [fieldsPage, setFieldsPage]   = useState(1);
  const [flLoading, setFlLoading]     = useState(false);

  const [bookings, setBookings]               = useState([]);
  const [bookingsTotal, setBookingsTotal]     = useState(0);
  const [bookingsPage, setBookingsPage]       = useState(1);
  const [bookingsStatus, setBookingsStatus]   = useState('');
  const [bkLoading, setBkLoading]             = useState(false);

  const [pendingFields, setPendingFields]     = useState([]);
  const [pendingTotal, setPendingTotal]       = useState(0);
  const [pendingPage, setPendingPage]         = useState(1);
  const [pdLoading, setPdLoading]             = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw   = localStorage.getItem('user');
    if (!token || !raw) { navigate('/login'); return; }
    const u = JSON.parse(raw);
    if (u.role !== 'admin') { navigate('/'); return; }
    setAdminUser(u);
  }, [navigate]);

  const loadOverview = useCallback(async () => {
    setOvLoading(true);
    try {
      const res  = await authFetch('/api/v1/admin/dashboard');
      const data = await res.json();
      if (data.success) setOverview(data.data);
    } catch { /* network error */ }
    finally { setOvLoading(false); }
  }, []);

  const loadUsers = useCallback(async (page, q) => {
    setUsLoading(true);
    try {
      const qs   = q ? `&search=${encodeURIComponent(q)}` : '';
      const res  = await authFetch(`/api/v1/admin/users?page=${page}&limit=10${qs}`);
      const data = await res.json();
      if (data.success) { setUsers(data.data?.users || []); setUsersTotal(data.data?.total || 0); }
    } catch { /* network error */ }
    finally { setUsLoading(false); }
  }, []);

  const loadFields = useCallback(async (page) => {
    setFlLoading(true);
    try {
      const res  = await authFetch(`/api/v1/admin/fields?page=${page}&limit=10`);
      const data = await res.json();
      if (data.success) { setFields(data.data?.fields || []); setFieldsTotal(data.data?.total || 0); }
    } catch { /* network error */ }
    finally { setFlLoading(false); }
  }, []);

  const loadBookings = useCallback(async (page, status) => {
    setBkLoading(true);
    try {
      const qs   = status ? `&status=${status}` : '';
      const res  = await authFetch(`/api/v1/admin/bookings?page=${page}&limit=10${qs}`);
      const data = await res.json();
      if (data.success) { setBookings(data.data?.bookings || []); setBookingsTotal(data.data?.total || 0); }
    } catch { /* network error */ }
    finally { setBkLoading(false); }
  }, []);

  const loadPendingFields = useCallback(async (page) => {
    setPdLoading(true);
    try {
      const res  = await authFetch(`/api/v1/admin/fields?page=${page}&limit=10&status=pending`);
      const data = await res.json();
      if (data.success) { setPendingFields(data.data?.fields || []); setPendingTotal(data.data?.total || 0); }
    } catch { /* network error */ }
    finally { setPdLoading(false); }
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    if (tab === 'overview') loadOverview();
    if (tab === 'users')    loadUsers(usersPage, usersQ);
    if (tab === 'fields')   loadFields(fieldsPage);
    if (tab === 'bookings') loadBookings(bookingsPage, bookingsStatus);
    if (tab === 'pending')  loadPendingFields(pendingPage);
  }, [tab, adminUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const manageUser = async (userId, action) => {
    try {
      const res  = await authFetch(`/api/v1/admin/users/${userId}/${action}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) { toast(`User ${action}d`); loadUsers(usersPage, usersQ); }
      else toast(data.message || `Failed to ${action}`, 'error');
    } catch { toast('Network error', 'error'); }
  };

  const manageField = async (fieldId, action) => {
    try {
      const res  = await authFetch(`/api/v1/admin/fields/${fieldId}/${action}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        toast(`Field ${action}d`);
        loadFields(fieldsPage);
        loadPendingFields(pendingPage);
      } else toast(data.message || `Failed to ${action}`, 'error');
    } catch { toast('Network error', 'error'); }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const res  = await authFetch(`/api/v1/admin/bookings/${bookingId}/cancel`, { method: 'PUT', body: JSON.stringify({ reason: 'Cancelled by admin' }) });
      const data = await res.json();
      if (data.success) { toast('Booking cancelled'); loadBookings(bookingsPage, bookingsStatus); }
      else toast(data.message || 'Cancel failed', 'error');
    } catch { toast('Network error', 'error'); }
  };

  const confirmBooking = async (bookingId) => {
    try {
      const res  = await authFetch(`/api/v1/admin/bookings/${bookingId}/confirm`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) { toast('Booking confirmed'); loadBookings(bookingsPage, bookingsStatus); }
      else toast(data.message || 'Confirm failed', 'error');
    } catch { toast('Network error', 'error'); }
  };

  if (!adminUser) return null;

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem' }}>
      <ToastBar toasts={toasts} />

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.14),transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.12),transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '90rem', margin: '0 auto', padding: '2rem 1.5rem 4rem', opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: 'opacity .5s, transform .5s' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Administration</p>
          <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: '#f1f5f9', margin: 0 }}>
            Admin Dashboard <span style={{ fontSize: '1.4rem' }}>👑</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.3rem' }}>Welcome back, {adminUser.firstName}</p>
        </div>

        <div className="card" style={{ display: 'flex', gap: '0.25rem', padding: '0.4rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: '1 1 auto', padding: '0.65rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'background .2s, color .2s', background: tab === t.id ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent', color: tab === t.id ? '#fff' : '#64748b' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab data={overview} loading={ovLoading} onRetry={loadOverview} />}

        {tab === 'users' && (
          <UsersTab
            users={users} total={usersTotal} page={usersPage} loading={usLoading} query={usersQ}
            onQueryChange={setUsersQ}
            onSearch={() => { setUsersPage(1); loadUsers(1, usersQ); }}
            onPageChange={p => { setUsersPage(p); loadUsers(p, usersQ); }}
            onAction={manageUser}
          />
        )}

        {tab === 'fields' && (
          <FieldsTab
            fields={fields} total={fieldsTotal} page={fieldsPage} loading={flLoading}
            onPageChange={p => { setFieldsPage(p); loadFields(p); }}
            onAction={manageField}
          />
        )}

        {tab === 'bookings' && (
          <BookingsTab
            bookings={bookings} total={bookingsTotal} page={bookingsPage}
            statusFilter={bookingsStatus} loading={bkLoading}
            onStatusChange={s => { setBookingsStatus(s); setBookingsPage(1); loadBookings(1, s); }}
            onPageChange={p => { setBookingsPage(p); loadBookings(p, bookingsStatus); }}
            onCancel={cancelBooking}
            onConfirm={confirmBooking}
          />
        )}

        {tab === 'pending' && (
          <PendingFieldsTab
            fields={pendingFields} total={pendingTotal} page={pendingPage} loading={pdLoading}
            onPageChange={p => { setPendingPage(p); loadPendingFields(p); }}
            onAction={manageField}
          />
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
