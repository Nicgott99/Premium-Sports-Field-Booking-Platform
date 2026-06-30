/**
 * ipBlocker.js
 * Express middleware to restrict or whitelist access by client IP addresses.
 * Premium Sports Field Booking Platform
 */

/**
 * Creates an IP blocking middleware.
 * 
 * @param {string[]} blockedIps - Array of IP strings to block.
 * @param {string[]} [allowedIps=[]] - Array of whitelisted IPs. If populated, only these IPs are allowed.
 * @returns {Function} Express middleware.
 */
export const ipBlocker = (blockedIps = [], allowedIps = []) => {
  return (req, res, next) => {
    // Get client IP address
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (allowedIps.length > 0) {
      if (!allowedIps.includes(clientIp)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: client IP address is not whitelisted.'
        });
      }
    }

    if (blockedIps.includes(clientIp)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: client IP address is blocked.'
      });
    }

    next();
  };
};

export default ipBlocker;
