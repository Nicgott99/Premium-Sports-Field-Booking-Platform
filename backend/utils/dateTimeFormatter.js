/**
 * DateTime formatting and manipulation utilities
 */

/**
 * Format date to human readable string
 * @param {Date} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date} date - Date to compare
 * @returns {string} Relative time
 */
export const getRelativeTime = (date) => {
  if (!date) return null;
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

/**
 * Get date range (start and end of period)
 * @param {string} period - Period type (day, week, month, year)
 * @param {Date} date - Reference date
 * @returns {object} Start and end dates
 */
export const getDateRange = (period = 'month', date = new Date()) => {
  const d = new Date(date);
  let start, end;

  switch (period) {
    case 'day':
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      break;
    case 'week':
      const day = d.getDay();
      start = new Date(d);
      start.setDate(d.getDate() - day);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
      break;
    case 'month':
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      break;
    case 'year':
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear() + 1, 0, 1);
      break;
  }

  return { start, end };
};

/**
 * Check if date is in past
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export const isPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Check if date is in future
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export const isFuture = (date) => {
  return new Date(date) > new Date();
};

/**
 * Check if dates are same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

/**
 * Add days to date
 * @param {Date} date - Base date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add hours to date
 * @param {Date} date - Base date
 * @param {number} hours - Hours to add
 * @returns {Date} New date
 */
export const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Get difference between dates in days
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Days difference
 */
export const daysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Format time duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(' ') : '0s';
};

export default {
  formatDate,
  getRelativeTime,
  getDateRange,
  isPast,
  isFuture,
  isSameDay,
  addDays,
  addHours,
  daysDifference,
  formatDuration,
};
