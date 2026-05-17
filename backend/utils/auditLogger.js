import logger from './logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Audit Logger
 * Tracks sensitive operations (admin actions, payments, user changes) with full context
 */

const AUDIT_LOG_DIR = process.env.AUDIT_LOG_DIR || './logs/audit';
const AUDIT_TYPES = {
  ADMIN_ACTION: 'admin_action',
  PAYMENT_PROCESSED: 'payment_processed',
  PAYMENT_REFUNDED: 'payment_refunded',
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  USER_ROLE_CHANGED: 'user_role_changed',
  FIELD_CREATED: 'field_created',
  FIELD_DELETED: 'field_deleted',
  BOOKING_CANCELLED: 'booking_cancelled',
  SECURITY_ALERT: 'security_alert'
};

// In-memory audit log store (for current session)
const auditLogs = [];
const MAX_MEMORY_LOGS = 10000;

/**
 * Ensure audit log directory exists
 */
const ensureAuditLogDir = () => {
  if (!fs.existsSync(AUDIT_LOG_DIR)) {
    fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
  }
};

/**
 * Get current date formatted for log filename
 */
const getDateString = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

/**
 * Get audit log filename for today
 */
const getAuditLogFilename = () => {
  return path.join(AUDIT_LOG_DIR, `audit-${getDateString()}.log`);
};

/**
 * Log an audit event
 * @param {Object} event - Audit event
 */
const logAuditEvent = (event) => {
  try {
    // Add memory entry
    auditLogs.push(event);

    // Trim memory if too large
    if (auditLogs.length > MAX_MEMORY_LOGS) {
      auditLogs.shift();
    }

    // Write to file
    ensureAuditLogDir();
    const logLine = JSON.stringify(event) + '\n';
    fs.appendFileSync(getAuditLogFilename(), logLine, 'utf8');
  } catch (error) {
    logger.error(`Failed to write audit log: ${error.message}`);
  }
};

/**
 * Create audit event
 * @param {Object} options - Event options
 * @returns {Object} Audit event
 */
const createAuditEvent = (options = {}) => {
  const {
    type,
    userId,
    targetId,
    targetType,
    action,
    status = 'success',
    details = {},
    ipAddress = 'unknown',
    userAgent = 'unknown',
    changes = null
  } = options;

  if (!type) {
    throw new Error('Audit event type is required');
  }

  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    type,
    userId: userId || 'system',
    targetId,
    targetType,
    action: action || type,
    status,
    details,
    ipAddress,
    userAgent,
    changes,
    version: 1
  };
};

/**
 * Log admin action
 */
export const logAdminAction = (options = {}) => {
  const { userId, action, targetId, details, ipAddress } = options;

  const event = createAuditEvent({
    type: AUDIT_TYPES.ADMIN_ACTION,
    userId,
    action,
    targetId,
    details,
    ipAddress,
    targetType: 'system'
  });

  logAuditEvent(event);
  logger.info(`Admin action logged: ${action} by ${userId}`);

  return event;
};

/**
 * Log payment event
 */
export const logPaymentEvent = (options = {}) => {
  const { type, userId, paymentId, amount, status, details, ipAddress } = options;

  const event = createAuditEvent({
    type,
    userId,
    targetId: paymentId,
    targetType: 'payment',
    details: { amount, ...details },
    status,
    ipAddress
  });

  logAuditEvent(event);
  logger.info(`Payment event logged: ${type} - ${paymentId} (${status})`);

  return event;
};

/**
 * Log user modification
 */
export const logUserModification = (options = {}) => {
  const { type, userId, targetUserId, changes, ipAddress, details } = options;

  const event = createAuditEvent({
    type,
    userId,
    targetId: targetUserId,
    targetType: 'user',
    changes,
    details,
    ipAddress
  });

  logAuditEvent(event);
  logger.info(`User modification logged: ${type} for ${targetUserId}`);

  return event;
};

/**
 * Log security event
 */
export const logSecurityAlert = (options = {}) => {
  const { alertType, userId, details, ipAddress, severity = 'warning' } = options;

  const event = createAuditEvent({
    type: AUDIT_TYPES.SECURITY_ALERT,
    userId,
    action: alertType,
    details: { severity, ...details },
    ipAddress,
    status: 'alert'
  });

  logAuditEvent(event);
  logger.warn(`Security alert logged: ${alertType} (severity: ${severity})`);

  return event;
};

/**
 * Log booking cancellation
 */
export const logBookingCancellation = (options = {}) => {
  const { userId, bookingId, reason, refundAmount, ipAddress } = options;

  const event = createAuditEvent({
    type: AUDIT_TYPES.BOOKING_CANCELLED,
    userId,
    targetId: bookingId,
    targetType: 'booking',
    details: { reason, refundAmount },
    ipAddress
  });

  logAuditEvent(event);
  logger.info(`Booking cancellation logged: ${bookingId} (refund: ${refundAmount})`);

  return event;
};

/**
 * Get audit logs for a user
 * @param {string} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Array} Filtered audit logs
 */
export const getUserAuditLogs = (userId, options = {}) => {
  const { type, limit = 100, offset = 0 } = options;

  let filtered = auditLogs.filter(log => log.userId === userId || log.targetId === userId);

  if (type) {
    filtered = filtered.filter(log => log.type === type);
  }

  return filtered.reverse().slice(offset, offset + limit);
};

/**
 * Get audit logs for a time range
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Array} Logs within time range
 */
export const getAuditLogsByTimeRange = (startTime, endTime) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  return auditLogs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start && logTime <= end;
  });
};

/**
 * Get statistics about audit logs
 */
export const getAuditLogStats = () => {
  const stats = {};

  for (const log of auditLogs) {
    stats[log.type] = (stats[log.type] || 0) + 1;
  }

  return {
    totalLogs: auditLogs.length,
    maxMemoryLogs: MAX_MEMORY_LOGS,
    byType: stats,
    logFile: getAuditLogFilename()
  };
};

/**
 * Export audit logs to file
 */
export const exportAuditLogs = (filename) => {
  try {
    const data = JSON.stringify(auditLogs, null, 2);
    fs.writeFileSync(filename, data, 'utf8');
    logger.info(`Audit logs exported to ${filename}`);
    return true;
  } catch (error) {
    logger.error(`Failed to export audit logs: ${error.message}`);
    return false;
  }
};

export default {
  logAdminAction,
  logPaymentEvent,
  logUserModification,
  logSecurityAlert,
  logBookingCancellation,
  getUserAuditLogs,
  getAuditLogsByTimeRange,
  getAuditLogStats,
  exportAuditLogs,
  AUDIT_TYPES
};
