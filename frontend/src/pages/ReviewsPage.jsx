import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_REVIEWS = [
  { id:1, author:'Jakir Hossain', avatar:'🏀', field:'Mirpur Indoor Stadium', sport:'Basketball', rating:5, date:'2026-06-14', comment:'Absolutely world-class facility. The floor is immaculate and lighting is perfect for games. Will definitely rebook!', verified:true },
  { id:2, author:'Sara Malik', avatar:'🎾', field:'Dhanmondi Tennis Club', sport:'Tennis', rating:4, date:'2026-06-12', comment:'Great courts and staff. The only minor issue was the net height on court 3 was slightly off. Overall a wonderful experience.', verified:true },
  { id:3, author:'Nusrat Jahan', avatar:'🏏', field:'Elite Cricket Centre', sport:'Cricket', rating:5, date:'2026-06-10', comment:'The pitch preparation is outstanding. Our team scored a record here. State-of-the-art pavilion and dressing rooms too.', verified:false },
  { id:4, author:'Rafi Ahmed', avatar:'⚽', field:'Bashundhara Sports Complex', sport:'Football', rating:3, date:'2026-06-08', comment:'Good turf quality but the changing rooms were not very clean on our last visit. Hope they improve the maintenance.', verified:true },
  { id:5, author:'Tanvir Islam', avatar:'🏸', field:'Badminton Arena Dhaka', sport:'Badminton', rating:5, date:'2026-06-05', comment:'Best badminton venue in the city. Six professional courts with excellent shuttle cock service included in the booking.', verified:true },
];

const STAR_STATS = [5,4,3,2,1].map(s => ({ stars:s, count: MOCK_REVIEWS.filter(r => Math.floor(r.rating) === s).length }));
const avgRating = (MOCK_REVIEWS.reduce((s,r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);

function StarRow({ n, filled }) {
  return (
    <div style={{ display:'flex', gap:'2px' }}>
      {Array.from({ length:5 }, (_,i) => (
        <span key={i} style={{ color: i < (filled ?? n) ? '#FBBF24' : 'rgba(255,255,255,0.12)', fontSize:'0.85rem' }}>★</span>
      ))}
    </div>
  );
}
StarRow.propTypes = { n: PropTypes.number, filled: PropTypes.number };

function ReviewCard({ review }) {
  return (
    <article style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.4rem 1.5rem', backdropFilter:'blur(14px)', transition:'border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(251,191,36,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
      <div style={{ display:'flex', gap:'0.85rem', marginBottom:'0.85rem' }}>
        <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>{review.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ color:'#f0f6ff', fontWeight:700, fontSize:'0.9rem' }}>{review.author}</span>
            {review.verified && (
              <span style={{ display:'flex', alignItems:'center', gap:'0.2rem', color:'#7dd3fc', fontSize:'0.68rem', fontWeight:700 }}>
                <span className="material-symbols-outlined" style={{ fontSize:'0.75rem' }}>verified</span>
                <span>Verified</span>
              </span>
            )}
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.1rem' }}>{review.field} · {review.date}</div>
        </div>
        <StarRow filled={review.rating} />
      </div>
      <p style={{ color:'#c8d8ea', fontSize:'0.9rem', lineHeight:1.65, margin:0 }}>{review.comment}</p>
      <div style={{ marginTop:'0.85rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <span style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.12)', color:'#506070', padding:'0.1rem 0.55rem', borderRadius:'999px', fontSize:'0.72rem' }}>{review.sport}</span>
      </div>
    </article>
  );
}
ReviewCard.propTypes = {
  review: PropTypes.shape({ id:PropTypes.number, author:PropTypes.string, avatar:PropTypes.string, field:PropTypes.string, sport:PropTypes.string, rating:PropTypes.number, date:PropTypes.string, comment:PropTypes.string, verified:PropTypes.bool }).isRequired,
};

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter]   = useState(0);
  const [draft, setDraft]     = useState('');
  const [draftRating, setDraftRating] = useState(5);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/reviews');
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setReviews(data.data ?? data);
      } catch {
        setReviews(MOCK_REVIEWS);
      }
    };
    load();
  }, []);

  const displayed = filter === 0 ? reviews : reviews.filter(r => Math.floor(r.rating) === filter);

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Community Voice</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.4rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Reviews & Ratings</h1>
        </div>

        {/* Summary */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'2rem', marginBottom:'1.5rem', backdropFilter:'blur(14px)', display:'grid', gridTemplateColumns:'auto 1fr', gap:'2.5rem', alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'4rem', color:'#FBBF24', lineHeight:1 }}>{avgRating}</div>
            <StarRow filled={Math.round(Number(avgRating))} />
            <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.4rem' }}>{MOCK_REVIEWS.length} reviews</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {STAR_STATS.map(({ stars, count }) => (
              <div key={stars} style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.75rem', color:'#506070', width:'8px', textAlign:'right' }}>{stars}</span>
                <span style={{ color:'#FBBF24', fontSize:'0.8rem' }}>★</span>
                <div style={{ flex:1, height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(count/MOCK_REVIEWS.length)*100}%`, background:'#FBBF24', borderRadius:'999px', transition:'width 0.6s ease' }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#506070', width:'16px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write review */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(251,191,36,0.1)', borderRadius:'16px', padding:'1.5rem', marginBottom:'1.5rem', backdropFilter:'blur(14px)' }}>
          <h3 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.95rem', color:'#f0f6ff', marginBottom:'0.85rem' }}>Leave a Review</h3>
          <div style={{ display:'flex', gap:'0.3rem', marginBottom:'0.85rem' }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setDraftRating(s)}
                style={{ background:'none', border:'none', cursor:'pointer', color: s <= draftRating ? '#FBBF24' : 'rgba(255,255,255,0.15)', fontSize:'1.5rem', padding:'0.15rem', transition:'color 0.15s' }}>★</button>
            ))}
          </div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Share your experience…"
            style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#f0f6ff', fontSize:'0.88rem', fontFamily:"'Inter',sans-serif", resize:'none', height:'72px', lineHeight:1.6, padding:'0.6rem 0.75rem', outline:'none', boxSizing:'border-box' }} />
          <button disabled={!draft.trim()} style={{ marginTop:'0.65rem', padding:'0.55rem 1.5rem', background: draft.trim() ? '#FBBF24' : 'rgba(251,191,36,0.15)', color: draft.trim() ? '#111111' : '#506070', border:'none', borderRadius:'10px', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.85rem', cursor: draft.trim() ? 'pointer' : 'not-allowed', transition:'all 0.15s' }}>
            Submit Review
          </button>
        </div>

        {/* Filter */}
        <div style={{ display:'flex', gap:'0.45rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          {[0,5,4,3].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding:'0.35rem 0.9rem', borderRadius:'999px', border:'1px solid', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', background: filter === s ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)', color: filter === s ? '#FBBF24' : '#506070', borderColor: filter === s ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.18s' }}>
              {s === 0 ? 'All' : `${s}★`}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {displayed.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
