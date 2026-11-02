import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  PackageSearch,
  MapPin,
  Tag,
  CheckCircle2,
  Copy,
  ShieldCheck,
  ArrowRight,
  ClipboardList,
  Search,
  AlertCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_CATEGORIES = [
  { id: 'ELECTRONICS', label: 'Electronics / Device', icon: '📱', verifyHint: 'Provide the device passcode or IMEI number to duty staff.' },
  { id: 'FOOTWEAR', label: 'Footwear / Cleats', icon: '👟', verifyHint: 'Confirm brand, size, and any personalisation (name tag, marker).' },
  { id: 'KIT_BAG', label: 'Kit Bag / Sports Bag', icon: '🎒', verifyHint: 'Describe contents and any unique markings or locks.' },
  { id: 'VALUABLES', label: 'Valuables / Jewellery', icon: '💎', verifyHint: 'Provide a receipt, photo, or distinctive detail of the item.' },
  { id: 'EQUIPMENT', label: 'Sports Equipment', icon: '⚽', verifyHint: 'Confirm sport type, brand, size, and any stickers or engravings.' },
];

const VENUE_ZONES = [
  'Changing Room A', 'Changing Room B', 'Pitch 1 Dugout', 'Pitch 2 Dugout',
  'Pitch 3 Dugout', 'Spectator Stand', 'Reception / Front Desk',
  'Canteen / Café Area', 'Car Park', 'Gym / Warm-up Zone',
];

// Mocked AI-matched found items for demo purposes
const MOCK_FOUND_ITEMS = [
  {
    matchId: 'FND-9021',
    matchScore: 91,
    categoryId: 'ELECTRONICS',
    brand: 'Samsung',
    color: 'Midnight Black',
    foundZone: 'Changing Room A',
    foundDate: '2026-11-02',
    vaultRef: 'VLT-C1-04',
  },
  {
    matchId: 'FND-8874',
    matchScore: 74,
    categoryId: 'ELECTRONICS',
    brand: 'Samsung (Case)',
    color: 'Dark Blue',
    foundZone: 'Pitch 1 Dugout',
    foundDate: '2026-11-01',
    vaultRef: 'VLT-D1-11',
  },
  {
    matchId: 'FND-9103',
    matchScore: 58,
    categoryId: 'VALUABLES',
    brand: 'Unknown',
    color: 'Silver',
    foundZone: 'Spectator Stand',
    foundDate: '2026-11-03',
    vaultRef: 'VLT-E2-07',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBadge({ score }) {
  const color =
    score >= 85 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
    score >= 65 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
    'bg-slate-600/30 text-slate-400 border-slate-600/40';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {score}% Match
    </span>
  );
}

ScoreBadge.propTypes = {
  score: PropTypes.number.isRequired,
};

function MatchCard({ item, onClaim }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-slate-100 font-semibold text-sm">{item.brand}</p>
          <p className="text-slate-400 text-xs mt-0.5">{item.color}</p>
        </div>
        <ScoreBadge score={item.matchScore} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <MapPin size={11} className="text-cyan-400" />
          {item.foundZone}
        </span>
        <span className="flex items-center gap-1.5">
          <Tag size={11} className="text-violet-400" />
          Vault {item.vaultRef}
        </span>
        <span className="flex items-center gap-1.5 col-span-2">
          <ClipboardList size={11} className="text-slate-500" />
          Found: {item.foundDate} · Ref: {item.matchId}
        </span>
      </div>
      <button
        onClick={() => onClaim(item)}
        className="flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold py-2 rounded-lg transition-colors"
      >
        Submit Claim <ArrowRight size={13} />
      </button>
    </div>
  );
}

MatchCard.propTypes = {
  item: PropTypes.shape({
    matchId: PropTypes.string.isRequired,
    matchScore: PropTypes.number.isRequired,
    brand: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    foundZone: PropTypes.string.isRequired,
    foundDate: PropTypes.string.isRequired,
    vaultRef: PropTypes.string.isRequired,
  }).isRequired,
  onClaim: PropTypes.func.isRequired,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * LostFoundReportCard
 *
 * Allows players to report a lost item, browse AI-matched found items,
 * submit a claim, and receive a digital custody receipt.
 */
export default function LostFoundReportCard({ venueId, venueName }) {
  // Step: 'report' | 'matches' | 'verify' | 'confirmed'
  const [step, setStep] = useState('report');
  const [trackingRef] = useState(
    () => `LNF-REF-${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [claimedItem, setClaimedItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const [custodyToken] = useState(
    () => `CUT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
  );

  const [form, setForm] = useState({
    category: '',
    brand: '',
    color: '',
    lastSeenZone: '',
    dateLost: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [formError, setFormError] = useState('');

  const isFormValid = useMemo(
    () => form.category && form.brand.trim() && form.color.trim() && form.lastSeenZone,
    [form],
  );

  const selectedCategory = useMemo(
    () => ITEM_CATEGORIES.find((c) => c.id === form.category) || null,
    [form.category],
  );

  const relevantMatches = useMemo(() => {
    if (!form.category) return MOCK_FOUND_ITEMS;
    return MOCK_FOUND_ITEMS
      .filter((m) => m.categoryId === form.category || m.matchScore > 80)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [form.category]);

  function handleFieldChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  }

  function handleSubmitReport() {
    if (!isFormValid) {
      setFormError('Please fill in category, brand, colour, and last-seen zone.');
      return;
    }
    setStep('matches');
  }

  function handleClaimItem(item) {
    setClaimedItem(item);
    setStep('verify');
  }

  function handleConfirmClaim() {
    setStep('confirmed');
  }

  function handleCopyToken() {
    navigator.clipboard.writeText(custodyToken).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-md mx-auto">
      {/* Gradient accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <PackageSearch size={22} className="text-cyan-400" />
        </div>
        <div>
          <h2 className="text-slate-100 font-bold text-lg leading-tight">Lost & Found</h2>
          <p className="text-slate-400 text-xs mt-0.5">{venueName || 'Venue'} · Ref: {trackingRef}</p>
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-5">

        {/* ── STEP 1: Report form ─────────────────────────────────────── */}
        {step === 'report' && (
          <>
            <p className="text-slate-400 text-sm">
              Tell us about the item you&apos;ve lost. Our AI will search the pitchside vault for matching found items.
            </p>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Item Category *
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {ITEM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleFieldChange('category', cat.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                      form.category === cat.id
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand + Colour */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: 'brand', label: 'Brand / Make *', placeholder: 'e.g. Nike' },
                { field: 'color', label: 'Colour *', placeholder: 'e.g. Red' },
              ].map(({ field, label, placeholder }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{label}</label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Last-seen zone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Last-Seen Location *
              </label>
              <select
                value={form.lastSeenZone}
                onChange={(e) => handleFieldChange('lastSeenZone', e.target.value)}
                className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 transition-colors"
              >
                <option value="">Select zone…</option>
                {VENUE_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Date + description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Date Lost</label>
              <input
                type="date"
                value={form.dateLost}
                onChange={(e) => handleFieldChange('dateLost', e.target.value)}
                className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Extra Details</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Any unique markings, stickers, engravings…"
                rows={2}
                className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors resize-none"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> {formError}
              </div>
            )}

            <button
              onClick={handleSubmitReport}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition-all text-sm"
            >
              <Search size={15} /> Search Vault for Matches
            </button>
          </>
        )}

        {/* ── STEP 2: AI Matches ──────────────────────────────────────── */}
        {step === 'matches' && (
          <>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-emerald-300 text-xs font-semibold">Report Filed · {trackingRef}</p>
                <p className="text-slate-400 text-xs mt-0.5">AI found {relevantMatches.length} potential matches in the vault</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-slate-300 text-sm font-semibold">Potential Matches</p>
              <p className="text-slate-500 text-xs">Select a match to submit a verification claim</p>
            </div>

            <div className="flex flex-col gap-3">
              {relevantMatches.map((item) => (
                <MatchCard key={item.matchId} item={item} onClaim={handleClaimItem} />
              ))}
            </div>

            <button
              onClick={() => setStep('report')}
              className="text-slate-500 hover:text-slate-300 text-xs text-center transition-colors"
            >
              ← Edit my report
            </button>
          </>
        )}

        {/* ── STEP 3: Verify ownership ────────────────────────────────── */}
        {step === 'verify' && claimedItem && (
          <>
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-100 font-semibold text-sm">{claimedItem.brand} · {claimedItem.color}</p>
                <ScoreBadge score={claimedItem.matchScore} />
              </div>
              <p className="text-slate-400 text-xs">Vault {claimedItem.vaultRef} · {claimedItem.foundZone}</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 flex gap-3">
              <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 text-xs font-semibold mb-1">Ownership Verification Required</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {selectedCategory
                    ? selectedCategory.verifyHint
                    : 'Please provide proof of ownership to duty staff before collection.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-slate-400 text-xs">
                By confirming, you agree to present the required verification to duty staff at the reception desk. Collection hours: 09:00 – 21:00.
              </p>
              <button
                onClick={handleConfirmClaim}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                <CheckCircle2 size={15} /> Confirm Claim &amp; Get Receipt
              </button>
              <button
                onClick={() => setStep('matches')}
                className="text-slate-500 hover:text-slate-300 text-xs text-center transition-colors"
              >
                ← Back to matches
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4: Confirmed ───────────────────────────────────────── */}
        {step === 'confirmed' && claimedItem && (
          <>
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="p-4 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <p className="text-emerald-300 font-bold text-base">Claim Submitted!</p>
              <p className="text-slate-400 text-xs text-center">
                Head to reception with your verification details. Staff will retrieve the item from vault {claimedItem.vaultRef}.
              </p>
            </div>

            {/* Custody receipt card */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Digital Custody Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Tracking Ref', value: trackingRef },
                  { label: 'Found Ref', value: claimedItem.matchId },
                  { label: 'Venue', value: venueName || 'Venue' },
                  { label: 'Vault', value: claimedItem.vaultRef },
                  { label: 'Item', value: `${claimedItem.brand} · ${claimedItem.color}` },
                  { label: 'Claim Date', value: new Date().toLocaleDateString('en-GB') },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-slate-500 text-[10px]">{label}</p>
                    <p className="text-slate-200 font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-700/50 pt-3">
                <p className="text-slate-500 text-[10px] mb-1">Custody Token</p>
                <div className="flex items-center gap-2 bg-slate-800/70 rounded-lg px-3 py-2">
                  <code className="text-cyan-300 text-xs font-mono flex-1 tracking-widest">{custodyToken}</code>
                  <button
                    onClick={handleCopyToken}
                    className="text-slate-400 hover:text-cyan-300 transition-colors"
                    aria-label="Copy custody token"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-xs text-center">
              {venueId ? `Venue ID: ${venueId} · ` : ''}Show this receipt to staff at reception.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

LostFoundReportCard.propTypes = {
  venueId: PropTypes.string,
  venueName: PropTypes.string,
};

LostFoundReportCard.defaultProps = {
  venueId: '',
  venueName: 'Sports Venue',
};
