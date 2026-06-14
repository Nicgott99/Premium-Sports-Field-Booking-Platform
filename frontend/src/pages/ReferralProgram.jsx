import React, { useState, useEffect, useCallback } from 'react';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_REFERRALS = [
  { id: 'r1', name: 'Tanvir Ahmed',   email: 'tanvir@example.com', status: 'completed', joinedAt: '2026-05-10', reward: 500 },
  { id: 'r2', name: 'Nusrat Jahan',   email: 'nusrat@example.com', status: 'completed', joinedAt: '2026-05-22', reward: 500 },
  { id: 'r3', name: 'Rafiq Islam',    email: 'rafiq@example.com',  status: 'pending',   joinedAt: '2026-06-01', reward: 0 },
  { id: 'r4', name: 'Sultana Begum',  email: 'sultana@example.com',status: 'completed', joinedAt: '2026-06-08', reward: 500 },
  { id: 'r5', name: 'Kamal Hossain',  email: 'kamal@example.com',  status: 'pending',   joinedAt: '2026-06-14', reward: 0 },
];

const REWARDS = [
  { milestone: 1,  reward: '৳500 credit',        icon: '🎁', reached: true },
  { milestone: 3,  reward: '৳1,500 + VIP badge',  icon: '⭐', reached: true },
  { milestone: 5,  reward: 'Free 1-month Pro',    icon: '⚡', reached: false },
  { milestone: 10, reward: 'Elite Membership',    icon: '👑', reached: false },
];

const HOW_IT_WORKS = [
  { icon: '🔗', title: 'Share Your Link', desc: 'Copy your unique referral link and share it with friends, teammates, or on social media.' },
  { icon: '📩', title: 'Friend Signs Up',  desc: 'Your friend clicks your link, registers an account, and makes their first booking.' },
  { icon: '💰', title: 'Both Earn',        desc: 'You earn ৳500 credit. Your friend gets ৳200 off their first booking. Win-win!' },
  { icon: '🏆', title: 'Hit Milestones',  desc: 'Refer more friends to unlock exclusive bonuses, badges, and free memberships.' },
];

const ReferralProgram = () => {
  const [referrals,  setReferrals]  = useState([]);
  const [stats,      setStats]      = useState({ total: 0, completed: 0, pending: 0, earned: 0 });
  const [refCode,    setRefCode]    = useState('');
  const [copied,     setCopied]     = useState(false);
  const [email,      setEmail]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [sentMsg,    setSentMsg]    = useState('');
  const [tab,        setTab]        = useState('overview');

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const uid  = raw ? (JSON.parse(raw)._id ?? JSON.parse(raw).id ?? 'USER') : 'USER';
    const code = `SPORT-${uid.toString().slice(-6).toUpperCase()}`;
    setRefCode(code);

    authFetch(`/api/v1/referrals?userId=${uid}`)
      .then(r => r.json())
      .then(d => {
        const list = d.success ? (d.data ?? []) : MOCK_REFERRALS;
        setReferrals(list);
        setStats({
          total:     list.length,
          completed: list.filter(r => r.status === 'completed').length,
          pending:   list.filter(r => r.status === 'pending').length,
          earned:    list.filter(r => r.status === 'completed').reduce((s, r) => s + (r.reward ?? 500), 0),
        });
      })
      .catch(() => {
        setReferrals(MOCK_REFERRALS);
        setStats({ total: 5, completed: 3, pending: 2, earned: 1500 });
      });
  }, []);

  const refLink = `https://sportsfield.bd/register?ref=${refCode}`;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [refLink]);

  const sendInvite = useCallback(async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const res  = await authFetch('/api/v1/referrals/invite', { method: 'POST', body: JSON.stringify({ email, refCode }) });
      const data = await res.json();
      setSentMsg(data.success ? `Invitation sent to ${email}!` : `Invite sent to ${email}! (demo)`);
    } catch {
      setSentMsg(`Invite sent to ${email}! (demo)`);
    }
    setEmail('');
    setSending(false);
    setTimeout(() => setSentMsg(''), 4000);
  }, [email, refCode]);

  const completedCount = stats.completed;
  const nextMilestone  = REWARDS.find(r => r.milestone > completedCount);
  const progressPct    = nextMilestone
    ? Math.min(100, (completedCount / nextMilestone.milestone) * 100) : 100;

  const S = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:   { maxWidth: 900, margin: '0 auto' },
    title:  { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    statGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' },
    statCard:{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' },
    tabs:   { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.3rem' },
    tab:    (a) => ({ flex: 1, background: a ? 'rgba(124,58,237,0.5)' : 'transparent', border: 'none', color: a ? '#f1f5f9' : '#94a3b8', fontWeight: a ? 700 : 500, padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }),
    card:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem' },
    linkBox:{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1rem' },
    copyBtn:{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.3)', border: `1px solid ${copied ? 'rgba(16,185,129,0.5)' : 'rgba(124,58,237,0.5)'}`, color: copied ? '#6ee7b7' : '#a78bfa', fontWeight: 800, padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 },
    input:  { flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#f1f5f9', padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none' },
    sendBtn:{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.65rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', flexShrink: 0 },
    howGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '1rem', marginBottom: '2rem' },
    howCard:{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' },
    badge:  (done) => ({ display: 'inline-block', background: done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, color: done ? '#6ee7b7' : '#475569', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }),
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={S.title}>🎯 Referral Program</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Invite friends, earn rewards — together</p>
        </div>

        {/* Stats */}
        <div style={S.statGrid}>
          {[
            ['👥', stats.total,     'Total Referred'],
            ['✅', stats.completed, 'Completed'],
            ['⏳', stats.pending,   'Pending'],
            ['💰', `৳${stats.earned.toLocaleString()}`, 'Credits Earned'],
          ].map(([ic, val, lbl]) => (
            <div key={lbl} style={S.statCard}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{ic}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>{val}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.3rem' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Progress to next milestone */}
        {nextMilestone && (
          <div style={{ ...S.card, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: '#fcd34d', fontWeight: 700, fontSize: '0.9rem' }}>
                Next milestone: {nextMilestone.icon} {nextMilestone.reward}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{completedCount} / {nextMilestone.milestone}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '20px', height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#f59e0b,#ec4899)', borderRadius: '20px', transition: 'width 0.8s ease' }} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0.5rem 0 0' }}>
              Refer {nextMilestone.milestone - completedCount} more friend{nextMilestone.milestone - completedCount !== 1 ? 's' : ''} to unlock
            </p>
          </div>
        )}

        <div style={S.tabs}>
          {[['overview','Overview'],['invite','Invite Friends'],['history','History'],['rewards','Rewards']].map(([v,l]) => (
            <button key={v} style={S.tab(tab===v)} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <>
            <div style={S.howGrid}>
              {HOW_IT_WORKS.map(h => (
                <div key={h.title} style={S.howCard}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{h.icon}</div>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.4rem' }}>{h.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.55 }}>{h.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎁</div>
              <h3 style={{ color: '#f1f5f9', fontWeight: 800, margin: '0 0 0.4rem' }}>You earn ৳500 · Friend gets ৳200</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>For every friend who completes their first booking</p>
              <button style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)', border: 'none', color: '#fff', fontWeight: 800, padding: '0.7rem 2rem', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem' }} onClick={() => setTab('invite')}>
                Start Inviting →
              </button>
            </div>
          </>
        )}

        {/* Invite tab */}
        {tab === 'invite' && (
          <div style={S.card}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 1rem', fontSize: '0.95rem' }}>🔗 Your Referral Link</h3>
            <div style={S.linkBox}>
              <span style={{ color: '#a78bfa', fontSize: '0.83rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refLink}</span>
              <button style={S.copyBtn} onClick={copyLink}>{copied ? '✓ Copied!' : 'Copy'}</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[['📘','Facebook'],['🐦','Twitter'],['💬','WhatsApp'],['📸','Instagram']].map(([ic,net]) => (
                <button key={net} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{ic} {net}</button>
              ))}
            </div>

            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 0.75rem', fontSize: '0.95rem' }}>📩 Invite by Email</h3>
            {sentMsg && <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{sentMsg}</div>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input style={S.input} type="email" placeholder="friend@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendInvite()} />
              <button style={S.sendBtn} onClick={sendInvite} disabled={sending}>{sending ? 'Sending…' : 'Send Invite'}</button>
            </div>
            <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.6rem' }}>Your friend will receive an email with your referral code and a ৳200 welcome bonus.</p>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div style={S.card}>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 1rem', fontSize: '0.95rem' }}>Referral History</h3>
            {referrals.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>No referrals yet. Share your link to get started!</div>
            ) : (
              referrals.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{r.email} · Joined {r.joinedAt}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {r.status === 'completed' && <span style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '0.85rem' }}>+৳{r.reward}</span>}
                    <span style={S.badge(r.status === 'completed')}>{r.status === 'completed' ? '✓ Completed' : '⏳ Pending'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rewards tab */}
        {tab === 'rewards' && (
          <div>
            {REWARDS.map(r => (
              <div key={r.milestone} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '1.25rem', opacity: r.reached || r.milestone <= completedCount ? 1 : 0.6 }}>
                <div style={{ fontSize: '2.5rem' }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem' }}>{r.reward}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>Reach {r.milestone} completed referral{r.milestone !== 1 ? 's' : ''}</div>
                </div>
                {completedCount >= r.milestone
                  ? <span style={S.badge(true)}>✓ Unlocked</span>
                  : <span style={S.badge(false)}>{r.milestone - completedCount} to go</span>
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralProgram;
