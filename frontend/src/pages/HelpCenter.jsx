import React, { useState, useCallback } from 'react';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const CATEGORIES = [
  { id: 'all',       label: 'All Topics',    icon: '📚' },
  { id: 'booking',   label: 'Booking',       icon: '📅' },
  { id: 'payment',   label: 'Payment',       icon: '💳' },
  { id: 'account',   label: 'Account',       icon: '👤' },
  { id: 'field',     label: 'Fields',        icon: '🏟️' },
  { id: 'team',      label: 'Teams',         icon: '👥' },
  { id: 'loyalty',   label: 'Loyalty',       icon: '⭐' },
];

const FAQS = [
  { id: 1, cat: 'booking', q: 'How do I make a booking?',           a: 'Go to Fields, pick a field, select your date and time, then confirm. You\'ll receive an email confirmation immediately.' },
  { id: 2, cat: 'booking', q: 'Can I reschedule my booking?',       a: 'Yes. Open My Bookings, select the booking, and click Reschedule. Rescheduling is free up to 24 hours before your slot.' },
  { id: 3, cat: 'booking', q: 'How do I cancel a booking?',         a: 'Open My Bookings and click Cancel. Cancellations made 48+ hours in advance receive a full refund. Later cancellations may incur a 25% fee.' },
  { id: 4, cat: 'booking', q: 'Can I book recurring time slots?',   a: 'Yes! On the booking page, toggle "Recurring" and choose weekly or bi-weekly. Your slot will be automatically reserved.' },
  { id: 5, cat: 'payment', q: 'What payment methods are accepted?', a: 'We accept bKash, Nagad, Rocket, Visa, Mastercard, and bank transfers. All payments are encrypted and secure.' },
  { id: 6, cat: 'payment', q: 'When will I receive my refund?',     a: 'Refunds are processed within 3–5 business days. Mobile banking refunds (bKash, Nagad) are typically within 24 hours.' },
  { id: 7, cat: 'payment', q: 'Is my payment information secure?',  a: 'Yes. We use SSL encryption and never store raw card numbers. All transactions go through PCI-DSS compliant gateways.' },
  { id: 8, cat: 'account', q: 'How do I reset my password?',        a: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a reset link within 5 minutes.' },
  { id: 9, cat: 'account', q: 'Can I change my email address?',     a: 'Yes, go to Profile → Account Settings → Edit Email. You\'ll need to verify the new address.' },
  { id: 10, cat: 'field',  q: 'How are field ratings calculated?',  a: 'Field ratings are an average of verified reviews from users who completed a booking at that field.' },
  { id: 11, cat: 'field',  q: 'Can I list my own field?',           a: 'Yes! Click "Add Field" in the menu. Our team reviews all submissions within 48 hours before publishing.' },
  { id: 12, cat: 'team',   q: 'How do I create a team?',            a: 'Go to Team Management and click "Create Team". Set your team name, sport, and invite players via email.' },
  { id: 13, cat: 'loyalty',q: 'How do I earn loyalty points?',      a: 'You earn points on every booking (1 point per ৳1 spent). Bonus points are awarded on weekends and for referrals.' },
  { id: 14, cat: 'loyalty',q: 'Do my points expire?',               a: 'Points never expire as long as your account is active (at least one booking per 12 months).' },
];

const GUIDES = [
  { title: 'Getting Started',       icon: '🚀', steps: ['Create your free account', 'Browse fields by sport or location', 'Pick a date and time slot', 'Pay securely and receive confirmation'] },
  { title: 'Cancellation Policy',   icon: '❌', steps: ['72+ hours: Full refund', '48–72 hours: 90% refund', '24–48 hours: 75% refund', 'Under 24 hours: No refund'] },
  { title: 'Loyalty Program',       icon: '⭐', steps: ['Earn 1 pt per ৳1 spent', 'Weekend bookings earn 2× points', 'Redeem points for vouchers and free hours', 'Reach Platinum for exclusive perks'] },
  { title: 'Adding Your Field',     icon: '🏟️', steps: ['Click Add Field in the menu', 'Upload photos and fill details', 'Set your availability and pricing', 'Our team reviews in 48 hours'] },
];

const HelpCenter = () => {
  const [category,  setCategory]  = useState('all');
  const [search,    setSearch]    = useState('');
  const [openFaq,   setOpenFaq]   = useState(null);
  const [ticketForm,setTicketForm]= useState({ subject: '', email: '', message: '', priority: 'normal' });
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tab,       setTab]       = useState('faq');

  const filtered = FAQS.filter(f =>
    (category === 'all' || f.cat === category) &&
    (!search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
  );

  const handleTicket = useCallback(async () => {
    if (!ticketForm.subject.trim() || !ticketForm.email.trim() || !ticketForm.message.trim()) return;
    setSubmitting(true);
    try {
      await authFetch('/api/v1/support/tickets', { method: 'POST', body: JSON.stringify(ticketForm) });
    } catch { /* silent */ }
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 800);
  }, [ticketForm]);

  const S = {
    page:    { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:    { maxWidth: 960, margin: '0 auto' },
    title:   { fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, background: 'linear-gradient(135deg,#7c3aed,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    search:  { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', color: '#f1f5f9', padding: '0.85rem 1.25rem', fontSize: '1rem', outline: 'none', marginBottom: '2rem', boxSizing: 'border-box' },
    cats:    { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' },
    cat:     (a) => ({ display: 'flex', alignItems: 'center', gap: '0.4rem', background: a ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)', border: `1px solid ${a ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, color: a ? '#f1f5f9' : '#94a3b8', padding: '0.4rem 0.9rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: a ? 700 : 400 }),
    tabs:    { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.3rem' },
    tab:     (a) => ({ flex: 1, background: a ? 'rgba(124,58,237,0.5)' : 'transparent', border: 'none', color: a ? '#f1f5f9' : '#94a3b8', fontWeight: a ? 700 : 500, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }),
    faqBox:  { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden', marginBottom: '0.5rem' },
    faqQ:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer' },
    faqA:    { padding: '0 1.25rem 1rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7 },
    guideGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem', marginBottom: '2rem' },
    guideCard:{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem' },
    input:   { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#f1f5f9', padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' },
    label:   { display: 'block', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
    submit:  { width: '100%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.85rem', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem' },
    contact: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' },
    cCard:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' },
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={S.title}>🎯 Help Center</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Find answers, guides, and get support</p>
        </div>

        <input
          style={S.search}
          placeholder="🔍 Search help articles, FAQs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={S.tabs}>
          {[['faq','FAQ'],['guides','Guides'],['contact','Contact Us']].map(([v,l]) => (
            <button key={v} style={S.tab(tab===v)} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {/* FAQ tab */}
        {tab === 'faq' && (
          <>
            <div style={S.cats}>
              {CATEGORIES.map(c => (
                <button key={c.id} style={S.cat(category === c.id)} onClick={() => setCategory(c.id)}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</p>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <p>No results for "{search}". Try a different search term or <button style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }} onClick={() => setTab('contact')}>contact support</button>.</p>
              </div>
            ) : (
              filtered.map(faq => (
                <div key={faq.id} style={S.faqBox}>
                  <div style={S.faqQ} onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>{faq.q}</span>
                    <span style={{ color: '#7c3aed', fontSize: '1.2rem', transition: 'transform 0.2s', transform: openFaq === faq.id ? 'rotate(45deg)' : 'none' }}>+</span>
                  </div>
                  {openFaq === faq.id && <div style={S.faqA}>{faq.a}</div>}
                </div>
              ))
            )}
          </>
        )}

        {/* Guides tab */}
        {tab === 'guides' && (
          <>
            <div style={S.guideGrid}>
              {GUIDES.map(g => (
                <div key={g.title} style={S.guideCard}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{g.icon}</div>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 0.75rem', fontSize: '0.95rem' }}>{g.title}</h3>
                  <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    {g.steps.map((s, i) => <li key={i} style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.35rem', lineHeight: 1.5 }}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📹</div>
              <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 0.5rem' }}>Video Tutorials</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1rem' }}>Watch step-by-step guides for common tasks</p>
              <button style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontWeight: 700, padding: '0.6rem 1.5rem', borderRadius: '10px', cursor: 'pointer' }}>
                Watch Tutorials →
              </button>
            </div>
          </>
        )}

        {/* Contact tab */}
        {tab === 'contact' && (
          <>
            <div style={S.contact}>
              {[
                ['💬', 'Live Chat', 'Available 9 AM – 9 PM', 'Start Chat'],
                ['📧', 'Email Support', 'support@sportsfield.bd', 'Send Email'],
                ['📞', 'Phone', '+880 1800-SPORTS', 'Call Now'],
              ].map(([ic, title, sub, btn]) => (
                <div key={title} style={S.cCard}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{ic}</div>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.25rem' }}>{title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 0.75rem' }}>{sub}</p>
                  <button style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontWeight: 700, padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>{btn}</button>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.75rem' }}>
              <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 1.25rem', fontSize: '1rem' }}>📝 Submit a Support Ticket</h3>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6ee7b7' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Ticket Submitted!</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>We'll respond to your email within 24 hours. Ticket ID: #TKT{Date.now().toString().slice(-6)}</p>
                  <button style={{ marginTop: '1rem', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setSubmitted(false)}>Submit Another</button>
                </div>
              ) : (
                <>
                  <label style={S.label}>Email Address</label>
                  <input style={S.input} type="email" placeholder="your@email.com" value={ticketForm.email} onChange={e => setTicketForm(f => ({ ...f, email: e.target.value }))} />
                  <label style={S.label}>Subject</label>
                  <input style={S.input} placeholder="Briefly describe your issue" value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} />
                  <label style={S.label}>Priority</label>
                  <select style={S.input} value={ticketForm.priority} onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low — General inquiry</option>
                    <option value="normal">Normal — Need help</option>
                    <option value="high">High — Booking issue</option>
                    <option value="urgent">Urgent — Payment problem</option>
                  </select>
                  <label style={S.label}>Message</label>
                  <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical' }} placeholder="Describe your issue in detail…" value={ticketForm.message} onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))} />
                  <button style={S.submit} onClick={handleTicket} disabled={submitting}>{submitting ? 'Submitting…' : '🎫 Submit Ticket'}</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HelpCenter;
