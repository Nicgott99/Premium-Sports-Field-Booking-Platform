import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'story',   label: '📖 Our Story' },
  { id: 'mission', label: '🎯 Mission' },
  { id: 'team',    label: '👥 Team' },
  { id: 'values',  label: '💎 Values' },
];

const TEAM = [
  { name: 'Alex Rahman',    role: 'CEO & Founder',      years: 10, skill: '🚀 Strategy',   image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', bio: 'Sports enthusiast with 10+ years in tech. Built this platform to revolutionize sports booking.',    links: [{ label: 'LinkedIn', icon: '💼', url: '#' }, { label: 'Twitter', icon: '🐦', url: '#' }] },
  { name: 'Sarah Ahmed',    role: 'CTO',                years: 8,  skill: '⚙️ Engineering', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300', bio: 'Full-stack developer passionate about creating seamless user experiences.',                        links: [{ label: 'LinkedIn', icon: '💼', url: '#' }, { label: 'GitHub',  icon: '💻', url: '#' }] },
  { name: 'Mike Khan',      role: 'Head of Operations', years: 6,  skill: '🏟️ Operations',  image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300', bio: 'Former sports facility manager, now ensuring smooth operations across all our partner venues.',   links: [{ label: 'LinkedIn', icon: '💼', url: '#' }, { label: 'Insta',   icon: '📸', url: '#' }] },
  { name: 'Lisa Chowdhury', role: 'UX Designer',        years: 5,  skill: '🎨 Design',      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300', bio: 'Design expert creating intuitive interfaces that make sports booking effortless.',                 links: [{ label: 'LinkedIn', icon: '💼', url: '#' }, { label: 'Dribbble', icon: '🎨', url: '#' }] },
];

const STATS = [
  { number: '50,000+', label: 'Happy Users',       icon: '👥', color: 'linear-gradient(135deg,#60a5fa,#22d3ee)' },
  { number: '1,200+',  label: 'Partner Fields',    icon: '🏟️', color: 'linear-gradient(135deg,#a78bfa,#ec4899)' },
  { number: '25+',     label: 'Sports Supported',  icon: '⚽', color: 'linear-gradient(135deg,#34d399,#10b981)' },
  { number: '8+',      label: 'Cities Covered',    icon: '🏙️', color: 'linear-gradient(135deg,#f97316,#fbbf24)' },
];

const MILESTONES = [
  { year: '2020', icon: '💡', title: 'The Idea',         desc: 'Founded after our CEO struggled to book a football field — built an MVP in 3 months.' },
  { year: '2021', icon: '🚀', title: 'Public Launch',    desc: 'Launched in Dhaka with 50 partner fields and 1,000 early users in the first week.' },
  { year: '2022', icon: '🏙️', title: 'City Expansion',  desc: 'Expanded to Chittagong, Sylhet, and Rajshahi. Crossed 10,000 registered users.' },
  { year: '2023', icon: '🏆', title: 'Premium Tier',     desc: 'Introduced tournament hosting, team features, and the field-owner dashboard.' },
  { year: '2024', icon: '📱', title: 'Mobile & Scale',   desc: 'Surpassed 50,000 users, 1,200+ partner fields across 8 cities in Bangladesh.' },
  { year: '2025', icon: '🌍', title: 'Going Regional',   desc: 'Expanding to South Asia — partnering with venues in Nepal, Sri Lanka, and India.' },
];

const MISSION_ITEMS = [
  { icon: '🚀', title: 'Innovation',    desc: 'Continuously improving technology to enhance user experience' },
  { icon: '🤝', title: 'Accessibility', desc: 'Making sports facilities available to people from all backgrounds' },
  { icon: '🏆', title: 'Excellence',    desc: 'Partnering only with premium facilities that meet our high standards' },
];

const VALUES = [
  { title: '🔒 Trust & Security',       desc: 'We prioritize user data security and maintain transparent, honest relationships with our users and partners.' },
  { title: '🌟 Quality First',           desc: 'Every facility on our platform meets strict quality standards to ensure the best experience for our users.' },
  { title: '🤝 Community Focus',         desc: 'We believe sports bring people together and actively foster a supportive community of athletes.' },
  { title: '💡 Continuous Innovation',   desc: 'We constantly evolve our platform based on user feedback and emerging technologies.' },
  { title: '🌍 Sustainability',          desc: 'We partner with eco-friendly facilities and promote sustainable sports practices.' },
  { title: '⚡ Speed & Efficiency',      desc: 'We value your time and ensure our platform is fast, reliable, and easy to use.' },
];

function useCounter(target) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      const steps = 40;
      const inc   = Math.ceil(target / steps);
      let cur = 0;
      const id = setInterval(() => {
        cur = Math.min(cur + inc, target);
        setVal(cur);
        if (cur >= target) clearInterval(id);
      }, 35);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return [val, ref];
}

function StatCounter({ stat }) {
  const numericTarget = Number.parseInt(stat.number.replace(/\D/g, ''), 10) || 0;
  const suffix = stat.number.replace(/\d/g, '').replace(',', '');
  const [count, ref] = useCounter(numericTarget);
  const display = Number(count).toLocaleString();
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, background: stat.color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>
        {display}{suffix}
      </div>
      <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem' }}>{stat.label}</div>
    </div>
  );
}
import PropTypes from 'prop-types';
StatCounter.propTypes = { stat: PropTypes.shape({ number: PropTypes.string, icon: PropTypes.string, label: PropTypes.string, color: PropTypes.string }).isRequired };

const WorkingAbout = () => {
  const navigate   = useNavigate();
  const [tab, setTab] = useState('story');

  const tabBtn = active => ({
    padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'transparent',
    color: active ? '#fff' : '#94a3b8',
  });

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>🏆</div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.75rem' }}>
            About Premium Sports
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
            We're revolutionizing how people discover, book, and enjoy sports facilities — built by sports lovers, for sports lovers.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '0.4rem', display: 'inline-flex', gap: '0.25rem', backdropFilter: 'blur(10px)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={tabBtn(tab === t.id)}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ marginBottom: '2.5rem' }}>

          {/* Story */}
          {tab === 'story' && (
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>
                <div>
                  <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.25rem' }}>📖 Our Story</h2>
                  {['It all started in 2020 when our founder, Alex Rahman, struggled to find and book a decent football field for his weekend games. The process was frustrating, time-consuming, and often resulted in disappointment.',
                    'That\'s when the idea struck: "What if there was a platform that made sports booking as easy as ordering food online?" With this vision, Premium Sports was born.',
                    'Today, we\'ve partnered with over 1,200 sports facilities across Bangladesh, serving 50,000+ sports enthusiasts who share our passion for the game.'].map(p => (
                    <p key={p.slice(0, 30)} style={{ color: '#94a3b8', lineHeight: 1.75, fontSize: '0.93rem', marginBottom: '0.85rem' }}>{p}</p>
                  ))}
                </div>
                <div>
                  <img src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600" alt="Sports field"
                    style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                </div>
              </div>

              {/* Timeline */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '2rem', paddingTop: '2rem' }}>
                <h3 style={{ color: '#e2e8f0', fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>🗓️ Our Milestones</h3>
                <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                  <div style={{ position: 'absolute', left: '0.6rem', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom,#7c3aed,#ec4899)', borderRadius: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {MILESTONES.map(m => (
                      <div key={m.year} style={{ position: 'relative', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                        <div style={{ position: 'absolute', left: '-1.7rem', width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0, boxShadow: '0 0 0 3px rgba(124,58,237,0.25)' }}>{m.icon}</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                            <span style={{ background: 'rgba(124,58,237,0.22)', color: '#c4b5fd', padding: '0.1rem 0.55rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>{m.year}</span>
                            <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '0.92rem' }}>{m.title}</span>
                          </div>
                          <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mission */}
          {tab === 'mission' && (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem', marginBottom: '1rem' }}>🎯 Our Mission</h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '680px', margin: '0 auto 2rem', lineHeight: 1.75 }}>
                To make sports accessible to everyone by providing a seamless platform for discovering, booking, and enjoying premium sports facilities.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                {MISSION_ITEMS.map(m => (
                  <div key={m.title} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.65rem' }}>{m.icon}</div>
                    <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>{m.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.65 }}>{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          {tab === 'team' && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.75rem' }}>👥 Meet Our Team</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.25rem' }}>
                {TEAM.map(m => (
                  <div key={m.name} style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
                    <img src={m.image} alt={m.name}
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.85rem', display: 'block', border: '2px solid rgba(124,58,237,0.5)' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{m.name}</h3>
                    <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.5rem' }}>{m.role}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(124,58,237,0.18)', color: '#c4b5fd', padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>{m.skill}</span>
                      <span style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>{m.years}y exp</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '0.85rem' }}>{m.bio}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      {(m.links ?? []).map(l => (
                        <a key={l.label} href={l.url} aria-label={l.label}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', fontSize: '0.9rem', textDecoration: 'none', transition: 'background .2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}>
                          {l.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Values */}
          {tab === 'values' && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.75rem' }}>💎 Our Values</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
                {VALUES.map(v => (
                  <div key={v.title} style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem' }}>
                    <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem' }}>{v.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.65 }}>{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.3rem', textAlign: 'center', marginBottom: '1.75rem' }}>📈 Our Impact</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1.5rem' }}>
            {STATS.map(s => <StatCounter key={s.label} stat={s} />)}
          </div>
        </div>

        {/* Careers banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: '#fcd34d', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>🌟 We&apos;re Hiring</p>
            <p style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.05rem', marginBottom: '0.2rem' }}>Join the Premium Sports Team</p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Remote-friendly roles in Engineering, Design, and Operations</p>
          </div>
          <button onClick={() => navigate('/contact')}
            style={{ padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', flexShrink: 0 }}>
            View Openings →
          </button>
        </div>

        {/* CTA */}
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.75rem' }}>🚀 Join Our Journey</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Whether you're a player looking for the perfect field or a facility owner wanting to reach more customers, we'd love to have you on board.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ padding: '0.85rem 2rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              🏃 Get Started Free
            </button>
            <button onClick={() => navigate('/contact')}
              style={{ padding: '0.85rem 2rem', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#c4b5fd', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              📞 Contact Us
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkingAbout;
