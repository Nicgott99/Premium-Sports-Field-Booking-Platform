/**
 * formatters.js — Frontend Data Formatting Utilities
 * Premium Sports Booking Platform
 *
 * Mirror of the backend formatters adapted for the browser environment.
 * Safe to use in React components, hooks, and utility pipelines.
 * No external dependencies — pure JavaScript.
 */

// ─── Currency ──────────────────────────────────────────────────────────────

/**
 * Format a number as a currency string.
 * @param {number} amount
 * @param {string} [currency='BDT']
 * @param {string} [locale='en-BD']
 * @returns {string}  e.g. "৳ 1,250.00"
 */
export const formatCurrency = (amount, currency = 'BDT', locale = 'en-BD') => {
  if (typeof amount !== 'number' || isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Format a number with thousand separators.
 * @param {number} num
 * @param {number} [decimals=0]
 * @returns {string}
 */
export const formatNumber = (num, decimals = 0) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format a rating number to one decimal place with a star label.
 * @param {number} rating
 * @returns {string}  e.g. "4.5 ★"
 */
export const formatRating = (rating) => {
  if (typeof rating !== 'number' || isNaN(rating)) return '—';
  return `${Math.min(5, Math.max(0, rating)).toFixed(1)} ★`;
};

// ─── Date & Time ───────────────────────────────────────────────────────────

/**
 * Format a date to a readable string.
 * @param {Date|string} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}  e.g. "June 26, 2026"
 */
export const formatDate = (date, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format a date to short form.
 * @param {Date|string} date
 * @returns {string}  e.g. "Jun 26"
 */
export const formatShortDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format a time string from a Date.
 * @param {Date|string} date
 * @param {boolean} [use12Hour=false]
 * @returns {string}  e.g. "14:30" or "2:30 PM"
 */
export const formatTime = (date, use12Hour = false) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: use12Hour,
  });
};

/**
 * Return a relative time description.
 * @param {Date|string} date
 * @returns {string}  e.g. "3 minutes ago", "in 2 days"
 */
export const timeAgo = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const future = seconds < 0;

  const intervals = [
    { label: 'year',   secs: 31536000 },
    { label: 'month',  secs: 2592000  },
    { label: 'week',   secs: 604800   },
    { label: 'day',    secs: 86400    },
    { label: 'hour',   secs: 3600     },
    { label: 'minute', secs: 60       },
    { label: 'second', secs: 1        },
  ];

  for (const { label, secs } of intervals) {
    const count = Math.floor(abs / secs);
    if (count >= 1) {
      const plural = count !== 1 ? `${label}s` : label;
      return future ? `in ${count} ${plural}` : `${count} ${plural} ago`;
    }
  }
  return 'just now';
};

/**
 * Convert minutes to a human-readable duration.
 * @param {number} minutes
 * @returns {string}  e.g. "1h 30m"
 */
export const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// ─── Strings ───────────────────────────────────────────────────────────────

/**
 * Truncate a string to a given max length.
 * @param {string} str
 * @param {number} [max=80]
 * @returns {string}
 */
export const truncate = (str, max = 80) => {
  if (typeof str !== 'string') return '';
  return str.length <= max ? str : `${str.slice(0, max - 3)}...`;
};

/**
 * Capitalize the first letter.
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) =>
  typeof str === 'string' && str.length > 0
    ? str.charAt(0).toUpperCase() + str.slice(1)
    : '';

/**
 * Convert snake_case or camelCase to Title Case.
 * @param {string} str
 * @returns {string}
 */
export const toTitleCase = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Format a phone number to a readable format.
 * @param {string} phone  - raw digits, e.g. "01712345678"
 * @returns {string}       - e.g. "017 1234-5678"
 */
export const formatPhone = (phone) => {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('01')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

// ─── Sports Domain ─────────────────────────────────────────────────────────

/**
 * Get the display name and emoji for a sport key.
 * @param {string} sport
 * @returns {{ name: string, emoji: string }}
 */
export const getSportMeta = (sport) => {
  const sports = {
    football:    { name: 'Football',    emoji: '⚽' },
    cricket:     { name: 'Cricket',     emoji: '🏏' },
    basketball:  { name: 'Basketball',  emoji: '🏀' },
    tennis:      { name: 'Tennis',      emoji: '🎾' },
    badminton:   { name: 'Badminton',   emoji: '🏸' },
    volleyball:  { name: 'Volleyball',  emoji: '🏐' },
    swimming:    { name: 'Swimming',    emoji: '🏊' },
    golf:        { name: 'Golf',        emoji: '⛳' },
    hockey:      { name: 'Hockey',      emoji: '🏑' },
    rugby:       { name: 'Rugby',       emoji: '🏉' },
  };
  const key = typeof sport === 'string' ? sport.toLowerCase() : '';
  return sports[key] || { name: toTitleCase(sport) || sport, emoji: '🏟️' };
};

/**
 * Format a price range for display.
 * @param {number} min
 * @param {number} max
 * @param {string} [currency='BDT']
 * @returns {string}  e.g. "BDT 500 – 1,200"
 */
export const formatPriceRange = (min, max, currency = 'BDT') => {
  if (min === max) return formatCurrency(min, currency);
  return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
};

// Export as default namespace too
export default {
  formatCurrency,
  formatNumber,
  formatRating,
  formatDate,
  formatShortDate,
  formatTime,
  timeAgo,
  formatDuration,
  truncate,
  capitalize,
  toTitleCase,
  formatPhone,
  getSportMeta,
  formatPriceRange,
};
