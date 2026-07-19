/**
 * currencyUtils.js
 * Currency formatting and conversion helpers.
 * Premium Sports Field Booking Platform
 *
 * Provides consistent money formatting across the entire backend — API
 * responses, receipts, reports, and email templates all use these functions
 * to avoid ad-hoc `toFixed(2)` calls scattered through the codebase.
 */

/**
 * Format a number as a localized currency string.
 *
 * @param {number} amount
 * @param {string} [currency='BDT']   - ISO 4217 code.
 * @param {string} [locale='en-BD']   - BCP 47 locale tag.
 * @returns {string}
 * @example formatCurrency(1500)         // '৳1,500.00'
 * @example formatCurrency(29.99, 'USD') // '$29.99'
 */
export const formatCurrency = (amount, currency = 'BDT', locale = 'en-BD') => {
  if (typeof amount !== 'number' || isNaN(amount)) return '';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Convert an amount from one currency to another using a static rate table.
 * In production, replace `rates` with a live FX feed (e.g. Open Exchange Rates).
 *
 * @param {number} amount
 * @param {string} from   - Source currency code.
 * @param {string} to     - Target currency code.
 * @param {object} [rates] - Exchange rate map keyed by currency code vs USD.
 * @returns {number}       - Converted amount, rounded to 2 decimal places.
 */
export const convertCurrency = (amount, from, to, rates = {}) => {
  if (from === to) return Math.round(amount * 100) / 100;
  if (!rates[from] || !rates[to]) {
    throw new Error(`[currencyUtils] Unknown currency pair: ${from} → ${to}`);
  }
  // Convert to USD as base, then to target
  const usdAmount = amount / rates[from];
  const converted = usdAmount * rates[to];
  return Math.round(converted * 100) / 100;
};

/**
 * Parse a currency string back to a plain number.
 * @param {string} str - e.g. '৳1,500.00' or '$29.99'
 * @returns {number}
 */
export const parseCurrencyString = (str) => {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Round a monetary value to the nearest integer (for platforms that avoid fractions).
 * @param {number} amount
 * @returns {number}
 */
export const roundToWhole = (amount) => Math.round(amount);

export default { formatCurrency, convertCurrency, parseCurrencyString, roundToWhole };
