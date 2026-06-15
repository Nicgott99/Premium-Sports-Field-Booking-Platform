import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_NEWS = [
  { id:1, headline:'Bashundhara Kings clinch record 6th consecutive BPL title', sport:'Football', category:'League', date:'2026-06-15', readTime:3, summary:'Bashundhara Kings secured their historic sixth consecutive Bangladesh Premier League title with a dominant 3-0 victory over Dhaka Abahani at the Bangabandhu National Stadium.', author:'Dhaka Sports Desk', featured:true, image:'🏆' },
  { id:2, headline:'New 12-pitch cricket complex to open in Mirpur by December', sport:'Cricket', category:'Infrastructure', date:'2026-06-14', readTime:4, summary:'The Bangladesh Cricket Board has announced the construction of a state-of-the-art 12-pitch cricket training complex in Mirpur, set to open in December 2026.', author:'Cricket BD', featured:true, image:'🏏' },
  { id:3, headline:'Aryan Khan breaks national 400m record at Dhaka Athletics Championship', sport:'Athletics', category:'Achievement', date:'2026-06-13', readTime:2, summary:'Young sprinter Aryan Khan shattered the national 400m record with a stunning time of 44.82 seconds at the Dhaka Athletics Championship.', author:'Sports Today', featured:false, image:'🏃' },
  { id:4, headline:'Bangladesh to host AFC U-20 Championship qualifiers in August', sport:'Football', category:'Tournament', date:'2026-06-12', readTime:3, summary:'Bangladesh Football Federation confirmed that Dhaka will host the AFC U-20 Championship qualification group stage in August 2026, marking a major milestone for local football.', author:'BFF Media', featured:false, image:'⚽' },
  { id:5, headline:'Smash Open tennis tournament draws 200+ entries from 8 countries', sport:'Tennis', category:'Tournament', date:'2026-06-11', readTime:2, summary:'The 3rd edition of the Smash Open International Tennis Tournament has received an unprecedented 200+ entries from players across 8 countries.', author:'Tennis BD', featured:false, image:'🎾' },
  { id:6, headline:'Dhaka Badminton Association launches free youth academy in Gulshan', sport:'Badminton', category:'Community', date:'2026-06-10', readTime:3, summary:'The Dhaka Badminton Association launched a free youth training academy in Gulshan targeting players aged 8-16, with BWF-certified coaches providing professional coaching.', author:'Sports Weekly', featured:false, image:'🏸' },
  { id:7, headline:'Premium Sports Field Booking hits 50,000 registered users milestone', sport:'Platform', category:'Milestone', date:'2026-06-09', readTime:2, summary:'The city\'s leading sports booking platform celebrated its 50,000 registered user milestone with special discounts and a community event at Bashundhara Sports Complex.', author:'Tech & Sports', featured:false, image:'📱' },
];

const CATEGORY_COLORS = {
  League:       { color:'#c3f400', bg:'rgba(195,244,0,0.1)',  border:'rgba(195,244,0,0.2)'  },
  Infrastructure:{ color:'#7dd3fc', bg:'rgba(125,211,252,0.1)', border:'rgba(125,211,252,0.2)' },
  Achievement:  { color:'#ff5e07', bg:'rgba(255,94,7,0.1)',   border:'rgba(255,94,7,0.2)'   },
  Tournament:   { color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.2)' },
  Community:    { color:'#22d3ee', bg:'rgba(34,211,238,0.1)', border:'rgba(34,211,238,0.2)' },
  Milestone:    { color:'#fb923c', bg:'rgba(251,146,60,0.1)', border:'rgba(251,146,60,0.2)' },
};

const SPORTS_FILTER = ['All', 'Football', 'Cricket', 'Tennis', 'Badminton', 'Athletics', 'Platform'];

function NewsCard({ article, featured }) {
  const cc = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.Milestone;
  return (
    <article style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding: featured ? '1.75rem' : '1.25rem', backdropFilter:'blur(14px)', transition:'border-color 0.2s, transform 0.2s', display:'flex', flexDirection:'column', gap:'0.75rem' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(195,244,0,0.18)'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.transform='none'; }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.75rem' }}>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <span style={{ background:cc.bg, border:`1px solid ${cc.border}`, color:cc.color, padding:'0.12rem 0.6rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:800 }}>{article.category}</span>
          <span style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#506070', padding:'0.12rem 0.6rem', borderRadius:'999px', fontSize:'0.68rem', fontWeight:700 }}>{article.sport}</span>
        </div>
        <span style={{ fontSize: featured ? '2rem' : '1.4rem', flexShrink:0 }}>{article.image}</span>
      </div>
      <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize: featured ? '1.2rem' : '0.95rem', color:'#f0f6ff', margin:0, lineHeight:1.35, letterSpacing:'-0.01em' }}>{article.headline}</h2>
      <p style={{ color:'#8ba3be', fontSize: featured ? '0.9rem' : '0.82rem', lineHeight:1.6, margin:0 }}>{article.summary}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:'0.5rem', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ color:'#506070', fontSize:'0.75rem' }}>{article.author}</span>
        <div style={{ display:'flex', gap:'0.85rem', alignItems:'center' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem' }}>{article.date}</span>
          <span style={{ display:'flex', alignItems:'center', gap:'0.25rem', color:'#506070', fontSize:'0.7rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'0.8rem' }}>schedule</span>
            <span>{article.readTime}m read</span>
          </span>
        </div>
      </div>
    </article>
  );
}
NewsCard.propTypes = {
  article: PropTypes.shape({ id:PropTypes.number, headline:PropTypes.string, sport:PropTypes.string, category:PropTypes.string, date:PropTypes.string, readTime:PropTypes.number, summary:PropTypes.string, author:PropTypes.string, featured:PropTypes.bool, image:PropTypes.string }).isRequired,
  featured: PropTypes.bool,
};

const SportsNewsPage = () => {
  const [news, setNews] = useState([]);
  const [sport, setSport] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/news');
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setNews(data.data ?? data);
      } catch {
        setNews(MOCK_NEWS);
      }
    };
    load();
  }, []);

  const filtered = sport === 'All' ? news : news.filter(a => a.sport === sport);
  const featured  = filtered.filter(a => a.featured);
  const regular   = filtered.filter(a => !a.featured);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Latest Updates</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.8rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Sports News</h1>
        </div>

        <div style={{ display:'flex', gap:'0.45rem', marginBottom:'1.75rem', justifyContent:'center', flexWrap:'wrap' }}>
          {SPORTS_FILTER.map(s => (
            <button key={s} onClick={() => setSport(s)}
              style={{ padding:'0.38rem 1rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', background: sport === s ? 'rgba(195,244,0,0.15)' : 'rgba(255,255,255,0.04)', color: sport === s ? '#c3f400' : '#506070', borderColor: sport === s ? 'rgba(195,244,0,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>{s}</button>
          ))}
        </div>

        {featured.length > 0 && (
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem' }}>Featured</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'1rem' }}>
              {featured.map(a => <NewsCard key={a.id} article={a} featured />)}
            </div>
          </div>
        )}

        {regular.length > 0 && (
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem' }}>Latest Stories</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
              {regular.map(a => <NewsCard key={a.id} article={a} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'4rem 0', color:'#506070' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'3rem', display:'block', marginBottom:'0.75rem' }}>newspaper</span>
            <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:700, fontSize:'1rem' }}>No news for this sport yet</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SportsNewsPage;
