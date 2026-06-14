/**
 * Distributed tracing utility for request tracing across services
 */

class DistributedTracing {
  constructor(options = {}) {
    this.traces = new Map();
    this.spans = new Map();
    this.samplingRate = options.samplingRate || 1.0;
    this.maxSpansPerTrace = options.maxSpansPerTrace || 1000;
  }

  /**
   * Generate trace ID
   * @returns {string}
   */
  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate span ID
   * @returns {string}
   */
  generateSpanId() {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create trace
   * @param {string} name - Trace name
   * @param {object} metadata - Trace metadata
   * @returns {string} Trace ID
   */
  createTrace(name, metadata = {}) {
    const traceId = this.generateTraceId();
    const shouldSample = Math.random() < this.samplingRate;

    this.traces.set(traceId, {
      id: traceId,
      name,
      startTime: Date.now(),
      startHrtime: process.hrtime.bigint(),
      metadata,
      shouldSample,
      spans: [],
    });

    return traceId;
  }

  /**
   * Create span
   * @param {string} traceId - Trace ID
   * @param {string} name - Span name
   * @param {string} parentSpanId - Parent span ID
   * @returns {string} Span ID
   */
  createSpan(traceId, name, parentSpanId = null) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    if (trace.spans.length >= this.maxSpansPerTrace) {
      throw new Error(`Max spans exceeded for trace: ${traceId}`);
    }

    const spanId = this.generateSpanId();

    const span = {
      id: spanId,
      traceId,
      name,
      parentSpanId,
      startTime: Date.now(),
      startHrtime: process.hrtime.bigint(),
      endTime: null,
      duration: null,
      status: 'running',
      tags: {},
      logs: [],
    };

    this.spans.set(spanId, span);
    trace.spans.push(spanId);

    return spanId;
  }

  /**
   * End span
   * @param {string} spanId - Span ID
   * @param {string} status - Span status (success, error)
   */
  endSpan(spanId, status = 'success') {
    const span = this.spans.get(spanId);
    if (!span) {
      throw new Error(`Span not found: ${spanId}`);
    }

    const endHrtime = process.hrtime.bigint();
    span.endTime = Date.now();
    span.duration = Number(endHrtime - span.startHrtime) / 1000000; // milliseconds
    span.status = status;
  }

  /**
   * Add tag to span
   * @param {string} spanId - Span ID
   * @param {string} key - Tag key
   * @param {*} value - Tag value
   */
  addTag(spanId, key, value) {
    const span = this.spans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  /**
   * Add log to span
   * @param {string} spanId - Span ID
   * @param {string} message - Log message
   * @param {object} fields - Log fields
   */
  addLog(spanId, message, fields = {}) {
    const span = this.spans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        fields,
      });
    }
  }

  /**
   * Get trace
   * @param {string} traceId - Trace ID
   * @returns {object|null}
   */
  getTrace(traceId) {
    return this.traces.get(traceId) || null;
  }

  /**
   * Get span
   * @param {string} spanId - Span ID
   * @returns {object|null}
   */
  getSpan(spanId) {
    return this.spans.get(spanId) || null;
  }

  /**
   * Export trace
   * @param {string} traceId - Trace ID
   * @returns {object}
   */
  exportTrace(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return null;
    }

    const spans = trace.spans.map(spanId => {
      const span = this.spans.get(spanId);
      return {
        ...span,
        duration: span.duration || 'pending',
      };
    });

    const traceDuration = trace.spans.length > 0
      ? Math.max(...spans.map(s => s.endTime || 0)) - trace.startTime
      : 0;

    return {
      trace: {
        ...trace,
        duration: traceDuration,
      },
      spans,
    };
  }

  /**
   * Cleanup old traces
   * @param {number} maxAge - Max age in milliseconds
   */
  cleanup(maxAge = 3600000) {
    const now = Date.now();
    let cleaned = 0;

    for (const [traceId, trace] of this.traces) {
      if (now - trace.startTime > maxAge) {
        // Remove associated spans
        trace.spans.forEach(spanId => this.spans.delete(spanId));
        this.traces.delete(traceId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get statistics
   * @returns {object}
   */
  getStats() {
    return {
      totalTraces: this.traces.size,
      totalSpans: this.spans.size,
      samplingRate: this.samplingRate,
      maxSpansPerTrace: this.maxSpansPerTrace,
    };
  }
}

export { DistributedTracing };

export const distributedTracing = new DistributedTracing();

export default DistributedTracing;
