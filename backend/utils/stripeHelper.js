import logger from './logger.js';

/**
 * Stripe Payment Helper Utilities
 * Handles Stripe-specific conversions and validations
 */

/**
 * Convert amount to Stripe cents (multiply by 100)
 * Stripe amounts must be in smallest currency unit (cents for USD, etc.)
 * @param {number} amount - Amount in major currency unit (e.g., dollars)
 * @param {string} currency - Currency code (default: USD)
 * @returns {number} Amount in minor currency unit (cents)
 * @throws {Error} If amount is invalid
 */
export const convertToStripeAmount = (amount, currency = 'USD') => {
  // Zero-decimal currencies: JPY, KRW, etc. (no multiplication needed)
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vef', 'clp'];
  
  if (!amount || amount < 0) {
    throw new Error('Amount must be a positive number');
  }

  // Check if currency is zero-decimal
  if (zeroDecimalCurrencies.includes((currency || '').toLowerCase())) {
    return Math.round(amount); // No conversion needed
  }

  // Standard two-decimal currencies (multiply by 100)
  return Math.round(amount * 100);
};

/**
 * Convert Stripe amount (cents) back to major currency unit
 * @param {number} stripeAmount - Amount in cents
 * @param {string} currency - Currency code (default: USD)
 * @returns {number} Amount in major currency unit
 */
export const convertFromStripeAmount = (stripeAmount, currency = 'USD') => {
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vef', 'clp'];
  
  if (!stripeAmount || stripeAmount < 0) {
    throw new Error('Stripe amount must be a positive number');
  }

  // Check if currency is zero-decimal
  if (zeroDecimalCurrencies.includes((currency || '').toLowerCase())) {
    return stripeAmount;
  }

  // Standard two-decimal currencies (divide by 100)
  return stripeAmount / 100;
};

/**
 * Validate payment amount for Stripe
 * Minimum: $0.50 USD (~$0.30 for most other currencies)
 * Maximum: ~$999,999.99
 * @param {number} amount - Amount in major currency unit
 * @param {string} currency - Currency code
 * @returns {boolean} True if amount is valid
 */
export const isValidStripeAmount = (amount, currency = 'USD') => {
  const minimumAmounts = {
    usd: 0.50,
    eur: 0.45,
    gbp: 0.40,
    jpy: 50,
    cad: 0.65,
    aud: 0.75,
    default: 0.50
  };

  const minAmount = minimumAmounts[(currency || '').toLowerCase()] || minimumAmounts.default;
  const maxAmount = 999999.99;

  return amount >= minAmount && amount <= maxAmount;
};

/**
 * Safe Stripe amount conversion with validation
 * @param {number} amount - Amount in major currency unit
 * @param {string} currency - Currency code
 * @returns {number|null} Converted amount or null if invalid
 */
export const safeConvertToStripeAmount = (amount, currency = 'USD') => {
  try {
    if (!isValidStripeAmount(amount, currency)) {
      logger.warn(`Invalid Stripe amount: ${amount} ${currency}`);
      return null;
    }
    return convertToStripeAmount(amount, currency);
  } catch (error) {
    logger.error(`Stripe amount conversion error: ${error.message}`);
    return null;
  }
};

export default {
  convertToStripeAmount,
  convertFromStripeAmount,
  isValidStripeAmount,
  safeConvertToStripeAmount
};
