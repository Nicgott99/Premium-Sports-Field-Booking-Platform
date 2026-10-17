/**
 * TimeSlotPicker.jsx — Interactive Sports Field Time Slot Picker
 * Premium Sports Booking Platform
 *
 * A high-performance, accessible time-slot picker designed for sports venue booking:
 *  - Categorized time periods (All, Morning, Afternoon, Evening, Night)
 *  - Real-time slot status states: Available, Peak (Surge), Reserved, Booked, Maintenance
 *  - Single-slot or multi-slot consecutive selection modes
 *  - Duration filter toggle (60 min, 90 min, 120 min)
 *  - Dynamic price tags with surge indicators and discount badges
 *  - Live summary tray showing total duration, calculated price, and selection counter
 *  - Full keyboard accessibility and mobile-responsive layout
 *  - Zero external dependencies with premium glassmorphic dark styling
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * <TimeSlotPicker
 *   date="2026-10-17"
 *   slots={[
 *     { id: 's1', startTime: '08:00', endTime: '09:00', status: 'available', price: 40, period: 'morning' },
 *     { id: 's2', startTime: '18:00', endTime: '19:00', status: 'peak', price: 65, period: 'evening', badge: 'Peak Surge' },
 *     { id: 's3', startTime: '19:00', endTime: '20:00', status: 'booked', price: 65, period: 'evening' },
 *   ]}
 *   selectedSlots={selectedIds}
 *   onChange={(slotIds, details) => handleSelect(slotIds, details)}
 *   currency="BDT"
 *   mode="multi" // 'single' | 'multi'
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback } from 'react';

// ─── Period Filters ──────────────────────────────────────────────────────────

const PERIODS = [
  { id: 'all', label: 'All Slots', icon: '⚡' },
  { id: 'morning', label: 'Morning (06:00–12:00)', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon (12:00–17:00)', icon: '☀️' },
  { id: 'evening', label: 'Evening (17:00–22:00)', icon: '🌆' },
  { id: 'night', label: 'Night (22:00+)', icon: '🌙' },
];

const DURATIONS = [
  { value: 60, label: '1 Hour' },
  { value: 90, label: '1.5 Hours' },
  { value: 120, label: '2 Hours' },
];

/**
 * Determine period from start time string "HH:MM".
 */
function getPeriodForTime(timeStr = '') {
  const hour = Number.parseInt(timeStr.split(':')[0], 10);
  if (Number.isNaN(hour)) return 'all';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Format currency with fallback.
 */
function formatSlotPrice(amount, currency = 'BDT') {
  if (amount == null) return '';
  if (currency === 'BDT') return `৳${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${amount.toLocaleString()}`;
  if (currency === 'EUR') return `€${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Compute CSS class for slot card status.
 */
function getSlotCardStateClass(slot, isSelected) {
  if (slot.status === 'booked') return 'tsp-slot--booked';
  if (slot.status === 'reserved') return 'tsp-slot--reserved';
  if (slot.status === 'maintenance') return 'tsp-slot--maintenance';
  if (isSelected) return 'tsp-slot--selected';
  if (slot.status === 'peak') return 'tsp-slot--peak';
  return 'tsp-slot--available';
}

/**
 * Compute badge text for slot card.
 */
function getSlotBadgeText(slot) {
  if (slot.badge) return slot.badge;
  if (slot.status === 'peak') return '🔥 Peak';
  if (slot.status === 'booked') return 'Booked';
  if (slot.status === 'reserved') return 'Reserved';
  if (slot.status === 'maintenance') return 'Unavailable';
  return null;
}

/**
 * Determine trailing icon for slot card.
 */
function getSlotStatusIcon(slot, isSelected) {
  if (isSelected) return '✓';
  if (slot.status === 'booked' || slot.status === 'reserved') return '🔒';
  if (slot.status === 'peak') return '⚡';
  return '+';
}

export function TimeSlotPicker({
  date,
  slots = [],
  selectedSlots = [],
  onChange,
  onConfirm,
  currency = 'BDT',
  mode = 'multi', // 'single' | 'multi'
  maxSlots = 4,
  disabled = false,
  className = '',
  emptyMessage = 'No time slots available for this period.',
}) {
  const [activePeriod, setActivePeriod] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState(60);

  // Normalize selected IDs set for O(1) checks
  const selectedSet = useMemo(() => new Set(selectedSlots), [selectedSlots]);

  // Filter slots by selected period
  const filteredSlots = useMemo(() => {
    if (activePeriod === 'all') return slots;
    return slots.filter((slot) => {
      const slotPeriod = slot.period || getPeriodForTime(slot.startTime);
      return slotPeriod === activePeriod;
    });
  }, [slots, activePeriod]);

  // Aggregate stats
  const stats = useMemo(() => {
    let availableCount = 0;
    let peakCount = 0;
    for (const s of slots) {
      if (s.status === 'available') availableCount++;
      if (s.status === 'peak') {
        availableCount++;
        peakCount++;
      }
    }
    return { total: slots.length, availableCount, peakCount };
  }, [slots]);

  // Details of currently selected slots
  const selectedDetails = useMemo(() => {
    return slots.filter((s) => selectedSet.has(s.id));
  }, [slots, selectedSet]);

  const totalPrice = useMemo(() => {
    return selectedDetails.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }, [selectedDetails]);

  const totalDurationMinutes = useMemo(() => {
    return selectedDetails.length * selectedDuration;
  }, [selectedDetails, selectedDuration]);

  // ── Slot Click Handler ──────────────────────────────────────────────────────

  const handleSlotClick = useCallback(
    (slot) => {
      if (disabled) return;
      if (slot.status === 'booked' || slot.status === 'maintenance' || slot.status === 'reserved') {
        return;
      }

      if (mode === 'single') {
        const next = selectedSet.has(slot.id) ? [] : [slot.id];
        const nextDetails = slots.filter((s) => next.includes(s.id));
        onChange?.(next, nextDetails);
        return;
      }

      // Multi-slot toggle
      const nextSet = new Set(selectedSet);
      if (nextSet.has(slot.id)) {
        nextSet.delete(slot.id);
      } else {
        if (nextSet.size >= maxSlots) return;
        nextSet.add(slot.id);
      }

      const nextArr = Array.from(nextSet);
      const nextDetails = slots.filter((s) => nextArr.includes(s.id));
      onChange?.(nextArr, nextDetails);
    },
    [disabled, mode, selectedSet, maxSlots, slots, onChange]
  );

  const clearSelection = useCallback(() => {
    onChange?.([], []);
  }, [onChange]);

  return (
    <div className={`tsp-container ${className}`}>
      {/* Header Bar */}
      <div className="tsp-header">
        <div className="tsp-title-wrap">
          <h3 className="tsp-title">Available Time Slots</h3>
          {date && (
            <span className="tsp-date-badge">
              📅 {typeof date === 'string' ? date : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Duration selector */}
        <div className="tsp-duration-selector" aria-label="Duration">
          <span className="tsp-duration-label">Session:</span>
          {DURATIONS.map((dur) => (
            <button
              key={dur.value}
              type="button"
              className={`tsp-dur-btn ${selectedDuration === dur.value ? 'tsp-dur-btn--active' : ''}`}
              onClick={() => setSelectedDuration(dur.value)}
            >
              {dur.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Availability Overview */}
      <div className="tsp-legend">
        <div className="tsp-legend-item">
          <span className="tsp-dot tsp-dot--available" />
          <span>Available ({stats.availableCount})</span>
        </div>
        <div className="tsp-legend-item">
          <span className="tsp-dot tsp-dot--peak" />
          <span>Peak Surge ({stats.peakCount})</span>
        </div>
        <div className="tsp-legend-item">
          <span className="tsp-dot tsp-dot--selected" />
          <span>Selected ({selectedSet.size})</span>
        </div>
        <div className="tsp-legend-item">
          <span className="tsp-dot tsp-dot--booked" />
          <span>Booked</span>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="tsp-periods-bar" role="tablist">
        {PERIODS.map((period) => (
          <button
            key={period.id}
            type="button"
            role="tab"
            aria-selected={activePeriod === period.id}
            className={`tsp-period-tab ${activePeriod === period.id ? 'tsp-period-tab--active' : ''}`}
            onClick={() => setActivePeriod(period.id)}
          >
            <span className="tsp-period-icon">{period.icon}</span>
            <span>{period.label}</span>
          </button>
        ))}
      </div>

      {/* Slots Grid */}
      {filteredSlots.length === 0 ? (
        <div className="tsp-empty-state">
          <span className="tsp-empty-icon">⏳</span>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="tsp-grid">
          {filteredSlots.map((slot) => {
            const isSelected = selectedSet.has(slot.id);
            const isBooked = slot.status === 'booked';
            const isReserved = slot.status === 'reserved';
            const isMaintenance = slot.status === 'maintenance';
            const isPeak = slot.status === 'peak';
            const isClickable = !isBooked && !isReserved && !isMaintenance && !disabled;
            const cardStateClass = getSlotCardStateClass(slot, isSelected);
            const badgeText = getSlotBadgeText(slot);
            const statusIcon = getSlotStatusIcon(slot, isSelected);

            return (
              <button
                key={slot.id}
                type="button"
                disabled={!isClickable}
                aria-pressed={isSelected}
                className={`tsp-slot-card ${cardStateClass}`}
                onClick={() => handleSlotClick(slot)}
              >
                {/* Badge (Peak, Discount, or Status) */}
                {badgeText && (
                  <span className={`tsp-slot-tag ${isPeak ? 'tsp-slot-tag--peak' : ''} ${isBooked ? 'tsp-slot-tag--booked' : ''}`}>
                    {badgeText}
                  </span>
                )}

                <div className="tsp-time-range">
                  <span className="tsp-time-start">{slot.startTime}</span>
                  <span className="tsp-time-sep">→</span>
                  <span className="tsp-time-end">{slot.endTime}</span>
                </div>

                <div className="tsp-card-footer">
                  <span className="tsp-price">
                    {formatSlotPrice(slot.price, currency)}
                  </span>
                  <span className="tsp-status-icon">
                    {statusIcon}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Summary Bar (when slots are selected) */}
      {selectedDetails.length > 0 && (
        <div className="tsp-summary-tray">
          <div className="tsp-summary-info">
            <div className="tsp-summary-badge">
              {selectedDetails.length} slot{selectedDetails.length > 1 ? 's' : ''} chosen
            </div>
            <div className="tsp-summary-duration">
              ⏱️ {totalDurationMinutes} mins total
            </div>
            <div className="tsp-summary-price">
              Total: <strong>{formatSlotPrice(totalPrice, currency)}</strong>
            </div>
          </div>

          <div className="tsp-summary-actions">
            <button
              type="button"
              className="tsp-clear-btn"
              onClick={clearSelection}
            >
              Clear
            </button>
            {onConfirm && (
              <button
                type="button"
                className="tsp-confirm-btn"
                onClick={() => onConfirm(selectedDetails, totalPrice)}
              >
                Continue with {selectedDetails.length} slot{selectedDetails.length > 1 ? 's' : ''} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scoped Styling */}
      <style>{`
        .tsp-container {
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 16px;
          padding: 20px;
          color: #f3f4f6;
          font-family: inherit;
        }

        .tsp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }

        .tsp-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tsp-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .tsp-date-badge {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 20px;
          color: #94a3b8;
        }

        .tsp-duration-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #1e293b;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #334155;
        }

        .tsp-duration-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          padding: 0 6px;
        }

        .tsp-dur-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tsp-dur-btn:hover {
          color: #ffffff;
        }

        .tsp-dur-btn--active {
          background: #6366f1;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }

        /* Legend */
        .tsp-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 14px;
          font-size: 12px;
          color: #94a3b8;
        }

        .tsp-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tsp-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .tsp-dot--available { background: #10b981; }
        .tsp-dot--peak { background: #f59e0b; }
        .tsp-dot--selected { background: #6366f1; }
        .tsp-dot--booked { background: #4b5563; }

        /* Periods Tab Bar */
        .tsp-periods-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 16px;
          scrollbar-width: none;
        }
        .tsp-periods-bar::-webkit-scrollbar { display: none; }

        .tsp-period-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 8px;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 500;
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tsp-period-tab:hover {
          background: #374151;
          color: #f3f4f6;
        }

        .tsp-period-tab--active {
          background: rgba(99, 102, 241, 0.15);
          border-color: #6366f1;
          color: #a5b4fc;
        }

        /* Grid */
        .tsp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }

        /* Slot Card */
        .tsp-slot-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
          border-radius: 12px;
          border: 1.5px solid #1f2937;
          background: #1e293b;
          color: #f3f4f6;
          cursor: pointer;
          min-height: 86px;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tsp-slot--available:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .tsp-slot--peak {
          border-color: rgba(245, 158, 11, 0.4);
          background: linear-gradient(135deg, #1e293b 0%, rgba(245, 158, 11, 0.08) 100%);
        }

        .tsp-slot--peak:hover {
          border-color: #f59e0b;
          transform: translateY(-2px);
        }

        .tsp-slot--selected {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(79, 70, 229, 0.2) 100%);
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4), 0 8px 16px rgba(0, 0, 0, 0.4);
          transform: translateY(-2px);
        }

        .tsp-slot--booked, .tsp-slot--maintenance, .tsp-slot--reserved {
          background: #111827;
          border-color: #1f2937;
          opacity: 0.45;
          cursor: not-allowed;
        }

        .tsp-slot-tag {
          position: absolute;
          top: -8px;
          right: 8px;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          background: #374151;
          color: #d1d5db;
          letter-spacing: 0.02em;
        }

        .tsp-slot-tag--peak {
          background: #f59e0b;
          color: #111827;
        }

        .tsp-slot-tag--booked {
          background: #374151;
          color: #9ca3af;
        }

        .tsp-time-range {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .tsp-time-sep {
          color: #64748b;
          font-size: 11px;
        }

        .tsp-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }

        .tsp-price {
          font-size: 13px;
          font-weight: 600;
          color: #10b981;
        }

        .tsp-slot--selected .tsp-price {
          color: #a5b4fc;
        }

        .tsp-status-icon {
          font-size: 12px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tsp-slot--selected .tsp-status-icon {
          background: #6366f1;
          color: #ffffff;
        }

        /* Empty state */
        .tsp-empty-state {
          padding: 36px 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }
        .tsp-empty-icon {
          font-size: 28px;
          display: block;
          margin-bottom: 8px;
        }

        /* Summary Tray */
        .tsp-summary-tray {
          margin-top: 20px;
          background: linear-gradient(135deg, #1e293b 0%, #172554 100%);
          border: 1px solid #3b82f6;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          animation: tspSlideUp 0.2s ease-out;
        }

        @keyframes tspSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tsp-summary-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .tsp-summary-badge {
          background: #6366f1;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .tsp-summary-duration {
          font-size: 13px;
          color: #cbd5e1;
          font-weight: 500;
        }

        .tsp-summary-price {
          font-size: 14px;
          color: #e2e8f0;
        }

        .tsp-summary-price strong {
          color: #34d399;
          font-size: 16px;
        }

        .tsp-summary-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tsp-clear-btn {
          background: transparent;
          border: 1px solid #475569;
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tsp-clear-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
          color: #fca5a5;
        }

        .tsp-confirm-btn {
          background: #6366f1;
          border: none;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .tsp-confirm-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

export default TimeSlotPicker;
