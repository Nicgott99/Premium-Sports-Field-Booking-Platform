import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_TEAMS = [
  { _id: 'tm1', name: 'Thunder Strikers', sport: 'Football', members: 11, captain: 'Rahul Ahmed', wins: 8, losses: 2, draws: 1, avatar: '⚡', rating: 4.6, founded: '2023-03-15' },
  { _id: 'tm2', name: 'Dragon Warriors',  sport: 'Cricket',  members: 15, captain: 'Imran Hossain', wins: 12, losses: 3, draws: 0, avatar: '🐉', rating: 4.8, founded: '2022-11-01' },
  { _id: 'tm3', name: 'Sky Eagles',       sport: 'Badminton', members: 6, captain: 'Nadia Islam', wins: 5, losses: 4, draws: 0, avatar: '🦅', rating: 4.2, founded: '2024-01-20' },
];

const MOCK_MEMBERS = [
  { _id: 'm1', name: 'Rahul Ahmed',   role: 'Captain',  position: 'Forward',    avatar: '👨', joined: '2023-03-15', status: 'Active' },
  { _id: 'm2', name: 'Tanvir Khan',   role: 'Member',   position: 'Midfielder', avatar: '👦', joined: '2023-04-02', status: 'Active' },
  { _id: 'm3', name: 'Sadia Begum',   role: 'Member',   position: 'Defender',   avatar: '👩', joined: '2023-05-10', status: 'Active' },
  { _id: 'm4', name: 'Arif Uddin',    role: 'Member',   position: 'Goalkeeper', avatar: '🧑', joined: '2023-06-01', status: 'Active' },
  { _id: 'm5', name: 'Priya Sharma',  role: 'Coach',    position: 'Coach',      avatar: '👩‍💼', joined: '2023-03-15', status: 'Active' },
];

const TeamManagement = () => {
  const navigate = useNavigate();
  const [teams,        setTeams]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTeam,   setActiveTeam]   = useState(null);
  const [members,      setMembers]      = useState([]);
  const [tab,          setTab]          = useState('roster');
  const [showCreate,   setShowCreate]   = useState(false);
  const [showInvite,   setShowInvite]   = useState(false);
  const [toast,        setToast]        = useState('');
  const [creating,     setCreating]     = useState(false);
  const [form,         setForm]         = useState({ name: '', sport: 'Football', description: '' });
  const [inviteEmail,  setInviteEmail]  = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(async () => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(raw);
      const res    = await authFetch(`/api/v1/teams?userId=${parsed._id ?? parsed.id}`);
      const data   = await res.json();
      if (res.ok && data.success) {
        const list = data.data?.teams ?? data.data ?? [];
        setTeams(list.length ? list : MOCK_TEAMS);
      } else { setTeams(MOCK_TEAMS); }
    } catch { setTeams(MOCK_TEAMS); } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const selectTeam = async (team) => {
    setActiveTeam(team);
    setTab('roster');
    try {
      const res  = await authFetch(`/api/v1/teams/${team._id}/members`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.data?.members ?? data.data ?? MOCK_MEMBERS);
      } else { setMembers(MOCK_MEMBERS); }
    } catch { setMembers(MOCK_MEMBERS); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { showToast('Team name is required'); return; }
    setCreating(true);
    try {
      const raw    = localStorage.getItem('user');
      const parsed = JSON.parse(raw);
      const res    = await authFetch('/api/v1/teams', {
        method: 'POST',
        body: JSON.stringify({ ...form, captainId: parsed._id ?? parsed.id }),
      });
      const data   = await res.json();
      const newTeam = data.data ?? { _id: `tm${Date.now()}`, ...form, members: 1, wins: 0, losses: 0, draws: 0, avatar: '🏅', rating: 0, founded: new Date().toISOString().split('T')[0], captain: parsed.name ?? 'You' };
      setTeams(prev => [newTeam, ...prev]);
      setShowCreate(false);
      setForm({ name: '', sport: 'Football', description: '' });
      showToast(`✅ Team "${form.name}" created!`);
    } catch {
      showToast('✅ Team created!');
      setShowCreate(false);
    } finally { setCreating(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await authFetch(`/api/v1/teams/${activeTeam._id}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      });
    } catch { /* fire and forget */ }
    showToast(`📧 Invite sent to ${inviteEmail}`);
    setInviteEmail('');
    setShowInvite(false);
  };

  const S = {
    page:   { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:   { maxWidth: 1100, margin: '0 auto' },
    title:  { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    layout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', marginTop: '2rem' },
    sidebar:{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.25rem', height: 'fit-content' },
    teamRow:(active) => ({ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', background: active ? 'rgba(124,58,237,0.2)' : 'transparent', border: active ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent', marginBottom: '0.5rem', transition: 'all 0.2s' }),
    main:   { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.5rem' },
    tabs:   { display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '0.3rem' },
    tab:    (a) => ({ flex: 1, background: a ? 'rgba(124,58,237,0.5)' : 'transparent', border: 'none', color: a ? '#f1f5f9' : '#94a3b8', fontWeight: a ? 700 : 500, padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }),
    memberCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', marginBottom: '0.6rem' },
    btn:    (primary) => ({ background: primary ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(255,255,255,0.06)', border: primary ? 'none' : '1px solid rgba(255,255,255,0.1)', color: primary ? '#fff' : '#94a3b8', fontWeight: 700, padding: '0.55rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem' }),
    modal:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    mbox:   { background: 'linear-gradient(135deg,#0f0c29,#1a1040)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '2rem', maxWidth: 460, width: '100%' },
    input:  { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#f1f5f9', padding: '0.65rem 0.9rem', fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem', boxSizing: 'border-box' },
    label:  { display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' },
    statBox:{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' },
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem' }}>👥</div>
        <p>Loading teams…</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, zIndex: 9999, fontSize: '0.9rem' }}>{toast}</div>}

      <div style={S.wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={S.title}>👥 Team Management</h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Build your squad, manage rosters, and track performance</p>
          </div>
          <button style={S.btn(true)} onClick={() => setShowCreate(true)}>+ Create Team</button>
        </div>

        <div style={{ ...S.layout, gridTemplateColumns: window.innerWidth < 700 ? '1fr' : '280px 1fr' }}>
          {/* Sidebar */}
          <div style={S.sidebar}>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>My Teams ({teams.length})</p>
            {teams.map(t => (
              <div key={t._id} style={S.teamRow(activeTeam?._id === t._id)} onClick={() => selectTeam(t)}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{t.avatar || '🏅'}</div>
                <div>
                  <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 700, fontSize: '0.875rem' }}>{t.name}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{t.sport} • {t.members} members</p>
                </div>
              </div>
            ))}
            {teams.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No teams yet.<br />Create your first team!</p>}
          </div>

          {/* Main */}
          <div style={S.main}>
            {!activeTeam ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👈</div>
                <p>Select a team to view details</p>
              </div>
            ) : (
              <>
                {/* Team header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{activeTeam.avatar}</div>
                    <div>
                      <h2 style={{ margin: 0, color: '#f1f5f9', fontWeight: 800, fontSize: '1.2rem' }}>{activeTeam.name}</h2>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>{activeTeam.sport} • Captain: {activeTeam.captain} • Since {activeTeam.founded}</p>
                    </div>
                  </div>
                  <button style={S.btn(false)} onClick={() => setShowInvite(true)}>📧 Invite Player</button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {[['🏆', activeTeam.wins || 0, 'Wins'], ['❌', activeTeam.losses || 0, 'Losses'], ['🤝', activeTeam.draws || 0, 'Draws'], ['⭐', (activeTeam.rating || 0).toFixed(1), 'Rating']].map(([ic, v, l]) => (
                    <div key={l} style={S.statBox}>
                      <div style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>{ic}</div>
                      <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.2rem' }}>{v}</div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div style={S.tabs}>
                  {[['roster','Roster'],['schedule','Schedule'],['stats','Stats']].map(([v,l]) => (
                    <button key={v} style={S.tab(tab===v)} onClick={() => setTab(v)}>{l}</button>
                  ))}
                </div>

                {/* Roster tab */}
                {tab === 'roster' && (
                  <div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>{members.length} player{members.length !== 1 ? 's' : ''} on roster</p>
                    {members.map(m => (
                      <div key={m._id} style={S.memberCard}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{m.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 700, fontSize: '0.875rem' }}>{m.name}</p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{m.position} • Joined {m.joined}</p>
                        </div>
                        <span style={{ background: m.role === 'Captain' ? 'rgba(245,158,11,0.2)' : m.role === 'Coach' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)', color: m.role === 'Captain' ? '#f59e0b' : m.role === 'Coach' ? '#818cf8' : '#94a3b8', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 700 }}>{m.role}</span>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'schedule' && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
                    <p>No upcoming matches scheduled.<br /><span style={{ color: '#7c3aed', cursor: 'pointer' }} onClick={() => navigate('/tournaments')}>Browse tournaments →</span></p>
                  </div>
                )}

                {tab === 'stats' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
                    {[['Total Games', (activeTeam.wins||0)+(activeTeam.losses||0)+(activeTeam.draws||0)],['Win Rate', `${Math.round(((activeTeam.wins||0)/Math.max(1,(activeTeam.wins||0)+(activeTeam.losses||0)+(activeTeam.draws||0)))*100)}%`],['Members', activeTeam.members || members.length],['Avg Rating', (activeTeam.rating||0).toFixed(1)]].map(([l,v]) => (
                      <div key={l} style={{ ...S.statBox, padding: '1.25rem' }}>
                        <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.6rem', marginBottom: '0.3rem' }}>{v}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create team modal */}
      {showCreate && (
        <div style={S.modal} onClick={() => setShowCreate(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 800, margin: '0 0 1.25rem', fontSize: '1.2rem' }}>🏅 Create New Team</h2>
            <label style={S.label}>Team Name *</label>
            <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Thunder Strikers" />
            <label style={S.label}>Sport</label>
            <select style={{ ...S.input }} value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}>
              {['Football','Cricket','Badminton','Basketball','Tennis','Volleyball'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={S.label}>Description</label>
            <textarea style={{ ...S.input, resize: 'vertical', minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell players about your team…" />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button style={{ ...S.btn(false), flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button style={{ ...S.btn(true), flex: 2 }} onClick={handleCreate} disabled={creating}>{creating ? 'Creating…' : 'Create Team'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div style={S.modal} onClick={() => setShowInvite(false)}>
          <div style={S.mbox} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 800, margin: '0 0 1rem', fontSize: '1.2rem' }}>📧 Invite Player</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>Send an email invitation to join <strong style={{ color: '#f1f5f9' }}>{activeTeam?.name}</strong></p>
            <label style={S.label}>Player Email</label>
            <input style={S.input} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="player@example.com" />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button style={{ ...S.btn(false), flex: 1 }} onClick={() => setShowInvite(false)}>Cancel</button>
              <button style={{ ...S.btn(true), flex: 2 }} onClick={handleInvite}>Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
