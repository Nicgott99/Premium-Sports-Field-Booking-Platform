import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Shield,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Heart,
  Phone,
  UserCheck,
  Download,
  Copy,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
} from 'lucide-react';

// ─── Constants & Plan Definitions ────────────────────────────────────────────

const WAIVER_CLAUSES = [
  {
    id: 'risk',
    title: '1. Assumption of Inherent Athletic Risk',
    content:
      'I voluntarily choose to participate in sports activities at this facility. I acknowledge and understand that sports such as football, basketball, and turf athletics involve physical exertion, rapid deceleration, and risk of accidental bodily injury.',
  },
  {
    id: 'liability',
    title: '2. Release & Indemnification of Venue',
    content:
      'I hereby release, waive, and forever discharge the venue operator, pitch owners, and booking platform organizers from any and all liability, claims, or demands arising out of negligence or accidental injury during match play.',
  },
  {
    id: 'medical',
    title: '3. Emergency First-Aid & Paramedic Authorization',
    content:
      'In the event of acute trauma, concussion, or medical emergency, I authorize facility staff to summon professional emergency medical services (EMS) and administer basic first-aid if I am incapacitated.',
  },
  {
    id: 'concussion',
    title: '4. Concussion Safety & Return-to-Play Protocol',
    content:
      'I affirm that I will immediately report any suspected head impact, dizziness, or concussion symptoms and will voluntarily remove myself from play until cleared by a qualified health professional.',
  },
];

const INSURANCE_TIERS = [
  {
    id: 'WAIVER_ONLY',
    name: 'Standard Liability Release',
    price: 0,
    tag: 'Included Free',
    coverage: 'Standard venue release (Zero medical benefits)',
    icon: FileText,
    recommended: false,
  },
  {
    id: 'BASIC_INJURY_GUARD',
    name: 'MatchDay Basic Injury Guard',
    price: 2.5,
    tag: 'Most Popular',
    coverage: 'Up to $5,000 Emergency Medical + $500 Ambulance transit',
    icon: ShieldCheck,
    recommended: true,
  },
  {
    id: 'PREMIUM_TOTAL_SHIELD',
    name: 'Total Player Shield & Gear Protection',
    price: 4.95,
    tag: 'Maximum Coverage',
    coverage: 'Up to $15,000 Medical + $2,000 Dental + $500 Gear theft/damage',
    icon: Sparkles,
    recommended: false,
  },
];

// ─── Component Definition ────────────────────────────────────────────────────

export default function DigitalWaiverSigner({
  fixtureId = 'FIX-2026-089',
  sport = 'Football',
  playerName = 'Alex Morgan',
  playerAge = 24,
  venueName = 'Apex Sports Complex — Pitch 2',
  onComplete,
  className = '',
}) {
  const [currentStep, setCurrentStep] = useState(1); // Steps 1 to 4

  // Step 1: Agreements
  const [agreedClauses, setAgreedClauses] = useState({
    risk: true,
    liability: true,
    medical: true,
    concussion: true,
  });

  // Step 2: Health & Emergency Contact
  const [emergencyContact, setEmergencyContact] = useState({
    name: 'Jordan Miller',
    phone: '+1 (555) 234-5678',
    relation: 'Spouse / Partner',
  });
  const [healthFlags, setHealthFlags] = useState({
    asthma: false,
    heartCondition: false,
    recentConcussion: false,
    allergies: false,
  });

  // Step 3: Insurance Plan
  const [selectedPlan, setSelectedPlan] = useState('BASIC_INJURY_GUARD');

  // Step 4: Digital Signature
  const [isMinor, setIsMinor] = useState(playerAge < 18);
  const [signatureText, setSignatureText] = useState(playerName);
  const [guardianName, setGuardianName] = useState('');
  const [guardianSignature, setGuardianSignature] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedCertificate, setCopiedCertificate] = useState(false);

  // Deterministic Certificate ID & Mock Hash
  const certificateData = useMemo(() => {
    const certNum = Math.abs(
      (playerName + fixtureId + selectedPlan).split('').reduce((acc, c) => acc + c.charCodeAt(0), 1000)
    );
    const mockHash = `sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f${certNum}`;
    const certId = `WVR-CERT-${certNum}-2026`;
    return { certId, mockHash, timestamp: '2026-10-26T23:35:00.000Z' };
  }, [playerName, fixtureId, selectedPlan]);

  const toggleClause = (id) => {
    setAgreedClauses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allClausesAccepted = Object.values(agreedClauses).every(Boolean);

  const handleNextStep = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!signatureText.trim()) return;
    if (isMinor && (!guardianName.trim() || !guardianSignature.trim())) return;

    setIsSubmitted(true);
    if (onComplete) {
      onComplete({
        certificateId: certificateData.certId,
        hash: certificateData.mockHash,
        plan: selectedPlan,
        emergencyContact,
        playerName,
      });
    }
  };

  const handleCopySummary = () => {
    const summary = `🛡️ VERIFIED DIGITAL SPORTS WAIVER & INJURY PASS
Certificate ID: ${certificateData.certId}
Player: ${playerName} (${isMinor ? 'Minor - Guardian Signed' : 'Adult'})
Sport: ${sport} | Venue: ${venueName}
Selected Coverage: ${selectedPlan}
Verification Stamp: ${certificateData.mockHash}
Status: ACTIVE & COMPLIANT`;

    navigator.clipboard.writeText(summary);
    setCopiedCertificate(true);
    setTimeout(() => setCopiedCertificate(false), 2500);
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-slate-100 font-sans ${className}`}
    >
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

      {/* ── Header Title Bar ─────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Digital Liability & Injury Pass</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sport}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fixture: <span className="text-slate-300 font-mono">{fixtureId}</span> • {venueName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-700/60">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium">256-Bit Encrypted Pass</span>
          </div>
        </div>

        {/* Step Progress Indicator (when not submitted) */}
        {!isSubmitted && (
          <div className="grid grid-cols-4 gap-2 mt-6">
            {[
              { num: 1, label: 'Liability Clauses' },
              { num: 2, label: 'Health & Contact' },
              { num: 3, label: 'Injury Shield' },
              { num: 4, label: 'Sign & Verify' },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-300 mb-2 ${
                    currentStep >= s.num ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium hidden md:block ${
                    currentStep === s.num ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Step Content ─────────────────────────────────────────────── */}
      <div className="p-6 md:p-8">
        {isSubmitted ? (
          /* ── Verified Certificate Pass View ────────────────────────────── */
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2">
              Verified & Legally Binding
            </span>

            <h3 className="text-2xl font-black text-white tracking-tight">Digital Waiver Cleared</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Your liability release and participant medical declaration have been cryptographically stamped and registered
              for this fixture.
            </p>

            {/* Certificate Details Card */}
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 my-6 text-left text-xs space-y-3 font-mono shadow-inner">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-500">Certificate ID:</span>
                <span className="text-emerald-400 font-bold">{certificateData.certId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-500">Signer Name:</span>
                <span className="text-slate-200">{signatureText}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-500">Coverage Tier:</span>
                <span className="text-indigo-300 font-semibold">{selectedPlan}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-500">Emergency Contact:</span>
                <span className="text-slate-300">
                  {emergencyContact.name} ({emergencyContact.phone})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cryptographic Digest:</span>
                <span className="text-[11px] text-cyan-400 truncate max-w-[220px]">{certificateData.mockHash}</span>
              </div>
            </div>

            {/* Certificate Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-md"
              >
                {copiedCertificate ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedCertificate ? 'Copied Summary!' : 'Copy Digital Pass'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF Receipt</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* ── Step 1: Liability Clauses ───────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Review Required Legal Clauses
                  </h4>
                  <button
                    onClick={() =>
                      setAgreedClauses({ risk: true, liability: true, medical: true, concussion: true })
                    }
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Accept All
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {WAIVER_CLAUSES.map((clause) => (
                    <div
                      key={clause.id}
                      onClick={() => toggleClause(clause.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        agreedClauses[clause.id]
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                            agreedClauses[clause.id]
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        >
                          {agreedClauses[clause.id] && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-200">{clause.title}</h5>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{clause.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Emergency Contact & Health ──────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    Pitchside Emergency Contact
                  </h4>
                  <p className="text-xs text-slate-400">Required by facility safety rules in case of medical need.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyContact.name}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Jordan Miller"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Emergency Phone</label>
                    <input
                      type="tel"
                      value={emergencyContact.phone}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. +1 (555) 000-0000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={emergencyContact.relation}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Parent, Spouse"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-rose-400" />
                    Medical & Physical Health Declaration
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">Please disclose any active conditions for on-site staff.</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { key: 'asthma', label: 'Asthma / Inhaler' },
                      { key: 'heartCondition', label: 'Heart Condition' },
                      { key: 'recentConcussion', label: 'Recent Concussion' },
                      { key: 'allergies', label: 'Severe Allergies' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() =>
                          setHealthFlags((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className={`p-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                          healthFlags[item.key]
                            ? 'bg-rose-950/20 border-rose-500/50 text-rose-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{item.label}</span>
                        {healthFlags[item.key] && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: MatchDay Injury Shield ─────────────────────────── */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    MatchDay Micro-Insurance Options
                  </h4>
                  <p className="text-xs text-slate-400">Optional single-fixture bodily injury and transit coverage.</p>
                </div>

                <div className="space-y-3">
                  {INSURANCE_TIERS.map((tier) => {
                    const TierIcon = tier.icon;
                    const isSelected = selectedPlan === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedPlan(tier.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              <TierIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-white">{tier.name}</h5>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                  {tier.tag}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{tier.coverage}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-white">
                              {tier.price === 0 ? 'FREE' : `$${tier.price.toFixed(2)}`}
                            </span>
                            <span className="block text-[10px] text-slate-500">per fixture</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 4: Digital Signature & Verification ────────────────── */}
            {currentStep === 4 && (
              <form onSubmit={handleFinalSubmit} className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Digital Signature & Legal Confirmation
                  </h4>
                  <p className="text-xs text-slate-400">
                    By typing your name, you execute this legally binding digital sports liability release.
                  </p>
                </div>

                {/* Minor Player Toggle */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <input
                    type="checkbox"
                    id="isMinorCheckbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <label htmlFor="isMinorCheckbox" className="text-slate-300 cursor-pointer">
                    Player is under 18 years of age (Requires Parent / Legal Guardian Co-Signature)
                  </label>
                </div>

                {/* Player Signature */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Participant Signature (Type Full Legal Name)
                  </label>
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-serif italic text-emerald-400 focus:outline-none focus:border-emerald-500 shadow-inner"
                    placeholder="e.g. Alex Morgan"
                    required
                  />
                </div>

                {/* Guardian Signature (if minor) */}
                {isMinor && (
                  <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                      Parent / Legal Guardian Indemnification
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Guardian Name</label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Robert Morgan"
                          required={isMinor}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Guardian Signature</label>
                        <input
                          type="text"
                          value={guardianSignature}
                          onChange={(e) => setGuardianSignature(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-serif italic text-indigo-400 focus:outline-none focus:border-indigo-500"
                          placeholder="Type guardian full name"
                          required={isMinor}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!allClausesAccepted || !signatureText.trim()}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Confirm & Generate Encrypted Digital Pass</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── Navigation Bottom Bar ───────────────────────────────────── */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && !allClausesAccepted}
                  className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

DigitalWaiverSigner.propTypes = {
  fixtureId: PropTypes.string,
  sport: PropTypes.string,
  playerName: PropTypes.string,
  playerAge: PropTypes.number,
  venueName: PropTypes.string,
  onComplete: PropTypes.func,
  className: PropTypes.string,
};
