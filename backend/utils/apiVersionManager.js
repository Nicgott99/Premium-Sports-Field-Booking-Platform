import logger from './logger.js';

/**
 * API versioning and deprecation management
 */

class ApiVersionManager {
  constructor() {
    this.versions = new Map();
    this.deprecations = new Map();
  }

  /**
   * Register API version
   * @param {string} version - Version number
   * @param {object} config - Version config
   */
  registerVersion(version, config = {}) {
    this.versions.set(version, {
      version,
      releaseDate: config.releaseDate || new Date(),
      deprecated: config.deprecated || false,
      deprecationDate: config.deprecationDate || null,
      sunsetDate: config.sunsetDate || null,
      status: config.deprecated ? 'deprecated' : 'active',
    });
  }

  /**
   * Deprecate version
   * @param {string} version - Version to deprecate
   * @param {Date} sunsetDate - When version will be removed
   */
  deprecateVersion(version, sunsetDate) {
    const versionInfo = this.versions.get(version);
    if (versionInfo) {
      versionInfo.deprecated = true;
      versionInfo.deprecationDate = new Date();
      versionInfo.sunsetDate = sunsetDate;
      versionInfo.status = 'deprecated';
      logger.info(`API version deprecated: ${version}`);
    }
  }

  /**
   * Check if version is active
   * @param {string} version - Version
   * @returns {boolean}
   */
  isActive(version) {
    const versionInfo = this.versions.get(version);
    return versionInfo && !versionInfo.deprecated;
  }

  /**
   * Check if version is deprecated
   * @param {string} version - Version
   * @returns {boolean}
   */
  isDeprecated(version) {
    const versionInfo = this.versions.get(version);
    return versionInfo?.deprecated || false;
  }

  /**
   * Get version info
   * @param {string} version - Version
   * @returns {object}
   */
  getVersionInfo(version) {
    return this.versions.get(version);
  }

  /**
   * Get latest version
   * @returns {string}
   */
  getLatestVersion() {
    let latest = null;
    for (const versionInfo of this.versions.values()) {
      if (this.isActive(versionInfo.version)) {
        if (!latest || versionInfo.releaseDate > this.versions.get(latest).releaseDate) {
          latest = versionInfo.version;
        }
      }
    }
    return latest;
  }

  /**
   * Register deprecation path
   * @param {string} oldVersion - Old version
   * @param {string} newVersion - New version
   * @param {function} migrator - Migration function
   */
  registerMigration(oldVersion, newVersion, migrator) {
    const key = `${oldVersion}->${newVersion}`;
    this.deprecations.set(key, migrator);
  }

  /**
   * Migrate request
   * @param {string} fromVersion - From version
   * @param {string} toVersion - To version
   * @param {object} data - Request data
   * @returns {object} Migrated data
   */
  migrate(fromVersion, toVersion, data) {
    const key = `${fromVersion}->${toVersion}`;
    const migrator = this.deprecations.get(key);

    if (!migrator) {
      logger.warn(`No migration found: ${key}`);
      return data;
    }

    return migrator(data);
  }

  /**
   * Get all versions
   * @returns {array}
   */
  getAllVersions() {
    return Array.from(this.versions.values());
  }

  /**
   * Get active versions
   * @returns {array}
   */
  getActiveVersions() {
    return this.getAllVersions().filter(v => !v.deprecated);
  }

  /**
   * Get deprecated versions
   * @returns {array}
   */
  getDeprecatedVersions() {
    return this.getAllVersions().filter(v => v.deprecated);
  }
}

/**
 * API versioning middleware
 * @param {ApiVersionManager} manager - Version manager
 * @returns {function} Middleware
 */
export const apiVersionMiddleware = (manager) => {
  return (req, res, next) => {
    const version = req.headers['api-version'] || req.query.version || manager.getLatestVersion();

    if (!manager.getVersionInfo(version)) {
      return res.status(400).json({
        success: false,
        error: `API version not found: ${version}`,
      });
    }

    if (manager.isDeprecated(version)) {
      res.setHeader('X-API-Deprecated', 'true');
      const versionInfo = manager.getVersionInfo(version);
      res.setHeader('X-Sunset', versionInfo.sunsetDate?.toISOString());
    }

    req.apiVersion = version;
    next();
  };
};

export { ApiVersionManager };

export const apiVersionManager = new ApiVersionManager();

export default ApiVersionManager;
