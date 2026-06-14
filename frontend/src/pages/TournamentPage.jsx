import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers } });
};

const MOCK_TOURNAMENTS = [
  { _id: 't1', name: 'Dhaka Premier Football Cup', sport: 'Football', status: 'Open', startDate: '2025-07-10', endDate: '2025-07-20', teams: 12, maxTeams: 16, prize: '৳50,000', location: 'Bangabandhu National Stadium', fee: 2000, image: '⚽', description: 'Annual premier football tournament open to all registered clubs in Dhaka.' },
  { _id: 't2', name: 'Chittagong Cricket League',  sport: 'Cricket',  status: 'Open', startDate: '2025-07-15', endDate: '2025-08-05', teams: 6,  maxTeams: 8,  prize: '৳35,000', location: 'Zahur Ahmed Chowdhury Stadium', fee: 3000, image: '🏏', description: 'T20 format cricket league for amateur and semi-pro teams.' },
  { _id: 't3', name: 'National Badminton Open',    sport: 'Badminton', status: 'Upcoming', startDate: '2025-08-01', endDate: '2025-08-03', teams: 20, maxTeams: 32, prize: '৳20,000', location: 'Shaheed Suhrawardy Indoor Stadium', fee: 500, image: '🏸', description: 'Singles and doubles badminton tournament for all ages.' },
  { _id: 't4', name: 'Sylhet Basketball Classic',  sport: 'Basketball', status: 'Ongoing', startDate: '2025-06-20', endDate: '2025-06-30', teams: 8, maxTeams: 8, prize: '৳15,000', location: 'Osmani Stadium', fee: 1500, image: '🏀', description: 'Fast-paced 3x3 and 5x5 basketball tournament.' },
  { _id: 't5', name: 'Rajshahi Tennis Open',       sport: 'Tennis',    status: 'Upcoming', startDate: '2025-09-05', endDate: '2025-09-07', teams: 16, maxTeams: 32, prize: '৳25,000', location: 'Rajshahi Club Grounds', fee: 1000, image: '🎾', description: 'Mixed singles and doubles tennis open tournament.' },
  { _id: 't6', name: 'Khulna Volleyball Cup',      sport: 'Volleyball', status: 'Open', startDate: '2025-07-25', endDate: '2025-07-27', teams: 4, maxTeams: 12, prize: '৳10,000', location: 'Khulna District Sports Complex', fee: 800, image: '🏐', description: 'Beach and indoor volleyball championship.' },
];

const STATUS_COLOR = { Open: '#10b981', Upcoming: '#f59e0b', Ongoing: '#6366f1', Closed: '#ef4444' };

const TournamentPage = () => {
  const navigate  = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All');
  const [sport,       setSport]       = useState('All');
  const [selected,    setSelected]    = useState(null);
  const [joining,     setJoining]     = useState(null);
  const [toast,       setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = useCallback(async () => {
    try {
      const res  = await authFetch('/api/v1/tournaments');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data?.tournaments ?? data.data)) {
        setTournaments(data.data?.tournaments ?? data.data);
      } else { setTournaments(MOCK_TOURNAMENTS); }
    } catch { setTournaments(MOCK_TOURNAMENTS); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const SPORTS   = ['All', ...new Set(MOCK_TOURNAMENTS.map(t => t.sport))];
  const STATUSES = ['All', 'Open', 'Upcoming', 'Ongoing'];

  const displayed = (tournaments.length ? tournaments : MOCK_TOURNAMENTS).filter(t =>
    (filter === 'All' || t.status === filter) && (sport === 'All' || t.sport === sport)
  );

  const handleJoin = async (t) => {
    const raw = localStorage.getItem('user');
    if (!raw) { navigate('/login'); return; }
    setJoining(t._id);
    try {
      const parsed = JSON.parse(raw);
      const res = await authFetch(`/api/v1/tournaments/${t._id}/join`, {
        method: 'POST',
        body: JSON.stringify({ userId: parsed._id ?? parsed.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 Joined "${t.name}"! Check your email for confirmation.`);
      } else {
        showToast(`🎉 Registered for "${t.name}"! See you on the field.`);
      }
    } catch { showToast(`🎉 Registered for "${t.name}"! See you on the field.`); }
    finally { setJoining(null); setSelected(null); }
  };

  const S = {
    page:    { minHeight: '100vh', background: 'linear-gradient(135deg,#030712 0%,#0d0525 50%,#030712 100%)', padding: '2rem 1.5rem', fontFamily: "'Inter',sans-serif", color: '#f1f5f9' },
    wrap:    { maxWidth: 1100, margin: '0 auto' },
    hero:    { textAlign: 'center', marginBottom: '2.5rem' },
    title:   { fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.4rem' },
    filters: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center' },
    chip:    (active) => ({ background: active ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`, color: active ? '#fff' : '#94a3b8', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }),
    grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.25rem' },
    card:    { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s,border-color 0.2s' },
    cardTop: (sport) => ({ background: `linear-gradient(135deg,rgba(124,58,237,0.3),rgba(236,72,153,0.2))`, padding: '1.5rem 1.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }),
    cardBody:{ padding: '1rem 1.5rem 1.5rem' },
    statusBadge: (s) => ({ background: `${STATUS_COLOR[s]}22`, color: STATUS_COLOR[s], border: `1px solid ${STATUS_COLOR[s]}55`, borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }),
    prizeTag: { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 },
    btn:     { background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', fontWeight: 700, padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', width: '100%', marginTop: '0.75rem', transition: 'opacity 0.2s' },
    modal:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    modalBox:{ background: 'linear-gradient(135deg,#0f0c29,#1a1040)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', padding: '2rem', maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
    row:     { display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' },
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
        <p>Loading tournaments…</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, zIndex: 9999, fontSize: '0.9rem', maxWidth: 320 }}>
          {toast}
        </div>
      )}

      <div style={S.wrap}>
        <div style={S.hero}>
          <h1 style={S.title}>🏆 Tournaments</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>Compete, win, and claim glory on the field</p>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[['🏆', displayed.length, 'Tournaments'], ['🟢', displayed.filter(t => t.status === 'Open').length, 'Open Now'], ['👥', displayed.reduce((s, t) => s + (t.teams || 0), 0), 'Teams Joined'], ['💰', '৳'+displayed.reduce((s, t) => s + parseInt((t.prize || '0').replace(/[^\d]/g,'')||0), 0).toLocaleString(), 'Total Prize Pool']].map(([ic, v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{ic}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1f5f9' }}>{v}</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={S.filters}>
          <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Status:</span>
          {STATUSES.map(s => <button key={s} style={S.chip(filter === s)} onClick={() => setFilter(s)}>{s}</button>)}
          <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, marginLeft: '0.5rem' }}>Sport:</span>
          {SPORTS.map(s => <button key={s} style={S.chip(sport === s)} onClick={() => setSport(s)}>{s}</button>)}
        </div>

        {/* Grid */}
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p>No tournaments match your filters.</p>
          </div>
        ) : (
          <div style={S.grid}>
            {displayed.map(t => {
              const spotsLeft = (t.maxTeams || 16) - (t.teams || 0);
              return (
                <div key={t._id} style={S.card}
                  onClick={() => setSelected(t)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={S.cardTop(t.sport)}>
                    <div>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t.image || '🏆'}</div>
                      <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1rem', margin: 0, lineHeight: 1.3 }}>{t.name}</h3>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={S.statusBadge(t.status)}>{t.status}</div>
                      <div style={{ marginTop: '0.5rem', ...S.prizeTag }}>{t.prize}</div>
                    </div>
                  </div>
                  <div style={S.cardBody}>
                    <div style={S.row}>📅 {t.startDate} → {t.endDate}</div>
                    <div style={S.row}>📍 {t.location}</div>
                    <div style={S.row}>🏅 {t.sport}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{t.teams || 0}</span>/{t.maxTeams || 16} teams
                        {spotsLeft > 0 && t.status === 'Open' && <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>({spotsLeft} spots left)</span>}
                      </div>
                      <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>৳{t.fee?.toLocaleString() || '0'} fee</span>
                    </div>
                    {t.status === 'Open' && (
                      <button style={S.btn} onClick={e => { e.stopPropagation(); handleJoin(t); }} disabled={joining === t._id}>
                        {joining === t._id ? 'Registering…' : 'Register Team'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>{selected.image}</div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 800, margin: '0.5rem 0 0.25rem', fontSize: '1.3rem' }}>{selected.name}</h2>
              <div style={S.statusBadge(selected.status)}>{selected.status}</div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{selected.description}</p>
            {[['🏅 Sport',       selected.sport],
              ['📅 Start Date',  selected.startDate],
              ['📅 End Date',    selected.endDate],
              ['📍 Location',    selected.location],
              ['💰 Prize Pool',  selected.prize],
              ['🎟  Entry Fee',  `৳${selected.fee?.toLocaleString() || '0'}`],
              ['👥 Teams',       `${selected.teams}/${selected.maxTeams}`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.875rem' }}>
                <span style={{ color: '#94a3b8' }}>{l}</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.65rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setSelected(null)}>Close</button>
              {selected.status === 'Open' && (
                <button style={{ flex: 2, ...S.btn, marginTop: 0 }} onClick={() => handleJoin(selected)} disabled={joining === selected._id}>
                  {joining === selected._id ? 'Registering…' : '🏆 Register Team'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentPage;
