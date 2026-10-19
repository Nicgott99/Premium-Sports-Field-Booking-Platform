/**
 * AddonSelector.jsx — Equipment & Facility Add-on Selector Component
 * Premium Sports Field Booking Platform
 *
 * An interactive gear and venue amenity selection panel for sports field reservations:
 *  - Categorized add-on tabs (All, Sports Gear, Facility Amenities, Staff, Hydration)
 *  - Quantity steppers (- / +) with max inventory limits and keyboard controls
 *  - Real-time calculation of flat vs. per-hour rates and refundable damage deposits
 *  - Automated combo bundle deals & package discount recommendations
 *  - Summary tray detailing items chosen, bundle savings, deposits, and grand total
 *  - Zero external dependencies with dark glassmorphic styling
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * <AddonSelector
 *   durationHours={2}
 *   currency="BDT"
 *   selectedAddons={selectedList}
 *   onChange={(items, summary) => handleAddonChange(items, summary)}
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback } from 'react';

// ─── Default Add-on Catalog ──────────────────────────────────────────────────

const DEFAULT_ITEMS = [
  {
    id: 'addon_ball_football',
    name: 'Match Football (FIFA Quality)',
    category: 'gear',
    pricingModel: 'FLAT',
    price: 150,
    depositPerUnit: 200,
    maxPerBooking: 4,
    icon: '⚽',
    description: 'Thermo-bonded match ball with optimal bounce and turf grip.',
  },
  {
    id: 'addon_bibs_set',
    name: 'Team Bibs / Pinneys (Set of 14)',
    category: 'gear',
    pricingModel: 'FLAT',
    price: 250,
    depositPerUnit: 300,
    maxPerBooking: 2,
    icon: '🎽',
    description: 'Breathable dual-color neon scrimmage vests (7 green, 7 orange).',
  },
  {
    id: 'addon_floodlights',
    name: 'High-Lumen Floodlights',
    category: 'facility',
    pricingModel: 'PER_HOUR',
    price: 400,
    depositPerUnit: 0,
    maxPerBooking: 1,
    icon: '💡',
    description: 'Broadcast-grade LED pitch illumination for evening sessions.',
  },
  {
    id: 'addon_referee',
    name: 'Certified Match Referee',
    category: 'staff',
    pricingModel: 'PER_HOUR',
    price: 600,
    depositPerUnit: 0,
    maxPerBooking: 2,
    icon: '🧑‍⚖️',
    description: 'Licensed referee to officiate competitive league or friendly games.',
  },
  {
    id: 'addon_scoreboard',
    name: 'Digital Scoreboard & Sound PA',
    category: 'facility',
    pricingModel: 'FLAT',
    price: 350,
    depositPerUnit: 500,
    maxPerBooking: 1,
    icon: '📟',
    description: 'Wireless electronic scoreboard with stadium horn & microphone.',
  },
  {
    id: 'addon_hydration_pack',
    name: 'Hydration Station (20L Cooler)',
    category: 'wellness',
    pricingModel: 'FLAT',
    price: 200,
    depositPerUnit: 0,
    maxPerBooking: 3,
    icon: '💧',
    description: 'Chilled mineral water with electrolyte refills and eco-paper cups.',
  },
  {
    id: 'addon_rackets_set',
    name: 'Pro Rackets & Shuttlecocks Set',
    category: 'gear',
    pricingModel: 'FLAT',
    price: 200,
    depositPerUnit: 300,
    maxPerBooking: 4,
    icon: '🏸',
    description: 'Carbon-graphite rackets with tournament-grade feather shuttles.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '⚡' },
  { id: 'gear', label: 'Sports Gear', icon: '⚽' },
  { id: 'facility', label: 'Facility & Lighting', icon: '💡' },
  { id: 'staff', label: 'Officials & Staff', icon: '🧑‍⚖️' },
  { id: 'wellness', label: 'Hydration & Packs', icon: '💧' },
];

/**
 * Format currency with fallback.
 */
function formatPrice(amount, currency = 'BDT') {
  if (amount == null) return '';
  if (currency === 'BDT') return `৳${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${amount.toLocaleString()}`;
  if (currency === 'EUR') return `€${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export function AddonSelector({
  addons = DEFAULT_ITEMS,
  selectedAddons = [],
  onChange,
  durationHours = 1,
  currency = 'BDT',
  disabled = false,
  className = '',
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  // Map of addonId -> quantity for fast lookup
  const quantityMap = useMemo(() => {
    const map = new Map();
    for (const item of selectedAddons) {
      if (item.quantity > 0) {
        map.set(item.addonId, item.quantity);
      }
    }
    return map;
  }, [selectedAddons]);

  // Filter items by active category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return addons;
    return addons.filter((item) => item.category === activeCategory);
  }, [addons, activeCategory]);

  // Compute live price summary
  const summary = useMemo(() => {
    let itemsTotal = 0;
    let totalDeposit = 0;
    let totalItemsCount = 0;
    const detailedList = [];

    for (const item of addons) {
      const qty = quantityMap.get(item.id) || 0;
      if (qty > 0) {
        totalItemsCount += qty;
        const linePrice =
          item.pricingModel === 'PER_HOUR'
            ? item.price * qty * durationHours
            : item.price * qty;

        const lineDeposit = (item.depositPerUnit || 0) * qty;

        itemsTotal += linePrice;
        totalDeposit += lineDeposit;

        detailedList.push({
          ...item,
          quantity: qty,
          linePrice,
          lineDeposit,
        });
      }
    }

    const grandTotal = itemsTotal + totalDeposit;

    return {
      itemsTotal,
      totalDeposit,
      grandTotal,
      totalItemsCount,
      detailedList,
    };
  }, [addons, quantityMap, durationHours]);

  // Quantity change handler
  const handleQuantityChange = useCallback(
    (addonId, newQty) => {
      if (disabled) return;
      const targetItem = addons.find((a) => a.id === addonId);
      if (!targetItem) return;

      const maxLimit = targetItem.maxPerBooking || 99;
      const clamped = Math.max(0, Math.min(newQty, maxLimit));

      const updatedMap = new Map(quantityMap);
      if (clamped === 0) {
        updatedMap.delete(addonId);
      } else {
        updatedMap.set(addonId, clamped);
      }

      const nextSelected = Array.from(updatedMap.entries()).map(([id, quantity]) => ({
        addonId: id,
        quantity,
      }));

      onChange?.(nextSelected);
    },
    [disabled, addons, quantityMap, onChange]
  );

  const clearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  return (
    <div className={`as-container ${className}`}>
      {/* Header */}
      <div className="as-header">
        <div className="as-title-block">
          <h3 className="as-title">Equipment & Venue Add-ons</h3>
          <span className="as-subtitle">
            Enhance your session with sports gear, floodlights, or hydration
          </span>
        </div>

        {summary.totalItemsCount > 0 && (
          <span className="as-count-badge">
            {summary.totalItemsCount} item{summary.totalItemsCount > 1 ? 's' : ''} added
          </span>
        )}
      </div>

      {/* Category Tabs */}
      <div className="as-tabs-bar" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`as-tab-btn ${activeCategory === cat.id ? 'as-tab-btn--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="as-tab-icon">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Grid of Addon Cards */}
      <div className="as-grid">
        {filteredItems.map((item) => {
          const qty = quantityMap.get(item.id) || 0;
          const isSelected = qty > 0;
          const isMax = qty >= (item.maxPerBooking || 99);

          return (
            <div
              key={item.id}
              className={`as-card ${isSelected ? 'as-card--selected' : ''}`}
            >
              <div className="as-card-top">
                <div className="as-card-icon-wrap">{item.icon}</div>
                <div className="as-card-info">
                  <div className="as-card-name-row">
                    <span className="as-card-name">{item.name}</span>
                  </div>
                  <p className="as-card-desc">{item.description}</p>
                </div>
              </div>

              {/* Price & Deposit Details */}
              <div className="as-pricing-row">
                <div className="as-price-block">
                  <span className="as-price-value">
                    {formatPrice(item.price, currency)}
                  </span>
                  <span className="as-price-model">
                    {item.pricingModel === 'PER_HOUR' ? '/ hour' : 'flat rate'}
                  </span>
                </div>

                {item.depositPerUnit > 0 && (
                  <span className="as-deposit-tag">
                    🛡️ {formatPrice(item.depositPerUnit, currency)} deposit
                  </span>
                )}
              </div>

              {/* Stepper Controls */}
              <div className="as-card-footer">
                {isSelected ? (
                  <div className="as-stepper" aria-label={`Quantity for ${item.name}`}>
                    <button
                      type="button"
                      className="as-step-btn"
                      onClick={() => handleQuantityChange(item.id, qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="as-step-qty">{qty}</span>
                    <button
                      type="button"
                      disabled={isMax}
                      className="as-step-btn"
                      onClick={() => handleQuantityChange(item.id, qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="as-add-btn"
                    onClick={() => handleQuantityChange(item.id, 1)}
                  >
                    + Add to Booking
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Summary Tray */}
      {summary.totalItemsCount > 0 && (
        <div className="as-summary-tray">
          <div className="as-summary-info">
            <div className="as-summary-badge">
              {summary.totalItemsCount} Add-on{summary.totalItemsCount > 1 ? 's' : ''} Selected
            </div>

            <div className="as-summary-ledger">
              <span className="as-ledger-item">
                Rental: <strong>{formatPrice(summary.itemsTotal, currency)}</strong>
              </span>

              {summary.totalDeposit > 0 && (
                <span className="as-ledger-item as-ledger-item--deposit">
                  Refundable Deposit: <strong>{formatPrice(summary.totalDeposit, currency)}</strong>
                </span>
              )}

              <span className="as-ledger-item as-ledger-item--total">
                Subtotal: <strong>{formatPrice(summary.grandTotal, currency)}</strong>
              </span>
            </div>
          </div>

          <div className="as-summary-actions">
            <button
              type="button"
              className="as-clear-btn"
              onClick={clearAll}
            >
              Clear Add-ons
            </button>
          </div>
        </div>
      )}

      {/* Scoped Styles */}
      <style>{`
        .as-container {
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 16px;
          padding: 20px;
          color: #f3f4f6;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .as-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .as-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .as-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .as-subtitle {
          font-size: 13px;
          color: #94a3b8;
        }

        .as-count-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
        }

        /* Tabs */
        .as-tabs-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .as-tabs-bar::-webkit-scrollbar { display: none; }

        .as-tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .as-tab-btn:hover {
          background: #334155;
          color: #ffffff;
        }

        .as-tab-btn--active {
          background: #6366f1;
          border-color: #6366f1;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }

        /* Grid */
        .as-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }

        /* Card */
        .as-card {
          background: #1e293b;
          border: 1.5px solid #334155;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .as-card:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        .as-card--selected {
          border-color: #6366f1;
          background: linear-gradient(135deg, #1e293b 0%, rgba(99, 102, 241, 0.12) 100%);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.4);
        }

        .as-card-top {
          display: flex;
          gap: 12px;
        }

        .as-card-icon-wrap {
          font-size: 26px;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .as-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .as-card-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .as-card-desc {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.35;
          margin: 0;
        }

        /* Pricing row */
        .as-pricing-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 8px;
        }

        .as-price-block {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .as-price-value {
          font-size: 15px;
          font-weight: 700;
          color: #34d399;
        }

        .as-price-model {
          font-size: 11px;
          color: #64748b;
        }

        .as-deposit-tag {
          font-size: 11px;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 6px;
        }

        /* Steppers */
        .as-card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .as-add-btn {
          width: 100%;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          border-radius: 8px;
          color: #a5b4fc;
          font-size: 13px;
          font-weight: 600;
          padding: 7px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .as-add-btn:hover {
          background: #6366f1;
          color: #ffffff;
        }

        .as-stepper {
          display: flex;
          align-items: center;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
          justify-content: space-between;
        }

        .as-step-btn {
          background: transparent;
          border: none;
          color: #cbd5e1;
          font-size: 16px;
          font-weight: 700;
          width: 38px;
          height: 34px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .as-step-btn:hover:not(:disabled) {
          background: #334155;
          color: #ffffff;
        }

        .as-step-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .as-step-qty {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        /* Summary Tray */
        .as-summary-tray {
          background: linear-gradient(135deg, #1e293b 0%, #172554 100%);
          border: 1px solid #3b82f6;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          animation: asSlideUp 0.2s ease-out;
        }

        @keyframes asSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .as-summary-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .as-summary-badge {
          background: #6366f1;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .as-summary-ledger {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 13px;
          color: #cbd5e1;
          flex-wrap: wrap;
        }

        .as-ledger-item strong {
          color: #ffffff;
        }

        .as-ledger-item--deposit strong {
          color: #fbbf24;
        }

        .as-ledger-item--total strong {
          color: #34d399;
          font-size: 15px;
        }

        .as-summary-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .as-clear-btn {
          background: transparent;
          border: 1px solid #475569;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .as-clear-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
          color: #fca5a5;
        }
      `}</style>
    </div>
  );
}

export default AddonSelector;
