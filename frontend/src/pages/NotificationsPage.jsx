import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_NOTIFS = [
  { _id: 'n1', type: 'booking',     title: 'Booking Confirmed',         message: 'Your booking at Dhanmondi Football Arena on June 20 at 5 PM is confirmed.', time: '2 min ago',  read: false, icon: '✅' },
  { _id: 'n2', type: 'reminder',    title: 'Upcoming Booking Reminder', message: 'You have a booking at Gulshan Tennis Club tomorrow at 7 AM.', time: '1 hr ago',   read: false, icon: '⏰' },
  { _id: 'n3', type: 'promo',       title: 'Weekend Special: 20% Off',  message: 'Book any field this weekend and get 20% off. Use code WEEKEND20.', time: '3 hrs ago',  read: false, icon: '🎁' },
  { _id: 'n4', type: 'points',      title: 'Loyalty Points Earned',     message: 'You earned 150 points from your last booking. Current balance: 1,850 pts.', time: '1 day ago',  read: true,  icon: '⭐' },
  { _id: 'n5', type: 'team',        title: 'Team Invite Received',      message: 'Tanvir Khan invited you to join Thunder Strikers football team.', time: '1 day ago',  read: true,  icon: '👥' },
  { _id: 'n6', type: 'tournament',  title: 'Tournament Registration Open', message: 'Dhaka Premier Football Cup registration is now open. 4 spots remaining!', time: '2 days ago', read: true,  icon: '🏆' },
  { _id: 'n7', type: 'payment',     title: 'Payment Successful',        message: 'Payment of ৳1,600 for Mirpur Cricket Ground booking was successful.', time: '3 days ago', read: true,  icon: '💳' },
  { _id: 'n8', type: 'review',      title: 'Review Request',            message: 'How was your experience at Sylhet Badminton Club? Leave a review!', time: '4 days ago', read: true,  icon: '⭐' },
  { _id: 'n9', type: 'system',      title: 'New Fields Added Near You', message: '3 new football fields have been added in Mirpur area.', time: '5 days ago', read: true,  icon: '📍' },
];

const TYPE_COLORS = {
  booking: '#10b981', reminder: '#f59e0b', promo: '#ec4899',
  points: '#f59e0b', team: '#7c3aed', tournament: '#6366f1',
  payment: '#10b981', review: '#f59e0b', system: '#94a3b8',
};

const PREFS_DEFAULT = {
  booking_confirmations: true,
  booking_reminders: true,
  promotional_offers: false,
  loyalty_updates: true,
  team_invites: true,
  tournament_alerts: true,
  payment_receipts: true,
  review_requests: false,
  system_updates: false,
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifs,    setNotifs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [tab,       setTab]       = useState('notifications');
  const [prefs,     setPrefs]     = useState(PREFS_DEFAULT);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(raw);
      const res    = await authFetch(`/api/v1/notifications?userId=${parsed._id ?? parsed.id}`);
      const data   = await res.json();
      if (res.ok && data.success) {
        const list = data.data?.notifications ?? data.data ?? [];
        setNotifs(list.length ? list : MOCK_NOTIFS);
      } else { setNotifs(MOCK_NOTIFS); }
    } catch { setNotifs(MOCK_NOTIFS); } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try { await authFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }); } catch { /* silent */ }
  };

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const raw    = localStorage.getItem('user');
      const parsed = JSON.parse(raw);
      await authFetch(`/api/v1/notifications/read-all?userId=${parsed._id ?? parsed.id}`, { method: 'PATCH' });
    } catch { /* silent */ }
    showToast('All notifications marked as read');
  };

  const deleteNotif = (id) => {
    setNotifs(prev => prev.filter(n => n._id !== id));
    authFetch(`/api/v1/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      const raw    = localStorage.getItem('user');
      const parsed = JSON.parse(raw);
      await authFetch(`/api/v1/users/${parsed._id ?? parsed.id}/notification-preferences`, {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });
    } catch { /* silent */ }
    setTimeout(() => { setSaving(false); showToast('✅ Preferences saved!'); }, 600);
  };

  const TYPES = ['all', 'booking', 'reminder', 'promo', 'points', 'team', 'tournament'];
  const displayed = filter === 'all' ? notifs : notifs.filter(n => n.type === filter);
  const unread    = notifs.filter(n => !n.read).length;

  const S = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:   { maxWidth: 860, margin: '0 auto' },
    title:  { fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 900, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    tabs:   { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.3rem' },
    tab:    (a) => ({ flex: 1, background: a ? 'rgba(124,58,237,0.5)' : 'transparent', border: 'none', color: a ? '#f1f5f9' : '#94a3b8', fontWeight: a ? 700 : 500, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }),
    filters:{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' },
    chip:   (a) => ({ background: a ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${a ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`, color: a ? '#f1f5f9' : '#94a3b8', padding: '0.3rem 0.8rem', borderRadius: '16px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: a ? 700 : 400 }),
    nCard:  (read) => ({ display: 'flex', gap: '0.75rem', padding: '1rem 1.1rem', background: read ? 'rgba(255,255,255,0.02)' : 'rgba(124,58,237,0.07)', border: `1px solid ${read ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.2)'}`, borderRadius: '14px', marginBottom: '0.6rem', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }),
    dot:    (c) => ({ width: 38, height: 38, borderRadius: '50%', background: `${c}22`, border: `1px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }),
    toggle: (on) => ({ width: 42, height: 22, background: on ? 'linear-gradient(90deg,#7c3aed,#6d28d9)' : 'rgba(255,255,255,0.1)', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, border: 'none' }),
    toggleKnob:(on) => ({ position: 'absolute', top: 3, left: on ? 22 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }),
    prefRow:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    prefLabel:{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 600 },
    prefDesc: { color: '#64748b', fontSize: '0.75rem', marginTop: '0.1rem' },
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem' }}>🔔</div>
        <p>Loading notifications…</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, zIndex: 9999 }}>{toast}</div>}

      <div style={S.wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={S.title}>
              🔔 Notifications
              {unread > 0 && <span style={{ display: 'inline-block', marginLeft: '0.6rem', background: '#ec4899', color: '#fff', borderRadius: '50%', width: 26, height: 26, lineHeight: '26px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, verticalAlign: 'middle' }}>{unread}</span>}
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>{unread} unread • {notifs.length} total</p>
          </div>
          {unread > 0 && (
            <button style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.83rem' }} onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div style={S.tabs}>
          <button style={S.tab(tab === 'notifications')} onClick={() => setTab('notifications')}>Notifications</button>
          <button style={S.tab(tab === 'preferences')}  onClick={() => setTab('preferences')}>Preferences</button>
        </div>

        {tab === 'notifications' && (
          <>
            <div style={S.filters}>
              {TYPES.map(t => <button key={t} style={S.chip(filter === t)} onClick={() => setFilter(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
            </div>

            {displayed.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔕</div>
                <p>No notifications in this category.</p>
              </div>
            ) : (
              displayed.map(n => (
                <div key={n._id} style={S.nCard(n.read)} onClick={() => markRead(n._id)}>
                  {!n.read && <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: 8, height: 8, background: '#7c3aed', borderRadius: '50%' }} />}
                  <div style={S.dot(TYPE_COLORS[n.type] || '#94a3b8')}>{n.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <p style={{ margin: 0, color: n.read ? '#94a3b8' : '#f1f5f9', fontWeight: n.read ? 500 : 700, fontSize: '0.9rem' }}>{n.title}</p>
                      <span style={{ color: '#475569', fontSize: '0.72rem', flexShrink: 0 }}>{n.time}</span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.8rem', lineHeight: 1.5 }}>{n.message}</p>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem', flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                    title="Dismiss"
                  >×</button>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'preferences' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' }}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 0.25rem', fontSize: '1rem' }}>Notification Preferences</h3>
            <p style={{ color: '#64748b', fontSize: '0.83rem', margin: '0 0 1.25rem' }}>Choose what you want to be notified about</p>

            {[
              { section: 'Activity', items: [
                ['booking_confirmations', 'Booking Confirmations', 'Get notified when a booking is confirmed or cancelled'],
                ['booking_reminders',    'Booking Reminders',     'Reminders 24h and 1h before your booking'],
                ['payment_receipts',     'Payment Receipts',      'Receipts and payment status updates'],
                ['review_requests',      'Review Requests',       'Prompts to review fields after your visit'],
              ]},
              { section: 'Community', items: [
                ['loyalty_updates',   'Loyalty & Points',       'Points earned, tier upgrades, and reward alerts'],
                ['team_invites',      'Team Invites',           'Invitations to join sports teams'],
                ['tournament_alerts', 'Tournament Alerts',      'New tournaments, registration deadlines, results'],
                ['promotional_offers','Promotional Offers',     'Discounts, deals, and special offers'],
              ]},
              { section: 'Delivery Channels', items: [
                ['email_notifications', 'Email Notifications', 'Receive updates via email'],
                ['sms_notifications',   'SMS Notifications',   'Receive important alerts via SMS'],
                ['push_notifications',  'Push Notifications',  'Browser and mobile push notifications'],
              ]},
            ].map(({ section, items }) => (
              <div key={section} style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: '#7c3aed', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{section}</p>
                {items.map(([key, label, desc]) => (
                  <div key={key} style={S.prefRow}>
                    <div>
                      <div style={S.prefLabel}>{label}</div>
                      <div style={S.prefDesc}>{desc}</div>
                    </div>
                    <button style={S.toggle(prefs[key])} onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}>
                      <div style={S.toggleKnob(prefs[key])} />
                    </button>
                  </div>
                ))}
              </div>
            ))}

            <button
              style={{ width: '100%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', marginTop: '0.5rem' }}
              onClick={savePrefs}
              disabled={saving}
            >
              {saving ? 'Saving…' : '💾 Save Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
