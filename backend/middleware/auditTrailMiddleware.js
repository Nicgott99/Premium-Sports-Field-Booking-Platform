import logger from '../utils/logger.js';

/**
 * Audit trail middleware for tracking all operations
 */

class AuditTrail {
  constructor() {
    this.entries = [];
    this.maxEntries = 10000;
  }

  /**
   * Create audit entry
   * @param {object} data - Audit data
   */
  createEntry(data) {
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...data,
    };

    this.entries.push(entry);

    // Keep only last maxEntries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return entry;
  }

  /**
   * Get audit entries with filters
   * @param {object} filters - Filter options
   * @returns {array} Audit entries
   */
  getEntries(filters = {}) {
    let entries = this.entries;

    if (filters.userId) {
      entries = entries.filter(e => e.userId === filters.userId);
    }

    if (filters.action) {
      entries = entries.filter(e => e.action === filters.action);
    }

    if (filters.resource) {
      entries = entries.filter(e => e.resource === filters.resource);
    }

    if (filters.startDate) {
      entries = entries.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      entries = entries.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
    }

    return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Export audit log
   * @param {object} filters - Filter options
   * @returns {string} CSV formatted log
   */
  exportLog(filters = {}) {
    const entries = this.getEntries(filters);
    const headers = ['timestamp', 'userId', 'action', 'resource', 'resourceId', 'status', 'details'];
    const csv = [headers.join(',')];

    entries.forEach(entry => {
      const row = headers.map(h => {
        const value = entry[h] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csv.push(row.join(','));
    });

    return csv.join('\n');
  }

  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @returns {object} Activity summary
   */
  getUserActivitySummary(userId) {
    const userEntries = this.entries.filter(e => e.userId === userId);
    const actions = {};

    userEntries.forEach(entry => {
      actions[entry.action] = (actions[entry.action] || 0) + 1;
    });

    return {
      userId,
      totalActions: userEntries.length,
      actionBreakdown: actions,
      lastActivity: userEntries[userEntries.length - 1]?.timestamp,
    };
  }
}

export const auditTrail = new AuditTrail();

/**
 * Audit trail middleware
 * @returns {function} Express middleware
 */
export const auditTrailMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - startTime;

    auditTrail.createEntry({
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      action: getActionFromRoute(req.method, req.path),
      resource: extractResource(req.path),
      resourceId: extractResourceId(req.path),
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Track specific user action
 * @param {object} req - Express request
 * @param {string} action - Action name
 * @param {string} resource - Resource type
 * @param {string} resourceId - Resource ID
 * @param {object} details - Additional details
 */
export const trackAction = (req, action, resource, resourceId, details = {}) => {
  auditTrail.createEntry({
    userId: req.user?.id,
    action,
    resource,
    resourceId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    details,
    status: 'success',
  });
};

/**
 * Track error action
 * @param {object} req - Express request
 * @param {string} action - Action name
 * @param {string} resource - Resource type
 * @param {Error} error - Error object
 */
export const trackError = (req, action, resource, error) => {
  auditTrail.createEntry({
    userId: req.user?.id,
    action,
    resource,
    method: req.method,
    path: req.path,
    ip: req.ip,
    status: 'error',
    error: error.message,
  });
};

/**
 * Deduce action from HTTP method and route
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @returns {string} Action name
 */
function getActionFromRoute(method, path) {
  const actionMap = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };
  return actionMap[method] || 'UNKNOWN';
}

/**
 * Extract resource type from path
 * @param {string} path - Request path
 * @returns {string} Resource type
 */
function extractResource(path) {
  const parts = path.split('/').filter(p => p && !p.match(/^\d+$/));
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Extract resource ID from path
 * @param {string} path - Request path
 * @returns {string} Resource ID
 */
function extractResourceId(path) {
  const parts = path.split('/');
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].match(/^[0-9a-f]{24}$|^\d+$/)) {
      return parts[i];
    }
  }
  return null;
}

export default {
  auditTrail,
  auditTrailMiddleware,
  trackAction,
  trackError,
};
