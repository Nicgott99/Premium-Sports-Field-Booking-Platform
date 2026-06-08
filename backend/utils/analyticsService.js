import logger from './logger.js';

/**
 * Analytics service for tracking metrics and user behavior
 */

class AnalyticsService {
  constructor() {
    this.events = [];
    this.sessions = new Map();
    this.metrics = {
      pageViews: {},
      userActions: {},
      errors: {},
      performance: [],
    };
  }

  /**
   * Track event
   * @param {string} userId - User ID
   * @param {string} eventName - Event name
   * @param {object} data - Event data
   */
  trackEvent(userId, eventName, data = {}) {
    const event = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // Update event count
    if (!this.metrics.userActions[eventName]) {
      this.metrics.userActions[eventName] = 0;
    }
    this.metrics.userActions[eventName]++;

    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events.shift();
    }

    logger.debug(`Event tracked: ${eventName} by ${userId}`);
  }

  /**
   * Track page view
   * @param {string} userId - User ID
   * @param {string} page - Page path
   */
  trackPageView(userId, page) {
    this.trackEvent(userId, 'pageView', { page });

    if (!this.metrics.pageViews[page]) {
      this.metrics.pageViews[page] = 0;
    }
    this.metrics.pageViews[page]++;
  }

  /**
   * Track error
   * @param {string} errorType - Error type
   * @param {string} message - Error message
   * @param {object} context - Error context
   */
  trackError(errorType, message, context = {}) {
    if (!this.metrics.errors[errorType]) {
      this.metrics.errors[errorType] = 0;
    }
    this.metrics.errors[errorType]++;

    logger.warn(`Error tracked: ${errorType} - ${message}`, context);
  }

  /**
   * Track performance metric
   * @param {string} metric - Metric name
   * @param {number} value - Metric value (ms)
   */
  trackPerformance(metric, value) {
    this.metrics.performance.push({
      metric,
      value,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 1000
    if (this.metrics.performance.length > 1000) {
      this.metrics.performance.shift();
    }
  }

  /**
   * Create user session
   * @param {string} userId - User ID
   * @returns {object} Session
   */
  createSession(userId) {
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      userId,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      pageViews: [],
      events: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * End user session
   * @param {string} sessionId - Session ID
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.duration = session.endTime - session.startTime;
    }
  }

  /**
   * Get user analytics
   * @param {string} userId - User ID
   * @param {number} days - Number of days
   * @returns {object} Analytics
   */
  getUserAnalytics(userId, days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const userEvents = this.events.filter(e =>
      e.userId === userId && new Date(e.timestamp) >= cutoffDate
    );

    const eventCounts = {};
    userEvents.forEach(e => {
      eventCounts[e.eventName] = (eventCounts[e.eventName] || 0) + 1;
    });

    return {
      userId,
      totalEvents: userEvents.length,
      uniqueEventTypes: Object.keys(eventCounts).length,
      eventBreakdown: eventCounts,
      period: `Last ${days} days`,
    };
  }

  /**
   * Get platform analytics
   * @returns {object} Platform analytics
   */
  getPlatformAnalytics() {
    const totalUsers = new Set(this.events.map(e => e.userId)).size;
    const totalEvents = this.events.length;
    const activeSessions = this.sessions.size;

    return {
      totalUsers,
      totalEvents,
      activeSessions,
      topPages: Object.entries(this.metrics.pageViews)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topEvents: Object.entries(this.metrics.userActions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      errors: this.metrics.errors,
      avgPerformance: this.getAveragePerformance(),
    };
  }

  /**
   * Get average performance
   * @returns {object} Average performance metrics
   */
  getAveragePerformance() {
    if (this.metrics.performance.length === 0) return {};

    const grouped = {};
    this.metrics.performance.forEach(p => {
      if (!grouped[p.metric]) {
        grouped[p.metric] = [];
      }
      grouped[p.metric].push(p.value);
    });

    const averages = {};
    Object.entries(grouped).forEach(([metric, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      averages[metric] = Math.round(sum / values.length);
    });

    return averages;
  }

  /**
   * Get funnel analysis
   * @param {array} events - Sequence of events
   * @returns {object} Funnel metrics
   */
  analyzeFunnel(events) {
    const funnelData = {};
    let currentStep = 0;

    events.forEach((eventName, index) => {
      const matchingEvents = this.events.filter(e => e.eventName === eventName);
      const count = matchingEvents.length;
      const prevCount = index === 0 ? count : Object.values(funnelData)[index - 1].count;
      const conversionRate = index === 0 ? 100 : (count / prevCount) * 100;

      funnelData[eventName] = {
        count,
        conversionRate: conversionRate.toFixed(2),
      };
    });

    return funnelData;
  }

  /**
   * Generate analytics report
   * @returns {string} Report text
   */
  generateReport() {
    const analytics = this.getPlatformAnalytics();
    let report = '\n=== ANALYTICS REPORT ===\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    report += `Total Users: ${analytics.totalUsers}\n`;
    report += `Total Events: ${analytics.totalEvents}\n`;
    report += `Active Sessions: ${analytics.activeSessions}\n\n`;

    report += 'Top Pages:\n';
    analytics.topPages.forEach(([page, count], i) => {
      report += `  ${i + 1}. ${page}: ${count} views\n`;
    });

    report += '\nTop Events:\n';
    analytics.topEvents.forEach(([event, count], i) => {
      report += `  ${i + 1}. ${event}: ${count} occurrences\n`;
    });

    return report;
  }

  /**
   * Clear analytics data
   */
  clear() {
    this.events = [];
    this.sessions.clear();
    this.metrics = {
      pageViews: {},
      userActions: {},
      errors: {},
      performance: [],
    };
  }
}

export const analyticsService = new AnalyticsService();

export default analyticsService;
