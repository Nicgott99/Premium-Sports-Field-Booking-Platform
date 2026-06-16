import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_POSTS = [
  { id:1, author:'Rafi Ahmed', avatar:'🏃', sport:'Football', time:'2m ago', content:'Just booked the Bashundhara turf for Sunday 6PM — anyone want to join? Need 4 more players!', likes:24, comments:8, tags:['#Football','#Dhaka'], type:'invite' },
  { id:2, author:'Sara Malik', avatar:'🎾', sport:'Tennis', time:'15m ago', content:'Won my first singles match at Dhanmondi Tennis Club. The courts are in perfect condition this season!', likes:41, comments:12, tags:['#Tennis','#Win'], type:'achievement' },
  { id:3, author:'Jakir Hossain', avatar:'🏀', sport:'Basketball', time:'1h ago', content:'Mirpur Indoor is running a 3v3 tournament next weekend. Registration closes Friday — ৳500 entry per team.', likes:67, comments:19, tags:['#Basketball','#Tournament'], type:'event' },
  { id:4, author:'Nusrat Jahan', avatar:'🏏', sport:'Cricket', time:'3h ago', content:'Our team hit a new record — 186 runs in the Rajshahi indoor session! The pitch setup at Elite Cricket Centre is top tier.', likes:89, comments:31, tags:['#Cricket','#Record'], type:'achievement' },
  { id:5, author:'Tanvir Islam', avatar:'⚽', sport:'Football', time:'5h ago', content:'Looking for a goalkeeper for our Saturday league. Experience preferred but beginners welcome. DM me!', likes:15, comments:22, tags:['#Football','#LookingForPlayer'], type:'invite' },
];

const TYPE_COLORS = { invite:'#FBBF24', achievement:'#ff5e07', event:'#7dd3fc' };
const TYPE_ICONS  = { invite:'group_add', achievement:'emoji_events', event:'event' };

function PostCard({ post, onLike, liked }) {
  return (
    <article style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.4rem 1.5rem', backdropFilter:'blur(14px)', transition:'border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(251,191,36,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
      <div style={{ display:'flex', gap:'0.85rem', marginBottom:'0.85rem' }}>
        <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>{post.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ color:'#f0f6ff', fontWeight:700, fontSize:'0.9rem' }}>{post.author}</span>
            <span style={{ background:`rgba(${post.type === 'invite' ? '195,244,0' : post.type === 'achievement' ? '255,94,7' : '125,211,252'},0.1)`, border:`1px solid rgba(${post.type === 'invite' ? '195,244,0' : post.type === 'achievement' ? '255,94,7' : '125,211,252'},0.25)`, color: TYPE_COLORS[post.type], padding:'0.1rem 0.5rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'0.75rem' }}>{TYPE_ICONS[post.type]}</span>
              <span>{post.type}</span>
            </span>
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.15rem' }}>{post.sport} · {post.time}</div>
        </div>
      </div>
      <p style={{ color:'#c8d8ea', fontSize:'0.92rem', lineHeight:1.6, marginBottom:'0.85rem' }}>{post.content}</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', marginBottom:'1rem' }}>
        {post.tags.map(t => <span key={t} style={{ color:'#FBBF24', fontSize:'0.75rem', fontFamily:"'JetBrains Mono',monospace" }}>{t}</span>)}
      </div>
      <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
        <button onClick={() => onLike(post.id)} style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'none', border:'none', cursor:'pointer', color: liked ? '#FBBF24' : '#506070', fontSize:'0.85rem', fontWeight:600, padding:0, transition:'color 0.15s' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'1.1rem' }}>{liked ? 'favorite' : 'favorite_border'}</span>
          <span>{post.likes + (liked ? 1 : 0)}</span>
        </button>
        <button style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'none', border:'none', cursor:'pointer', color:'#506070', fontSize:'0.85rem', fontWeight:600, padding:0 }}>
          <span className="material-symbols-outlined" style={{ fontSize:'1.1rem' }}>chat_bubble_outline</span>
          <span>{post.comments}</span>
        </button>
        <button style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'none', border:'none', cursor:'pointer', color:'#506070', fontSize:'0.85rem', fontWeight:600, padding:0, marginLeft:'auto' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'1.1rem' }}>share</span>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}
PostCard.propTypes = {
  post: PropTypes.shape({ id:PropTypes.number, author:PropTypes.string, avatar:PropTypes.string, sport:PropTypes.string, time:PropTypes.string, content:PropTypes.string, likes:PropTypes.number, comments:PropTypes.number, tags:PropTypes.arrayOf(PropTypes.string), type:PropTypes.string }).isRequired,
  onLike: PropTypes.func.isRequired,
  liked: PropTypes.bool.isRequired,
};

const FILTERS = ['All', 'Football', 'Basketball', 'Tennis', 'Cricket'];

const CommunityFeed = () => {
  const [posts, setPosts]       = useState([]);
  const [filter, setFilter]     = useState('All');
  const [likedIds, setLikedIds] = useState(new Set());
  const [draft, setDraft]       = useState('');
  const [posting, setPosting]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/v1/community/posts');
        const data = await res.json();
        if (!res.ok) throw new Error('api');
        setPosts(data.data ?? data);
      } catch {
        setPosts(MOCK_POSTS);
      }
    };
    load();
  }, []);

  const handleLike = (id) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handlePost = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/v1/community/posts', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ content: draft }) });
    } finally {
      setPosting(false);
      setDraft('');
    }
  };

  const filtered = filter === 'All' ? posts : posts.filter(p => p.sport === filter);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Social Hub</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.4rem 0 0', letterSpacing:'-0.02em' }}>Community Feed</h1>
        </div>

        {/* Compose */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(251,191,36,0.12)', borderRadius:'16px', padding:'1.25rem', marginBottom:'1.5rem', backdropFilter:'blur(14px)' }}>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Share a match result, invite players, or post an event…"
            style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:'#f0f6ff', fontSize:'0.92rem', fontFamily:"'Inter',sans-serif", resize:'none', height:'72px', lineHeight:1.6, boxSizing:'border-box' }} />
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'0.5rem' }}>
            <button onClick={handlePost} disabled={posting || !draft.trim()}
              style={{ background: draft.trim() ? '#FBBF24' : 'rgba(251,191,36,0.15)', color: draft.trim() ? '#111111' : '#506070', border:'none', borderRadius:'10px', padding:'0.5rem 1.25rem', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.85rem', cursor: draft.trim() ? 'pointer' : 'not-allowed', transition:'all 0.15s' }}>
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>

        {/* Sport filter chips */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'0.38rem 1rem', borderRadius:'999px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', border:'1px solid', background: filter === f ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f ? '#FBBF24' : '#506070', borderColor: filter === f ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {filtered.map(post => (
            <PostCard key={post.id} post={post} onLike={handleLike} liked={likedIds.has(post.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityFeed;
