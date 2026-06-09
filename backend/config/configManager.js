import logger from '../utils/logger.js';

/**
 * Configuration management system
 * Handles environment variables and configuration overrides
 */

class ConfigManager {
  constructor() {
    this.config = {
      app: {
        name: process.env.APP_NAME || 'Sports Field Booking',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT, 10) || 5000,
        baseUrl: process.env.BASE_URL || 'http://localhost:5000',
      },
      database: {
        mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sports-booking',
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        dbName: process.env.DB_NAME || 'sports-booking',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRY || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      },
      email: {
        provider: process.env.EMAIL_PROVIDER || 'nodemailer',
        from: process.env.EMAIL_FROM || 'noreply@sportsfieldsbooking.com',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || '',
      },
      uploads: {
        directory: process.env.UPLOAD_DIR || './uploads',
        maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
      },
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: process.env.CORS_CREDENTIALS === 'true',
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        file: process.env.LOG_FILE || './logs/app.log',
      },
      features: {
        emailNotifications: process.env.ENABLE_EMAIL === 'true',
        smsNotifications: process.env.ENABLE_SMS === 'true',
        pushNotifications: process.env.ENABLE_PUSH === 'true',
        webhooks: process.env.ENABLE_WEBHOOKS === 'true',
        analytics: process.env.ENABLE_ANALYTICS !== 'false',
      },
    };

    this.overrides = new Map();
    this.validateConfig();
  }

  /**
   * Get configuration value
   * @param {string} path - Config path (dot-notation)
   * @param {*} defaultValue - Default value
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    // Check overrides first
    if (this.overrides.has(path)) {
      return this.overrides.get(path);
    }

    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value
   * @param {string} path - Config path
   * @param {*} value - Value to set
   */
  set(path, value) {
    this.overrides.set(path, value);
    logger.info(`Config override: ${path} = ${value}`);
  }

  /**
   * Get entire config section
   * @param {string} section - Section name
   * @returns {object} Section config
   */
  getSection(section) {
    return this.config[section] || {};
  }

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} Is enabled
   */
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`, false);
  }

  /**
   * Get database configuration
   * @returns {object} Database config
   */
  getDatabaseConfig() {
    return {
      uri: this.get('database.mongoUri'),
      name: this.get('database.dbName'),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    };
  }

  /**
   * Get JWT configuration
   * @returns {object} JWT config
   */
  getJWTConfig() {
    return {
      secret: this.get('jwt.secret'),
      expiresIn: this.get('jwt.expiresIn'),
      refreshSecret: this.get('jwt.refreshSecret'),
    };
  }

  /**
   * Validate required configuration
   * @throws Error if validation fails
   */
  validateConfig() {
    const required = [
      'jwt.secret',
      'database.mongoUri',
    ];

    const errors = [];
    required.forEach(key => {
      if (!this.get(key)) {
        errors.push(`Missing required config: ${key}`);
      }
    });

    if (errors.length > 0) {
      logger.warn('Configuration warnings:', errors);
    }
  }

  /**
   * Get all configuration
   * @param {boolean} mask - Mask sensitive values
   * @returns {object} Full config
   */
  getAll(mask = true) {
    if (!mask) {
      return { ...this.config };
    }

    const masked = JSON.parse(JSON.stringify(this.config));
    const sensitiveKeys = ['secret', 'password', 'token', 'key'];

    const maskValues = (obj) => {
      for (const key in obj) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
          obj[key] = '***MASKED***';
        } else if (typeof obj[key] === 'object') {
          maskValues(obj[key]);
        }
      }
    };

    maskValues(masked);
    return masked;
  }

  /**
   * Check if production environment
   * @returns {boolean}
   */
  isProduction() {
    return this.get('app.environment') === 'production';
  }

  /**
   * Check if development environment
   * @returns {boolean}
   */
  isDevelopment() {
    return this.get('app.environment') === 'development';
  }
}

export const configManager = new ConfigManager();

export default configManager;
