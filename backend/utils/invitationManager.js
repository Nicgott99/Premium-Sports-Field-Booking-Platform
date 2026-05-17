import logger from './logger.js';

/**
 * Team Member Invitation Manager
 * Handles invitation creation, expiry tracking, and expiration enforcement
 */

// Default invitation TTL (7 days)
const DEFAULT_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Create team invitation with expiry
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID being invited
 * @param {string} invitedBy - User ID who sent invitation
 * @param {Object} options - Configuration options
 * @returns {Object} Invitation object with expiry
 */
export const createInvitation = (teamId, userId, invitedBy, options = {}) => {
  const { ttlMs = DEFAULT_INVITATION_TTL_MS, role = 'member' } = options;

  if (!teamId || !userId || !invitedBy) {
    throw new Error('teamId, userId, and invitedBy are required');
  }

  const now = Date.now();
  const expiryTime = now + ttlMs;

  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    teamId,
    userId,
    invitedBy,
    role,
    status: 'pending', // pending | accepted | declined | expired
    createdAt: new Date(now),
    expiresAt: new Date(expiryTime),
    expiryTimestampMs: expiryTime,
    acceptedAt: null,
    declinedAt: null
  };
};

/**
 * Check if invitation is still valid (not expired)
 * @param {Object} invitation - Invitation object
 * @returns {boolean} True if invitation is valid
 */
export const isInvitationValid = (invitation) => {
  if (!invitation) {
    return false;
  }

  // Check status
  if (invitation.status && invitation.status !== 'pending') {
    return false;
  }

  // Check expiry
  const now = Date.now();
  const expiryTime = invitation.expiryTimestampMs || new Date(invitation.expiresAt).getTime();

  if (now > expiryTime) {
    logger.debug(`Invitation ${invitation.id} has expired`);
    return false;
  }

  return true;
};

/**
 * Check and auto-expire invitations
 * Marks expired invitations with 'expired' status
 * @param {Array} invitations - Array of invitation objects
 * @returns {Object} { valid: Array, expired: Array }
 */
export const filterValidInvitations = (invitations = []) => {
  if (!Array.isArray(invitations)) {
    return { valid: [], expired: [] };
  }

  const valid = [];
  const expired = [];
  const now = Date.now();

  for (const invitation of invitations) {
    if (isInvitationValid(invitation)) {
      valid.push(invitation);
    } else {
      // Auto-mark as expired if status is still pending
      if (!invitation.status || invitation.status === 'pending') {
        invitation.status = 'expired';
      }
      expired.push(invitation);
    }
  }

  return { valid, expired };
};

/**
 * Get invitation time remaining (in ms)
 * @param {Object} invitation - Invitation object
 * @returns {number} Milliseconds until expiry (negative if expired)
 */
export const getInvitationTimeRemaining = (invitation) => {
  if (!invitation) {
    return -1;
  }

  const now = Date.now();
  const expiryTime = invitation.expiryTimestampMs || new Date(invitation.expiresAt).getTime();

  return expiryTime - now;
};

/**
 * Format invitation expiry as human-readable string
 * @param {Object} invitation - Invitation object
 * @returns {string} Human-readable expiry info
 */
export const formatInvitationExpiry = (invitation) => {
  const timeRemaining = getInvitationTimeRemaining(invitation);

  if (timeRemaining < 0) {
    return 'Expired';
  }

  const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `Expires in ${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `Expires in ${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  return `Expires in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

/**
 * Accept invitation
 * @param {Object} invitation - Invitation object
 * @returns {Object} Updated invitation
 */
export const acceptInvitation = (invitation) => {
  if (!isInvitationValid(invitation)) {
    throw new Error('Cannot accept expired or already processed invitation');
  }

  return {
    ...invitation,
    status: 'accepted',
    acceptedAt: new Date()
  };
};

/**
 * Decline invitation
 * @param {Object} invitation - Invitation object
 * @returns {Object} Updated invitation
 */
export const declineInvitation = (invitation) => {
  if (!invitation) {
    throw new Error('Invitation is required');
  }

  return {
    ...invitation,
    status: 'declined',
    declinedAt: new Date()
  };
};

/**
 * Bulk cleanup expired invitations
 * Use for batch cleanup operations
 * @param {Array} invitations - Array of invitations
 * @returns {Object} { cleaned: number, remaining: number }
 */
export const cleanupExpiredInvitations = (invitations = []) => {
  if (!Array.isArray(invitations)) {
    return { cleaned: 0, remaining: 0 };
  }

  const { valid, expired } = filterValidInvitations(invitations);

  logger.info(`Cleaned up ${expired.length} expired invitations, ${valid.length} still active`);

  return {
    cleaned: expired.length,
    remaining: valid.length
  };
};

export default {
  createInvitation,
  isInvitationValid,
  filterValidInvitations,
  getInvitationTimeRemaining,
  formatInvitationExpiry,
  acceptInvitation,
  declineInvitation,
  cleanupExpiredInvitations,
  DEFAULT_INVITATION_TTL_MS
};
