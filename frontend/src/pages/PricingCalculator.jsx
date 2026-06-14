import React, { useState, useEffect, useCallback } from 'react';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const SPORTS = ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis', 'Volleyball', 'Swimming'];

const BASE_RATES = {
  Football: 800, Cricket: 1000, Badminton: 400, Basketball: 600, Tennis: 700, Volleyball: 500, Swimming: 900,
};

const MULTIPLIERS = {
  peak: { label: 'Peak Hours (6–9 AM, 5–10 PM)', value: 1.5 },
  offpeak: { label: 'Off-Peak Hours (10 AM–4 PM)', value: 1.0 },
  weekend: { label: 'Weekend', value: 1.3 },
};

const ADDONS = [
  { id: 'lighting',    label: 'Floodlights / Night Lighting', cost: 200 },
  { id: 'equipment',  label: 'Equipment Rental',              cost: 300 },
  { id: 'referee',    label: 'Referee Service',               cost: 500 },
  { id: 'coach',      label: 'Coaching Session',              cost: 800 },
  { id: 'streaming',  label: 'Live Streaming Setup',          cost: 1000 },
  { id: 'catering',   label: 'Refreshments Package',          cost: 600 },
];

const DISCOUNTS = {
  member: { label: 'Member Discount', pct: 10 },
  loyalty_silver: { label: 'Silver Tier Loyalty', pct: 10 },
  loyalty_gold: { label: 'Gold Tier Loyalty', pct: 15 },
  loyalty_platinum: { label: 'Platinum Tier Loyalty', pct: 20 },
  early_bird: { label: 'Early Bird (7+ days advance)', pct: 8 },
  bulk: { label: 'Bulk Booking (5+ hours)', pct: 12 },
};

const PricingCalculator = () => {
  const [sport,      setSport]      = useState('Football');
  const [hours,      setHours]      = useState(2);
  const [timeSlot,   setTimeSlot]   = useState('peak');
  const [addons,     setAddons]     = useState([]);
  const [discount,   setDiscount]   = useState('');
  const [quote,      setQuote]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fields,     setFields]     = useState([]);
  const [selField,   setSelField]   = useState(null);

  useEffect(() => {
    authFetch('/api/v1/fields?limit=20')
      .then(r => r.json())
      .then(d => { if (d.success) setFields(d.data?.fields ?? d.data ?? []); })
      .catch(() => {});
  }, []);

  const toggleAddon = (id) => setAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/v1/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify({ sport, hours, timeSlot, addons, discount, fieldId: selField }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setQuote(data.data); setLoading(false); return; }
    } catch { /* fall through to local calc */ }

    const base      = (selField ? (fields.find(f => f._id === selField)?.pricePerHour ?? BASE_RATES[sport]) : BASE_RATES[sport]) * hours;
    const mult      = MULTIPLIERS[timeSlot]?.value ?? 1;
    const addonCost = addons.reduce((s, id) => s + (ADDONS.find(a => a.id === id)?.cost ?? 0), 0);
    const subtotal  = base * mult + addonCost;
    const discPct   = discount ? (DISCOUNTS[discount]?.pct ?? 0) : 0;
    const discAmt   = Math.round(subtotal * discPct / 100);
    const tax       = Math.round((subtotal - discAmt) * 0.05);
    const total     = subtotal - discAmt + tax;
    const bulkDisc  = hours >= 5 && !discount ? Math.round(subtotal * 0.12) : 0;

    setQuote({ base: Math.round(base * mult), addonCost, subtotal: Math.round(subtotal), discPct, discAmt: discAmt + bulkDisc, tax, total: total - bulkDisc, breakdown: [
      { label: `${sport} field × ${hours}h (${MULTIPLIERS[timeSlot]?.label})`, amount: Math.round(base * mult) },
      ...addons.map(id => ({ label: ADDONS.find(a => a.id === id)?.label, amount: ADDONS.find(a => a.id === id)?.cost ?? 0 })),
      discPct > 0 && { label: `${DISCOUNTS[discount]?.label} (−${discPct}%)`, amount: -discAmt },
      bulkDisc > 0 && { label: 'Bulk Booking Discount (−12%)', amount: -bulkDisc },
      { label: 'VAT (5%)', amount: tax },
    ].filter(Boolean) });
    setLoading(false);
  }, [sport, hours, timeSlot, addons, discount, selField, fields]);

  useEffect(() => { setQuote(null); }, [sport, hours, timeSlot, addons, discount, selField]);

  const S = {
    page:  { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:  { maxWidth: 1050, margin: '0 auto' },
    title: { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#10b981,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    grid:  { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', marginTop: '2rem', alignItems: 'start' },
    card:  { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' },
    label: { display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
    sel:   { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#f1f5f9', padding: '0.65rem 0.9rem', fontSize: '0.9rem', outline: 'none', marginBottom: '1.1rem', boxSizing: 'border-box' },
    range: { width: '100%', accentColor: '#7c3aed', marginBottom: '0.25rem' },
    slotBtn:(a) => ({ padding: '0.5rem 0.9rem', borderRadius: '8px', border: a ? 'none' : '1px solid rgba(255,255,255,0.1)', background: a ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(255,255,255,0.04)', color: a ? '#fff' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }),
    addonChip:(a) => ({ padding: '0.45rem 0.9rem', borderRadius: '8px', border: `1px solid ${a ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'}`, background: a ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', color: a ? '#6ee7b7' : '#94a3b8', fontWeight: a ? 700 : 500, cursor: 'pointer', fontSize: '0.78rem', transition: 'all 0.18s' }),
    calcBtn:{ width: '100%', background: 'linear-gradient(135deg,#10b981,#7c3aed)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.85rem', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', marginTop: '1rem', letterSpacing: '0.02em' },
    quoteRow:(bold) => ({ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: bold ? '0.9rem' : '0.83rem', color: bold ? '#f1f5f9' : '#94a3b8', fontWeight: bold ? 700 : 400 }),
    total: { display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#f1f5f9', marginTop: '0.25rem' },
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h1 style={S.title}>💰 Pricing Calculator</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Get an instant quote for your sports field booking</p>
        </div>

        <div style={{ ...S.grid, gridTemplateColumns: window.innerWidth < 800 ? '1fr' : '1fr 380px' }}>
          {/* Left — form */}
          <div style={S.card}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1rem' }}>Configure Your Booking</h3>

            <label style={S.label}>Sport</label>
            <select style={S.sel} value={sport} onChange={e => setSport(e.target.value)}>
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {fields.length > 0 && (
              <>
                <label style={S.label}>Specific Field (optional)</label>
                <select style={S.sel} value={selField || ''} onChange={e => setSelField(e.target.value || null)}>
                  <option value="">Use standard rate for {sport}</option>
                  {fields.filter(f => !f.sport || f.sport === sport).map(f => (
                    <option key={f._id} value={f._id}>{f.name} — ৳{f.pricePerHour}/hr</option>
                  ))}
                </select>
              </>
            )}

            <label style={S.label}>Duration: <span style={{ color: '#f59e0b', fontWeight: 800 }}>{hours} hour{hours !== 1 ? 's' : ''}</span></label>
            <input type="range" min={1} max={12} step={0.5} value={hours} onChange={e => setHours(+e.target.value)} style={S.range} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.72rem', marginBottom: '1.1rem' }}>
              <span>1h</span><span>6h</span><span>12h</span>
            </div>

            <label style={S.label}>Time Slot</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.1rem' }}>
              {Object.entries(MULTIPLIERS).map(([k, v]) => (
                <button key={k} style={S.slotBtn(timeSlot === k)} onClick={() => setTimeSlot(k)}>{v.label}</button>
              ))}
            </div>

            <label style={S.label}>Add-ons (optional)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.1rem' }}>
              {ADDONS.map(a => (
                <button key={a.id} style={S.addonChip(addons.includes(a.id))} onClick={() => toggleAddon(a.id)}>
                  {a.label} +৳{a.cost}
                </button>
              ))}
            </div>

            <label style={S.label}>Discount Code / Member Tier</label>
            <select style={S.sel} value={discount} onChange={e => setDiscount(e.target.value)}>
              <option value="">None</option>
              {Object.entries(DISCOUNTS).map(([k, v]) => <option key={k} value={k}>{v.label} (−{v.pct}%)</option>)}
            </select>

            <button style={S.calcBtn} onClick={calculate} disabled={loading}>
              {loading ? 'Calculating…' : '⚡ Calculate Price'}
            </button>
          </div>

          {/* Right — quote */}
          <div style={S.card}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1rem' }}>Price Breakdown</h3>

            {!quote ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧮</div>
                <p style={{ fontSize: '0.875rem' }}>Configure your booking and click Calculate to see a full price breakdown</p>
              </div>
            ) : (
              <>
                {quote.breakdown.map((row, i) => (
                  <div key={i} style={S.quoteRow(false)}>
                    <span style={{ color: row.amount < 0 ? '#6ee7b7' : '#94a3b8' }}>{row.label}</span>
                    <span style={{ color: row.amount < 0 ? '#6ee7b7' : '#f1f5f9', fontWeight: 600 }}>
                      {row.amount < 0 ? '−' : '+'}৳{Math.abs(row.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div style={S.total}>
                  <span>Total</span>
                  <span style={{ background: 'linear-gradient(135deg,#10b981,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>৳{quote.total.toLocaleString()}</span>
                </div>

                <div style={{ marginTop: '1.5rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', color: '#6ee7b7', lineHeight: 1.6 }}>
                  <strong>Included in your booking:</strong><br />
                  ✓ Field access for {hours} hour{hours !== 1 ? 's' : ''}<br />
                  ✓ Changing rooms<br />
                  ✓ Parking<br />
                  {addons.includes('lighting') && '✓ Floodlights\n'}
                  {addons.includes('equipment') && '✓ Equipment rental\n'}
                  ✓ Online booking confirmation
                </div>

                <button
                  style={{ ...S.calcBtn, marginTop: '1rem', background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}
                  onClick={() => window.location.href = '/booking'}
                >
                  📅 Book Now at This Price
                </button>
              </>
            )}

            {/* Quick reference */}
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Base Rates (per hour)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {Object.entries(BASE_RATES).map(([s, r]) => (
                  <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: s === sport ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.78rem' }}>
                    <span style={{ color: s === sport ? '#a78bfa' : '#94a3b8' }}>{s}</span>
                    <span style={{ color: s === sport ? '#f1f5f9' : '#64748b', fontWeight: 700 }}>৳{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;
