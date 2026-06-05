import React, { useState } from 'react';

const CATEGORIES = ['General Inquiry', 'Booking Support', 'Technical Issue', 'Partnership', 'Feedback', 'Complaint', 'Feature Request'];

const CONTACT_METHODS = [
  { icon: '📞', title: 'Phone Support',  info: '+880-1711-SPORTS (776787)',      sub: 'Mon–Fri: 9AM–9PM, Sat–Sun: 10AM–6PM' },
  { icon: '📧', title: 'Email Support',  info: 'support@premiumsports.bd',        sub: 'Response within 24 hours' },
  { icon: '💬', title: 'Live Chat',      info: 'Chat with our support team',      sub: 'Available 24/7' },
  { icon: '📍', title: 'Visit Us',       info: 'House 123, Road 4, Dhanmondi',    sub: 'Open Mon–Fri: 9AM–6PM' },
];

const HOURS = [
  { day: 'Monday – Friday',  hours: '9:00 AM – 9:00 PM' },
  { day: 'Saturday',         hours: '10:00 AM – 8:00 PM' },
  { day: 'Sunday',           hours: '10:00 AM – 6:00 PM' },
  { day: 'Public Holidays',  hours: '10:00 AM – 4:00 PM' },
];

const SOCIALS = [
  { name: 'Facebook',  icon: '📘', bg: 'linear-gradient(135deg,#1877f2,#1558b0)' },
  { name: 'Instagram', icon: '📸', bg: 'linear-gradient(135deg,#e1306c,#7c3aed)' },
  { name: 'Twitter',   icon: '🐦', bg: 'linear-gradient(135deg,#1da1f2,#0d6ecd)' },
  { name: 'LinkedIn',  icon: '💼', bg: 'linear-gradient(135deg,#0077b5,#005580)' },
];

const FAQS = [
  { q: 'How do I book a sports field?',              a: 'Browse our fields, select your preferred date and time, and confirm your booking. Payment can be made online or at the venue.' },
  { q: 'Can I cancel or reschedule my booking?',     a: 'Yes, you can cancel or reschedule up to 24 hours before your booking time through your dashboard or by contacting us.' },
  { q: 'What payment methods do you accept?',        a: 'We accept bKash, Nagad, Rocket, credit/debit cards, and cash payments at partner venues.' },
  { q: 'How do I become a partner facility?',        a: 'Contact us through the Partnership category in the form, and our team will guide you through the onboarding process.' },
];

const BLANK_FORM = { name: '', email: '', phone: '', subject: '', category: '', message: '', priority: 'normal' };

const WorkingContact = () => {
  const [form,      setForm]      = useState(BLANK_FORM);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error,     setError]     = useState('');
  const [openFaq,   setOpenFaq]   = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setError('');
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setError('Please fill in all required fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/v1/auth/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message');
      setSubmitted(data.data);
      setForm(BLANK_FORM);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>📞</div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.65rem' }}>Contact Us</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 1.25rem' }}>
            We're here to help! Get in touch for support, partnerships, or any questions.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '999px', padding: '0.25rem 0.85rem', fontSize: '0.78rem', fontWeight: 700 }}>
              🟢 Support Online
            </span>
            <span style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', borderRadius: '999px', padding: '0.25rem 0.85rem', fontSize: '0.78rem', fontWeight: 700 }}>
              ⚡ Avg. Response: &lt;2 hours
            </span>
            <span style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', borderRadius: '999px', padding: '0.25rem 0.85rem', fontSize: '0.78rem', fontWeight: 700 }}>
              💬 Live Chat 24/7
            </span>
          </div>
        </div>

        {/* Contact method tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {CONTACT_METHODS.map(m => (
            <div key={m.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.4rem', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{m.icon}</div>
              <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.35rem' }}>{m.title}</h3>
              <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{m.info}</p>
              <p style={{ color: '#64748b', fontSize: '0.78rem' }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Main grid: form + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start', marginBottom: '2.5rem' }}>

          {/* Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.2rem', marginBottom: '1.75rem' }}>📝 Send us a Message</h2>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                <h3 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.3rem', marginBottom: '0.5rem' }}>Message Sent!</h3>
                <p style={{ color: '#94a3b8', marginBottom: '0.35rem' }}>Thank you, <strong style={{ color: '#e2e8f0' }}>{submitted.name}</strong>!</p>
                <p style={{ color: '#94a3b8', marginBottom: '0.35rem' }}>
                  We'll get back to you at <span style={{ color: '#a78bfa', fontWeight: 600 }}>{submitted.email}</span> within 24 hours.
                </p>
                {submitted.referenceId && (
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Reference ID: <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 700 }}>{submitted.referenceId}</span>
                  </p>
                )}
                <button onClick={() => setSubmitted(null)} className="btn-primary" style={{ justifyContent: 'center' }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '0.7rem 1rem', color: '#f87171', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="ct-name" className="field-label">👤 Full Name *</label>
                    <input id="ct-name" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="input-field" required />
                  </div>
                  <div>
                    <label htmlFor="ct-email" className="field-label">📧 Email Address *</label>
                    <input id="ct-email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-field" required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="ct-phone" className="field-label">📱 Phone Number</label>
                    <input id="ct-phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="ct-category" className="field-label">📋 Category</label>
                    <select id="ct-category" name="category" value={form.category} onChange={handleChange} className="input-field">
                      <option value="">Select a category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label htmlFor="ct-subject" className="field-label">📌 Subject</label>
                    <input id="ct-subject" type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="Brief subject" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="ct-priority" className="field-label">🚨 Priority</label>
                    <select id="ct-priority" name="priority" value={form.priority} onChange={handleChange} className="input-field">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label htmlFor="ct-message" className="field-label" style={{ margin: 0 }}>💬 Message *</label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: form.message.length > 900 ? '#f87171' : '#64748b' }}>
                      {form.message.length}/1000
                    </span>
                  </div>
                  <textarea id="ct-message" name="message" value={form.message} onChange={handleChange} placeholder="Tell us how we can help you…" rows={6} maxLength={1000} className="input-field" style={{ resize: 'vertical' }} required />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', opacity: loading ? 0.75 : 1 }}>
                  {loading ? <><span className="spinner" style={{ width: '18px', height: '18px' }} /> Sending…</> : '🚀 Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Hours */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>🕒 Business Hours</h3>
              {HOURS.map(h => (
                <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.55rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.55rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{h.day}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.82rem' }}>{h.hours}</span>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>🌐 Follow Us</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {SOCIALS.map(s => (
                  <button key={s.name} type="button"
                    style={{ padding: '0.6rem', background: s.bg, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.2rem', textAlign: 'center', marginBottom: '1.75rem' }}>❓ Frequently Asked Questions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '1rem' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
              <div key={faq.q} style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${isOpen ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color .2s' }}>
                <button type="button" onClick={() => setOpenFaq(isOpen ? null : idx)}
                  style={{ width: '100%', padding: '1rem 1.25rem', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', gap: '0.75rem' }}>
                  <h4 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.92rem', margin: 0 }}>{faq.q}</h4>
                  <span style={{ color: isOpen ? '#a78bfa' : '#64748b', fontSize: '1rem', flexShrink: 0, transition: 'transform .2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}>＋</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.65, margin: '0.75rem 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkingContact;
