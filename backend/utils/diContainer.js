import logger from './logger.js';

/**
 * Dependency Injection Container for managing dependencies
 */

class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.factories = new Map();
  }

  /**
   * Register a service
   * @param {string} name - Service name
   * @param {function} definition - Service definition/factory
   * @param {boolean} singleton - Is singleton
   */
  register(name, definition, singleton = false) {
    if (typeof definition !== 'function') {
      throw new Error(`Service definition must be a function: ${name}`);
    }

    this.services.set(name, { definition, singleton });
    logger.debug(`Service registered: ${name} (singleton: ${singleton})`);
  }

  /**
   * Register singleton service
   * @param {string} name - Service name
   * @param {function} definition - Service definition
   */
  singleton(name, definition) {
    this.register(name, definition, true);
  }

  /**
   * Register factory service
   * @param {string} name - Service name
   * @param {function} factory - Factory function
   */
  factory(name, factory) {
    this.factories.set(name, factory);
    logger.debug(`Factory registered: ${name}`);
  }

  /**
   * Register value
   * @param {string} name - Service name
   * @param {*} value - Value
   */
  value(name, value) {
    this.singletons.set(name, value);
  }

  /**
   * Resolve service
   * @param {string} name - Service name
   * @returns {*} Service instance
   */
  resolve(name) {
    // Check if singleton already exists
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Check if factory exists
    if (this.factories.has(name)) {
      return this.factories.get(name)(this);
    }

    // Check if service is registered
    if (!this.services.has(name)) {
      throw new Error(`Service not found: ${name}`);
    }

    const { definition, singleton } = this.services.get(name);
    const instance = definition(this);

    if (singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name) || this.singletons.has(name);
  }

  /**
   * Get all registered services
   * @returns {array} Service names
   */
  getServices() {
    return Array.from(new Set([
      ...this.services.keys(),
      ...this.factories.keys(),
      ...this.singletons.keys(),
    ]));
  }

  /**
   * Bind service alias
   * @param {string} alias - Alias name
   * @param {string} name - Original service name
   */
  alias(alias, name) {
    if (!this.has(name)) {
      throw new Error(`Service not found: ${name}`);
    }

    this.register(alias, (container) => container.resolve(name));
  }

  /**
   * Register service with dependencies
   * @param {string} name - Service name
   * @param {array} deps - Dependencies
   * @param {function} fn - Constructor function
   */
  registerWithDeps(name, deps, fn) {
    this.register(name, (container) => {
      const resolvedDeps = deps.map(dep => container.resolve(dep));
      return fn(...resolvedDeps);
    });
  }

  /**
   * Clear all services
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  /**
   * Get container stats
   * @returns {object} Statistics
   */
  getStats() {
    return {
      totalServices: this.getServices().length,
      registeredServices: this.services.size,
      factories: this.factories.size,
      singletons: this.singletons.size,
    };
  }
}

export const diContainer = new DIContainer();

/**
 * Dependency injection decorator for classes
 * @param {...string} deps - Dependencies
 * @returns {function} Decorator
 */
export const Inject = (...deps) => {
  return (target) => {
    target.prototype.dependencies = deps;
    return target;
  };
};

export default diContainer;
