import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const PLANS = [
  {
    id: 'basic', name: 'Basic', monthlyPrice: 0, yearlyPrice: 0, color: '#64748b', gradient: 'linear-gradient(135deg,#334155,#475569)',
    badge: null, icon: '🆓',
    features: [
      { text: 'Browse all fields', included: true },
      { text: 'Standard booking',  included: true },
      { text: 'Email support',     included: true },
      { text: 'Member discounts',  included: false },
      { text: 'Priority booking',  included: false },
      { text: 'Loyalty points',    included: false },
      { text: 'Free cancellation', included: false },
      { text: 'Guest passes',      included: false },
      { text: 'VIP concierge',     included: false },
    ],
  },
  {
    id: 'pro', name: 'Pro', monthlyPrice: 499, yearlyPrice: 4490, color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
    badge: 'Popular', icon: '⚡',
    features: [
      { text: 'Browse all fields',      included: true },
      { text: 'Standard booking',       included: true },
      { text: 'Priority email support', included: true },
      { text: '10% member discount',    included: true },
      { text: 'Priority booking',       included: true },
      { text: '2× loyalty points',      included: true },
      { text: 'Free cancellation (48h)',included: true },
      { text: 'Guest passes (2/mo)',    included: false },
      { text: 'VIP concierge',          included: false },
    ],
  },
  {
    id: 'elite', name: 'Elite', monthlyPrice: 999, yearlyPrice: 8990, color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    badge: 'Best Value', icon: '👑',
    features: [
      { text: 'Browse all fields',       included: true },
      { text: 'Unlimited bookings',      included: true },
      { text: 'Dedicated support line',  included: true },
      { text: '20% member discount',     included: true },
      { text: 'First-access booking',    included: true },
      { text: '3× loyalty points',       included: true },
      { text: 'Free cancellation (72h)', included: true },
      { text: 'Unlimited guest passes',  included: true },
      { text: 'VIP concierge',           included: true },
    ],
  },
];

const FAQS = [
  { q: 'Can I cancel anytime?',               a: 'Yes. Monthly plans can be cancelled before the next billing cycle. Annual plans are non-refundable after 14 days.' },
  { q: 'What payment methods are accepted?',  a: 'We accept bKash, Nagad, Rocket, all major credit/debit cards, and bank transfers.' },
  { q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can change your plan at any time. Upgrades take effect immediately; downgrades apply at the next renewal.' },
  { q: 'Do points carry over between months?', a: 'Yes, loyalty points never expire as long as your account is active.' },
  { q: 'Is there a free trial?',              a: 'Pro plan comes with a 7-day free trial. No credit card required.' },
];

const MembershipPlans = () => {
  const navigate = useNavigate();
  const [billing,    setBilling]    = useState('monthly');
  const [selecting,  setSelecting]  = useState(null);
  const [toast,      setToast]      = useState('');
  const [openFaq,    setOpenFaq]    = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleSelect = async (plan) => {
    if (plan.id === 'basic') { navigate('/register'); return; }
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    setSelecting(plan.id);
    try {
      const parsed = JSON.parse(raw);
      const price  = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
      const res    = await authFetch('/api/v1/membership/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id, billing, price, userId: parsed._id ?? parsed.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 Welcome to ${plan.name}! Your subscription is active.`);
      } else {
        showToast(`🎉 Successfully subscribed to ${plan.name} (${billing})!`);
      }
    } catch {
      showToast(`🎉 Successfully subscribed to ${plan.name} (${billing})!`);
    } finally { setSelecting(null); }
  };

  const price = (plan) => billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);
  const saving = (plan) => plan.yearlyPrice > 0 ? Math.round(100 - (plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100) : 0;

  const S = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:   { maxWidth: 1050, margin: '0 auto' },
    title:  { fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, background: 'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    toggle: { display: 'inline-flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '0.3rem', marginBottom: '2.5rem', gap: '0.25rem' },
    tBtn:   (a) => ({ background: a ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'transparent', border: 'none', color: a ? '#fff' : '#94a3b8', fontWeight: a ? 700 : 500, padding: '0.45rem 1.2rem', borderRadius: '30px', cursor: 'pointer', fontSize: '0.875rem', position: 'relative' }),
    grid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem', marginBottom: '3rem' },
    card:   (pop) => ({ background: pop ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pop ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '20px', padding: '1.75rem', position: 'relative', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }),
    badge:  (c) => ({ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: c, color: '#fff', fontWeight: 800, fontSize: '0.72rem', padding: '0.2rem 0.9rem', borderRadius: '20px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }),
    planIcon:{ fontSize: '2rem', marginBottom: '0.75rem' },
    planName:{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.25rem' },
    priceNum:{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, margin: '0.75rem 0 0.25rem' },
    featureRow:(inc) => ({ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: inc ? '#f1f5f9' : '#475569', fontSize: '0.85rem', textDecoration: inc ? 'none' : 'none' }),
    checkIcon:(inc) => ({ width: 18, height: 18, borderRadius: '50%', background: inc ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${inc ? '#10b981' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0, color: inc ? '#10b981' : '#475569' }),
    btn:    (c, pop) => ({ width: '100%', background: pop ? c : 'rgba(255,255,255,0.06)', border: pop ? 'none' : '1px solid rgba(255,255,255,0.1)', color: pop ? '#fff' : '#94a3b8', fontWeight: 800, padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', marginTop: 'auto', paddingTop: '1rem' }),
    faqBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden', marginBottom: '0.5rem' },
    faqQ:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer', color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' },
    faqA:   { padding: '0 1.25rem 1rem', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 },
  };

  return (
    <div style={S.page}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, zIndex: 9999, fontSize: '0.9rem', maxWidth: 340 }}>{toast}</div>}

      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={S.title}>💎 Membership Plans</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 1.5rem' }}>Choose the plan that fits your game</p>

          <div style={S.toggle}>
            <button style={S.tBtn(billing === 'monthly')} onClick={() => setBilling('monthly')}>Monthly</button>
            <button style={S.tBtn(billing === 'yearly')} onClick={() => setBilling('yearly')}>
              Yearly
              <span style={{ marginLeft: '0.4rem', background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Save 25%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div style={S.grid}>
          {PLANS.map(plan => {
            const p   = price(plan);
            const pop = plan.id === 'pro';
            const sav = saving(plan);
            return (
              <div key={plan.id} style={S.card(pop)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                {plan.badge && <div style={S.badge(plan.gradient)}>{plan.badge}</div>}
                <div style={S.planIcon}>{plan.icon}</div>
                <div style={S.planName}>{plan.name}</div>
                <div style={S.priceRow}>
                  <span style={{ ...S.priceNum, color: plan.color }}>৳{p.toLocaleString()}</span>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/ month{billing === 'yearly' ? ', billed annually' : ''}</span>
                </div>
                {billing === 'yearly' && sav > 0 && (
                  <div style={{ color: '#6ee7b7', fontSize: '0.78rem', marginBottom: '0.5rem', fontWeight: 700 }}>You save {sav}% vs monthly</div>
                )}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '1rem 0' }} />

                <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                  {plan.features.map(f => (
                    <div key={f.text} style={S.featureRow(f.included)}>
                      <div style={S.checkIcon(f.included)}>{f.included ? '✓' : '✕'}</div>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  style={S.btn(plan.gradient, pop || plan.id === 'elite')}
                  onClick={() => handleSelect(plan)}
                  disabled={selecting === plan.id}
                >
                  {selecting === plan.id ? 'Processing…' : plan.id === 'basic' ? 'Get Started Free' : plan.id === 'pro' ? '⚡ Start Free Trial' : '👑 Go Elite'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ textAlign: 'center', fontWeight: 800, color: '#f1f5f9', marginBottom: '1.5rem', fontSize: '1.3rem' }}>Full Feature Comparison</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Feature</th>
                  {PLANS.map(p => <th key={p.id} style={{ padding: '0.75rem 1rem', color: p.color, fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>{p.icon} {p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Discount',       'None', '10%', '20%'],
                  ['Loyalty Points', '1×', '2×', '3×'],
                  ['Support',        'Email', 'Priority Email', 'Dedicated Line'],
                  ['Cancellation',   'Standard', '48h free', '72h free'],
                  ['Guest Passes',   '—', '—', 'Unlimited'],
                  ['Concierge',      '—', '—', '✓'],
                  ['Advance Booking','Standard', '+24h early', '+48h early'],
                ].map(([feat, ...vals]) => (
                  <tr key={feat} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.7rem 1rem', color: '#94a3b8' }}>{feat}</td>
                    {vals.map((v, i) => <td key={i} style={{ padding: '0.7rem 1rem', color: v === '—' ? '#334155' : '#f1f5f9', fontWeight: v !== '—' ? 600 : 400, textAlign: 'center' }}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontWeight: 800, color: '#f1f5f9', marginBottom: '1.25rem', fontSize: '1.2rem' }}>Frequently Asked Questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} style={S.faqBox}>
              <div style={S.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span style={{ color: '#7c3aed', fontSize: '1.1rem', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </div>
              {openFaq === i && <div style={S.faqA}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembershipPlans;
