import logger from './logger.js';

/**
 * Session management utility for user sessions
 */

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.maxSessions = 10000;
    this.defaultTTL = 3600000; // 1 hour
  }

  /**
   * Create session
   * @param {string} userId - User ID
   * @param {object} data - Session data
   * @param {number} ttl - Time to live in milliseconds
   * @returns {object} Session
   */
  createSession(userId, data = {}, ttl = this.defaultTTL) {
    const sessionId = this.generateSessionId();
    const expiresAt = Date.now() + ttl;

    const session = {
      id: sessionId,
      userId,
      data,
      createdAt: new Date(),
      expiresAt: new Date(expiresAt),
      lastActivity: Date.now(),
      activityCount: 0,
    };

    this.sessions.set(sessionId, session);

    // Clean up if too many sessions
    if (this.sessions.size > this.maxSessions) {
      this.cleanupExpiredSessions();
    }

    logger.info(`Session created: ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * Generate session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session
   * @param {string} sessionId - Session ID
   * @returns {object} Session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if expired
    if (Date.now() > session.expiresAt.getTime()) {
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session data
   * @param {string} sessionId - Session ID
   * @param {object} data - Data to update
   * @returns {boolean} Success
   */
  updateSession(sessionId, data) {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    session.data = { ...session.data, ...data };
    session.lastActivity = Date.now();
    session.activityCount++;

    return true;
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success
   */
  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get user sessions
   * @param {string} userId - User ID
   * @returns {array} Sessions
   */
  getUserSessions(userId) {
    const userSessions = [];

    for (const [_, session] of this.sessions) {
      if (session.userId === userId) {
        // Check if expired
        if (Date.now() <= session.expiresAt.getTime()) {
          userSessions.push(session);
        } else {
          this.deleteSession(session.id);
        }
      }
    }

    return userSessions;
  }

  /**
   * Invalidate all user sessions
   * @param {string} userId - User ID
   * @returns {number} Deleted count
   */
  invalidateUserSessions(userId) {
    let count = 0;

    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        this.deleteSession(sessionId);
        count++;
      }
    }

    logger.info(`Invalidated ${count} sessions for user ${userId}`);
    return count;
  }

  /**
   * Extend session expiry
   * @param {string} sessionId - Session ID
   * @param {number} ttl - Additional time in milliseconds
   * @returns {boolean} Success
   */
  extendSession(sessionId, ttl = this.defaultTTL) {
    const session = this.getSession(sessionId);

    if (!session) {
      return false;
    }

    session.expiresAt = new Date(Date.now() + ttl);
    return true;
  }

  /**
   * Cleanup expired sessions
   * @returns {number} Cleaned up count
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let count = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now > session.expiresAt.getTime()) {
        this.deleteSession(sessionId);
        count++;
      }
    }

    if (count > 0) {
      logger.info(`Cleaned up ${count} expired sessions`);
    }

    return count;
  }

  /**
   * Get session stats
   * @returns {object} Statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      expiredSessions: Array.from(this.sessions.values())
        .filter(s => Date.now() > s.expiresAt.getTime()).length,
    };
  }

  /**
   * Clear all sessions
   */
  clearAllSessions() {
    this.sessions.clear();
  }
}

export const sessionManager = new SessionManager();

/**
 * Session middleware
 * @returns {function} Express middleware
 */
export const sessionMiddleware = () => {
  return (req, res, next) => {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        req.session = session;
      }
    }

    next();
  };
};

export default {
  sessionManager,
  sessionMiddleware,
};
