/**
 * csvExporter.js — CSV Export Utility
 * Premium Sports Booking Platform
 *
 * Converts arrays of objects to well-formatted CSV strings or buffers
 * for download. Used in admin data exports (bookings, users, revenue).
 *
 * Features:
 *   - Auto-detects headers from data keys or accepts explicit column config
 *   - Proper RFC 4180 CSV encoding (handles commas, quotes, newlines)
 *   - Express response helper for streaming CSV downloads
 *   - Supports field transforms (e.g. format dates, currency)
 *
 * Usage:
 *   import { toCsv, sendCsvResponse } from '../utils/csvExporter.js';
 *   const csv = toCsv(bookings, { columns: [...] });
 *   sendCsvResponse(res, csv, 'bookings-report.csv');
 */

// ─── Core CSV Encoding ─────────────────────────────────────────────────────

/**
 * Escape a single cell value per RFC 4180.
 * Wraps in quotes if value contains comma, quote, or newline.
 * @param {any} value
 * @returns {string}
 */
const escapeCell = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Must quote if contains comma, double-quote, or line break
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ─── Column Configuration ──────────────────────────────────────────────────

/**
 * @typedef {object} CsvColumn
 * @property {string}    key          - Object key (dot-notation supported for nested values)
 * @property {string}    header       - Column header label
 * @property {Function}  [transform]  - Optional transform: (value, row) => string
 */

/**
 * Safely get a nested value from an object using dot-notation key.
 * @param {object} obj
 * @param {string} path  - e.g. "user.name" or "field.city"
 * @returns {any}
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
};

// ─── toCsv ─────────────────────────────────────────────────────────────────

/**
 * Convert an array of objects to a CSV string.
 *
 * @param {object[]}    data              - Array of plain objects
 * @param {object}      [options]
 * @param {CsvColumn[]} [options.columns] - Column definitions. If omitted, auto-detected from first row keys.
 * @param {string}      [options.delimiter=','] - Field delimiter
 * @param {boolean}     [options.bom=true]      - Prepend UTF-8 BOM for Excel compatibility
 * @returns {string}    CSV string
 */
export const toCsv = (data, options = {}) => {
  const { delimiter = ',', bom = true } = options;

  if (!Array.isArray(data) || data.length === 0) {
    return bom ? '\uFEFF' : '';
  }

  // Build column definitions
  let columns = options.columns;
  if (!columns || columns.length === 0) {
    // Auto-detect from first row
    columns = Object.keys(data[0]).map((key) => ({ key, header: key }));
  }

  const lines = [];

  // Header row
  lines.push(columns.map((col) => escapeCell(col.header)).join(delimiter));

  // Data rows
  for (const row of data) {
    const cells = columns.map((col) => {
      const raw = getNestedValue(row, col.key);
      const value = col.transform ? col.transform(raw, row) : raw;
      return escapeCell(value);
    });
    lines.push(cells.join(delimiter));
  }

  const csv = lines.join('\r\n');
  return bom ? `\uFEFF${csv}` : csv;
};

// ─── Express Response Helper ───────────────────────────────────────────────

/**
 * Stream a CSV string as a file download response.
 *
 * @param {import('express').Response} res      - Express response object
 * @param {string}                     csvData  - CSV string from toCsv()
 * @param {string}                     [filename='export.csv']
 */
export const sendCsvResponse = (res, csvData, filename = 'export.csv') => {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'no-cache');
  res.send(csvData);
};

// ─── Domain-Specific Exporters ─────────────────────────────────────────────

/**
 * Export booking records to CSV.
 * @param {object[]} bookings
 * @returns {string}
 */
export const bookingsToCsv = (bookings) => {
  const columns = [
    { key: '_id',                header: 'Booking ID',    transform: (v) => v?.toString() || '' },
    { key: 'user.name',          header: 'User Name' },
    { key: 'user.email',         header: 'User Email' },
    { key: 'field.name',         header: 'Field Name' },
    { key: 'field.sport',        header: 'Sport' },
    { key: 'field.city',         header: 'City' },
    { key: 'startTime',          header: 'Start Time',    transform: (v) => v ? new Date(v).toISOString() : '' },
    { key: 'endTime',            header: 'End Time',      transform: (v) => v ? new Date(v).toISOString() : '' },
    { key: 'durationMinutes',    header: 'Duration (min)' },
    { key: 'totalAmount',        header: 'Amount (BDT)',  transform: (v) => v?.toFixed(2) || '0.00' },
    { key: 'status',             header: 'Status' },
    { key: 'paymentStatus',      header: 'Payment Status' },
    { key: 'createdAt',          header: 'Booked At',     transform: (v) => v ? new Date(v).toISOString() : '' },
  ];
  return toCsv(bookings, { columns });
};

/**
 * Export user records to CSV.
 * @param {object[]} users
 * @returns {string}
 */
export const usersToCsv = (users) => {
  const columns = [
    { key: '_id',        header: 'User ID',       transform: (v) => v?.toString() || '' },
    { key: 'name',       header: 'Full Name' },
    { key: 'email',      header: 'Email' },
    { key: 'role',       header: 'Role' },
    { key: 'phone',      header: 'Phone' },
    { key: 'city',       header: 'City' },
    { key: 'isVerified', header: 'Verified',       transform: (v) => v ? 'Yes' : 'No' },
    { key: 'createdAt',  header: 'Registered At',  transform: (v) => v ? new Date(v).toISOString() : '' },
    { key: 'lastLogin',  header: 'Last Login',     transform: (v) => v ? new Date(v).toISOString() : '' },
  ];
  return toCsv(users, { columns });
};

/**
 * Export revenue records to CSV.
 * @param {object[]} payments
 * @returns {string}
 */
export const revenueToCsv = (payments) => {
  const columns = [
    { key: '_id',           header: 'Payment ID',  transform: (v) => v?.toString() || '' },
    { key: 'user.name',     header: 'Payer Name' },
    { key: 'user.email',    header: 'Payer Email' },
    { key: 'booking',       header: 'Booking ID',  transform: (v) => v?.toString() || '' },
    { key: 'amount',        header: 'Amount (BDT)', transform: (v) => v?.toFixed(2) || '0.00' },
    { key: 'method',        header: 'Payment Method' },
    { key: 'status',        header: 'Status' },
    { key: 'stripePaymentId', header: 'Stripe ID' },
    { key: 'createdAt',     header: 'Paid At',     transform: (v) => v ? new Date(v).toISOString() : '' },
  ];
  return toCsv(payments, { columns });
};

export default { toCsv, sendCsvResponse, bookingsToCsv, usersToCsv, revenueToCsv };
