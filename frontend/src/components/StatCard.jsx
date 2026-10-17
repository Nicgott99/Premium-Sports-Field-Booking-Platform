/**
 * StatCard.jsx — Premium Metric & KPI Stat Card
 * Premium Sports Field Booking Platform
 *
 * A modern, dark-themed KPI metric card with:
 *  - Animated/formatted metric display with prefix & suffix support
 *  - Dynamic SVG mini-sparkline trend visualization
 *  - Positive / Negative / Neutral trend indicator pills
 *  - Optional goal progress bar (% to target)
 *  - Preset color themes: indigo, emerald, amber, rose, cyan, purple
 *  - Loading skeleton shimmer state
 *  - Interactive click and hover glow effects
 *  - Full keyboard accessibility and responsive design
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * <StatCard
 *   title="Monthly Revenue"
 *   value={148500}
 *   prefix="৳"
 *   change={+14.8}
 *   trend="up"
 *   changeLabel="vs previous 30 days"
 *   icon="🏆"
 *   color="emerald"
 *   sparkline={[110, 125, 118, 135, 142, 138, 148.5]}
 *   target={160000}
 *   badge="This Month"
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';

// ─── Theme Color Map ─────────────────────────────────────────────────────────

const COLOR_MAP = {
  indigo: {
    accent: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.12)',
    borderGlow: 'rgba(99, 102, 241, 0.4)',
    sparklineStroke: '#818cf8',
    sparklineFill: 'rgba(99, 102, 241, 0.25)',
  },
  emerald: {
    accent: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    borderGlow: 'rgba(16, 185, 129, 0.4)',
    sparklineStroke: '#34d399',
    sparklineFill: 'rgba(16, 185, 129, 0.25)',
  },
  amber: {
    accent: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    borderGlow: 'rgba(245, 158, 11, 0.4)',
    sparklineStroke: '#fbbf24',
    sparklineFill: 'rgba(245, 158, 11, 0.25)',
  },
  rose: {
    accent: '#f43f5e',
    accentBg: 'rgba(244, 63, 94, 0.12)',
    borderGlow: 'rgba(244, 63, 94, 0.4)',
    sparklineStroke: '#fb7185',
    sparklineFill: 'rgba(244, 63, 94, 0.25)',
  },
  cyan: {
    accent: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.12)',
    borderGlow: 'rgba(6, 182, 212, 0.4)',
    sparklineStroke: '#22d3ee',
    sparklineFill: 'rgba(6, 182, 212, 0.25)',
  },
  purple: {
    accent: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.12)',
    borderGlow: 'rgba(168, 85, 247, 0.4)',
    sparklineStroke: '#c084fc',
    sparklineFill: 'rgba(168, 85, 247, 0.25)',
  },
};

/**
 * Format numeric value with thousands separator.
 */
function formatNumber(val) {
  if (typeof val === 'number') {
    return val.toLocaleString();
  }
  return val;
}

/**
 * Generates SVG path coordinates for a mini sparkline chart.
 */
function generateSparklinePaths(data = [], width = 110, height = 36) {
  if (!Array.isArray(data) || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const stepX = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * stepX;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return [x, y];
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return { linePath, areaPath, width, height };
}

export function StatCard({
  title,
  value,
  previousValue,
  prefix = '',
  suffix = '',
  change,
  trend, // 'up' | 'down' | 'neutral'
  changeLabel = 'vs previous period',
  icon,
  color = 'indigo',
  sparkline = null,
  target = null,
  badge = null,
  loading = false,
  onClick,
  className = '',
  id,
}) {
  const theme = COLOR_MAP[color] || COLOR_MAP.indigo;

  // Auto-detect trend direction if not explicitly given
  const derivedTrend = useMemo(() => {
    if (trend) return trend;
    if (typeof change === 'number') {
      if (change > 0) return 'up';
      if (change < 0) return 'down';
      return 'neutral';
    }
    return null;
  }, [trend, change]);

  // Compute progress toward goal
  const progressPercent = useMemo(() => {
    if (!target || typeof value !== 'number') return null;
    return Math.min(100, Math.max(0, Math.round((value / target) * 100)));
  }, [target, value]);

  // Generate SVG paths for sparkline
  const sparklineData = useMemo(() => {
    return generateSparklinePaths(sparkline);
  }, [sparkline]);

  if (loading) {
    return (
      <div className={`sc-card sc-card--skeleton ${className}`} aria-busy="true">
        <div className="sc-skel-header">
          <div className="sc-skel-line sc-skel-line--sm" />
          <div className="sc-skel-icon" />
        </div>
        <div className="sc-skel-line sc-skel-line--lg" />
        <div className="sc-skel-line sc-skel-line--md" />
      </div>
    );
  }

  const isClickable = typeof onClick === 'function';

  return (
    <div
      id={id}
      className={`sc-card ${isClickable ? 'sc-card--interactive' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
    >
      {/* Header Row: Title & Icon / Badge */}
      <div className="sc-header">
        <div className="sc-header-left">
          <span className="sc-title">{title}</span>
          {badge && <span className="sc-badge">{badge}</span>}
        </div>

        {icon && (
          <div
            className="sc-icon-wrap"
            style={{
              backgroundColor: theme.accentBg,
              color: theme.accent,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric & Sparkline Grid */}
      <div className="sc-metric-row">
        <div className="sc-metric-wrap">
          <span className="sc-value">
            {prefix && <span className="sc-prefix">{prefix}</span>}
            {formatNumber(value)}
            {suffix && <span className="sc-suffix">{suffix}</span>}
          </span>
        </div>

        {sparklineData && (
          <div className="sc-sparkline-wrap" aria-hidden="true">
            <svg
              width={sparklineData.width}
              height={sparklineData.height}
              viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
              className="sc-sparkline-svg"
            >
              <defs>
                <linearGradient id={`sc-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.sparklineFill} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={theme.sparklineFill} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={sparklineData.areaPath}
                fill={`url(#sc-grad-${color})`}
              />
              <path
                d={sparklineData.linePath}
                fill="none"
                stroke={theme.sparklineStroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Goal Progress Bar (if target is set) */}
      {progressPercent != null && (
        <div className="sc-target-wrap">
          <div className="sc-target-labels">
            <span>Goal: {prefix}{formatNumber(target)}{suffix}</span>
            <span className="sc-target-pct">{progressPercent}%</span>
          </div>
          <div className="sc-progress-track">
            <div
              className="sc-progress-fill"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: theme.accent,
              }}
            />
          </div>
        </div>
      )}

      {/* Trend Row / Footer */}
      {(derivedTrend || changeLabel || previousValue) && (
        <div className="sc-footer">
          {derivedTrend && (
            <span
              className={`sc-trend-pill sc-trend-pill--${derivedTrend}`}
            >
              {derivedTrend === 'up' && '▲ +'}
              {derivedTrend === 'down' && '▼ '}
              {derivedTrend === 'neutral' && '● '}
              {typeof change === 'number' ? `${Math.abs(change)}%` : change}
            </span>
          )}

          {changeLabel && <span className="sc-change-label">{changeLabel}</span>}
        </div>
      )}

      {/* Scoped Styles */}
      <style>{`
        .sc-card {
          position: relative;
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px 20px;
          color: #f3f4f6;
          backdrop-filter: blur(12px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        .sc-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 14px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent 60%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .sc-card--interactive {
          cursor: pointer;
        }

        .sc-card--interactive:hover {
          border-color: ${theme.borderGlow};
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
        }

        .sc-card--interactive:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px ${theme.accent};
        }

        /* Header */
        .sc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .sc-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sc-title {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sc-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          letter-spacing: 0.02em;
        }

        .sc-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        /* Metric Row */
        .sc-metric-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .sc-value {
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .sc-prefix {
          font-size: 20px;
          font-weight: 600;
          color: #94a3b8;
          margin-right: 2px;
        }

        .sc-suffix {
          font-size: 16px;
          font-weight: 600;
          color: #94a3b8;
          margin-left: 3px;
        }

        .sc-sparkline-wrap {
          display: flex;
          align-items: center;
        }

        .sc-sparkline-svg {
          overflow: visible;
        }

        /* Target Progress Bar */
        .sc-target-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 2px;
        }

        .sc-target-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .sc-target-pct {
          font-weight: 700;
          color: #e2e8f0;
        }

        .sc-progress-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .sc-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }

        /* Footer & Trend Pill */
        .sc-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
        }

        .sc-trend-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .sc-trend-pill--up {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .sc-trend-pill--down {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .sc-trend-pill--neutral {
          background: rgba(148, 163, 184, 0.15);
          color: #94a3b8;
        }

        .sc-change-label {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Loading Skeleton */
        .sc-card--skeleton {
          pointer-events: none;
        }

        .sc-skel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sc-skel-line {
          height: 14px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          animation: scShimmer 1.5s infinite linear;
        }

        .sc-skel-line--sm { width: 35%; }
        .sc-skel-line--md { width: 60%; }
        .sc-skel-line--lg { width: 45%; height: 26px; }

        .sc-skel-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          animation: scShimmer 1.5s infinite linear;
        }

        @keyframes scShimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default StatCard;
