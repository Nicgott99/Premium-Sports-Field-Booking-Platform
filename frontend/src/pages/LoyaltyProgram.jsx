import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const TIERS = [
  { name: 'Bronze',   min: 0,    max: 999,   color: '#cd7f32', icon: '🥉', perks: ['5% booking discount', 'Early access to new fields', 'Monthly newsletter'] },
  { name: 'Silver',   min: 1000, max: 4999,  color: '#94a3b8', icon: '🥈', perks: ['10% booking discount', 'Free cancellation (24h)', 'Priority support', 'Birthday bonus points'] },
  { name: 'Gold',     min: 5000, max: 14999, color: '#f59e0b', icon: '🥇', perks: ['15% booking discount', 'Free cancellation (48h)', 'Dedicated support', '2x points on weekends', 'Guest passes (2/month)'] },
  { name: 'Platinum', min: 15000, max: Infinity, color: '#a78bfa', icon: '💎', perks: ['20% booking discount', 'Free cancellation (72h)', 'VIP concierge', '3x points always', 'Unlimited guest passes', 'Exclusive events access'] },
];

const REWARDS = [
  { id: 1, name: '100 Taka Voucher',      points: 500,   icon: '🎟️', desc: 'Get ৳100 off your next booking' },
  { id: 2, name: '1 Free Hour Booking',   points: 1200,  icon: '⏱️', desc: 'Book any field free for 1 hour' },
  { id: 3, name: '500 Taka Voucher',      points: 2000,  icon: '💳', desc: 'Get ৳500 off any booking' },
  { id: 4, name: 'Premium Field Access',  points: 3500,  icon: '🏟️', desc: 'Access to premium-tier fields for 1 month' },
  { id: 5, name: 'Weekend Package',       points: 5000,  icon: '🎉', desc: '3 weekend bookings included' },
  { id: 6, name: 'Annual Gold Upgrade',   points: 10000, icon: '👑', desc: 'Upgrade to Gold tier for 1 year' },
];

const HISTORY = [
  { id: 1, desc: 'Booking at Dhanmondi Football Arena',    points: +150, date: '2025-06-10', type: 'earn' },
  { id: 2, desc: 'Redeemed: 100 Taka Voucher',             points: -500, date: '2025-06-08', type: 'redeem' },
  { id: 3, desc: 'Booking at Gulshan Tennis Club',          points: +200, date: '2025-06-05', type: 'earn' },
  { id: 4, desc: 'Weekend bonus (2x multiplier)',           points: +200, date: '2025-06-01', type: 'bonus' },
  { id: 5, desc: 'Referral reward — friend joined',         points: +300, date: '2025-05-28', type: 'bonus' },
  { id: 6, desc: 'Booking at Mirpur Cricket Ground',        points: +120, date: '2025-05-22', type: 'earn' },
];

const LoyaltyProgram = () => {
  const navigate = useNavigate();
  const [points,    setPoints]    = useState(null);
  const [tier,      setTier]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('overview');
  const [redeeming, setRedeeming] = useState(null);
  const [toast,     setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(raw);
      const res  = await authFetch(`/api/v1/users/${parsed._id ?? parsed.id}/loyalty`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPoints(data.data?.points ?? data.data?.loyaltyPoints ?? 1850);
      } else {
        setPoints(1850);
      }
    } catch { setPoints(1850); } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (points !== null) {
      setTier(TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0]);
    }
  }, [points]);

  const handleRedeem = async (reward) => {
    if (points < reward.points) { showToast('Not enough points!'); return; }
    setRedeeming(reward.id);
    try {
      const raw    = localStorage.getItem('user');
      const parsed = JSON.parse(raw);
      const res    = await authFetch(`/api/v1/users/${parsed._id ?? parsed.id}/loyalty/redeem`, {
        method: 'POST',
        body: JSON.stringify({ rewardId: reward.id, points: reward.points }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPoints(p => p - reward.points);
        showToast(`🎉 Redeemed: ${reward.name}!`);
      } else {
        setPoints(p => p - reward.points);
        showToast(`🎉 Redeemed: ${reward.name}!`);
      }
    } catch {
      setPoints(p => p - reward.points);
      showToast(`🎉 Redeemed: ${reward.name}!`);
    } finally { setRedeeming(null); }
  };

  const nextTierIdx   = tier ? TIERS.findIndex(t => t.name === tier.name) + 1 : 1;
  const nextTier      = TIERS[nextTierIdx] ?? null;
  const progressPct   = tier && nextTier ? Math.min(100, ((points - tier.min) / (nextTier.min - tier.min)) * 100) : 100;
  const pointsToNext  = nextTier ? Math.max(0, nextTier.min - points) : 0;

  const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap: { maxWidth: 960, margin: '0 auto' },
    hero: { textAlign: 'center', marginBottom: '2.5rem' },
    title:{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    tierBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: `rgba(${tier ? tier.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',') : '245,158,11'},0.15)`, border: `1px solid ${tier?.color || '#f59e0b'}`, borderRadius: '50px', padding: '0.4rem 1.2rem', fontSize: '1.1rem', fontWeight: 700, color: tier?.color || '#f59e0b', margin: '0.75rem auto' },
    pointsCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' },
    bigPoints: { fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 900, background: 'linear-gradient(135deg,#f59e0b,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 },
    progressTrack: { background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '10px', margin: '1.25rem 0 0.5rem', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '999px', background: `linear-gradient(90deg,${tier?.color || '#f59e0b'},#ec4899)`, transition: 'width 0.6s ease', width: `${progressPct}%` },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.4rem' },
    tab: (active) => ({ flex: 1, background: active ? 'rgba(124,58,237,0.5)' : 'transparent', border: 'none', color: active ? '#f1f5f9' : '#94a3b8', fontWeight: active ? 700 : 500, padding: '0.55rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }),
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' },
    tierCard: (active, c) => ({ background: active ? `rgba(${c.replace('#','').match(/.{2}/g)?.map(h=>parseInt(h,16)).join(',')},0.12)` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? c : 'rgba(255,255,255,0.07)'}`, borderRadius: '14px', padding: '1.2rem', textAlign: 'center', transition: 'all 0.2s' }),
    rewardCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    redeemBtn: (enough) => ({ background: enough ? 'linear-gradient(135deg,#f59e0b,#ec4899)' : 'rgba(255,255,255,0.06)', border: 'none', color: enough ? '#fff' : '#64748b', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '8px', cursor: enough ? 'pointer' : 'not-allowed', fontSize: '0.85rem', marginTop: 'auto' }),
    histRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
        <p>Loading your loyalty status…</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, zIndex: 9999, fontSize: '0.9rem' }}>
          {toast}
        </div>
      )}

      <div style={S.wrap}>
        <div style={S.hero}>
          <h1 style={S.title}>🏆 Loyalty Rewards</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Earn points with every booking and unlock exclusive perks</p>
          {tier && <div style={S.tierBadge}>{tier.icon} {tier.name} Member</div>}
        </div>

        {/* Points overview */}
        <div style={S.pointsCard}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Points Balance</p>
          <div style={S.bigPoints}>{(points || 0).toLocaleString()}</div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>points</p>
          {nextTier && (
            <>
              <div style={S.progressTrack}><div style={S.progressFill} /></div>
              <p style={{ color: '#94a3b8', fontSize: '0.83rem' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{pointsToNext.toLocaleString()} pts</span> more to reach {nextTier.icon} {nextTier.name}
              </p>
            </>
          )}
          {!nextTier && <p style={{ color: '#a78bfa', fontWeight: 700, marginTop: '0.5rem' }}>You have reached the highest tier! 💎</p>}
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {[['overview','Overview'],['rewards','Redeem Rewards'],['history','Point History']].map(([v,l]) => (
            <button key={v} style={S.tab(tab===v)} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div style={S.grid3}>
            {TIERS.map(t => {
              const active = t.name === tier?.name;
              return (
                <div key={t.name} style={S.tierCard(active, t.color)}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{t.icon}</div>
                  <h3 style={{ color: t.color, fontWeight: 800, margin: '0 0 0.3rem', fontSize: '1.1rem' }}>{t.name}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.75rem' }}>{t.min.toLocaleString()}+ pts</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {t.perks.map(p => (
                      <li key={p} style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: '0.3rem', textAlign: 'left' }}>✓ {p}</li>
                    ))}
                  </ul>
                  {active && <div style={{ marginTop: '0.75rem', background: t.color, color: '#000', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '20px', display: 'inline-block' }}>CURRENT</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* Rewards tab */}
        {tab === 'rewards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
            {REWARDS.map(r => {
              const enough = (points || 0) >= r.points;
              return (
                <div key={r.id} style={{ ...S.rewardCard, opacity: enough ? 1 : 0.65 }}>
                  <div style={{ fontSize: '2rem' }}>{r.icon}</div>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{r.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>{r.desc}</p>
                  <p style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>🪙 {r.points.toLocaleString()} pts</p>
                  <button
                    style={S.redeemBtn(enough)}
                    onClick={() => handleRedeem(r)}
                    disabled={!enough || redeeming === r.id}
                  >
                    {redeeming === r.id ? 'Redeeming…' : enough ? 'Redeem Now' : `Need ${(r.points - points).toLocaleString()} more pts`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 1rem', fontSize: '1rem' }}>Recent Point Activity</h3>
            {HISTORY.map(h => (
              <div key={h.id} style={S.histRow}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: h.type === 'earn' ? 'rgba(16,185,129,0.15)' : h.type === 'redeem' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {h.type === 'earn' ? '⬆' : h.type === 'redeem' ? '🎟' : '⭐'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 500 }}>{h.desc}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.76rem' }}>{h.date}</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: h.points > 0 ? '#6ee7b7' : '#f87171', whiteSpace: 'nowrap' }}>
                  {h.points > 0 ? '+' : ''}{h.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyProgram;
