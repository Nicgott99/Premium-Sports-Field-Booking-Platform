/**
 * requestSizeLimiter.js
 * Express middleware to enforce request payload size limits on specific routes.
 * Premium Sports Field Booking Platform
 */

/**
 * Creates a request payload size limiting middleware.
 * 
 * @param {number} maxBytes - Maximum allowed size in bytes.
 * @returns {Function} Express middleware.
 */
export const requestSizeLimiter = (maxBytes) => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return res.status(413).json({
        success: false,
        message: `Payload too large. Maximum size allowed is ${maxBytes} bytes.`
      });
    }
    next();
  };
};

export default requestSizeLimiter;
