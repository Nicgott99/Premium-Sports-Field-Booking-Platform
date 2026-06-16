import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_CONTACTS = [
  { id:1, name:'Bashundhara SC Admin', avatar:'🏟️', role:'Venue', lastMsg:'Your booking for Sunday is confirmed!', time:'10:24', unread:2, online:true },
  { id:2, name:'Coach Rahim', avatar:'🧑‍🏫', role:'Coach', lastMsg:'See you at 6PM for practice', time:'09:45', unread:0, online:true },
  { id:3, name:'Team Falcon', avatar:'🦅', role:'Team', lastMsg:'Match rescheduled to 7PM', time:'Yesterday', unread:1, online:false },
  { id:4, name:'Dhanmondi Tennis Club', avatar:'🎾', role:'Venue', lastMsg:'Court 2 maintenance complete', time:'Yesterday', unread:0, online:false },
  { id:5, name:'Tanvir Islam', avatar:'🏸', role:'Player', lastMsg:'GG! Same time next week?', time:'Mon', unread:0, online:true },
];

const MOCK_MESSAGES = {
  1: [
    { id:1, from:'them', text:'Hello! Your booking for Bashundhara SC — Football (Sunday June 22, 5PM-7PM) is confirmed.', time:'10:20' },
    { id:2, from:'them', text:'Please arrive 15 mins early for field preparation. Changing rooms available.', time:'10:21' },
    { id:3, from:'me',   text:'Thanks! Will there be bibs available?', time:'10:23' },
    { id:4, from:'them', text:'Your booking for Sunday is confirmed! And yes, we provide bibs for teams up to 14 players.', time:'10:24' },
  ],
  2: [
    { id:1, from:'them', text:'Training session tomorrow at Mirpur Indoor Stadium', time:'09:40' },
    { id:2, from:'me',   text:'Perfect. What should I bring?', time:'09:42' },
    { id:3, from:'them', text:'See you at 6PM for practice. Bring your own shoes and water.', time:'09:45' },
  ],
  3: [
    { id:1, from:'them', text:'Team meeting — we need to discuss formation', time:'Tue 8PM' },
    { id:2, from:'me',   text:'Agreed. 4-3-3 or 4-4-2?', time:'Tue 8PM' },
    { id:3, from:'them', text:'Match rescheduled to 7PM, same venue', time:'Yesterday' },
  ],
};

function ContactRow({ contact, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ width:'100%', textAlign:'left', display:'block', padding:'0.85rem 1rem', background: selected ? 'rgba(251,191,36,0.07)' : 'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.15s' }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background='transparent'; }}>
      <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{ width:'42px', height:'42px', borderRadius:'50%', background: selected ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)', border:`1px solid ${selected ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>{contact.avatar}</div>
          {contact.online && <div style={{ position:'absolute', bottom:1, right:1, width:'10px', height:'10px', borderRadius:'50%', background:'#22d3ee', border:'2px solid #051424' }} />}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'#f0f6ff', fontWeight:700, fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{contact.name}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.65rem', flexShrink:0, marginLeft:'0.4rem' }}>{contact.time}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.15rem' }}>
            <span style={{ color:'#506070', fontSize:'0.78rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{contact.lastMsg}</span>
            {contact.unread > 0 && <span style={{ background:'#FBBF24', color:'#111111', borderRadius:'999px', fontSize:'0.65rem', fontWeight:900, minWidth:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:'0.4rem', flexShrink:0, padding:'0 4px' }}>{contact.unread}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
ContactRow.propTypes = {
  contact: PropTypes.shape({ id:PropTypes.number, name:PropTypes.string, avatar:PropTypes.string, role:PropTypes.string, lastMsg:PropTypes.string, time:PropTypes.string, unread:PropTypes.number, online:PropTypes.bool }).isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

function MsgBubble({ msg }) {
  const isMe = msg.from === 'me';
  return (
    <div style={{ display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom:'0.6rem' }}>
      <div style={{ maxWidth:'70%', background: isMe ? 'rgba(251,191,36,0.15)' : 'rgba(13,28,45,0.9)', border: isMe ? '1px solid rgba(251,191,36,0.22)' : '1px solid rgba(255,255,255,0.08)', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding:'0.6rem 0.85rem' }}>
        <p style={{ margin:0, color: isMe ? '#e8ffb0' : '#c8d8ea', fontSize:'0.88rem', lineHeight:1.55 }}>{msg.text}</p>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.62rem', color:'#506070', marginTop:'0.25rem', textAlign: isMe ? 'right' : 'left' }}>{msg.time}</div>
      </div>
    </div>
  );
}
MsgBubble.propTypes = {
  msg: PropTypes.shape({ id:PropTypes.number, from:PropTypes.string, text:PropTypes.string, time:PropTypes.string }).isRequired,
};

const ChatMessaging = () => {
  const [activeId, setActiveId] = useState(1);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const endRef = useRef(null);

  const contact = MOCK_CONTACTS.find(c => c.id === activeId);
  const msgs = messages[activeId] ?? [];
  const filtered = MOCK_CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs.length]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = { id: Date.now(), from:'me', text, time: new Date().toLocaleTimeString('en-BD', { hour:'2-digit', minute:'2-digit' }) };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setInput('');
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'2rem' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ marginBottom:'1.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Inbox</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.6rem,3.5vw,2.2rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Messages</h1>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'1rem', height:'calc(100vh - 220px)', minHeight:'500px' }}>

          {/* Sidebar */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', backdropFilter:'blur(14px)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'0.85rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ position:'relative' }}>
                <span className="material-symbols-outlined" style={{ position:'absolute', left:'0.6rem', top:'50%', transform:'translateY(-50%)', fontSize:'1rem', color:'#506070' }}>search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…"
                  style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#f0f6ff', fontSize:'0.82rem', fontFamily:"'Inter',sans-serif", padding:'0.45rem 0.75rem 0.45rem 2rem', outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {filtered.map(c => <ContactRow key={c.id} contact={c} selected={c.id === activeId} onClick={() => setActiveId(c.id)} />)}
            </div>
          </div>

          {/* Chat window */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', backdropFilter:'blur(14px)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Header */}
            {contact && (
              <div style={{ padding:'0.85rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>{contact.avatar}</div>
                <div>
                  <div style={{ color:'#f0f6ff', fontWeight:700, fontSize:'0.95rem' }}>{contact.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    {contact.online && <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#22d3ee' }} />}
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", color: contact.online ? '#22d3ee' : '#506070', fontSize:'0.68rem' }}>{contact.online ? 'Online' : 'Offline'}</span>
                    <span style={{ color:'#506070', fontSize:'0.68rem' }}>· {contact.role}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'1.25rem' }}>
              {msgs.map(m => <MsgBubble key={m.id} msg={m} />)}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'0.85rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'0.65rem', alignItems:'flex-end', flexShrink:0 }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Type a message…" rows={1}
                style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#f0f6ff', fontSize:'0.88rem', fontFamily:"'Inter',sans-serif", padding:'0.6rem 0.85rem', outline:'none', resize:'none', lineHeight:1.5, maxHeight:'100px', overflowY:'auto' }} />
              <button onClick={send} disabled={!input.trim()}
                style={{ width:'40px', height:'40px', borderRadius:'50%', background: input.trim() ? '#FBBF24' : 'rgba(251,191,36,0.1)', border:'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'1.1rem', color: input.trim() ? '#111111' : '#506070' }}>send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessaging;
