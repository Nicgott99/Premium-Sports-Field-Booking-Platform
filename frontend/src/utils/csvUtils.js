/**
 * csvUtils.js
 * CSV generation and parsing helpers for data export and import.
 * Premium Sports Field Booking Platform
 *
 * Used by admin dashboards, booking reports, and analytics exporters
 * to convert JSON data to downloadable CSV files and vice versa.
 */

/**
 * Convert an array of objects to a CSV string.
 * Automatically derives headers from the first object's keys.
 *
 * @param {object[]} rows       - Array of flat objects to serialize.
 * @param {string[]} [columns]  - Optional explicit column order / subset.
 * @param {string}   [delimiter=',']
 * @returns {string}            - CSV string (UTF-8, with BOM for Excel compatibility).
 *
 * @example
 * const csv = objectsToCsv(bookings, ['id', 'user', 'field', 'total', 'status']);
 * downloadFile(csv, 'bookings.csv', 'text/csv');
 */
export const objectsToCsv = (rows, columns, delimiter = ',') => {
  if (!Array.isArray(rows) || rows.length === 0) return '';

  const headers = columns ?? Object.keys(rows[0]);

  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    // Wrap in quotes if the value contains delimiter, newline, or quotes
    if (str.includes(delimiter) || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(delimiter);
  const dataRows = rows.map((row) =>
    headers.map((h) => escape(row[h])).join(delimiter)
  );

  // \uFEFF BOM ensures Excel opens UTF-8 correctly
  return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
};

/**
 * Parse a CSV string into an array of objects.
 * Assumes the first row is the header row.
 *
 * @param {string} csvString
 * @param {string} [delimiter=',']
 * @returns {object[]}
 */
export const csvToObjects = (csvString, delimiter = ',') => {
  if (!csvString || typeof csvString !== 'string') return [];

  // Remove BOM if present
  const clean = csvString.replace(/^\uFEFF/, '').trim();
  const [headerLine, ...dataLines] = clean.split(/\r?\n/);

  const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

  return dataLines
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i] ?? '';
        return obj;
      }, {});
    });
};

/**
 * Trigger a CSV file download in the browser.
 * @param {string} csvString
 * @param {string} [filename='export.csv']
 */
export const downloadCsv = (csvString, filename = 'export.csv') => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default { objectsToCsv, csvToObjects, downloadCsv };
