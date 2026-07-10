/**
 * userAgentParser.js
 * Lightweight middleware to parse and expose client user-agent details.
 * Premium Sports Field Booking Platform
 *
 * Attaches a `req.clientInfo` object containing detected browser, OS, and
 * device-type information. Useful for analytics, audit logs, and adaptive
 * responses without pulling in a heavy library.
 *
 * Usage in server.js:
 *   import userAgentParser from './middleware/userAgentParser.js';
 *   app.use(userAgentParser);
 */

/**
 * Detect the browser name from a User-Agent string.
 * @param {string} ua
 * @returns {string}
 */
const detectBrowser = (ua) => {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer';
  return 'Unknown';
};

/**
 * Detect the operating system from a User-Agent string.
 * @param {string} ua
 * @returns {string}
 */
const detectOS = (ua) => {
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
};

/**
 * Detect whether the client is mobile, tablet, or desktop.
 * @param {string} ua
 * @returns {'mobile'|'tablet'|'desktop'}
 */
const detectDeviceType = (ua) => {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
  return 'desktop';
};

/**
 * Express middleware — parses User-Agent and attaches req.clientInfo.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const userAgentParser = (req, res, next) => {
  const ua = req.headers['user-agent'] || '';

  req.clientInfo = {
    userAgent: ua,
    browser: detectBrowser(ua),
    os: detectOS(ua),
    deviceType: detectDeviceType(ua),
    isBot: /bot|crawler|spider|slurp|googlebot|bingbot/i.test(ua),
  };

  next();
};

export default userAgentParser;
