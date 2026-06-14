/**
 * Metrics exporter for Prometheus and other monitoring systems
 */

class MetricsExporter {
  constructor(options = {}) {
    this.format = options.format || 'prometheus';
    this.prefix = options.prefix || 'app';
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.timestamps = new Map();
  }

  /**
   * Increment counter
   * @param {string} name - Metric name
   * @param {number} value - Increment value
   * @param {object} labels - Labels
   */
  incrementCounter(name, value = 1, labels = {}) {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  /**
   * Set gauge value
   * @param {string} name - Metric name
   * @param {number} value - Value
   * @param {object} labels - Labels
   */
  setGauge(name, value, labels = {}) {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record histogram value
   * @param {string} name - Metric name
   * @param {number} value - Value
   * @param {object} labels - Labels
   */
  recordHistogram(name, value, labels = {}) {
    const key = this.getKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key).push(value);
  }

  /**
   * Time function execution
   * @param {string} name - Metric name
   * @param {function} fn - Function to time
   * @param {object} labels - Labels
   * @returns {*} Function result
   */
  async time(name, fn, labels = {}) {
    const start = process.hrtime.bigint();
    try {
      return await fn();
    } finally {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // milliseconds
      this.recordHistogram(name, duration, labels);
    }
  }

  /**
   * Get metric key
   * @param {string} name - Metric name
   * @param {object} labels - Labels
   * @returns {string}
   */
  getKey(name, labels = {}) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Export metrics in Prometheus format
   * @returns {string}
   */
  exportPrometheus() {
    const lines = [];

    // Export counters
    for (const [key, value] of this.counters) {
      lines.push(`${this.prefix}_${key} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges) {
      lines.push(`${this.prefix}_${key} ${value}`);
    }

    // Export histograms
    for (const [key, values] of this.histograms) {
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      const p50 = sorted[Math.floor(count * 0.5)];
      const p95 = sorted[Math.floor(count * 0.95)];
      const p99 = sorted[Math.floor(count * 0.99)];

      lines.push(`${this.prefix}_${key}_sum ${sum}`);
      lines.push(`${this.prefix}_${key}_count ${count}`);
      lines.push(`${this.prefix}_${key}_p50 ${p50}`);
      lines.push(`${this.prefix}_${key}_p95 ${p95}`);
      lines.push(`${this.prefix}_${key}_p99 ${p99}`);
    }

    return lines.join('\n');
  }

  /**
   * Export metrics in JSON format
   * @returns {object}
   */
  exportJSON() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms).map(([k, v]) => [k, this.getHistogramStats(v)])
      ),
    };
  }

  /**
   * Get histogram statistics
   * @param {array} values - Values
   * @returns {object}
   */
  getHistogramStats(values) {
    if (values.length === 0) return { count: 0 };

    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return { count, sum, avg, min, max, p50, p95, p99 };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * Get metric summary
   * @returns {object}
   */
  getSummary() {
    return {
      counters: this.counters.size,
      gauges: this.gauges.size,
      histograms: this.histograms.size,
      totalMetrics: this.counters.size + this.gauges.size + this.histograms.size,
    };
  }
}

export { MetricsExporter };

export const metricsExporter = new MetricsExporter();

export default MetricsExporter;
