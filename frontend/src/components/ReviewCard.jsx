/**
 * ReviewCard.jsx — Sports Venue & Pitch Player Review Component
 * Premium Sports Field Booking Platform
 *
 * A specialized review card for sports field bookings:
 *  - Overall star rating with category breakdown (Turf Quality, Lighting, Amenities, Parking)
 *  - Verified Player badge with match count history
 *  - Sport played tag and match context pill
 *  - Interactive "Helpful" vote counter with optimistic state
 *  - Pitch condition photo thumbnails with click-to-enlarge modal
 *  - Official venue management response block
 *  - Zero external dependencies with dark glassmorphic styling
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * <ReviewCard
 *   review={{
 *     id: 'rev_101',
 *     author: { name: 'Tanvir Ahmed', matchesPlayed: 16, isVerified: true },
 *     rating: 4.8,
 *     createdAt: '2026-10-18T14:00:00Z',
 *     sport: '7v7 Football',
 *     title: 'Incredible turf grip and flawless night floodlights',
 *     comment: 'The rubber crumb infill was evenly distributed. No slipping during sprint cuts.',
 *     subRatings: {
 *       turfQuality: 5,
 *       lighting: 5,
 *       amenities: 4,
 *       parking: 4,
 *     },
 *     helpfulCount: 24,
 *     venueResponse: {
 *       responderName: 'Arena Operations Manager',
 *       comment: 'Thanks for the feedback Tanvir! Glad the evening lighting delivered.',
 *     },
 *   }}
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';

const SUB_RATING_LABELS = {
  turfQuality: { label: 'Turf Surface', icon: '🌱' },
  lighting: { label: 'Floodlights', icon: '💡' },
  amenities: { label: 'Locker & Showers', icon: '🚿' },
  parking: { label: 'Parking & Access', icon: '🚗' },
};

/**
 * Format relative date string.
 */
function formatReviewDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Render numeric stars as SVG icons.
 */
function renderStars(rating = 5) {
  const rounded = Math.round(rating);
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= rounded;
    stars.push(
      <span
        key={i}
        className={`rc-star ${isFilled ? 'rc-star--filled' : 'rc-star--empty'}`}
        aria-hidden="true"
      >
        ★
      </span>
    );
  }
  return stars;
}

export function ReviewCard({
  review,
  onHelpfulClick,
  onReport,
  className = '',
}) {
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulDelta, setHelpfulDelta] = useState(0);
  const [showSubRatings, setShowSubRatings] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  if (!review) return null;

  const {
    id,
    author = {},
    rating = 5,
    createdAt,
    sport,
    title,
    comment,
    subRatings = {},
    photos = [],
    helpfulCount = 0,
    venueResponse,
  } = review;

  const handleHelpfulToggle = () => {
    if (isHelpful) {
      setIsHelpful(false);
      setHelpfulDelta((d) => d - 1);
    } else {
      setIsHelpful(true);
      setHelpfulDelta((d) => d + 1);
    }
    onHelpfulClick?.(id);
  };

  const hasSubRatings = Object.keys(subRatings).length > 0;
  const initialLetter = author.name ? author.name.charAt(0).toUpperCase() : 'P';

  return (
    <div className={`rc-card ${className}`}>
      {/* Header: User Avatar, Name, Verified Badge, Date */}
      <div className="rc-header">
        <div className="rc-author-block">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="rc-avatar-img"
            />
          ) : (
            <div className="rc-avatar-fallback">{initialLetter}</div>
          )}

          <div className="rc-author-meta">
            <div className="rc-author-name-row">
              <span className="rc-author-name">{author.name || 'Verified Player'}</span>
              {author.isVerified && (
                <span className="rc-verified-badge" title="Verified pitch booking">
                  ✓ Verified Booker
                </span>
              )}
            </div>

            <div className="rc-sub-meta">
              {author.matchesPlayed != null && author.matchesPlayed > 0 && (
                <span className="rc-matches-played">
                  ⚽ {author.matchesPlayed} matches played
                </span>
              )}
              <span className="rc-date">{formatReviewDate(createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Rating Score Badge */}
        <div className="rc-rating-badge">
          <div className="rc-stars-row">{renderStars(rating)}</div>
          <span className="rc-score-num">{Number(rating).toFixed(1)}</span>
        </div>
      </div>

      {/* Sport Context Tag & Review Title */}
      <div className="rc-title-row">
        {sport && <span className="rc-sport-tag">🏆 {sport}</span>}
        {title && <h4 className="rc-title">{title}</h4>}
      </div>

      {/* Main Comment */}
      <p className="rc-comment">{comment}</p>

      {/* Photo Gallery Thumbnails */}
      {Array.isArray(photos) && photos.length > 0 && (
        <div className="rc-photos-row">
          {photos.map((photoUrl, idx) => (
            <button
              key={idx}
              type="button"
              className="rc-photo-btn"
              onClick={() => setActivePhoto(photoUrl)}
              aria-label={`View pitch condition photo ${idx + 1}`}
            >
              <img src={photoUrl} alt="Pitch condition" className="rc-photo-img" />
            </button>
          ))}
        </div>
      )}

      {/* Sub-ratings Breakdown Toggle */}
      {hasSubRatings && (
        <div className="rc-subratings-wrapper">
          <button
            type="button"
            className="rc-subratings-toggle"
            onClick={() => setShowSubRatings((o) => !o)}
            aria-expanded={showSubRatings}
          >
            <span>Category Ratings</span>
            <span className="rc-chevron">{showSubRatings ? '▲' : '▼'}</span>
          </button>

          {showSubRatings && (
            <div className="rc-subratings-grid">
              {Object.entries(subRatings).map(([key, val]) => {
                const config = SUB_RATING_LABELS[key] || { label: key, icon: '⭐' };
                const pct = Math.min(100, Math.max(0, (val / 5) * 100));

                return (
                  <div key={key} className="rc-subrating-item">
                    <div className="rc-subrating-labels">
                      <span>{config.icon} {config.label}</span>
                      <strong>{Number(val).toFixed(1)}</strong>
                    </div>
                    <div className="rc-subrating-track">
                      <div
                        className="rc-subrating-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Official Venue Management Response */}
      {venueResponse && (
        <div className="rc-venue-response">
          <div className="rc-response-header">
            <span className="rc-response-badge">🏢 Venue Response</span>
            <span className="rc-response-author">
              {venueResponse.responderName || 'Venue Management'}
            </span>
          </div>
          <p className="rc-response-text">{venueResponse.comment}</p>
        </div>
      )}

      {/* Footer: Helpful Button & Actions */}
      <div className="rc-footer">
        <button
          type="button"
          className={`rc-helpful-btn ${isHelpful ? 'rc-helpful-btn--active' : ''}`}
          onClick={handleHelpfulToggle}
          aria-pressed={isHelpful}
        >
          <span className="rc-helpful-icon">{isHelpful ? '👍' : '👍'}</span>
          <span>Helpful ({helpfulCount + helpfulDelta})</span>
        </button>

        {onReport && (
          <button
            type="button"
            className="rc-report-btn"
            onClick={() => onReport(id)}
          >
            Report
          </button>
        )}
      </div>

      {/* Photo Preview Modal */}
      {activePhoto && (
        <div
          className="rc-photo-modal-backdrop"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="rc-photo-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <img src={activePhoto} alt="Pitch detail full view" className="rc-modal-img" />
            <button
              type="button"
              className="rc-photo-modal-close"
              onClick={() => setActivePhoto(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Scoped Styling */}
      <style>{`
        .rc-card {
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 16px;
          padding: 18px 20px;
          color: #f3f4f6;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .rc-card:hover {
          border-color: #374151;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        /* Header */
        .rc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .rc-author-block {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rc-avatar-img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #374151;
        }

        .rc-avatar-fallback {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #6366f1;
          color: #ffffff;
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rc-author-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rc-author-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rc-author-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .rc-verified-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .rc-sub-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #94a3b8;
        }

        .rc-matches-played {
          color: #a5b4fc;
          font-weight: 600;
        }

        .rc-date {
          color: #64748b;
        }

        /* Rating Badge */
        .rc-rating-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1e293b;
          border: 1px solid #334155;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .rc-stars-row {
          display: flex;
          gap: 2px;
        }

        .rc-star {
          font-size: 13px;
        }

        .rc-star--filled {
          color: #f59e0b;
        }

        .rc-star--empty {
          color: #4b5563;
        }

        .rc-score-num {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
        }

        /* Title & Sport */
        .rc-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rc-sport-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
        }

        .rc-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .rc-comment {
          font-size: 13px;
          line-height: 1.5;
          color: #cbd5e1;
          margin: 0;
        }

        /* Photos Row */
        .rc-photos-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .rc-photos-row::-webkit-scrollbar { display: none; }

        .rc-photo-btn {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .rc-photo-img {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #374151;
          transition: transform 0.15s ease;
        }

        .rc-photo-img:hover {
          transform: scale(1.05);
        }

        /* Sub-ratings */
        .rc-subratings-wrapper {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 8px;
        }

        .rc-subratings-toggle {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
        }

        .rc-subratings-toggle:hover {
          color: #ffffff;
        }

        .rc-chevron {
          font-size: 9px;
        }

        .rc-subratings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 8px;
          background: #172033;
          border-radius: 10px;
          padding: 10px 14px;
        }

        .rc-subrating-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rc-subrating-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }

        .rc-subrating-labels strong {
          color: #f3f4f6;
        }

        .rc-subrating-track {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .rc-subrating-fill {
          height: 100%;
          background: #10b981;
          border-radius: 4px;
        }

        /* Official Venue Response */
        .rc-venue-response {
          background: rgba(99, 102, 241, 0.08);
          border-left: 3px solid #6366f1;
          border-radius: 0 10px 10px 0;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rc-response-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rc-response-badge {
          font-size: 11px;
          font-weight: 800;
          color: #818cf8;
          text-transform: uppercase;
        }

        .rc-response-author {
          font-size: 11px;
          color: #94a3b8;
        }

        .rc-response-text {
          font-size: 12px;
          color: #cbd5e1;
          line-height: 1.4;
          margin: 0;
        }

        /* Footer */
        .rc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 10px;
        }

        .rc-helpful-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #1e293b;
          border: 1px solid #334155;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .rc-helpful-btn:hover {
          background: #334155;
          color: #ffffff;
        }

        .rc-helpful-btn--active {
          background: rgba(16, 185, 129, 0.15);
          border-color: #10b981;
          color: #34d399;
        }

        .rc-report-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 11px;
          cursor: pointer;
        }

        .rc-report-btn:hover {
          color: #ef4444;
        }

        /* Photo Modal */
        .rc-photo-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .rc-photo-modal-box {
          position: relative;
          max-width: 90vw;
          max-height: 85vh;
        }

        .rc-modal-img {
          max-width: 100%;
          max-height: 80vh;
          border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8);
        }

        .rc-photo-modal-close {
          position: absolute;
          top: -12px;
          right: -12px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1e293b;
          border: 1px solid #4b5563;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

export default ReviewCard;
