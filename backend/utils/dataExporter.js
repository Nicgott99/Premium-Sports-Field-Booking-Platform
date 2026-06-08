import fs from 'fs';
import path from 'path';
import { Parser } from 'json2csv';
import logger from './logger.js';

/**
 * Data export utilities for JSON, CSV, and Excel formats
 */

/**
 * Export data to JSON
 * @param {array} data - Data to export
 * @param {string} filename - Output filename
 * @returns {string} File path
 */
export const exportToJSON = (data, filename = 'export.json') => {
  try {
    const filepath = path.join('./exports', filename);
    const dir = path.dirname(filepath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(filepath, json);
    logger.info(`Data exported to JSON: ${filename}`);
    return filepath;
  } catch (error) {
    logger.error(`JSON export failed: ${error.message}`);
    throw error;
  }
};

/**
 * Export data to CSV
 * @param {array} data - Data to export
 * @param {string} filename - Output filename
 * @param {array} fields - CSV fields
 * @returns {string} File path
 */
export const exportToCSV = (data, filename = 'export.csv', fields = null) => {
  try {
    const filepath = path.join('./exports', filename);
    const dir = path.dirname(filepath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const csvFields = fields || (data.length > 0 ? Object.keys(data[0]) : []);
    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(data);

    fs.writeFileSync(filepath, csv);
    logger.info(`Data exported to CSV: ${filename}`);
    return filepath;
  } catch (error) {
    logger.error(`CSV export failed: ${error.message}`);
    throw error;
  }
};

/**
 * Export data to TSV (Tab-Separated Values)
 * @param {array} data - Data to export
 * @param {string} filename - Output filename
 * @returns {string} File path
 */
export const exportToTSV = (data, filename = 'export.tsv') => {
  try {
    const filepath = path.join('./exports', filename);
    const dir = path.dirname(filepath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (data.length === 0) {
      fs.writeFileSync(filepath, '');
      return filepath;
    }

    const headers = Object.keys(data[0]);
    const tsv = [headers.join('\t')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? value.replace(/\t/g, ' ') : value;
      });
      tsv.push(values.join('\t'));
    });

    fs.writeFileSync(filepath, tsv.join('\n'));
    logger.info(`Data exported to TSV: ${filename}`);
    return filepath;
  } catch (error) {
    logger.error(`TSV export failed: ${error.message}`);
    throw error;
  }
};

/**
 * Export with custom formatting
 * @param {array} data - Data to export
 * @param {function} formatter - Formatter function
 * @param {string} filename - Output filename
 * @returns {string} File path
 */
export const exportWithFormatter = (data, formatter, filename = 'export.txt') => {
  try {
    const filepath = path.join('./exports', filename);
    const dir = path.dirname(filepath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const formatted = data.map(formatter).join('\n');
    fs.writeFileSync(filepath, formatted);
    logger.info(`Data exported with custom formatter: ${filename}`);
    return filepath;
  } catch (error) {
    logger.error(`Custom export failed: ${error.message}`);
    throw error;
  }
};

/**
 * Export as HTML table
 * @param {array} data - Data to export
 * @param {string} filename - Output filename
 * @param {string} title - Table title
 * @returns {string} File path
 */
export const exportToHTML = (data, filename = 'export.html', title = 'Data Export') => {
  try {
    const filepath = path.join('./exports', filename);
    const dir = path.dirname(filepath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (data.length === 0) {
      fs.writeFileSync(filepath, '<p>No data to display</p>');
      return filepath;
    }

    const headers = Object.keys(data[0]);
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const rows = data.map(row =>
      `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`
    ).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <tr>${headerRow}</tr>
          ${rows}
        </table>
      </body>
      </html>
    `;

    fs.writeFileSync(filepath, html);
    logger.info(`Data exported to HTML: ${filename}`);
    return filepath;
  } catch (error) {
    logger.error(`HTML export failed: ${error.message}`);
    throw error;
  }
};

/**
 * Batch export records
 * @param {object} recordsByType - Records grouped by type
 * @param {string} format - Export format (json, csv, tsv, html)
 * @returns {object} Export results
 */
export const batchExport = (recordsByType, format = 'json') => {
  const results = {};

  Object.entries(recordsByType).forEach(([type, records]) => {
    try {
      let filepath;
      const filename = `export_${type}_${Date.now()}.${format}`;

      switch (format) {
        case 'json':
          filepath = exportToJSON(records, filename);
          break;
        case 'csv':
          filepath = exportToCSV(records, filename);
          break;
        case 'tsv':
          filepath = exportToTSV(records, filename);
          break;
        case 'html':
          filepath = exportToHTML(records, filename, `${type} Export`);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      results[type] = { success: true, filepath };
    } catch (error) {
      logger.error(`Batch export failed for ${type}: ${error.message}`);
      results[type] = { success: false, error: error.message };
    }
  });

  return results;
};

/**
 * Generate export report
 * @param {array} data - Data to report
 * @param {object} options - Report options
 * @returns {string} Report text
 */
export const generateReport = (data, options = {}) => {
  const {
    title = 'Data Report',
    includeStats = true,
    includeDate = true,
  } = options;

  let report = `\n${'='.repeat(60)}\n`;
  report += `${title}\n`;

  if (includeDate) {
    report += `Generated: ${new Date().toLocaleString()}\n`;
  }

  report += `${'='.repeat(60)}\n`;

  if (includeStats && data.length > 0) {
    report += `\nTotal Records: ${data.length}\n`;
  }

  report += `\n${JSON.stringify(data, null, 2)}\n`;

  return report;
};

export default {
  exportToJSON,
  exportToCSV,
  exportToTSV,
  exportToHTML,
  exportWithFormatter,
  batchExport,
  generateReport,
};
