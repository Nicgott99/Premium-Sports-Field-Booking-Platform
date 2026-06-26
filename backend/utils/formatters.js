/**
 * formatters.js — Backend Data Formatting Utilities
 * Premium Sports Booking Platform
 *
 * A collection of pure utility functions for formatting data consistently
 * across controllers, services, and response builders.
 *
 * All functions are side-effect free and safe to use in any context.
 */

// ─── Currency ──────────────────────────────────────────────────────────────

/**
 * Format a numeric amount as a currency string.
 * @param {number} amount       - Amount to format
 * @param {string} [currency]   - ISO 4217 code (default: 'BDT')
 * @param {string} [locale]     - BCP 47 locale (default: 'en-BD')
 * @returns {string}            - e.g. "৳ 1,250.00" or "$ 1,250.00"
 */
export const formatCurrency = (amount, currency = 'BDT', locale = 'en-BD') => {
  if (typeof amount !== 'number' || isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
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
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// ─── Date & Time ───────────────────────────────────────────────────────────

/**
 * Format a Date or ISO string into a human-readable date.
 * @param {Date|string} date
 * @param {object} [options]   - Intl.DateTimeFormat options
 * @returns {string}           - e.g. "June 26, 2026"
 */
export const formatDate = (date, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format a Date or ISO string into a short date + time string.
 * @param {Date|string} date
 * @returns {string}  - e.g. "Jun 26, 2026 · 14:30"
 */
export const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart} · ${timePart}`;
};

/**
 * Convert minutes to a human-readable duration string.
 * @param {number} minutes
 * @returns {string}  - e.g. "1h 30m", "45m", "2h"
 */
export const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Return a relative time string (e.g. "3 minutes ago", "in 2 days").
 * @param {Date|string} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Unknown';
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
      const plural = count > 1 ? `${label}s` : label;
      return future ? `in ${count} ${plural}` : `${count} ${plural} ago`;
    }
  }
  return 'just now';
};

// ─── File Size ─────────────────────────────────────────────────────────────

/**
 * Format bytes into a human-readable file size.
 * @param {number} bytes
 * @param {number} [decimals=1]
 * @returns {string}  - e.g. "4.2 MB", "1.1 KB"
 */
export const formatFileSize = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

// ─── Strings ───────────────────────────────────────────────────────────────

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) =>
  typeof str === 'string' && str.length > 0
    ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    : '';

/**
 * Convert a camelCase or snake_case identifier to Title Case.
 * @param {string} str  - e.g. "fieldOwner" or "field_owner"
 * @returns {string}    - e.g. "Field Owner"
 */
export const toTitleCase = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Truncate a string to a maximum length, appending an ellipsis.
 * @param {string} str
 * @param {number} [maxLength=100]
 * @returns {string}
 */
export const truncate = (str, maxLength = 100) => {
  if (typeof str !== 'string') return '';
  return str.length <= maxLength ? str : `${str.slice(0, maxLength - 3)}...`;
};

// ─── Sports Domain ─────────────────────────────────────────────────────────

/**
 * Map a sport key to its display name and emoji.
 * @param {string} sport  - e.g. "football", "cricket"
 * @returns {{ name: string, emoji: string }}
 */
export const formatSport = (sport) => {
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
    baseball:    { name: 'Baseball',    emoji: '⚾' },
    handball:    { name: 'Handball',    emoji: '🤾' },
  };
  const key = typeof sport === 'string' ? sport.toLowerCase() : '';
  return sports[key] || { name: toTitleCase(sport) || 'Unknown Sport', emoji: '🏟️' };
};

/**
 * Format a booking status into a display label and color class.
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
export const formatBookingStatus = (status) => {
  const map = {
    pending:    { label: 'Pending',    color: 'yellow'  },
    confirmed:  { label: 'Confirmed',  color: 'green'   },
    cancelled:  { label: 'Cancelled',  color: 'red'     },
    completed:  { label: 'Completed',  color: 'blue'    },
    refunded:   { label: 'Refunded',   color: 'purple'  },
    no_show:    { label: 'No Show',    color: 'gray'    },
  };
  return map[status] || { label: toTitleCase(status), color: 'gray' };
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatDuration,
  timeAgo,
  formatFileSize,
  capitalize,
  toTitleCase,
  truncate,
  formatSport,
  formatBookingStatus,
};
