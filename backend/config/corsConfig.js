/**
 * corsConfig.js
 * Configurable CORS options for the Express server.
 * Premium Sports Field Booking Platform
 *
 * Centralises all CORS policy in one place so it is easy to add/remove
 * allowed origins for different environments (development, staging, production)
 * without touching server.js.
 *
 * Usage in server.js:
 *   import cors from 'cors';
 *   import corsOptions from './config/corsConfig.js';
 *   app.use(cors(corsOptions));
 */

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
];

const PROD_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = isProduction ? PROD_ORIGINS : [...DEV_ORIGINS, ...PROD_ORIGINS];

/**
 * Dynamic origin validator.
 * Supports string matching, wildcard *, and RegExp-based rules.
 */
const originValidator = (origin, callback) => {
  // Allow server-to-server requests (no Origin header) — e.g. Postman, curl
  if (!origin) return callback(null, true);

  // Wildcard: allow all (dev only guard)
  if (!isProduction && allowedOrigins.includes('*')) return callback(null, true);

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
};

/**
 * @type {import('cors').CorsOptions}
 */
const corsOptions = {
  origin: originValidator,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Api-Key',
    'X-Request-Id',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'X-Response-Time',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
  ],
  credentials: true,          // Allow cookies and Authorization headers
  maxAge: 86_400,             // Preflight cache: 24 hours
  optionsSuccessStatus: 204,  // Some legacy browsers choke on 200 for OPTIONS
};

export default corsOptions;
