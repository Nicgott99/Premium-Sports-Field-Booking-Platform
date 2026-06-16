import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MOCK_WALLET = {
  balance: 12450,
  points: 3280,
  totalSpent: 38600,
  totalTopUp: 51050,
  transactions: [
    { id:1, type:'debit',  desc:'Bashundhara SC — Football',     amount:1800, date:'2026-06-15', status:'completed' },
    { id:2, type:'credit', desc:'Top-up via bKash',              amount:5000, date:'2026-06-14', status:'completed' },
    { id:3, type:'debit',  desc:'Mirpur Indoor — Basketball',    amount:1200, date:'2026-06-12', status:'completed' },
    { id:4, type:'credit', desc:'Loyalty cashback',              amount:320,  date:'2026-06-10', status:'completed' },
    { id:5, type:'debit',  desc:'Dhanmondi Tennis Club',         amount:950,  date:'2026-06-08', status:'refunded' },
    { id:6, type:'credit', desc:'Refund — Tennis booking',       amount:950,  date:'2026-06-09', status:'completed' },
    { id:7, type:'debit',  desc:'Elite Cricket Centre',          amount:2400, date:'2026-06-05', status:'completed' },
  ],
};

const TOPUP_OPTIONS = [500, 1000, 2000, 5000];
const STATUS_STYLE = {
  completed:{ color:'#FBBF24', bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.2)' },
  refunded: { color:'#7dd3fc', bg:'rgba(125,211,252,0.1)', border:'rgba(125,211,252,0.2)' },
};

function TxRow({ tx }) {
  const isCredit = tx.type === 'credit';
  const st = STATUS_STYLE[tx.status] ?? STATUS_STYLE.completed;
  return (
    <article style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.9rem 1rem', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: isCredit ? 'rgba(251,191,36,0.1)' : 'rgba(255,94,7,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span className="material-symbols-outlined" style={{ fontSize:'1rem', color: isCredit ? '#FBBF24' : '#ff5e07' }}>{isCredit ? 'add_circle' : 'remove_circle'}</span>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ color:'#c8d8ea', fontSize:'0.88rem', fontWeight:600 }}>{tx.desc}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', marginTop:'0.15rem' }}>{tx.date}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color: isCredit ? '#FBBF24' : '#ff5e07' }}>
          {isCredit ? '+' : '-'}৳{tx.amount.toLocaleString()}
        </div>
        <span style={{ fontSize:'0.68rem', padding:'0.1rem 0.45rem', borderRadius:'999px', background:st.bg, color:st.color, border:`1px solid ${st.border}`, fontWeight:700 }}>{tx.status}</span>
      </div>
    </article>
  );
}
TxRow.propTypes = {
  tx: PropTypes.shape({ id:PropTypes.number, type:PropTypes.string, desc:PropTypes.string, amount:PropTypes.number, date:PropTypes.string, status:PropTypes.string }).isRequired,
};

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [topupAmt, setTopupAmt] = useState(1000);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/wallet', { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error('api');
        const data = await res.json();
        setWallet(data.data ?? data);
      } catch {
        setWallet(MOCK_WALLET);
      }
    };
    load();
  }, []);

  const w = wallet ?? MOCK_WALLET;
  const finalAmt = custom ? parseInt(custom, 10) || 0 : topupAmt;

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#FBBF24', letterSpacing:'0.12em', textTransform:'uppercase' }}>Payments</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.4rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>My Wallet</h1>
        </div>

        {/* Balance card */}
        <div style={{ background:'linear-gradient(135deg,rgba(13,28,45,0.9) 0%,rgba(18,33,49,0.95) 100%)', border:'1px solid rgba(251,191,36,0.18)', borderRadius:'20px', padding:'2rem 2.25rem', marginBottom:'1.5rem', backdropFilter:'blur(16px)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'radial-gradient(circle,rgba(251,191,36,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.1em' }}>Available Balance</span>
          <div style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'3.5rem', color:'#FBBF24', letterSpacing:'-0.02em', lineHeight:1.1, margin:'0.25rem 0 0.75rem' }}>
            ৳{w.balance.toLocaleString()}
          </div>
          <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', textTransform:'uppercase' }}>Points</div>
              <div style={{ color:'#ff5e07', fontWeight:700, fontSize:'1rem' }}>{w.points.toLocaleString()} pts</div>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", color:'#506070', fontSize:'0.7rem', textTransform:'uppercase' }}>Total Spent</div>
              <div style={{ color:'#8ba3be', fontWeight:700, fontSize:'1rem' }}>৳{w.totalSpent.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.5rem' }}>
          {/* Top-up */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(14px)' }}>
            <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', marginBottom:'1.1rem' }}>Top Up</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.85rem' }}>
              {TOPUP_OPTIONS.map(a => (
                <button key={a} onClick={() => { setTopupAmt(a); setCustom(''); }}
                  style={{ padding:'0.55rem', borderRadius:'10px', border:'1px solid', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', background: topupAmt === a && !custom ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)', color: topupAmt === a && !custom ? '#FBBF24' : '#506070', borderColor: topupAmt === a && !custom ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.08)', transition:'all 0.15s' }}>
                  ৳{a.toLocaleString()}
                </button>
              ))}
            </div>
            <input value={custom} onChange={e => { setCustom(e.target.value); setTopupAmt(0); }} placeholder="Custom amount…"
              style={{ width:'100%', padding:'0.55rem 0.75rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'#f0f6ff', fontSize:'0.88rem', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box', marginBottom:'0.85rem' }} />
            <button style={{ width:'100%', padding:'0.65rem', background:'#FBBF24', border:'none', borderRadius:'10px', color:'#111111', fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.9rem', cursor:'pointer' }}>
              Add ৳{finalAmt.toLocaleString()}
            </button>
          </div>

          {/* Quick stats */}
          <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.5rem', backdropFilter:'blur(14px)', display:'flex', flexDirection:'column', gap:'0.85rem' }}>
            <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', marginBottom:'0.25rem' }}>Quick Stats</h2>
            {[['payments','Total Top-ups',`৳${w.totalTopUp.toLocaleString()}`],['sports','Bookings Paid',w.transactions.filter(t=>t.type==='debit').length],['redeem','Cashback Earned',`৳${w.transactions.filter(t=>t.desc.includes('cashback')).reduce((s,t)=>s+t.amount,0)}`]].map(([icon, label, val]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem', background:'rgba(255,255,255,0.03)', borderRadius:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'1rem', color:'#506070' }}>{icon}</span>
                  <span style={{ color:'#8ba3be', fontSize:'0.85rem' }}>{label}</span>
                </div>
                <span style={{ color:'#FBBF24', fontWeight:700, fontSize:'0.9rem' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'1.75rem', backdropFilter:'blur(14px)' }}>
          <h2 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'1rem', color:'#f0f6ff', marginBottom:'1.1rem' }}>Transaction History</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.55rem' }}>
            {w.transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
