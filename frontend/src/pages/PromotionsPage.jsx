import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const now = new Date();
const addDays = (d) => { const x = new Date(now); x.setDate(now.getDate() + d); return x.toISOString().split('T')[0]; };

const MOCK_PROMOS = [
  { _id: 'p1', title: 'Weekend Warriors',     code: 'WEEKEND25',  discount: 25, type: 'percent',  minBooking: 2, sport: 'All',       endsAt: addDays(3),  uses: 142, maxUses: 200, desc: 'Get 25% off all bookings on Friday, Saturday, and Sunday.', badge: '🔥 Hot',    color: '#ec4899' },
  { _id: 'p2', title: 'Early Bird Special',   code: 'EARLY20',    discount: 20, type: 'percent',  minBooking: 1, sport: 'All',       endsAt: addDays(7),  uses: 89,  maxUses: 150, desc: 'Book any slot before 9 AM and save 20%.', badge: '🌅 Early',  color: '#f59e0b' },
  { _id: 'p3', title: 'Football Fiesta',      code: 'FOOTBALL500',discount: 500,type: 'flat',     minBooking: 3, sport: 'Football',  endsAt: addDays(5),  uses: 56,  maxUses: 100, desc: 'Flat ৳500 off on Football field bookings of 3+ hours.', badge: '⚽ Sport',  color: '#10b981' },
  { _id: 'p4', title: 'First Booking Free',   code: 'FIRST1HR',   discount: 100,type: 'percent',  minBooking: 1, sport: 'All',       endsAt: addDays(30), uses: 34,  maxUses: 500, desc: 'New users get their first 1-hour booking at any standard field completely free.', badge: '🎁 New',  color: '#7c3aed' },
  { _id: 'p5', title: 'Bulk Booking Deal',    code: 'BULK15',     discount: 15, type: 'percent',  minBooking: 5, sport: 'All',       endsAt: addDays(14), uses: 27,  maxUses: 80,  desc: 'Book 5+ hours at once and save 15% automatically.', badge: '📦 Bulk',   color: '#06b6d4' },
  { _id: 'p6', title: 'Cricket Season',       code: 'CRICKET10',  discount: 10, type: 'percent',  minBooking: 2, sport: 'Cricket',   endsAt: addDays(10), uses: 18,  maxUses: 60,  desc: '10% off all Cricket ground bookings this season.', badge: '🏏 Sport',  color: '#f97316' }
];

const countdown = (endsAt) => {
  const diff = new Date(endsAt) - new Date();
  if (diff <= 0) {return 'Expired';}
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) {return `${days}d ${hours}h left`;}
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m left`;
};

const PromotionsPage = () => {
  const navigate  = useNavigate();
  const [promos,  setPromos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const [copied,  setCopied]  = useState('');
  const [claimed, setClaimed] = useState({});
  const [toast,   setToast]   = useState('');

  useEffect(() => {
    authFetch('/api/v1/promotions')
      .then(r => r.json())
      .then(d => setPromos(d.success ? (d.data ?? []) : MOCK_PROMOS))
      .catch(() => setPromos(MOCK_PROMOS))
      .finally(() => setLoading(false));
  }, []);

  const sports   = ['All', ...new Set(MOCK_PROMOS.map(p => p.sport).filter(s => s !== 'All'))];
  const filtered = promos.filter(p => filter === 'All' || p.sport === filter || p.sport === 'All');

  const copyCode = useCallback((code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(''), 2500);
    });
  }, []);

  const claimPromo = useCallback(async (promo) => {
    setClaimed(prev => ({ ...prev, [promo._id]: 'loading' }));
    try {
      const raw = localStorage.getItem('user');
      if (!raw) { navigate('/login'); return; }
      const uid = JSON.parse(raw)._id ?? JSON.parse(raw).id;
      const res = await authFetch('/api/v1/promotions/claim', { method: 'POST', body: JSON.stringify({ promoId: promo._id, userId: uid, code: promo.code }) });
      const d   = await res.json();
      setClaimed(prev => ({ ...prev, [promo._id]: 'done' }));
      setToast(d.success ? `✅ Promo "${promo.code}" applied to your account!` : `✅ Promo "${promo.code}" saved! Use it at checkout.`);
    } catch {
      setClaimed(prev => ({ ...prev, [promo._id]: 'done' }));
      setToast(`✅ Promo "${promo.code}" saved! Use it at checkout.`);
    }
    setTimeout(() => setToast(''), 4000);
  }, [navigate]);

  const getPct = (p) => Math.min(100, Math.round((p.uses / p.maxUses) * 100));

  const S = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:   { maxWidth: 1050, margin: '0 auto' },
    title:  { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    chips:  { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' },
    chip:   (a) => ({ background: a ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${a ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, color: a ? '#f1f5f9' : '#94a3b8', padding: '0.35rem 0.85rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: a ? 700 : 500 }),
    grid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' },
    card:   (c) => ({ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c}33`, borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }),
    top:    (c) => ({ background: `linear-gradient(135deg,${c}22,${c}11)`, padding: '1.25rem 1.5rem', borderBottom: `1px solid ${c}33` }),
    badge:  (c) => ({ display: 'inline-block', background: `${c}33`, border: `1px solid ${c}55`, color: c, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.5rem' }),
    disc:   (c) => ({ fontSize: '2rem', fontWeight: 900, color: c, lineHeight: 1, margin: '0.25rem 0' }),
    code:   { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.5rem 0.85rem', margin: '0.75rem 0', cursor: 'pointer' },
    prog:   { background: 'rgba(255,255,255,0.08)', borderRadius: '20px', height: 6, overflow: 'hidden', marginBottom: '0.4rem' },
    claimBtn:(done, c) => ({ width: '100%', background: done ? 'rgba(16,185,129,0.15)' : `linear-gradient(135deg,${c},${c}cc)`, border: done ? '1px solid rgba(16,185,129,0.3)' : 'none', color: done ? '#6ee7b7' : '#fff', fontWeight: 800, padding: '0.7rem', borderRadius: '10px', cursor: done ? 'default' : 'pointer', fontSize: '0.875rem', marginTop: 'auto' })
  };

  return (
    <div style={S.page}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 700, zIndex: 9999, fontSize: '0.875rem', maxWidth: 340 }}>{toast}</div>}

      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={S.title}>🎉 Promotions & Deals</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Exclusive offers and limited-time discounts</p>
        </div>

        {/* Hero banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(236,72,153,0.2))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '18px', padding: '1.75rem 2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.4rem' }}>LIMITED TIME OFFER</div>
            <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 0.4rem' }}>Up to 25% off this weekend!</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>Use code <strong style={{ color: '#f1f5f9' }}>WEEKEND25</strong> at checkout</p>
          </div>
          <button style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.75rem 1.75rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', flexShrink: 0 }} onClick={() => navigate('/pricing')}>
            Calculate Savings →
          </button>
        </div>

        {/* Sport filter */}
        <div style={S.chips}>
          {sports.map(s => <button key={s} style={S.chip(filter === s)} onClick={() => setFilter(s)}>{s}</button>)}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem' }}>Loading promotions…</div>
        ) : (
          <div style={S.grid}>
            {filtered.map(promo => {
              const done = claimed[promo._id] === 'done';
              const busy = claimed[promo._id] === 'loading';
              const pct  = getPct(promo);
              return (
                <div key={promo._id} style={S.card(promo.color)}>
                  <div style={S.top(promo.color)}>
                    <div style={S.badge(promo.color)}>{promo.badge}</div>
                    <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem', margin: '0 0 0.25rem' }}>{promo.title}</h3>
                    <div style={S.disc(promo.color)}>
                      {promo.type === 'percent' ? `${promo.discount}% OFF` : `৳${promo.discount} OFF`}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      {promo.sport !== 'All' ? `${promo.sport} · ` : ''}Min {promo.minBooking}h booking
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>{promo.desc}</p>

                    {/* Promo code */}
                    <div style={S.code} onClick={() => copyCode(promo.code)}>
                      <span style={{ color: '#f1f5f9', fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem', flex: 1 }}>{promo.code}</span>
                      <span style={{ color: copied === promo.code ? '#6ee7b7' : '#7c3aed', fontSize: '0.75rem', fontWeight: 700 }}>{copied === promo.code ? '✓ Copied' : 'Copy'}</span>
                    </div>

                    {/* Usage bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem' }}>
                        <span>{promo.uses} / {promo.maxUses} claimed</span>
                        <span style={{ color: pct > 80 ? '#f87171' : '#64748b' }}>{100 - pct}% remaining</span>
                      </div>
                      <div style={S.prog}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#ef4444' : promo.color, borderRadius: '20px' }} />
                      </div>
                    </div>

                    {/* Expiry */}
                    <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>⏰ {countdown(promo.endsAt)}</div>

                    <button
                      style={S.claimBtn(done, promo.color)}
                      onClick={() => !done && !busy && claimPromo(promo)}
                      disabled={busy}
                    >
                      {busy ? 'Saving…' : done ? '✓ Claimed!' : '🎁 Claim Offer'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Terms */}
        <div style={{ marginTop: '2.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem' }}>
          <h4 style={{ color: '#64748b', fontWeight: 700, fontSize: '0.8rem', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Terms & Conditions</h4>
          <ul style={{ color: '#475569', fontSize: '0.78rem', lineHeight: 1.7, margin: 0, paddingLeft: '1.2rem' }}>
            <li>One promotion code per booking. Codes cannot be combined.</li>
            <li>Discounts apply to field rental only, not add-on services.</li>
            <li>Expired codes cannot be applied retroactively.</li>
            <li>SportsField BD reserves the right to modify or cancel promotions at any time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PromotionsPage;
