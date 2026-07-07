/**
 * responseTime.js
 * Express middleware to measure and expose server response time.
 * Premium Sports Field Booking Platform
 *
 * Adds an `X-Response-Time` header to every response showing how many
 * milliseconds the server took to process the request. Useful for
 * performance monitoring and SLA tracking dashboards.
 *
 * Usage in server.js:
 *   import responseTime from './middleware/responseTime.js';
 *   app.use(responseTime());
 */

/**
 * @param {object}  [options]
 * @param {string}  [options.header='X-Response-Time'] - Header name to write.
 * @param {number}  [options.digits=2]                 - Decimal places on the ms value.
 * @param {boolean} [options.suffix=true]              - Append "ms" suffix to the value.
 * @returns {import('express').RequestHandler}
 */
const responseTime = (options = {}) => {
  const {
    header = 'X-Response-Time',
    digits = 2,
    suffix = true,
  } = options;

  return (req, res, next) => {
    const startNs = process.hrtime.bigint();

    const writeHeader = () => {
      const durationNs = process.hrtime.bigint() - startNs;
      const ms = (Number(durationNs) / 1_000_000).toFixed(digits);
      res.setHeader(header, suffix ? `${ms}ms` : ms);
    };

    // Write the header just before the response is flushed
    res.on('header', writeHeader);

    // Fallback for older Express versions that don't emit 'header'
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = (...args) => {
      writeHeader();
      res.write = originalWrite;
      return originalWrite(...args);
    };

    res.end = (...args) => {
      writeHeader();
      res.end = originalEnd;
      return originalEnd(...args);
    };

    next();
  };
};

export default responseTime;
