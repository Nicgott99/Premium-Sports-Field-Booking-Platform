/**
 * languageDetector.js
 * Express middleware to detect and normalize the client's preferred language.
 * Premium Sports Field Booking Platform
 *
 * Reads the `Accept-Language` header, parses quality values (q-factors),
 * and attaches `req.preferredLanguage` (e.g. "en", "bn") and the full
 * `req.acceptedLanguages` array. Useful for serving localized content and
 * logging analytics by region.
 *
 * Usage in server.js:
 *   import languageDetector from './middleware/languageDetector.js';
 *   app.use(languageDetector(['en', 'bn']));  // supported languages
 */

/**
 * Parse the `Accept-Language` header into a sorted array of language tags.
 * @param {string} header
 * @returns {{ lang: string, q: number }[]}
 */
const parseAcceptLanguage = (header) => {
  if (!header) return [];
  return header
    .split(',')
    .map((part) => {
      const [langRaw, qRaw] = part.trim().split(';q=');
      const lang = langRaw.trim().toLowerCase().split('-')[0]; // normalize to base tag (en-US → en)
      const q = qRaw ? parseFloat(qRaw) : 1.0;
      return { lang, q };
    })
    .filter(({ lang }) => /^[a-z]{2,3}$/.test(lang))
    .sort((a, b) => b.q - a.q);
};

/**
 * Creates a language-detection middleware.
 * @param {string[]} [supported=['en']] - List of language codes your app supports.
 * @param {string}   [fallback='en']    - Default language when no match is found.
 * @returns {import('express').RequestHandler}
 */
const languageDetector = (supported = ['en'], fallback = 'en') => {
  const supportedSet = new Set(supported.map((l) => l.toLowerCase()));

  return (req, res, next) => {
    const header = req.headers['accept-language'] || '';
    const parsed = parseAcceptLanguage(header);

    req.acceptedLanguages = parsed.map((p) => p.lang);

    // Pick the first accepted language that the app actually supports
    const matched = parsed.find(({ lang }) => supportedSet.has(lang));
    req.preferredLanguage = matched ? matched.lang : fallback;

    // Expose for downstream use without re-reading the header
    res.setHeader('Content-Language', req.preferredLanguage);

    next();
  };
};

export default languageDetector;
