import React, { useState } from 'react';
import PropTypes from 'prop-types';

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width:'44px', height:'24px', borderRadius:'999px', border:'none', background: on ? '#c3f400' : 'rgba(255,255,255,0.12)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:'3px', left: on ? '23px' : '3px', width:'18px', height:'18px', borderRadius:'50%', background: on ? '#0a1200' : '#506070', transition:'left 0.2s' }} />
    </button>
  );
}
Toggle.propTypes = { on: PropTypes.bool.isRequired, onChange: PropTypes.func.isRequired };

function SettingRow({ icon, label, sub, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.05)', gap:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flex:1, minWidth:0 }}>
        <span className="material-symbols-outlined" style={{ fontSize:'1.15rem', color:'#506070', flexShrink:0 }}>{icon}</span>
        <div>
          <div style={{ color:'#c8d8ea', fontSize:'0.9rem', fontWeight:600 }}>{label}</div>
          {sub && <div style={{ color:'#506070', fontSize:'0.78rem', marginTop:'0.1rem' }}>{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
SettingRow.propTypes = { icon:PropTypes.string.isRequired, label:PropTypes.string.isRequired, sub:PropTypes.string, children:PropTypes.node };

function Section({ title, children }) {
  return (
    <div style={{ background:'rgba(13,28,45,0.72)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', overflow:'hidden', backdropFilter:'blur(14px)', marginBottom:'1.25rem' }}>
      <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontFamily:"'Anybody',sans-serif", fontWeight:800, fontSize:'0.9rem', color:'#f0f6ff' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
Section.propTypes = { title:PropTypes.string.isRequired, children:PropTypes.node };

const SettingsPage = () => {
  const [notifs, setNotifs] = useState({ booking:true, promo:false, community:true, reminder:true });
  const [privacy, setPrivacy] = useState({ publicProfile:true, showStats:true, showBookings:false });
  const [sport, setSport] = useState('Football');
  const [lang, setLang] = useState('English');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'#f0f6ff', fontSize:'0.85rem', padding:'0.4rem 0.7rem', outline:'none', fontFamily:"'Inter',sans-serif" };

  return (
    <div style={{ minHeight:'100vh', background:'#051424', paddingTop:'5.5rem', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'0 1.25rem' }}>

        <div style={{ marginBottom:'2rem' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color:'#c3f400', letterSpacing:'0.12em', textTransform:'uppercase' }}>Preferences</span>
          <h1 style={{ fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'clamp(1.8rem,4vw,2.4rem)', color:'#f0f6ff', margin:'0.3rem 0 0', letterSpacing:'-0.02em' }}>Settings</h1>
        </div>

        {/* Profile section */}
        <Section title="Profile">
          <div style={{ padding:'1.25rem' }}>
            <div style={{ display:'flex', gap:'1.5rem', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap' }}>
              <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(195,244,0,0.15),rgba(255,94,7,0.1))', border:'2px solid rgba(195,244,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', flexShrink:0 }}>🏃</div>
              <button style={{ background:'rgba(195,244,0,0.08)', border:'1px solid rgba(195,244,0,0.2)', color:'#c3f400', borderRadius:'10px', padding:'0.5rem 1rem', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>Change Photo</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
              {[['Full Name','Hasibullah Khan'],['Username','@hk_elite'],['Email','hasibullah@example.com'],['Phone','+880 1XXXXXXXXX']].map(([label, val]) => (
                <div key={label}>
                  <label style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color:'#506070', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'0.3rem' }}>{label}</label>
                  <input defaultValue={val} style={{ ...inputStyle, width:'100%', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <SettingRow icon="sports_soccer" label="Preferred Sport" sub="Default sport for new bookings">
            <select value={sport} onChange={e => setSport(e.target.value)} style={inputStyle}>
              {['Football','Cricket','Basketball','Tennis','Badminton','Swimming'].map(s => <option key={s}>{s}</option>)}
            </select>
          </SettingRow>
          <SettingRow icon="language" label="Language" sub="App display language">
            <select value={lang} onChange={e => setLang(e.target.value)} style={inputStyle}>
              {['English','বাংলা'].map(l => <option key={l}>{l}</option>)}
            </select>
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          {[['notifications','Booking Confirmations','Alerts for confirmed and cancelled bookings','booking'],['campaign','Promotions & Offers','Special deals and discount alerts','promo'],['group','Community Activity','Likes, comments and mentions','community'],['alarm','Session Reminders','Reminders 1 hour before your bookings','reminder']].map(([icon, label, sub, key]) => (
            <SettingRow key={key} icon={icon} label={label} sub={sub}>
              <Toggle on={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]:v }))} />
            </SettingRow>
          ))}
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          {[['person','Public Profile','Let others find your profile','publicProfile'],['bar_chart','Show Statistics','Display your stats on leaderboards','showStats'],['event','Show Bookings','Let others see your booking history','showBookings']].map(([icon, label, sub, key]) => (
            <SettingRow key={key} icon={icon} label={label} sub={sub}>
              <Toggle on={privacy[key]} onChange={v => setPrivacy(p => ({ ...p, [key]:v }))} />
            </SettingRow>
          ))}
        </Section>

        {/* Danger zone */}
        <Section title="Account">
          <SettingRow icon="lock_reset" label="Change Password" sub="Update your login password">
            <button style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#8ba3be', borderRadius:'8px', padding:'0.38rem 0.85rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>Change</button>
          </SettingRow>
          <SettingRow icon="delete_forever" label="Delete Account" sub="Permanently remove your account and data">
            <button style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', borderRadius:'8px', padding:'0.38rem 0.85rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>Delete</button>
          </SettingRow>
        </Section>

        <button onClick={handleSave} style={{ width:'100%', padding:'0.8rem', background: saved ? 'rgba(195,244,0,0.15)' : '#c3f400', color: saved ? '#c3f400' : '#0a1200', border: saved ? '1px solid rgba(195,244,0,0.3)' : 'none', borderRadius:'12px', fontFamily:"'Anybody',sans-serif", fontWeight:900, fontSize:'1rem', cursor:'pointer', transition:'all 0.2s' }}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
