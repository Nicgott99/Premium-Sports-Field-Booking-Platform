/**
 * urlValidator.js
 * Utility to validate and parse URLs safely.
 * Premium Sports Field Booking Platform
 */

/**
 * Validates if a given string is a well-formed URL.
 * @param {string} urlString - The URL string to validate.
 * @param {object} options - Validation options.
 * @param {boolean} [options.requireProtocol=true] - Whether to require a protocol (e.g., http:// or https://).
 * @param {string[]} [options.allowedProtocols=['http:', 'https:']] - Array of allowed protocols.
 * @returns {boolean} True if valid, false otherwise.
 */
export const isValidUrl = (urlString, options = {}) => {
  const {
    requireProtocol = true,
    allowedProtocols = ['http:', 'https:']
  } = options;

  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  let url;
  try {
    // URL constructor throws a TypeError if the string is not a valid URL
    url = new URL(urlString);
  } catch (err) {
    // If requireProtocol is false, we might want to test if it's a valid domain/path
    // by prepending a protocol temporarily.
    if (!requireProtocol) {
      try {
        url = new URL(`https://${urlString}`);
      } catch (innerErr) {
        return false;
      }
    } else {
      return false;
    }
  }

  // Check allowed protocols if a protocol was parsed
  if (url.protocol && allowedProtocols.length > 0) {
    if (!allowedProtocols.includes(url.protocol)) {
      return false;
    }
  }

  return true;
};

/**
 * Parses a URL string into its components safely.
 * @param {string} urlString - The URL to parse.
 * @returns {object|null} - Parsed URL object (protocol, host, pathname, search, etc.) or null if invalid.
 */
export const parseUrl = (urlString) => {
  if (!isValidUrl(urlString)) {
    return null;
  }
  
  try {
    const parsed = new URL(urlString);
    return {
      href: parsed.href,
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      searchParams: Object.fromEntries(parsed.searchParams.entries()),
      hash: parsed.hash,
    };
  } catch (err) {
    return null;
  }
};

export default {
  isValidUrl,
  parseUrl
};
