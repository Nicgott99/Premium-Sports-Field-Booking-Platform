/**
 * Monitoring dashboard utility for real-time system monitoring
 */

class MonitoringDashboard {
  constructor(options = {}) {
    this.metrics = new Map();
    this.alerts = [];
    this.events = [];
    this.maxEventsSize = options.maxEventsSize || 1000;
    this.thresholds = new Map();
  }

  /**
   * Record metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {object} labels - Labels
   */
  recordMetric(name, value, labels = {}) {
    const key = this.getMetricKey(name, labels);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        name,
        labels,
        values: [],
        min: Infinity,
        max: -Infinity,
        avg: 0,
        count: 0,
      });
    }

    const metric = this.metrics.get(key);
    metric.values.push({ timestamp: Date.now(), value });
    metric.count++;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.avg = metric.values.reduce((sum, v) => sum + v.value, 0) / metric.count;

    // Keep only last 1000 values
    if (metric.values.length > 1000) {
      metric.values.shift();
    }

    // Check threshold
    this.checkThreshold(key, value);
  }

  /**
   * Set threshold for metric
   * @param {string} key - Metric key
   * @param {number} value - Threshold value
   * @param {string} condition - Condition (gt, lt, eq)
   */
  setThreshold(key, value, condition = 'gt') {
    this.thresholds.set(key, { value, condition });
  }

  /**
   * Check threshold
   * @param {string} key - Metric key
   * @param {number} value - Current value
   */
  checkThreshold(key, value) {
    const threshold = this.thresholds.get(key);
    if (!threshold) return;

    let breached = false;
    switch (threshold.condition) {
      case 'gt':
        breached = value > threshold.value;
        break;
      case 'lt':
        breached = value < threshold.value;
        break;
      case 'eq':
        breached = value === threshold.value;
        break;
    }

    if (breached) {
      this.createAlert(`Threshold breached for ${key}: ${value} ${threshold.condition} ${threshold.value}`);
    }
  }

  /**
   * Get metric key
   * @param {string} name - Metric name
   * @param {object} labels - Labels
   * @returns {string}
   */
  getMetricKey(name, labels = {}) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Create alert
   * @param {string} message - Alert message
   * @param {string} severity - Severity (info, warning, critical)
   */
  createAlert(message, severity = 'warning') {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      message,
      severity,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  /**
   * Record event
   * @param {string} name - Event name
   * @param {object} data - Event data
   */
  recordEvent(name, data = {}) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      data,
    };

    this.events.push(event);

    // Keep only last N events
    if (this.events.length > this.maxEventsSize) {
      this.events.shift();
    }
  }

  /**
   * Get dashboard summary
   * @returns {object}
   */
  getDashboardSummary() {
    const metrics = Array.from(this.metrics.values()).map(m => ({
      name: m.name,
      labels: m.labels,
      min: m.min === Infinity ? 0 : m.min,
      max: m.max === -Infinity ? 0 : m.max,
      avg: m.avg,
      count: m.count,
    }));

    return {
      timestamp: new Date().toISOString(),
      metrics: metrics,
      alerts: this.alerts.slice(-10),
      events: this.events.slice(-10),
      summary: {
        totalMetrics: this.metrics.size,
        totalAlerts: this.alerts.length,
        criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
        totalEvents: this.events.length,
      },
    };
  }

  /**
   * Get metric data
   * @param {string} name - Metric name
   * @returns {array}
   */
  getMetricData(name) {
    const metric = this.metrics.get(name);
    if (!metric) {
      return [];
    }

    return metric.values;
  }

  /**
   * Get active alerts
   * @returns {array}
   */
  getActiveAlerts() {
    return this.alerts.filter(a => a.severity === 'critical');
  }

  /**
   * Clear old data
   * @param {number} olderThan - Age in milliseconds
   */
  clearOldData(olderThan = 3600000) {
    const threshold = Date.now() - olderThan;

    // Clear old events
    this.events = this.events.filter(e => e.timestamp > threshold);

    // Clear old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > threshold);
  }

  /**
   * Get statistics
   * @returns {object}
   */
  getStats() {
    return {
      totalMetrics: this.metrics.size,
      totalAlerts: this.alerts.length,
      totalEvents: this.events.length,
      thresholds: this.thresholds.size,
    };
  }

  /**
   * Reset dashboard
   */
  reset() {
    this.metrics.clear();
    this.alerts = [];
    this.events = [];
    this.thresholds.clear();
  }
}

export { MonitoringDashboard };

export const monitoringDashboard = new MonitoringDashboard();

export default MonitoringDashboard;
