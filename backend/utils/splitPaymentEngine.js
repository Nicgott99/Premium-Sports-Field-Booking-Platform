/**
 * splitPaymentEngine.js — Group Booking Split Payment & Escrow Engine
 * Premium Sports Field Booking Platform
 *
 * Manages multi-player bill splitting, group escrow collection, and payment tracking:
 *  - Supports EQUAL, CUSTOM, and PERCENTAGE split modes across participants
 *  - Remainder distribution to guarantee sum of shares strictly equals the total bill
 *  - Unique payment token generation for shareable WhatsApp/SMS deep links
 *  - Escrow status lifecycle (PENDING -> PARTIALLY_PAID -> FULLY_FUNDED / EXPIRED)
 *  - Organizer shortfall bailout (organizer covers remainder before slot release)
 *  - Automated refund ledger generation for failed or expired pools
 *  - Real-time funding progress metrics and countdown management
 *
 * Pure, deterministic, and dependency-free.
 *
 * Usage:
 *   import {
 *     createSplitPool,
 *     recordContribution,
 *     resolveShortfallWithOrganizer,
 *     generateShareSummary,
 *   } from './splitPaymentEngine.js';
 */

import crypto from 'node:crypto';

// ─── Constants & Status Enums ────────────────────────────────────────────────

export const SPLIT_POOL_STATUS = {
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  FULLY_FUNDED: 'FULLY_FUNDED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

export const SHARE_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  WAIVED: 'WAIVED',
  REFUNDED: 'REFUNDED',
};

export const SPLIT_MODES = {
  EQUAL: 'EQUAL',
  CUSTOM: 'CUSTOM',
  PERCENTAGE: 'PERCENTAGE',
};

export const SPLIT_DEFAULTS = {
  EXPIRY_MINUTES: 120, // 2 hours default deadline to fund
  DEFAULT_CURRENCY: 'BDT',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Round a monetary value to 2 decimal places.
 */
export function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Generates an opaque alphanumeric payment token for participant links.
 */
export function generateToken(prefix = 'spl') {
  const rand = crypto.randomBytes(6).toString('hex');
  const time = Date.now().toString(36);
  return `${prefix}_${rand}${time}`;
}

// ─── Split Pool Creation ─────────────────────────────────────────────────────

/**
 * @typedef {object} ParticipantInput
 * @property {string} [id]
 * @property {string} name
 * @property {string} [phone]
 * @property {string} [email]
 * @property {number} [customAmount] - Only used if splitMode is CUSTOM
 * @property {number} [customPercentage] - Only used if splitMode is PERCENTAGE
 * @property {boolean} [isOrganizer]
 */

/**
 * Creates a new split payment escrow pool for a sports field reservation.
 *
 * @param {object} params
 * @param {string} params.bookingId
 * @param {number} params.totalAmount
 * @param {string} [params.currency='BDT']
 * @param {ParticipantInput[]} params.participants - List of team members sharing the cost
 * @param {string} [params.splitMode='EQUAL'] - 'EQUAL' | 'CUSTOM' | 'PERCENTAGE'
 * @param {number} [params.expiryMinutes=120] - Funding deadline in minutes
 * @param {Date|string} [params.createdAt=new Date()]
 * @returns {object} Complete split payment pool state
 */
export function createSplitPool({
  bookingId,
  totalAmount,
  currency = SPLIT_DEFAULTS.DEFAULT_CURRENCY,
  participants = [],
  splitMode = SPLIT_MODES.EQUAL,
  expiryMinutes = SPLIT_DEFAULTS.EXPIRY_MINUTES,
  createdAt = new Date(),
}) {
  if (!bookingId) throw new Error('bookingId is required.');
  if (typeof totalAmount !== 'number' || totalAmount <= 0) {
    throw new Error('totalAmount must be a positive number.');
  }
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new Error('Split pool requires at least 2 participants.');
  }

  const createdTime = new Date(createdAt);
  const expiresAt = new Date(createdTime.getTime() + expiryMinutes * 60 * 1000);
  const count = participants.length;

  let shares = [];

  if (splitMode === SPLIT_MODES.EQUAL) {
    // Distribute equal base share and assign 1-cent remainders to head
    const baseShare = Math.floor((totalAmount / count) * 100) / 100;
    const totalBase = round2(baseShare * count);
    let remainderCents = Math.round((totalAmount - totalBase) * 100);

    shares = participants.map((p, idx) => {
      let amount = baseShare;
      if (remainderCents > 0) {
        amount = round2(amount + 0.01);
        remainderCents -= 1;
      }
      return {
        shareId: `sh_${idx + 1}`,
        participantId: p.id || `p_${idx + 1}`,
        name: p.name,
        phone: p.phone || null,
        email: p.email || null,
        isOrganizer: !!p.isOrganizer || idx === 0,
        amountDue: amount,
        amountPaid: 0,
        status: SHARE_STATUS.PENDING,
        paymentToken: generateToken('pay'),
        paidAt: null,
        paymentRef: null,
      };
    });
  } else if (splitMode === SPLIT_MODES.CUSTOM) {
    const allocated = participants.reduce((sum, p) => sum + (Number(p.customAmount) || 0), 0);
    if (Math.abs(allocated - totalAmount) > 0.05) {
      throw new Error(`Custom split sum (${allocated}) does not match total amount (${totalAmount}).`);
    }

    shares = participants.map((p, idx) => ({
      shareId: `sh_${idx + 1}`,
      participantId: p.id || `p_${idx + 1}`,
      name: p.name,
      phone: p.phone || null,
      email: p.email || null,
      isOrganizer: !!p.isOrganizer || idx === 0,
      amountDue: round2(Number(p.customAmount) || 0),
      amountPaid: 0,
      status: SHARE_STATUS.PENDING,
      paymentToken: generateToken('pay'),
      paidAt: null,
      paymentRef: null,
    }));
  } else if (splitMode === SPLIT_MODES.PERCENTAGE) {
    const totalPct = participants.reduce((sum, p) => sum + (Number(p.customPercentage) || 0), 0);
    if (Math.abs(totalPct - 100) > 0.1) {
      throw new Error(`Percentage split sum (${totalPct}%) must equal 100%.`);
    }

    shares = participants.map((p, idx) => {
      const amount = round2(totalAmount * ((Number(p.customPercentage) || 0) / 100));
      return {
        shareId: `sh_${idx + 1}`,
        participantId: p.id || `p_${idx + 1}`,
        name: p.name,
        phone: p.phone || null,
        email: p.email || null,
        isOrganizer: !!p.isOrganizer || idx === 0,
        amountDue: amount,
        amountPaid: 0,
        status: SHARE_STATUS.PENDING,
        paymentToken: generateToken('pay'),
        paidAt: null,
        paymentRef: null,
      };
    });
  } else {
    throw new Error(`Unsupported splitMode: ${splitMode}`);
  }

  return {
    poolId: `pool_${bookingId}_${Date.now().toString(36)}`,
    bookingId,
    totalAmount: round2(totalAmount),
    totalPaid: 0,
    remainingBalance: round2(totalAmount),
    currency,
    splitMode,
    status: SPLIT_POOL_STATUS.PENDING,
    participantCount: count,
    shares,
    createdAt: createdTime.toISOString(),
    expiresAt: expiresAt.toISOString(),
    completedAt: null,
  };
}

// ─── Payment Contributions ───────────────────────────────────────────────────

/**
 * Record a contributor's payment toward their share.
 *
 * @param {object} params
 * @param {object} params.pool - Current pool state
 * @param {string} [params.shareId] - Participant share ID
 * @param {string} [params.paymentToken] - Alternate lookup by token
 * @param {number} params.amountPaid - Amount transferred
 * @param {string} params.paymentRef - Gateway reference / transaction ID
 * @param {Date|string} [params.paidAt=new Date()]
 * @returns {object} Updated pool state
 */
export function recordContribution({
  pool,
  shareId,
  paymentToken,
  amountPaid,
  paymentRef,
  paidAt = new Date(),
}) {
  if (pool.status === SPLIT_POOL_STATUS.FULLY_FUNDED) {
    throw new Error('This split pool is already fully funded.');
  }
  if (pool.status === SPLIT_POOL_STATUS.EXPIRED) {
    throw new Error('Cannot contribute to an expired split pool.');
  }
  if (typeof amountPaid !== 'number' || amountPaid <= 0) {
    throw new Error('amountPaid must be greater than 0.');
  }

  const targetShare = pool.shares.find(
    (s) => (shareId && s.shareId === shareId) || (paymentToken && s.paymentToken === paymentToken)
  );

  if (!targetShare) {
    throw new Error('Matching share was not found in this pool.');
  }
  if (targetShare.status === SHARE_STATUS.PAID) {
    throw new Error('This share has already been settled.');
  }

  // Update target share
  const newShares = pool.shares.map((s) => {
    if (s.shareId !== targetShare.shareId) return s;
    return {
      ...s,
      amountPaid: round2(amountPaid),
      status: SHARE_STATUS.PAID,
      paidAt: new Date(paidAt).toISOString(),
      paymentRef: paymentRef || `ref_${Date.now()}`,
    };
  });

  // Calculate new totals
  const totalPaid = round2(newShares.reduce((sum, s) => sum + s.amountPaid, 0));
  const remainingBalance = Math.max(0, round2(pool.totalAmount - totalPaid));

  const isComplete = remainingBalance <= 0;
  let newStatus = SPLIT_POOL_STATUS.PENDING;
  if (isComplete) {
    newStatus = SPLIT_POOL_STATUS.FULLY_FUNDED;
  } else if (totalPaid > 0) {
    newStatus = SPLIT_POOL_STATUS.PARTIALLY_PAID;
  }

  return {
    ...pool,
    totalPaid,
    remainingBalance,
    status: newStatus,
    shares: newShares,
    completedAt: isComplete ? new Date().toISOString() : null,
  };
}

// ─── Organizer Shortfall Bailout ─────────────────────────────────────────────

/**
 * Allows the organizer to fund the remaining unpaid balance before deadline.
 *
 * @param {object} params
 * @param {object} params.pool
 * @param {string} params.paymentRef
 * @returns {object} Updated fully funded pool state
 */
export function resolveShortfallWithOrganizer({ pool, paymentRef }) {
  if (pool.status === SPLIT_POOL_STATUS.FULLY_FUNDED) {
    return pool;
  }
  if (pool.remainingBalance <= 0) {
    return {
      ...pool,
      status: SPLIT_POOL_STATUS.FULLY_FUNDED,
      completedAt: new Date().toISOString(),
    };
  }

  const organizerShare = pool.shares.find((s) => s.isOrganizer);
  const shortfall = pool.remainingBalance;

  // Mark all pending shares as waived/covered by organizer
  const updatedShares = pool.shares.map((s) => {
    if (s.status === SHARE_STATUS.PAID) return s;
    if (s.isOrganizer) {
      return {
        ...s,
        amountPaid: round2(s.amountPaid + shortfall),
        status: SHARE_STATUS.PAID,
        paymentRef: paymentRef || `bailout_${Date.now()}`,
        paidAt: new Date().toISOString(),
      };
    }
    return {
      ...s,
      status: SHARE_STATUS.WAIVED,
      coveredByOrganizer: true,
    };
  });

  // If organizer wasn't already credited shortfall in map
  const finalTotalPaid = round2(pool.totalPaid + shortfall);

  return {
    ...pool,
    totalPaid: finalTotalPaid,
    remainingBalance: 0,
    status: SPLIT_POOL_STATUS.FULLY_FUNDED,
    shortfallCoveredByOrganizer: shortfall,
    organizerId: organizerShare?.participantId || null,
    shares: updatedShares,
    completedAt: new Date().toISOString(),
  };
}

// ─── Expiration & Refund Ledger ──────────────────────────────────────────────

/**
 * Checks if the pool is expired and returns updated state if deadline has passed.
 *
 * @param {object} pool
 * @param {Date|string|number} [currentTime=Date.now()]
 * @returns {{ isExpired: boolean, pool: object }}
 */
export function checkPoolExpiration(pool, currentTime = Date.now()) {
  if (pool.status === SPLIT_POOL_STATUS.FULLY_FUNDED || pool.status === SPLIT_POOL_STATUS.CANCELLED) {
    return { isExpired: false, pool };
  }

  const nowMs = new Date(currentTime).getTime();
  const expireMs = new Date(pool.expiresAt).getTime();

  if (nowMs >= expireMs) {
    return {
      isExpired: true,
      pool: {
        ...pool,
        status: SPLIT_POOL_STATUS.EXPIRED,
      },
    };
  }

  return { isExpired: false, pool };
}

/**
 * Builds an automated refund disbursement ledger for all contributors of an expired/cancelled pool.
 *
 * @param {object} pool
 * @returns {Array<object>} Itemized refund transactions
 */
export function calculateRefundSchedule(pool) {
  const refunds = [];

  for (const share of pool.shares) {
    if (share.amountPaid > 0 && share.status === SHARE_STATUS.PAID) {
      refunds.push({
        refundId: `ref_${share.shareId}_${Date.now().toString(36)}`,
        participantId: share.participantId,
        name: share.name,
        refundAmount: share.amountPaid,
        currency: pool.currency,
        originalPaymentRef: share.paymentRef,
        status: 'PENDING_DISBURSEMENT',
        reason: pool.status === SPLIT_POOL_STATUS.EXPIRED ? 'GROUP_FUNDING_DEADLINE_EXPIRED' : 'POOL_CANCELLED',
      });
    }
  }

  return refunds;
}

// ─── Status Summary ──────────────────────────────────────────────────────────

/**
 * Computes a consumer-facing summary of the group split progress.
 *
 * @param {object} pool
 * @returns {object} High-level overview
 */
export function generateShareSummary(pool) {
  const totalShares = pool.shares.length;
  const paidShares = pool.shares.filter((s) => s.status === SHARE_STATUS.PAID).length;
  const pendingShares = totalShares - paidShares;
  const fundedPercent = Math.min(100, Math.round((pool.totalPaid / pool.totalAmount) * 100));

  const nowMs = Date.now();
  const expireMs = new Date(pool.expiresAt).getTime();
  const minutesRemaining = Math.max(0, Math.round((expireMs - nowMs) / 60000));

  return {
    poolId: pool.poolId,
    bookingId: pool.bookingId,
    status: pool.status,
    totalAmount: pool.totalAmount,
    totalPaid: pool.totalPaid,
    remainingBalance: pool.remainingBalance,
    currency: pool.currency,
    fundedPercent,
    paidSharesCount: paidShares,
    pendingSharesCount: pendingShares,
    totalParticipants: totalShares,
    minutesRemaining,
    isFullyFunded: pool.status === SPLIT_POOL_STATUS.FULLY_FUNDED,
  };
}

export default {
  SPLIT_POOL_STATUS,
  SHARE_STATUS,
  SPLIT_MODES,
  SPLIT_DEFAULTS,
  createSplitPool,
  recordContribution,
  resolveShortfallWithOrganizer,
  checkPoolExpiration,
  calculateRefundSchedule,
  generateShareSummary,
  round2,
};
