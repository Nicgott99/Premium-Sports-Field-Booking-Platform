/**
 * WeatherWidget.jsx — Venue Weather & Sports Playability Advisory Widget
 * Premium Sports Field Booking Platform
 *
 * Integrates real-time weather metrics with an automated sports playability scoring engine:
 *  - Temperature, Feels-Like, Humidity, Wind Speed, UV Index, Rain Probability
 *  - Automated Sports Playability Score (0–100) with color-coded status badges
 *  - Turf condition advisory (Indoor vs. Outdoor recommendations)
 *  - 5-hour micro-forecast strip with hourly condition icons & precipitation risk
 *  - Interactive Celsius / Fahrenheit unit toggle
 *  - Compact bar mode or full dashboard card mode
 *  - Shimmer loading skeleton
 *  - Pure React & CSS with zero external icon/chart dependencies
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * <WeatherWidget
 *   weather={{
 *     temperature: 28,
 *     feelsLike: 31,
 *     condition: 'PARTLY_CLOUDY',
 *     humidity: 62,
 *     windSpeedKmH: 14,
 *     precipitationProb: 15,
 *     uvIndex: 4,
 *     isOutdoor: true,
 *     hourlyForecast: [
 *       { time: '16:00', temp: 29, condition: 'CLEAR', rainProb: 5 },
 *       { time: '17:00', temp: 28, condition: 'PARTLY_CLOUDY', rainProb: 15 },
 *       { time: '18:00', temp: 26, condition: 'PARTLY_CLOUDY', rainProb: 20 },
 *       { time: '19:00', temp: 25, condition: 'RAIN', rainProb: 65 },
 *       { time: '20:00', temp: 24, condition: 'RAIN', rainProb: 75 },
 *     ]
 *   }}
 *   venueName="Bashundhara Arena — Field 2"
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';

// ─── Weather Condition Configurations ────────────────────────────────────────

const WEATHER_META = {
  CLEAR: {
    label: 'Clear Skies',
    icon: '☀️',
    badgeClass: 'ww-badge--green',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(17, 24, 39, 0.95) 100%)',
  },
  PARTLY_CLOUDY: {
    label: 'Partly Cloudy',
    icon: '⛅',
    badgeClass: 'ww-badge--blue',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(17, 24, 39, 0.95) 100%)',
  },
  CLOUDY: {
    label: 'Overcast',
    icon: '☁️',
    badgeClass: 'ww-badge--gray',
    bgGradient: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15) 0%, rgba(17, 24, 39, 0.95) 100%)',
  },
  RAIN: {
    label: 'Light Rain',
    icon: '🌧️',
    badgeClass: 'ww-badge--amber',
    bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(17, 24, 39, 0.95) 100%)',
  },
  HEAVY_RAIN: {
    label: 'Heavy Rain',
    icon: '⛈️',
    badgeClass: 'ww-badge--red',
    bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(17, 24, 39, 0.95) 100%)',
  },
  THUNDERSTORM: {
    label: 'Thunderstorm',
    icon: '⚡',
    badgeClass: 'ww-badge--red',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(17, 24, 39, 0.95) 100%)',
  },
  WINDY: {
    label: 'High Winds',
    icon: '💨',
    badgeClass: 'ww-badge--amber',
    bgGradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(17, 24, 39, 0.95) 100%)',
  },
};

/**
 * Calculates a composite 0-100 sports playability score.
 */
function calculatePlayabilityScore({
  temp = 24,
  condition = 'CLEAR',
  humidity = 50,
  windSpeedKmH = 10,
  rainProb = 0,
  isOutdoor = true,
}) {
  let score = 100;

  // Temperature penalties (sweet spot: 18°C - 26°C)
  if (temp > 35) score -= 30;
  else if (temp > 30) score -= 15;
  else if (temp < 10) score -= 20;
  else if (temp < 15) score -= 8;

  // Rain / storm impact
  const cond = condition.toUpperCase();
  if (cond.includes('THUNDER') || cond.includes('STORM')) {
    score -= isOutdoor ? 60 : 15;
  } else if (cond.includes('RAIN') || cond.includes('DRIZZLE')) {
    score -= isOutdoor ? 45 : 10;
  } else if (rainProb > 50) {
    score -= isOutdoor ? 25 : 5;
  }

  // Wind speed impact (racket sports & high balls)
  if (windSpeedKmH > 35) score -= 25;
  else if (windSpeedKmH > 22) score -= 12;

  // High humidity fatigue factor
  if (humidity > 80) score -= 12;

  score = Math.max(10, Math.min(100, Math.round(score)));

  let label = 'Optimal Conditions';
  let badgeClass = 'ww-score--optimal';
  let advisory = 'Ideal weather for outdoor turf football, cricket, and athletic matches.';

  if (score < 40) {
    label = 'Severe Weather Alert';
    badgeClass = 'ww-score--poor';
    advisory = isOutdoor
      ? 'Adverse weather detected. Covered or indoor pitch strongly advised.'
      : 'Inclement outside weather. Indoor pitch operating normally.';
  } else if (score < 70) {
    label = 'Moderate Playability';
    badgeClass = 'ww-score--moderate';
    advisory = 'Playable with caution. Stay hydrated and monitor changing conditions.';
  }

  return { score, label, badgeClass, advisory };
}

export function WeatherWidget({
  weather,
  venueName,
  compact = false,
  loading = false,
  className = '',
}) {
  const [unit, setUnit] = useState('C'); // 'C' | 'F'

  // Default fallback data if weather prop is not fully provided
  const data = useMemo(() => {
    return {
      temperature: weather?.temperature ?? 26,
      feelsLike: weather?.feelsLike ?? 28,
      condition: weather?.condition ?? 'CLEAR',
      humidity: weather?.humidity ?? 55,
      windSpeedKmH: weather?.windSpeedKmH ?? 12,
      precipitationProb: weather?.precipitationProb ?? 10,
      uvIndex: weather?.uvIndex ?? 3,
      isOutdoor: weather?.isOutdoor ?? true,
      hourlyForecast: weather?.hourlyForecast ?? [
        { time: '16:00', temp: 28, condition: 'CLEAR', rainProb: 5 },
        { time: '17:00', temp: 27, condition: 'CLEAR', rainProb: 10 },
        { time: '18:00', temp: 25, condition: 'PARTLY_CLOUDY', rainProb: 20 },
        { time: '19:00', temp: 24, condition: 'PARTLY_CLOUDY', rainProb: 25 },
        { time: '20:00', temp: 23, condition: 'CLOUDY', rainProb: 30 },
      ],
    };
  }, [weather]);

  const meta = WEATHER_META[data.condition.toUpperCase()] || WEATHER_META.CLEAR;

  // Conversion helper
  const displayTemp = (celsius) => {
    if (unit === 'F') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  };

  const playability = useMemo(() => {
    return calculatePlayabilityScore({
      temp: data.temperature,
      condition: data.condition,
      humidity: data.humidity,
      windSpeedKmH: data.windSpeedKmH,
      rainProb: data.precipitationProb,
      isOutdoor: data.isOutdoor,
    });
  }, [data]);

  if (loading) {
    return (
      <div className={`ww-container ww-container--skeleton ${className}`} aria-busy="true">
        <div className="ww-skel-line ww-skel-line--sm" />
        <div className="ww-skel-line ww-skel-line--lg" />
        <div className="ww-skel-grid">
          <div className="ww-skel-box" />
          <div className="ww-skel-box" />
          <div className="ww-skel-box" />
        </div>
      </div>
    );
  }

  // Compact Pill / Bar Mode
  if (compact) {
    return (
      <div className={`ww-compact-bar ${className}`}>
        <span className="ww-compact-icon" aria-hidden="true">{meta.icon}</span>
        <span className="ww-compact-temp">{displayTemp(data.temperature)}°{unit}</span>
        <span className="ww-compact-cond">{meta.label}</span>
        <span className={`ww-compact-score ${playability.badgeClass}`}>
          Score {playability.score}/100
        </span>
      </div>
    );
  }

  return (
    <div
      className={`ww-container ${className}`}
      style={{ background: meta.bgGradient }}
    >
      {/* Header */}
      <div className="ww-header">
        <div className="ww-venue-info">
          <span className="ww-title">Match Weather Advisory</span>
          {venueName && <span className="ww-venue-name">📍 {venueName}</span>}
        </div>

        {/* C/F Unit Toggle */}
        <div className="ww-unit-toggle" role="group" aria-label="Temperature unit">
          <button
            type="button"
            className={`ww-unit-btn ${unit === 'C' ? 'ww-unit-btn--active' : ''}`}
            onClick={() => setUnit('C')}
            aria-label="Celsius"
          >
            °C
          </button>
          <button
            type="button"
            className={`ww-unit-btn ${unit === 'F' ? 'ww-unit-btn--active' : ''}`}
            onClick={() => setUnit('F')}
            aria-label="Fahrenheit"
          >
            °F
          </button>
        </div>
      </div>

      {/* Main Temperature & Playability Summary */}
      <div className="ww-hero-row">
        <div className="ww-temp-block">
          <span className="ww-big-icon" aria-hidden="true">{meta.icon}</span>
          <div className="ww-temp-numbers">
            <span className="ww-current-temp">{displayTemp(data.temperature)}°{unit}</span>
            <span className="ww-feels-like">
              Feels like {displayTemp(data.feelsLike)}°{unit} • {meta.label}
            </span>
          </div>
        </div>

        {/* Playability Gauge Badge */}
        <div className="ww-playability-badge">
          <div className="ww-score-header">
            <span className="ww-score-title">Playability</span>
            <span className={`ww-score-pill ${playability.badgeClass}`}>
              {playability.score}/100
            </span>
          </div>
          <span className="ww-score-desc">{playability.label}</span>
        </div>
      </div>

      {/* Advisory Notification Banner */}
      <div className="ww-advisory-banner">
        <span className="ww-advisory-icon">{data.isOutdoor ? '🏟️ Outdoor Turf' : '🏢 Covered Arena'}</span>
        <span className="ww-advisory-text">{playability.advisory}</span>
      </div>

      {/* Weather Attributes Grid */}
      <div className="ww-metrics-grid">
        <div className="ww-metric-card">
          <span className="ww-metric-label">Rain Risk</span>
          <span className="ww-metric-value">🌧️ {data.precipitationProb}%</span>
        </div>
        <div className="ww-metric-card">
          <span className="ww-metric-label">Humidity</span>
          <span className="ww-metric-value">💧 {data.humidity}%</span>
        </div>
        <div className="ww-metric-card">
          <span className="ww-metric-label">Wind Speed</span>
          <span className="ww-metric-value">💨 {data.windSpeedKmH} km/h</span>
        </div>
        <div className="ww-metric-card">
          <span className="ww-metric-label">UV Index</span>
          <span className="ww-metric-value">☀️ {data.uvIndex} / 11</span>
        </div>
      </div>

      {/* Hourly Match Slot Forecast Strip */}
      {data.hourlyForecast.length > 0 && (
        <div className="ww-forecast-wrap">
          <div className="ww-forecast-title">Match Time Slot Forecast</div>
          <div className="ww-forecast-strip">
            {data.hourlyForecast.map((slot, idx) => {
              const slotMeta = WEATHER_META[slot.condition?.toUpperCase()] || WEATHER_META.CLEAR;
              return (
                <div key={idx} className="ww-forecast-item">
                  <span className="ww-forecast-time">{slot.time}</span>
                  <span className="ww-forecast-icon" aria-hidden="true">{slotMeta.icon}</span>
                  <span className="ww-forecast-temp">{displayTemp(slot.temp)}°</span>
                  {slot.rainProb != null && slot.rainProb > 0 && (
                    <span className="ww-forecast-rain">{slot.rainProb}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scoped Styles */}
      <style>{`
        .ww-container {
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          color: #f3f4f6;
          backdrop-filter: blur(12px);
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        /* Header */
        .ww-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ww-venue-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ww-title {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ww-venue-name {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }

        /* Unit toggle */
        .ww-unit-toggle {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .ww-unit-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ww-unit-btn--active {
          background: #6366f1;
          color: #ffffff;
        }

        /* Hero */
        .ww-hero-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ww-temp-block {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ww-big-icon {
          font-size: 42px;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
        }

        .ww-temp-numbers {
          display: flex;
          flex-direction: column;
        }

        .ww-current-temp {
          font-size: 34px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }

        .ww-feels-like {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }

        /* Playability Badge */
        .ww-playability-badge {
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ww-score-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ww-score-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .ww-score-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .ww-score--optimal {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .ww-score--moderate {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        .ww-score--poor {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .ww-score-desc {
          font-size: 12px;
          font-weight: 600;
          color: #e2e8f0;
        }

        /* Advisory Banner */
        .ww-advisory-banner {
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .ww-advisory-icon {
          font-weight: 700;
          color: #a5b4fc;
          white-space: nowrap;
        }

        .ww-advisory-text {
          color: #cbd5e1;
          line-height: 1.4;
        }

        /* Metrics Grid */
        .ww-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        @media (max-width: 640px) {
          .ww-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .ww-metric-card {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ww-metric-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        .ww-metric-value {
          font-size: 14px;
          font-weight: 700;
          color: #f3f4f6;
        }

        /* Hourly Strip */
        .ww-forecast-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 14px;
        }

        .ww-forecast-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ww-forecast-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .ww-forecast-strip::-webkit-scrollbar { display: none; }

        .ww-forecast-item {
          flex: 1;
          min-width: 64px;
          background: rgba(17, 24, 39, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 8px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .ww-forecast-time {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        .ww-forecast-icon {
          font-size: 16px;
        }

        .ww-forecast-temp {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
        }

        .ww-forecast-rain {
          font-size: 10px;
          font-weight: 700;
          color: #38bdf8;
        }

        /* Compact Mode */
        .ww-compact-bar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 13px;
          color: #e2e8f0;
          backdrop-filter: blur(8px);
        }

        .ww-compact-temp {
          font-weight: 700;
        }

        .ww-compact-cond {
          color: #94a3b8;
        }

        .ww-compact-score {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
        }

        /* Skeleton */
        .ww-container--skeleton {
          background: rgba(17, 24, 39, 0.85);
          pointer-events: none;
        }

        .ww-skel-line {
          height: 16px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          animation: wwShimmer 1.5s infinite linear;
        }
        .ww-skel-line--sm { width: 30%; }
        .ww-skel-line--lg { width: 50%; height: 32px; }

        .ww-skel-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .ww-skel-box {
          height: 50px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          animation: wwShimmer 1.5s infinite linear;
        }

        @keyframes wwShimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default WeatherWidget;
