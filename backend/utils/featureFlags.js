import logger from './logger.js';

/**
 * Feature flags and feature toggle system
 */

class FeatureFlagManager {
  constructor() {
    this.flags = new Map();
    this.rules = new Map();
  }

  /**
   * Define feature flag
   * @param {string} name - Flag name
   * @param {object} config - Flag configuration
   */
  define(name, config = {}) {
    this.flags.set(name, {
      name,
      enabled: config.enabled || false,
      percentage: config.percentage || 0,
      users: config.users || [],
      groups: config.groups || [],
      description: config.description || '',
      createdAt: new Date(),
    });

    logger.info(`Feature flag defined: ${name}`);
  }

  /**
   * Check if feature is enabled
   * @param {string} name - Flag name
   * @param {object} context - User/context information
   * @returns {boolean} Is enabled
   */
  isEnabled(name, context = {}) {
    const flag = this.flags.get(name);

    if (!flag) {
      logger.warn(`Feature flag not found: ${name}`);
      return false;
    }

    // Check if fully enabled
    if (flag.enabled === true) return true;
    if (flag.enabled === false) return false;

    // Check user whitelist
    if (flag.users.includes(context.userId)) return true;

    // Check group membership
    if (context.groups && flag.groups.some(g => context.groups.includes(g))) {
      return true;
    }

    // Check percentage rollout
    if (flag.percentage > 0) {
      const hash = this.hashContext(context);
      return (hash % 100) < flag.percentage;
    }

    // Check custom rules
    if (this.rules.has(name)) {
      const rule = this.rules.get(name);
      return rule(context);
    }

    return false;
  }

  /**
   * Hash context for consistent rollout
   * @param {object} context - Context
   * @returns {number} Hash
   */
  hashContext(context) {
    const str = JSON.stringify(context);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash);
  }

  /**
   * Register custom rule
   * @param {string} name - Flag name
   * @param {function} rule - Rule function
   */
  registerRule(name, rule) {
    this.rules.set(name, rule);
  }

  /**
   * Enable flag
   * @param {string} name - Flag name
   */
  enable(name) {
    const flag = this.flags.get(name);
    if (flag) {
      flag.enabled = true;
      logger.info(`Feature flag enabled: ${name}`);
    }
  }

  /**
   * Disable flag
   * @param {string} name - Flag name
   */
  disable(name) {
    const flag = this.flags.get(name);
    if (flag) {
      flag.enabled = false;
      logger.info(`Feature flag disabled: ${name}`);
    }
  }

  /**
   * Add user to flag
   * @param {string} name - Flag name
   * @param {string} userId - User ID
   */
  addUser(name, userId) {
    const flag = this.flags.get(name);
    if (flag && !flag.users.includes(userId)) {
      flag.users.push(userId);
    }
  }

  /**
   * Remove user from flag
   * @param {string} name - Flag name
   * @param {string} userId - User ID
   */
  removeUser(name, userId) {
    const flag = this.flags.get(name);
    if (flag) {
      flag.users = flag.users.filter(u => u !== userId);
    }
  }

  /**
   * Set rollout percentage
   * @param {string} name - Flag name
   * @param {number} percentage - Percentage (0-100)
   */
  setPercentage(name, percentage) {
    const flag = this.flags.get(name);
    if (flag) {
      flag.percentage = Math.min(100, Math.max(0, percentage));
    }
  }

  /**
   * Get all flags
   * @returns {array} Flags
   */
  getAll() {
    return Array.from(this.flags.values());
  }

  /**
   * Get flag status
   * @param {string} name - Flag name
   * @returns {object} Flag status
   */
  getStatus(name) {
    return this.flags.get(name);
  }
}

export const featureFlags = new FeatureFlagManager();

/**
 * Feature flag middleware
 * @returns {function} Express middleware
 */
export const featureFlagMiddleware = () => {
  return (req, res, next) => {
    req.isFeatureEnabled = (name) => {
      return featureFlags.isEnabled(name, {
        userId: req.user?.id,
        groups: req.user?.groups || [],
      });
    };

    next();
  };
};

export default {
  featureFlags,
  featureFlagMiddleware,
};
