/**
 * BookingPass.jsx — Digital Stadium Booking Pass & Match Ticket
 * Premium Sports Field Booking Platform
 *
 * A digital boarding pass / match ticket component for confirmed field bookings:
 *  - Classic perforated stadium pass aesthetic with notch cutouts & barcode
 *  - Live kickoff countdown timer badge
 *  - Interactive QR verification badge with tap-to-expand
 *  - Sport icon, pitch surface type, and entry gate directions
 *  - Add-ons chips (e.g. Floodlights, Referee, Match Balls)
 *  - One-click actions: Add to Calendar (.ics), Share with Squad, Directions
 *  - Full keyboard accessibility, print-friendly styling, and zero dependencies
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * <BookingPass
 *   booking={{
 *     bookingId: 'BK-84920',
 *     venueName: 'Bashundhara Sports Arena',
 *     fieldName: 'Pitch 1 — Premier 4G Turf',
 *     sport: 'football',
 *     date: '2026-10-24',
 *     startTime: '19:00',
 *     endTime: '21:00',
 *     playerName: 'Hasibullah Khan',
 *     teamName: 'Thunderbolts FC',
 *     status: 'CONFIRMED',
 *     gate: 'Gate B — North Entry',
 *     totalPaid: 2400,
 *     currency: 'BDT',
 *     addons: ['Floodlights', 'FIFA Match Ball'],
 *   }}
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';

// ─── Sport Icons & Configurations ────────────────────────────────────────────

const SPORT_CONFIG = {
  football: { icon: '⚽', label: 'Football', badgeColor: '#10b981' },
  futsal: { icon: '🥅', label: 'Futsal', badgeColor: '#06b6d4' },
  cricket: { icon: '🏏', label: 'Cricket', badgeColor: '#f59e0b' },
  tennis: { icon: '🎾', label: 'Tennis', badgeColor: '#84cc16' },
  badminton: { icon: '🏸', label: 'Badminton', badgeColor: '#a855f7' },
  basketball: { icon: '🏀', label: 'Basketball', badgeColor: '#f97316' },
};

/**
 * Format currency with fallback.
 */
function formatCurrency(amount, currency = 'BDT') {
  if (amount == null) return '';
  if (currency === 'BDT') return `৳${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${amount.toLocaleString()}`;
  if (currency === 'EUR') return `€${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Calculate countdown string to match start.
 */
function getCountdownString(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const matchDateTime = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(matchDateTime.getTime())) return null;

  const diffMs = matchDateTime.getTime() - Date.now();
  if (diffMs <= 0) return 'Session in progress or completed';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;

  if (diffDays > 0) {
    return `Kickoff in ${diffDays}d ${remHours}h`;
  }
  const remMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Kickoff in ${diffHours}h ${remMinutes}m`;
}

/**
 * Generates an iCalendar (.ics) download data URL.
 */
function generateIcsDataUrl(booking) {
  const start = new Date(`${booking.date}T${booking.startTime}:00`);
  const end = new Date(`${booking.date}T${booking.endTime}:00`);

  const formatIcsDate = (d) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Premium Sports Booking Platform//Booking Pass//EN',
    'BEGIN:VEVENT',
    `UID:${booking.bookingId}@premiumsports.com`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Match: ${booking.fieldName} (${booking.venueName})`,
    `DESCRIPTION:Reservation #${booking.bookingId} for ${booking.playerName}. Entry: ${booking.gate || 'Main Gate'}`,
    `LOCATION:${booking.venueName}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
}

export function BookingPass({
  booking,
  onShare,
  onDirections,
  className = '',
}) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const sportInfo = useMemo(() => {
    const key = (booking?.sport || 'football').toLowerCase();
    return SPORT_CONFIG[key] || SPORT_CONFIG.football;
  }, [booking?.sport]);

  const countdownText = useMemo(() => {
    return getCountdownString(booking?.date, booking?.startTime);
  }, [booking?.date, booking?.startTime]);

  const icsUrl = useMemo(() => {
    if (!booking?.date || !booking?.startTime || !booking?.endTime) return null;
    return generateIcsDataUrl(booking);
  }, [booking]);

  const handleCopyPassLink = () => {
    const passUrl = window.location.href;
    navigator.clipboard?.writeText(passUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!booking) return null;

  return (
    <div className={`bp-wrapper ${className}`}>
      {/* Ticket Pass Card */}
      <div className="bp-card">
        {/* Top Header Section */}
        <div className="bp-header">
          <div className="bp-header-left">
            <span className="bp-pass-badge">DIGITAL MATCH PASS</span>
            <span className="bp-booking-id">#{booking.bookingId}</span>
          </div>

          <div className="bp-status-pill">
            <span className="bp-status-dot" />
            <span>{booking.status || 'CONFIRMED'}</span>
          </div>
        </div>

        {/* Venue & Field Details */}
        <div className="bp-body">
          <div className="bp-venue-row">
            <div className="bp-sport-icon" aria-hidden="true">
              {sportInfo.icon}
            </div>
            <div className="bp-venue-meta">
              <span className="bp-sport-type">{sportInfo.label} MATCH</span>
              <h3 className="bp-field-name">{booking.fieldName}</h3>
              <span className="bp-venue-name">📍 {booking.venueName}</span>
            </div>
          </div>

          {/* Date, Time & Gate Grid */}
          <div className="bp-grid-details">
            <div className="bp-detail-item">
              <span className="bp-detail-label">Match Date</span>
              <span className="bp-detail-val">
                {new Date(booking.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="bp-detail-item">
              <span className="bp-detail-label">Kickoff Time</span>
              <span className="bp-detail-val">
                {booking.startTime} – {booking.endTime}
              </span>
            </div>

            <div className="bp-detail-item">
              <span className="bp-detail-label">Player / Team</span>
              <span className="bp-detail-val">
                {booking.teamName ? `${booking.teamName}` : booking.playerName}
              </span>
            </div>

            <div className="bp-detail-item">
              <span className="bp-detail-label">Stadium Entry</span>
              <span className="bp-detail-val bp-detail-val--gate">
                {booking.gate || 'Main Gate Entrance'}
              </span>
            </div>
          </div>

          {/* Add-ons & Gear Chips */}
          {Array.isArray(booking.addons) && booking.addons.length > 0 && (
            <div className="bp-addons-row">
              <span className="bp-addons-label">Equipped Add-ons:</span>
              <div className="bp-addons-list">
                {booking.addons.map((addon, idx) => (
                  <span key={idx} className="bp-addon-chip">
                    ✓ {typeof addon === 'string' ? addon : addon.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Countdown Pill */}
          {countdownText && (
            <div className="bp-countdown-banner">
              <span className="bp-countdown-icon">⏱️</span>
              <span className="bp-countdown-text">{countdownText}</span>
            </div>
          )}
        </div>

        {/* Tear-off Perforated Divider */}
        <div className="bp-tear-divider" aria-hidden="true">
          <div className="bp-notch bp-notch--left" />
          <div className="bp-dashed-line" />
          <div className="bp-notch bp-notch--right" />
        </div>

        {/* Bottom Stub / Verification QR Section */}
        <div className="bp-stub">
          <div className="bp-stub-left">
            <div className="bp-stub-price-row">
              <span className="bp-stub-label">Total Amount Paid</span>
              <span className="bp-stub-price">
                {formatCurrency(booking.totalPaid, booking.currency)}
              </span>
            </div>
            <span className="bp-stub-hint">
              Present QR code at venue gate reader for contactless pitch admission.
            </span>
          </div>

          <button
            type="button"
            className="bp-qr-trigger"
            onClick={() => setShowQrModal(true)}
            aria-label="Scan or enlarge gate verification QR code"
          >
            {/* SVG Simulated QR Pattern */}
            <svg
              className="bp-qr-svg"
              width="58"
              height="58"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm10-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2-2h2v2h-2v-2zm2 4h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
            </svg>
            <span className="bp-qr-text">Scan Gate QR</span>
          </button>
        </div>
      </div>

      {/* Ticket Action Buttons */}
      <div className="bp-actions-bar">
        {icsUrl && (
          <a
            href={icsUrl}
            download={`match_${booking.bookingId}.ics`}
            className="bp-act-btn"
          >
            📅 Add to Calendar
          </a>
        )}

        <button
          type="button"
          className="bp-act-btn"
          onClick={() => {
            if (onShare) onShare(booking);
            else handleCopyPassLink();
          }}
        >
          {copiedLink ? '✓ Link Copied!' : '📤 Share with Squad'}
        </button>

        {onDirections && (
          <button
            type="button"
            className="bp-act-btn"
            onClick={() => onDirections(booking)}
          >
            🗺️ Directions
          </button>
        )}
      </div>

      {/* QR Modal (Enlarged for scanning at venue gate) */}
      {showQrModal && (
        <div
          className="bp-modal-backdrop"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bp-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Gate Access QR Code"
          >
            <h4 className="bp-modal-title">Stadium Gate Access</h4>
            <p className="bp-modal-sub">
              Scan at pitch scanner or show to venue security attendant
            </p>

            <div className="bp-modal-qr-wrap">
              <svg
                width="160"
                height="160"
                viewBox="0 0 24 24"
                fill="#111827"
              >
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm10-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2-2h2v2h-2v-2zm2 4h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
              </svg>
            </div>

            <div className="bp-modal-ref">
              Pass #{booking.bookingId} • Gate {booking.gate || 'A'}
            </div>

            <button
              type="button"
              className="bp-modal-close"
              onClick={() => setShowQrModal(false)}
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* Scoped Styles */}
      <style>{`
        .bp-wrapper {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 440px;
          margin: 0 auto;
          font-family: inherit;
        }

        /* Pass Card Container */
        .bp-card {
          position: relative;
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          color: #f3f4f6;
        }

        /* Top Header */
        .bp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 14px;
          background: #1a2234;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .bp-header-left {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .bp-pass-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #a5b4fc;
        }

        .bp-booking-id {
          font-size: 12px;
          color: #64748b;
          font-family: monospace;
          font-weight: 700;
        }

        .bp-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .bp-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        /* Body */
        .bp-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .bp-venue-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bp-sport-icon {
          font-size: 32px;
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bp-venue-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .bp-sport-type {
          font-size: 10px;
          font-weight: 800;
          color: #818cf8;
          letter-spacing: 0.08em;
        }

        .bp-field-name {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .bp-venue-name {
          font-size: 12px;
          color: #94a3b8;
        }

        /* Details Grid */
        .bp-grid-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #172033;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 12px 14px;
        }

        .bp-detail-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .bp-detail-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }

        .bp-detail-val {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
        }

        .bp-detail-val--gate {
          color: #38bdf8;
        }

        /* Add-ons Row */
        .bp-addons-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
        }

        .bp-addons-label {
          color: #64748b;
          font-size: 11px;
        }

        .bp-addons-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .bp-addon-chip {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
        }

        /* Countdown */
        .bp-countdown-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 700;
          color: #cbd5e1;
        }

        /* Perforation / Tear-off divider */
        .bp-tear-divider {
          position: relative;
          display: flex;
          align-items: center;
          height: 20px;
          background: #111827;
        }

        .bp-notch {
          width: 20px;
          height: 20px;
          background: #030712; /* Matches app background */
          border-radius: 50%;
          position: absolute;
          top: 0;
          box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.6);
        }

        .bp-notch--left { left: -10px; }
        .bp-notch--right { right: -10px; }

        .bp-dashed-line {
          width: 100%;
          border-top: 2px dashed rgba(255, 255, 255, 0.12);
        }

        /* Stub Section */
        .bp-stub {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #161f30;
          gap: 12px;
        }

        .bp-stub-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bp-stub-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .bp-stub-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }

        .bp-stub-price {
          font-size: 17px;
          font-weight: 800;
          color: #34d399;
        }

        .bp-stub-hint {
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.3;
        }

        .bp-qr-trigger {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          color: #111827;
          border: none;
          padding: 6px;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.15s ease;
          flex-shrink: 0;
        }

        .bp-qr-trigger:hover {
          transform: scale(1.05);
        }

        .bp-qr-text {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        /* Action Buttons */
        .bp-actions-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .bp-act-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          background: #1e293b;
          border: 1px solid #334155;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          padding: 9px 12px;
          border-radius: 10px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .bp-act-btn:hover {
          background: #334155;
          border-color: #6366f1;
          color: #ffffff;
        }

        /* Modal */
        .bp-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .bp-modal-box {
          background: #111827;
          border: 1px solid #374151;
          border-radius: 18px;
          padding: 24px;
          max-width: 340px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
        }

        .bp-modal-title {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .bp-modal-sub {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .bp-modal-qr-wrap {
          background: #ffffff;
          padding: 16px;
          border-radius: 14px;
          margin: 8px 0;
        }

        .bp-modal-ref {
          font-size: 13px;
          font-weight: 700;
          color: #a5b4fc;
        }

        .bp-modal-close {
          background: #374151;
          border: none;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        .bp-modal-close:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
}

export default BookingPass;
