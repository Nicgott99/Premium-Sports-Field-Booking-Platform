/**
 * Configuration hot reload utility for dynamic configuration updates
 */

class ConfigHotReload {
  constructor(options = {}) {
    this.config = {};
    this.originalConfig = {};
    this.watchers = new Map();
    this.listeners = [];
    this.checkInterval = options.checkInterval || 5000;
    this.isWatching = false;
  }

  /**
   * Load configuration
   * @param {object} config - Configuration object
   */
  load(config) {
    this.config = { ...config };
    this.originalConfig = { ...config };
  }

  /**
   * Get configuration value
   * @param {string} path - Config path (dot notation)
   * @param {*} defaultValue - Default value
   * @returns {*}
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value
   * @param {string} path - Config path (dot notation)
   * @param {*} value - Value to set
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = this.config;

    for (const key of keys) {
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }

    const oldValue = obj[lastKey];
    obj[lastKey] = value;

    // Notify listeners if value changed
    if (oldValue !== value) {
      this.notify(path, oldValue, value);
    }
  }

  /**
   * Watch configuration changes
   * @param {string} path - Config path (dot notation)
   * @param {function} callback - Callback function
   */
  watch(path, callback) {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }
    this.watchers.get(path).push(callback);
  }

  /**
   * Unwatch configuration changes
   * @param {string} path - Config path (dot notation)
   * @param {function} callback - Callback function
   */
  unwatch(path, callback) {
    const cbs = this.watchers.get(path);
    if (cbs) {
      const index = cbs.indexOf(callback);
      if (index > -1) {
        cbs.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to all changes
   * @param {function} callback - Callback function
   */
  onChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify watchers
   * @param {string} path - Config path
   * @param {*} oldValue - Old value
   * @param {*} newValue - New value
   */
  notify(path, oldValue, newValue) {
    const callbacks = this.watchers.get(path) || [];
    callbacks.forEach(cb => cb(newValue, oldValue));

    this.listeners.forEach(listener => {
      listener({ path, oldValue, newValue });
    });
  }

  /**
   * Start watching for file changes
   * @param {function} fileReader - Function to read config file
   */
  startWatching(fileReader) {
    if (this.isWatching) return;

    this.isWatching = true;
    this.watchInterval = setInterval(async () => {
      try {
        const newConfig = await fileReader();
        this.checkChanges(newConfig);
      } catch (error) {
        console.error('Error reading config:', error.message);
      }
    }, this.checkInterval);
  }

  /**
   * Stop watching
   */
  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.isWatching = false;
    }
  }

  /**
   * Check for configuration changes
   * @param {object} newConfig - New configuration
   */
  checkChanges(newConfig) {
    const diff = this.getDifferences(this.config, newConfig);

    if (Object.keys(diff).length > 0) {
      this.config = { ...newConfig };
      this.notifyChanges(diff);
    }
  }

  /**
   * Get differences between two configs
   * @param {object} oldConfig - Old config
   * @param {object} newConfig - New config
   * @returns {object}
   */
  getDifferences(oldConfig, newConfig) {
    const diff = {};

    const walk = (old, newer, path = '') => {
      for (const key in newer) {
        const fullPath = path ? `${path}.${key}` : key;

        if (typeof newer[key] === 'object' && newer[key] !== null) {
          walk(old[key] || {}, newer[key], fullPath);
        } else if (old[key] !== newer[key]) {
          diff[fullPath] = { old: old[key], new: newer[key] };
        }
      }
    };

    walk(oldConfig, newConfig);
    return diff;
  }

  /**
   * Notify changes
   * @param {object} changes - Changed values
   */
  notifyChanges(changes) {
    for (const [path, { old: oldValue, new: newValue }] of Object.entries(changes)) {
      this.notify(path, oldValue, newValue);
    }
  }

  /**
   * Reset to original config
   */
  reset() {
    this.config = { ...this.originalConfig };
  }

  /**
   * Get entire configuration
   * @returns {object}
   */
  getAll() {
    return { ...this.config };
  }
}

export { ConfigHotReload };

export const configHotReload = new ConfigHotReload();

export default ConfigHotReload;
