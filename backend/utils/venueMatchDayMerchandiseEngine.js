/**
 * venueMatchDayMerchandiseEngine.js
 *
 * Match-day merchandise and vendor management engine.
 * Handles product catalogue management, vendor stall assignment,
 * inventory reservation and depletion tracking, sales recording,
 * and end-of-day revenue reporting for sports venue retail operations.
 *
 * @module venueMatchDayMerchandiseEngine
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PRODUCT_CATEGORIES = {
  APPAREL: 'APPAREL',
  ACCESSORIES: 'ACCESSORIES',
  FOOD_BEVERAGE: 'FOOD_BEVERAGE',
  MEMORABILIA: 'MEMORABILIA',
  PROGRAMMES: 'PROGRAMMES',
  EQUIPMENT: 'EQUIPMENT',
};

export const STALL_ZONES = {
  NORTH_CONCOURSE: 'NORTH_CONCOURSE',
  SOUTH_CONCOURSE: 'SOUTH_CONCOURSE',
  EAST_GATE: 'EAST_GATE',
  WEST_GATE: 'WEST_GATE',
  MAIN_ENTRANCE: 'MAIN_ENTRANCE',
  ONLINE_PICKUP: 'ONLINE_PICKUP',
};

export const STALL_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
};

export const SALE_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  REFUNDED: 'REFUNDED',
  VOIDED: 'VOIDED',
};

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  MOBILE: 'MOBILE',
  VOUCHER: 'VOUCHER',
};

// VAT rate applied to all sales
export const DEFAULT_VAT_RATE = 0.15;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validates a product record.
 * @param {Object} product
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProduct(product) {
  const errors = [];

  if (!product || typeof product !== 'object') {
    return { valid: false, errors: ['Product must be a non-null object.'] };
  }
  if (!product.productId || typeof product.productId !== 'string') {
    errors.push('productId must be a non-empty string.');
  }
  if (!product.name || typeof product.name !== 'string') {
    errors.push('name must be a non-empty string.');
  }
  if (!Object.values(PRODUCT_CATEGORIES).includes(product.category)) {
    errors.push(`category must be one of: ${Object.values(PRODUCT_CATEGORIES).join(', ')}.`);
  }
  if (typeof product.unitPriceGBP !== 'number' || product.unitPriceGBP <= 0) {
    errors.push('unitPriceGBP must be a positive number.');
  }
  if (!Number.isInteger(product.stockQty) || product.stockQty < 0) {
    errors.push('stockQty must be a non-negative integer.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a vendor stall record.
 * @param {Object} stall
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStall(stall) {
  const errors = [];

  if (!stall || typeof stall !== 'object') {
    return { valid: false, errors: ['Stall must be a non-null object.'] };
  }
  if (!stall.stallId || typeof stall.stallId !== 'string') {
    errors.push('stallId must be a non-empty string.');
  }
  if (!Object.values(STALL_ZONES).includes(stall.zone)) {
    errors.push(`zone must be one of: ${Object.values(STALL_ZONES).join(', ')}.`);
  }
  if (!stall.operatorName || typeof stall.operatorName !== 'string') {
    errors.push('operatorName must be a non-empty string.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a sale line item.
 * @param {Object} item
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSaleItem(item) {
  const errors = [];

  if (!item || typeof item !== 'object') {
    return { valid: false, errors: ['Sale item must be a non-null object.'] };
  }
  if (!item.productId || typeof item.productId !== 'string') {
    errors.push('productId must be a non-empty string.');
  }
  if (!Number.isInteger(item.qty) || item.qty < 1) {
    errors.push('qty must be a positive integer.');
  }
  if (typeof item.unitPriceGBP !== 'number' || item.unitPriceGBP <= 0) {
    errors.push('unitPriceGBP must be a positive number.');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Product catalogue helpers
// ---------------------------------------------------------------------------

/**
 * Creates a new product record.
 * @param {Object} params - Product parameters
 * @returns {Object} Product record
 */
export function createProduct(params) {
  const validation = validateProduct(params);
  if (!validation.valid) {
    throw new Error(`Invalid product: ${validation.errors.join('; ')}`);
  }

  return {
    productId: params.productId,
    name: params.name,
    category: params.category,
    unitPriceGBP: Math.round(params.unitPriceGBP * 100) / 100,
    stockQty: params.stockQty,
    reservedQty: 0,
    soldQty: 0,
    description: params.description || '',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Reserves stock for a pending sale. Returns updated product or throws if insufficient.
 * @param {Object} product
 * @param {number} qty
 * @returns {Object} Updated product with reserved qty incremented
 */
export function reserveStock(product, qty) {
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error('qty must be a positive integer.');
  }
  const available = product.stockQty - product.reservedQty - product.soldQty;
  if (qty > available) {
    throw new Error(
      `Insufficient stock for "${product.name}": requested ${qty}, available ${available}.`,
    );
  }
  return { ...product, reservedQty: product.reservedQty + qty };
}

/**
 * Commits reserved stock as sold, updating sold and reserved counts.
 * @param {Object} product
 * @param {number} qty
 * @returns {Object} Updated product
 */
export function commitSale(product, qty) {
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error('qty must be a positive integer.');
  }
  if (qty > product.reservedQty) {
    throw new Error(`Cannot commit ${qty} units; only ${product.reservedQty} reserved.`);
  }
  return {
    ...product,
    reservedQty: product.reservedQty - qty,
    soldQty: product.soldQty + qty,
  };
}

/**
 * Releases a reservation without committing (e.g. cancelled order).
 * @param {Object} product
 * @param {number} qty
 * @returns {Object} Updated product
 */
export function releaseReservation(product, qty) {
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error('qty must be a positive integer.');
  }
  const newReserved = Math.max(0, product.reservedQty - qty);
  return { ...product, reservedQty: newReserved };
}

// ---------------------------------------------------------------------------
// Stall management
// ---------------------------------------------------------------------------

/**
 * Creates a vendor stall record.
 * @param {Object} params
 * @returns {Object} Stall record
 */
export function createStall(params) {
  const validation = validateStall(params);
  if (!validation.valid) {
    throw new Error(`Invalid stall: ${validation.errors.join('; ')}`);
  }

  return {
    stallId: params.stallId,
    zone: params.zone,
    operatorName: params.operatorName,
    status: STALL_STATUS.AVAILABLE,
    assignedProductIds: [],
    openedAt: null,
    closedAt: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Assigns a list of product IDs to a stall and marks it as ASSIGNED.
 * @param {Object} stall
 * @param {string[]} productIds
 * @returns {Object} Updated stall
 */
export function assignProductsToStall(stall, productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new Error('productIds must be a non-empty array of strings.');
  }
  if (stall.status !== STALL_STATUS.AVAILABLE) {
    throw new Error(`Stall "${stall.stallId}" is not AVAILABLE (current: ${stall.status}).`);
  }
  return {
    ...stall,
    assignedProductIds: [...new Set([...stall.assignedProductIds, ...productIds])],
    status: STALL_STATUS.ASSIGNED,
  };
}

/**
 * Opens a stall for trading.
 * @param {Object} stall
 * @returns {Object} Updated stall with status ACTIVE
 */
export function openStall(stall) {
  if (stall.status === STALL_STATUS.ACTIVE) {
    throw new Error(`Stall "${stall.stallId}" is already ACTIVE.`);
  }
  if (stall.status === STALL_STATUS.CLOSED) {
    throw new Error(`Stall "${stall.stallId}" is already CLOSED.`);
  }
  return { ...stall, status: STALL_STATUS.ACTIVE, openedAt: new Date().toISOString() };
}

/**
 * Closes a stall.
 * @param {Object} stall
 * @returns {Object} Updated stall with status CLOSED
 */
export function closeStall(stall) {
  if (stall.status !== STALL_STATUS.ACTIVE) {
    throw new Error(`Only ACTIVE stalls can be closed (current: ${stall.status}).`);
  }
  return { ...stall, status: STALL_STATUS.CLOSED, closedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Sales recording
// ---------------------------------------------------------------------------

/**
 * Records a completed merchandise sale transaction.
 * @param {Object} params - Sale parameters
 * @param {string} params.stallId
 * @param {string} params.paymentMethod - One of PAYMENT_METHODS values
 * @param {Object[]} params.items - Array of { productId, qty, unitPriceGBP }
 * @param {number} [params.vatRate] - VAT rate (default DEFAULT_VAT_RATE)
 * @param {string} [params.customerRef] - Optional customer/order reference
 * @returns {Object} Sale record
 */
export function recordSale(params) {
  if (!params.stallId || typeof params.stallId !== 'string') {
    throw new Error('stallId must be a non-empty string.');
  }
  if (!Object.values(PAYMENT_METHODS).includes(params.paymentMethod)) {
    throw new Error(`paymentMethod must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}.`);
  }
  if (!Array.isArray(params.items) || params.items.length === 0) {
    throw new Error('items must be a non-empty array.');
  }

  const vatRate = params.vatRate ?? DEFAULT_VAT_RATE;
  const lines = [];
  let subtotalGBP = 0;

  for (const item of params.items) {
    const validation = validateSaleItem(item);
    if (!validation.valid) {
      throw new Error(`Invalid sale item: ${validation.errors.join('; ')}`);
    }
    const lineTotal = Math.round(item.unitPriceGBP * item.qty * 100) / 100;
    subtotalGBP += lineTotal;
    lines.push({
      productId: item.productId,
      qty: item.qty,
      unitPriceGBP: item.unitPriceGBP,
      lineTotalGBP: lineTotal,
    });
  }

  subtotalGBP = Math.round(subtotalGBP * 100) / 100;
  const vatAmountGBP = Math.round(subtotalGBP * vatRate * 100) / 100;
  const totalGBP = Math.round((subtotalGBP + vatAmountGBP) * 100) / 100;

  return {
    saleId: `SALE-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    stallId: params.stallId,
    paymentMethod: params.paymentMethod,
    items: lines,
    subtotalGBP,
    vatRate,
    vatAmountGBP,
    totalGBP,
    status: SALE_STATUS.COMPLETED,
    customerRef: params.customerRef || null,
    recordedAt: new Date().toISOString(),
  };
}

/**
 * Marks a completed sale as refunded.
 * @param {Object} sale
 * @param {string} reason - Reason for refund
 * @returns {Object} Updated sale
 */
export function refundSale(sale, reason) {
  if (sale.status !== SALE_STATUS.COMPLETED) {
    throw new Error(`Only COMPLETED sales can be refunded (current: ${sale.status}).`);
  }
  if (!reason || typeof reason !== 'string') {
    throw new Error('reason must be a non-empty string.');
  }
  return {
    ...sale,
    status: SALE_STATUS.REFUNDED,
    refundReason: reason,
    refundedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Revenue reporting
// ---------------------------------------------------------------------------

/**
 * Builds an end-of-day revenue report from a list of sales.
 * @param {Object[]} sales - Array of sale records
 * @param {string} matchId - Match identifier
 * @returns {Object} Revenue report
 */
export function buildRevenueReport(sales, matchId) {
  if (!Array.isArray(sales)) {
    throw new Error('sales must be an array.');
  }

  const completedSales = sales.filter((s) => s.status === SALE_STATUS.COMPLETED);
  const refundedSales = sales.filter((s) => s.status === SALE_STATUS.REFUNDED);

  let grossRevenue = 0;
  let totalVat = 0;
  let totalRefunds = 0;
  const byStall = {};
  const byPaymentMethod = {};
  const productTotals = {};

  for (const sale of completedSales) {
    grossRevenue += sale.totalGBP;
    totalVat += sale.vatAmountGBP;

    // By stall
    if (!byStall[sale.stallId]) {
      byStall[sale.stallId] = { stallId: sale.stallId, totalGBP: 0, saleCount: 0 };
    }
    byStall[sale.stallId].totalGBP += sale.totalGBP;
    byStall[sale.stallId].saleCount += 1;

    // By payment method
    if (!byPaymentMethod[sale.paymentMethod]) {
      byPaymentMethod[sale.paymentMethod] = { method: sale.paymentMethod, totalGBP: 0, count: 0 };
    }
    byPaymentMethod[sale.paymentMethod].totalGBP += sale.totalGBP;
    byPaymentMethod[sale.paymentMethod].count += 1;

    // By product
    for (const line of sale.items) {
      if (!productTotals[line.productId]) {
        productTotals[line.productId] = { productId: line.productId, unitsSold: 0, revenueGBP: 0 };
      }
      productTotals[line.productId].unitsSold += line.qty;
      productTotals[line.productId].revenueGBP += line.lineTotalGBP;
    }
  }

  for (const sale of refundedSales) {
    totalRefunds += sale.totalGBP;
  }

  // Round all accumulated floats
  grossRevenue = Math.round(grossRevenue * 100) / 100;
  totalVat = Math.round(totalVat * 100) / 100;
  totalRefunds = Math.round(totalRefunds * 100) / 100;
  const netRevenue = Math.round((grossRevenue - totalRefunds) * 100) / 100;

  // Sort products by revenue descending
  const topProducts = Object.values(productTotals)
    .sort((a, b) => b.revenueGBP - a.revenueGBP)
    .map((p) => ({ ...p, revenueGBP: Math.round(p.revenueGBP * 100) / 100 }));

  return {
    reportId: `RPT-${Date.now()}`,
    matchId: matchId || null,
    generatedAt: new Date().toISOString(),
    totalTransactions: sales.length,
    completedCount: completedSales.length,
    refundedCount: refundedSales.length,
    grossRevenueGBP: grossRevenue,
    totalVatGBP: totalVat,
    totalRefundsGBP: totalRefunds,
    netRevenueGBP: netRevenue,
    byStall: Object.values(byStall).map((s) => ({
      ...s,
      totalGBP: Math.round(s.totalGBP * 100) / 100,
    })),
    byPaymentMethod: Object.values(byPaymentMethod).map((m) => ({
      ...m,
      totalGBP: Math.round(m.totalGBP * 100) / 100,
    })),
    topProducts,
  };
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  PRODUCT_CATEGORIES,
  STALL_ZONES,
  STALL_STATUS,
  SALE_STATUS,
  PAYMENT_METHODS,
  DEFAULT_VAT_RATE,
  validateProduct,
  validateStall,
  validateSaleItem,
  createProduct,
  reserveStock,
  commitSale,
  releaseReservation,
  createStall,
  assignProductsToStall,
  openStall,
  closeStall,
  recordSale,
  refundSale,
  buildRevenueReport,
};
