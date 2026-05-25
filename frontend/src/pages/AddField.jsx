import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const SPORTS_LIST = [
  { id: 'football',    label: '⚽ Football' },
  { id: 'cricket',     label: '🏏 Cricket' },
  { id: 'basketball',  label: '🏀 Basketball' },
  { id: 'tennis',      label: '🎾 Tennis' },
  { id: 'badminton',   label: '🏸 Badminton' },
  { id: 'volleyball',  label: '🏐 Volleyball' },
  { id: 'table-tennis',label: '🏓 Table Tennis' },
  { id: 'squash',      label: '🎱 Squash' },
  { id: 'multi-sport', label: '🏅 Multi-Sport' },
];

const FIELD_TYPES = [
  { id: 'outdoor', label: '☀️ Outdoor' },
  { id: 'indoor',  label: '🏠 Indoor' },
  { id: 'covered', label: '⛺ Covered' },
];

const SURFACES = [
  { id: 'grass',          label: '🌿 Natural Grass' },
  { id: 'artificial-turf',label: '🟩 Artificial Turf' },
  { id: 'concrete',       label: '⬜ Concrete' },
  { id: 'wood',           label: '🪵 Wood' },
  { id: 'rubber',         label: '⚫ Rubber' },
  { id: 'clay',           label: '🟤 Clay' },
  { id: 'synthetic',      label: '🔵 Synthetic' },
];

const AMENITY_OPTIONS = [
  'Parking', 'Changing Rooms', 'Lighting', 'Equipment Rental',
  'Refreshments', 'Seating', 'WiFi', 'First Aid', 'Restrooms', 'Showers',
];

const BLANK = {
  name: '', description: '', sports: [], fieldType: '', surface: '',
  address: '', city: '', lat: '', lon: '',
  capacityMin: '2', capacityMax: '22',
  hourlyRate: '', contactPhone: '', contactEmail: '',
  amenities: [],
};

const SEC = { marginBottom: '2rem' };
const SEC_HEAD = { color: '#e2e8f0', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' };
const ROW = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.25rem', marginBottom: '1.25rem' };
const FLD = { marginBottom: '1.25rem' };
const LBL = { display: 'block', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' };
const TAG = { color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem', margin: '0 0 0.6rem' };

function ToastBar({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: 'fixed', top: '5.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '0.85rem 1.25rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem',
          background: t.type === 'success' ? 'rgba(16,185,129,0.92)' : 'rgba(239,68,68,0.92)',
          color: '#fff', backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          {t.type === 'success' ? '✅' : '❌'} {t.msg}
          <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', marginLeft: '0.5rem', fontSize: '1rem' }}>×</button>
        </div>
      ))}
    </div>
  );
}
ToastBar.propTypes = {
  toasts: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, msg: PropTypes.string, type: PropTypes.string })).isRequired,
  onRemove: PropTypes.func.isRequired,
};

function OptionBtn({ id, label, selected, onToggle }) {
  return (
    <button type="button" onClick={() => onToggle(id)} style={{
      padding: '0.5rem 0.85rem', borderRadius: '10px',
      border: `1px solid ${selected ? '#7c3aed' : 'rgba(255,255,255,0.12)'}`,
      background: selected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
      color: selected ? '#c4b5fd' : '#94a3b8',
      cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}
OptionBtn.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const AddField = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw === null) { navigate('/login'); return; }
    setUser(JSON.parse(raw));
  }, [navigate]);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const setField = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const toggleSport = useCallback(id => {
    setForm(prev => {
      const sports = prev.sports.includes(id)
        ? prev.sports.filter(s => s !== id)
        : [...prev.sports, id];
      return { ...prev, sports };
    });
  }, []);

  const toggleFieldType = useCallback(id => {
    setForm(prev => ({ ...prev, fieldType: prev.fieldType === id ? '' : id }));
  }, []);

  const toggleSurface = useCallback(id => {
    setForm(prev => ({ ...prev, surface: prev.surface === id ? '' : id }));
  }, []);

  const toggleAmenity = useCallback(name => {
    setForm(prev => {
      const amenities = prev.amenities.includes(name)
        ? prev.amenities.filter(a => a !== name)
        : [...prev.amenities, name];
      return { ...prev, amenities };
    });
  }, []);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();
    if (form.sports.length === 0) { toast('Select at least one sport', 'error'); return; }
    if (form.fieldType === '') { toast('Select a field type', 'error'); return; }
    if (form.surface === '') { toast('Select a surface type', 'error'); return; }
    if (form.hourlyRate === '' || Number(form.hourlyRate) <= 0) { toast('Enter a valid hourly rate', 'error'); return; }

    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        sports: form.sports,
        fieldType: form.fieldType,
        surface: form.surface,
        location: {
          address: form.address,
          city: form.city,
          coordinates: [Number.parseFloat(form.lon) || 90.4125, Number.parseFloat(form.lat) || 23.8103],
        },
        capacity: { min: Number.parseInt(form.capacityMin, 10), max: Number.parseInt(form.capacityMax, 10) },
        pricing: { hourly: Number.parseFloat(form.hourlyRate) },
        contact: { phone: form.contactPhone, email: form.contactEmail },
        amenities: form.amenities.map(name => ({ name })),
      };
      const res = await fetch('/api/v1/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        toast(data.message || 'Failed to submit field', 'error');
      }
    } catch {
      toast('Network error — please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [form, toast]);

  if (user === null) return null;

  if (submitted) {
    return (
      <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ToastBar toasts={toasts} onRemove={removeToast} />
        <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 900, fontSize: '1.6rem', marginBottom: '0.75rem' }}>Field Submitted!</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            Your field is pending admin review. You will be notified once it is approved and listed on the platform.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setForm(BLANK); setSubmitted(false); }}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
              Add Another Field
            </button>
            <button onClick={() => navigate('/fields')}
              style={{ padding: '0.75rem 1.5rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#c4b5fd', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
              Browse Fields
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-bg" style={{ minHeight: '100vh', paddingTop: '5.5rem', paddingBottom: '3rem' }}>
      <ToastBar toasts={toasts} onRemove={removeToast} />
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 1.25rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏟️</div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#f9a8d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
            List Your Field
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Welcome, {user.firstName}! Submit your facility for admin review.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: '2rem' }}>

            {/* Basic Info */}
            <div style={SEC}>
              <h2 style={SEC_HEAD}>📋 Basic Information</h2>
              <div style={FLD}>
                <label htmlFor="af-name" style={LBL}>Field Name *</label>
                <input id="af-name" className="input-field" type="text" placeholder="e.g., Dhaka Sports Complex" required value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div style={FLD}>
                <label htmlFor="af-desc" style={LBL}>Description *</label>
                <textarea id="af-desc" className="input-field" rows={4} placeholder="Describe the field, surface quality, facilities..." required value={form.description} onChange={e => setField('description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div style={FLD}>
                <p style={TAG}>Sports Offered *</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {SPORTS_LIST.map(s => (
                    <OptionBtn key={s.id} id={s.id} label={s.label} selected={form.sports.includes(s.id)} onToggle={toggleSport} />
                  ))}
                </div>
              </div>
              <div style={ROW}>
                <div>
                  <p style={TAG}>Field Type *</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {FIELD_TYPES.map(t => (
                      <OptionBtn key={t.id} id={t.id} label={t.label} selected={form.fieldType === t.id} onToggle={toggleFieldType} />
                    ))}
                  </div>
                </div>
                <div>
                  <p style={TAG}>Surface *</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {SURFACES.map(s => (
                      <OptionBtn key={s.id} id={s.id} label={s.label} selected={form.surface === s.id} onToggle={toggleSurface} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={SEC}>
              <h2 style={SEC_HEAD}>📍 Location</h2>
              <div style={FLD}>
                <label htmlFor="af-addr" style={LBL}>Street Address *</label>
                <input id="af-addr" className="input-field" type="text" placeholder="123 Sports Ave, Gulshan" required value={form.address} onChange={e => setField('address', e.target.value)} />
              </div>
              <div style={ROW}>
                <div>
                  <label htmlFor="af-city" style={LBL}>City *</label>
                  <input id="af-city" className="input-field" type="text" placeholder="Dhaka" required value={form.city} onChange={e => setField('city', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="af-lat" style={LBL}>Latitude <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <input id="af-lat" className="input-field" type="number" step="any" placeholder="23.8103" value={form.lat} onChange={e => setField('lat', e.target.value)} />
                </div>
              </div>
              <div style={ROW}>
                <div>
                  <label htmlFor="af-lon" style={LBL}>Longitude <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <input id="af-lon" className="input-field" type="number" step="any" placeholder="90.4125" value={form.lon} onChange={e => setField('lon', e.target.value)} />
                </div>
                <div />
              </div>
            </div>

            {/* Capacity & Pricing */}
            <div style={SEC}>
              <h2 style={SEC_HEAD}>💰 Capacity & Pricing</h2>
              <div style={ROW}>
                <div>
                  <label htmlFor="af-capmin" style={LBL}>Min Players *</label>
                  <input id="af-capmin" className="input-field" type="number" min="1" required value={form.capacityMin} onChange={e => setField('capacityMin', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="af-capmax" style={LBL}>Max Players *</label>
                  <input id="af-capmax" className="input-field" type="number" min="1" required value={form.capacityMax} onChange={e => setField('capacityMax', e.target.value)} />
                </div>
              </div>
              <div style={ROW}>
                <div>
                  <label htmlFor="af-rate" style={LBL}>Hourly Rate (৳) *</label>
                  <input id="af-rate" className="input-field" type="number" min="1" step="0.01" placeholder="e.g. 1500" required value={form.hourlyRate} onChange={e => setField('hourlyRate', e.target.value)} />
                </div>
                <div />
              </div>
            </div>

            {/* Contact */}
            <div style={SEC}>
              <h2 style={SEC_HEAD}>📞 Contact Information</h2>
              <div style={ROW}>
                <div>
                  <label htmlFor="af-phone" style={LBL}>Phone *</label>
                  <input id="af-phone" className="input-field" type="tel" placeholder="+880 1700-000000" required value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="af-email" style={LBL}>Email <span style={{ opacity: 0.6 }}>(optional)</span></label>
                  <input id="af-email" className="input-field" type="email" placeholder="field@example.com" value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div style={SEC}>
              <h2 style={SEC_HEAD}>✅ Amenities</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))', gap: '0.6rem' }}>
                {AMENITY_OPTIONS.map(name => (
                  <label key={name} htmlFor={`af-am-${name}`} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.8rem',
                    background: form.amenities.includes(name) ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.amenities.includes(name) ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <input id={`af-am-${name}`} type="checkbox" checked={form.amenities.includes(name)} onChange={() => toggleAmenity(name)} style={{ accentColor: '#7c3aed' }} />
                    <span style={{ color: form.amenities.includes(name) ? '#c4b5fd' : '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Info box */}
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: '12px', padding: '1.25rem', marginBottom: '2rem' }}>
              <p style={{ color: '#93c5fd', fontWeight: 700, marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>📋 Submission Process</p>
              <ul style={{ color: '#bfdbfe', fontSize: '0.85rem', lineHeight: 1.85, paddingLeft: '1.1rem', margin: 0 }}>
                <li>Your field will be reviewed by the admin team</li>
                <li>Approval typically takes 1–2 business days</li>
                <li>You will be notified via email once approved</li>
                <li>All fields must meet quality and safety standards</li>
              </ul>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '1rem',
              background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#ec4899)',
              border: 'none', color: '#fff', borderRadius: '14px', fontWeight: 800,
              fontSize: '1.05rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            }}>
              {loading
                ? <><span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2.5px' }} />Submitting...</>
                : '🚀 Submit Field for Approval'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddField;
