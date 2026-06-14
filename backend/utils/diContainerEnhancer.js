/**
 * Dependency injection container enhancer for advanced DI patterns
 */

class DIContainerEnhancer {
  constructor(baseContainer = {}) {
    this.bindings = new Map(Object.entries(baseContainer));
    this.singletons = new Map();
    this.factories = new Map();
    this.middlewares = [];
    this.metadata = new Map();
  }

  /**
   * Register singleton binding
   * @param {string} name - Binding name
   * @param {*} instance - Singleton instance
   */
  singleton(name, instance) {
    this.bindings.set(name, instance);
    this.singletons.set(name, true);
  }

  /**
   * Register factory binding
   * @param {string} name - Binding name
   * @param {function} factory - Factory function
   */
  factory(name, factory) {
    this.factories.set(name, factory);
  }

  /**
   * Register class binding
   * @param {string} name - Binding name
   * @param {class} Class - Class to instantiate
   * @param {array} dependencies - Constructor dependencies
   */
  bind(name, Class, dependencies = []) {
    this.bindings.set(name, {
      Class,
      dependencies,
      type: 'class',
    });

    this.metadata.set(name, {
      name,
      type: 'class',
      dependencies,
      Class: Class.name,
    });
  }

  /**
   * Register middleware
   * @param {function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Resolve binding
   * @param {string} name - Binding name
   * @returns {*}
   */
  resolve(name) {
    // Apply middlewares
    let resolved = this.get(name);
    for (const middleware of this.middlewares) {
      resolved = middleware(resolved, name);
    }
    return resolved;
  }

  /**
   * Get binding
   * @param {string} name - Binding name
   * @returns {*}
   */
  get(name) {
    // Check singleton cache
    if (this.singletons.has(name)) {
      return this.bindings.get(name);
    }

    // Check factory
    if (this.factories.has(name)) {
      return this.factories.get(name)();
    }

    const binding = this.bindings.get(name);
    if (!binding) {
      throw new Error(`Binding not found: ${name}`);
    }

    // Handle class binding
    if (binding.type === 'class') {
      const deps = binding.dependencies.map(depName => this.resolve(depName));
      return new binding.Class(...deps);
    }

    return binding;
  }

  /**
   * Has binding
   * @param {string} name - Binding name
   * @returns {boolean}
   */
  has(name) {
    return this.bindings.has(name) || this.factories.has(name);
  }

  /**
   * Batch register
   * @param {object} bindings - Bindings object
   */
  register(bindings) {
    Object.entries(bindings).forEach(([name, binding]) => {
      if (typeof binding === 'function' && binding.prototype) {
        this.bind(name, binding);
      } else if (typeof binding === 'function') {
        this.factory(name, binding);
      } else {
        this.singleton(name, binding);
      }
    });
  }

  /**
   * Get all bindings
   * @returns {Map}
   */
  getAll() {
    return new Map(this.bindings);
  }

  /**
   * Get metadata
   * @param {string} name - Binding name
   * @returns {object|null}
   */
  getMetadata(name) {
    return this.metadata.get(name) || null;
  }

  /**
   * Get all metadata
   * @returns {Map}
   */
  getAllMetadata() {
    return new Map(this.metadata);
  }

  /**
   * Create child container
   * @returns {DIContainerEnhancer}
   */
  createChild() {
    const child = new DIContainerEnhancer();
    child.bindings = new Map(this.bindings);
    child.singletons = new Map(this.singletons);
    child.factories = new Map(this.factories);
    child.middlewares = [...this.middlewares];
    child.metadata = new Map(this.metadata);
    return child;
  }

  /**
   * Clear container
   */
  clear() {
    this.bindings.clear();
    this.singletons.clear();
    this.factories.clear();
    this.middlewares = [];
    this.metadata.clear();
  }

  /**
   * Validate dependencies
   * @returns {object}
   */
  validate() {
    const errors = [];
    const warnings = [];

    for (const [name, binding] of this.bindings) {
      if (binding.type === 'class' && binding.dependencies) {
        for (const dep of binding.dependencies) {
          if (!this.has(dep)) {
            errors.push(`${name} depends on unresolved: ${dep}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export { DIContainerEnhancer };

export default DIContainerEnhancer;
