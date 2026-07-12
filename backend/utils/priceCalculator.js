/**
 * priceCalculator.js
 * Sports field booking price calculation utility.
 * Premium Sports Field Booking Platform
 *
 * Encapsulates all pricing logic — base rates, peak-hour surcharges,
 * duration discounts, promotional codes, and tax — in one testable module.
 * Controllers stay thin by delegating all pricing to this utility.
 */

/**
 * @typedef {object} PriceBreakdown
 * @property {number} basePrice       - Price before any adjustments.
 * @property {number} peakSurcharge   - Extra charge during peak hours.
 * @property {number} discount        - Discount amount (positive = reduction).
 * @property {number} taxAmount       - Calculated tax.
 * @property {number} total           - Final payable amount (rounded to 2 dp).
 * @property {string} currency        - ISO 4217 currency code.
 */

const DEFAULT_PEAK_HOURS = { start: 17, end: 21 }; // 5 PM – 9 PM
const DEFAULT_TAX_RATE   = 0.15;                    // 15% VAT
const DEFAULT_CURRENCY   = 'BDT';

/**
 * Check if a Date falls within peak hours.
 * @param {Date|string} datetime
 * @param {{start:number, end:number}} peakHours
 * @returns {boolean}
 */
export const isPeakHour = (datetime, peakHours = DEFAULT_PEAK_HOURS) => {
  const hour = new Date(datetime).getHours();
  return hour >= peakHours.start && hour < peakHours.end;
};

/**
 * Calculate the booking price with all adjustments.
 *
 * @param {object} params
 * @param {number}       params.hourlyRate        - Base rate per hour (in currency).
 * @param {number}       params.durationHours     - Booking duration in hours.
 * @param {Date|string}  params.startTime         - Booking start time.
 * @param {number}       [params.peakMultiplier=1.3]  - Multiplier applied during peak hours.
 * @param {number}       [params.discountPercent=0]   - Percentage discount (0–100).
 * @param {number}       [params.taxRate]             - Tax rate (0–1). Defaults to 15%.
 * @param {string}       [params.currency]             - ISO currency code.
 * @returns {PriceBreakdown}
 */
export const calculateBookingPrice = ({
  hourlyRate,
  durationHours,
  startTime,
  peakMultiplier = 1.3,
  discountPercent = 0,
  taxRate = DEFAULT_TAX_RATE,
  currency = DEFAULT_CURRENCY,
}) => {
  if (!hourlyRate || hourlyRate < 0) throw new Error('hourlyRate must be a positive number.');
  if (!durationHours || durationHours <= 0) throw new Error('durationHours must be positive.');

  const basePrice = hourlyRate * durationHours;

  const peak = isPeakHour(startTime);
  const peakSurcharge = peak ? basePrice * (peakMultiplier - 1) : 0;

  const priceAfterPeak = basePrice + peakSurcharge;

  const clampedDiscount = Math.min(Math.max(discountPercent, 0), 100);
  const discount = priceAfterPeak * (clampedDiscount / 100);

  const priceAfterDiscount = priceAfterPeak - discount;
  const taxAmount = priceAfterDiscount * taxRate;
  const total = Math.round((priceAfterDiscount + taxAmount) * 100) / 100;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    peakSurcharge: Math.round(peakSurcharge * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total,
    currency,
  };
};

/**
 * Apply a flat promo code discount to a price breakdown.
 * @param {PriceBreakdown} breakdown
 * @param {number} promoAmount - Fixed amount to deduct.
 * @returns {PriceBreakdown}
 */
export const applyPromoCode = (breakdown, promoAmount) => {
  const adjusted = Math.max(0, breakdown.total - promoAmount);
  return {
    ...breakdown,
    discount: Math.round((breakdown.discount + promoAmount) * 100) / 100,
    total: Math.round(adjusted * 100) / 100,
  };
};

export default { isPeakHour, calculateBookingPrice, applyPromoCode };
