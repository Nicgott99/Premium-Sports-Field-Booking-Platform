import logger from './logger.js';

/**
 * Metrics collection and monitoring system
 */

class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.timers = new Map();
  }

  /**
   * Increment counter
   * @param {string} name - Metric name
   * @param {number} value - Increment value
   * @param {object} tags - Metric tags
   */
  incrementCounter(name, value = 1, tags = {}) {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set gauge value
   * @param {string} name - Metric name
   * @param {number} value - Gauge value
   * @param {object} tags - Metric tags
   */
  setGauge(name, value, tags = {}) {
    const key = this.buildKey(name, tags);
    this.gauges.set(key, value);
  }

  /**
   * Record histogram value
   * @param {string} name - Metric name
   * @param {number} value - Value
   * @param {object} tags - Metric tags
   */
  recordHistogram(name, value, tags = {}) {
    const key = this.buildKey(name, tags);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key).push(value);
  }

  /**
   * Start timer
   * @param {string} name - Timer name
   * @returns {function} Stop function
   */
  startTimer(name) {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.recordHistogram(name, duration);
      return duration;
    };
  }

  /**
   * Build metric key
   * @param {string} name - Metric name
   * @param {object} tags - Tags
   * @returns {string} Key
   */
  buildKey(name, tags = {}) {
    if (Object.keys(tags).length === 0) return name;
    const tagStr = Object.entries(tags)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}{${tagStr}}`;
  }

  /**
   * Get metric value
   * @param {string} name - Metric name
   * @param {string} type - Metric type (counter, gauge, histogram)
   * @returns {*} Metric value
   */
  getMetric(name, type = 'counter') {
    const store = type === 'counter' ? this.counters :
                  type === 'gauge' ? this.gauges :
                  this.histograms;
    return store.get(name);
  }

  /**
   * Get all metrics
   * @returns {object} All metrics
   */
  getAllMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([k, v]) => [k, {
          count: v.length,
          sum: v.reduce((a, b) => a + b, 0),
          min: Math.min(...v),
          max: Math.max(...v),
          avg: v.reduce((a, b) => a + b, 0) / v.length,
        }])
      ),
    };
  }

  /**
   * Get percentile from histogram
   * @param {string} name - Histogram name
   * @param {number} percentile - Percentile (0-100)
   * @returns {number} Value
   */
  getPercentile(name, percentile = 95) {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Record metric
   * @param {string} name - Metric name
   * @param {*} value - Value
   * @param {string} type - Type (counter, gauge, histogram)
   */
  record(name, value, type = 'counter') {
    switch (type) {
      case 'counter':
        this.incrementCounter(name, value);
        break;
      case 'gauge':
        this.setGauge(name, value);
        break;
      case 'histogram':
        this.recordHistogram(name, value);
        break;
    }
  }

  /**
   * Reset metrics
   * @param {string} type - Type to reset (all, counter, gauge, histogram)
   */
  reset(type = 'all') {
    if (type === 'all' || type === 'counter') this.counters.clear();
    if (type === 'all' || type === 'gauge') this.gauges.clear();
    if (type === 'all' || type === 'histogram') this.histograms.clear();
  }

  /**
   * Export metrics in Prometheus format
   * @returns {string} Prometheus format
   */
  toPrometheus() {
    let output = '';

    // Export counters
    for (const [key, value] of this.counters) {
      output += `# HELP ${key} Counter metric\n`;
      output += `${key} ${value}\n`;
    }

    // Export gauges
    for (const [key, value] of this.gauges) {
      output += `# HELP ${key} Gauge metric\n`;
      output += `${key} ${value}\n`;
    }

    // Export histograms
    for (const [key, values] of this.histograms) {
      const sum = values.reduce((a, b) => a + b, 0);
      output += `${key}_total ${sum}\n`;
      output += `${key}_count ${values.length}\n`;
    }

    return output;
  }

  /**
   * Get metrics summary
   * @returns {object} Summary
   */
  getSummary() {
    return {
      timestamp: new Date().toISOString(),
      counters: this.counters.size,
      gauges: this.gauges.size,
      histograms: this.histograms.size,
      totalMetrics: this.counters.size + this.gauges.size + this.histograms.size,
    };
  }
}

export const metricsCollector = new MetricsCollector();

/**
 * Metrics collection middleware
 * @returns {function} Express middleware
 */
export const metricsMiddleware = () => {
  return (req, res, next) => {
    const stopTimer = metricsCollector.startTimer(`http_request_duration_${req.method}`);

    res.on('finish', () => {
      stopTimer();
      metricsCollector.incrementCounter(`http_requests_total`, 1, {
        method: req.method,
        status: res.statusCode,
      });
    });

    next();
  };
};

export default {
  metricsCollector,
  metricsMiddleware,
};
