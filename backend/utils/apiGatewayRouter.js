/**
 * API gateway router for managing routes and request forwarding
 */

class ApiGatewayRouter {
  constructor(options = {}) {
    this.routes = new Map();
    this.middleware = [];
    this.errorHandlers = [];
    this.rateLimitRules = new Map();
  }

  /**
   * Register route
   * @param {string} method - HTTP method
   * @param {string} path - Route path
   * @param {function} handler - Route handler
   * @param {object} options - Route options
   */
  registerRoute(method, path, handler, options = {}) {
    const routeKey = `${method}:${path}`;

    this.routes.set(routeKey, {
      method,
      path,
      handler,
      pattern: this.pathToRegex(path),
      middleware: options.middleware || [],
      rateLimit: options.rateLimit || null,
      requireAuth: options.requireAuth || false,
      roles: options.roles || [],
    });
  }

  /**
   * Convert path to regex
   * @param {string} path - Path pattern
   * @returns {RegExp}
   */
  pathToRegex(path) {
    const regexPath = path
      .replace(/\//g, '\\/')
      .replace(/:([^/]+)/g, '(?<$1>[^/]+)');

    return new RegExp(`^${regexPath}$`);
  }

  /**
   * Find route
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @returns {object|null}
   */
  findRoute(method, path) {
    for (const [, route] of this.routes) {
      if (route.method === method && route.pattern.test(path)) {
        const match = path.match(route.pattern);
        return { ...route, params: match?.groups || {} };
      }
    }

    return null;
  }

  /**
   * Use middleware
   * @param {function} middleware - Middleware function
   */
  use(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Use error handler
   * @param {function} handler - Error handler
   */
  useErrorHandler(handler) {
    this.errorHandlers.push(handler);
  }

  /**
   * Register rate limit rule
   * @param {string} pathPattern - Path pattern
   * @param {number} limit - Request limit
   * @param {number} windowMs - Time window
   */
  registerRateLimit(pathPattern, limit, windowMs) {
    this.rateLimitRules.set(pathPattern, { limit, windowMs });
  }

  /**
   * Handle request
   * @param {object} req - Request
   * @param {object} res - Response
   * @returns {Promise}
   */
  async handleRequest(req, res) {
    try {
      // Run global middleware
      for (const middleware of this.middleware) {
        await middleware(req, res);
        if (res.headersSent) {
          return;
        }
      }

      // Find matching route
      const route = this.findRoute(req.method, req.path);
      if (!route) {
        res.status(404).json({
          success: false,
          error: 'Route not found',
        });
        return;
      }

      // Inject route params
      req.params = route.params;

      // Check authentication
      if (route.requireAuth && !req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      // Check authorization
      if (route.roles.length > 0 && !route.roles.includes(req.user?.role)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
        return;
      }

      // Check rate limit
      if (route.rateLimit) {
        const allowed = await this.checkRateLimit(req, route);
        if (!allowed) {
          res.status(429).json({
            success: false,
            error: 'Too many requests',
          });
          return;
        }
      }

      // Run route middleware
      for (const middleware of route.middleware) {
        await middleware(req, res);
        if (res.headersSent) {
          return;
        }
      }

      // Execute handler
      await route.handler(req, res);
    } catch (error) {
      // Run error handlers
      let handled = false;
      for (const handler of this.errorHandlers) {
        if (await handler(error, req, res)) {
          handled = true;
          break;
        }
      }

      if (!handled) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  }

  /**
   * Check rate limit
   * @param {object} req - Request
   * @param {object} route - Route
   * @returns {Promise<boolean>}
   */
  async checkRateLimit(req, route) {
    // Implementation depends on rate limit store
    return true;
  }

  /**
   * Get route statistics
   * @returns {object}
   */
  getStats() {
    return {
      totalRoutes: this.routes.size,
      methods: new Set(Array.from(this.routes.values()).map(r => r.method)).size,
      middleware: this.middleware.length,
      errorHandlers: this.errorHandlers.length,
      rateLimits: this.rateLimitRules.size,
    };
  }

  /**
   * List all routes
   * @returns {array}
   */
  listRoutes() {
    return Array.from(this.routes.values()).map(r => ({
      method: r.method,
      path: r.path,
      requireAuth: r.requireAuth,
      roles: r.roles,
    }));
  }
}

export { ApiGatewayRouter };

export default ApiGatewayRouter;
