/**
 * Graceful shutdown handler for clean application termination
 */

class GracefulShutdown {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.signals = options.signals || ['SIGTERM', 'SIGINT'];
    this.hooks = {
      beforeShutdown: [],
      afterShutdown: [],
      onError: [],
    };
    this.isShuttingDown = false;
    this.server = null;
  }

  /**
   * Register server
   * @param {object} server - Express/HTTP server
   */
  registerServer(server) {
    this.server = server;
  }

  /**
   * Register before shutdown hook
   * @param {string} name - Hook name
   * @param {function} handler - Handler function
   */
  beforeShutdown(name, handler) {
    this.hooks.beforeShutdown.push({ name, handler });
  }

  /**
   * Register after shutdown hook
   * @param {string} name - Hook name
   * @param {function} handler - Handler function
   */
  afterShutdown(name, handler) {
    this.hooks.afterShutdown.push({ name, handler });
  }

  /**
   * Register error handler
   * @param {function} handler - Error handler
   */
  onError(handler) {
    this.hooks.onError.push(handler);
  }

  /**
   * Initialize shutdown listeners
   */
  listen() {
    this.signals.forEach(signal => {
      process.on(signal, () => this.shutdown(signal));
    });

    process.on('uncaughtException', error => this.handleUncaughtException(error));
    process.on('unhandledRejection', reason => this.handleUnhandledRejection(reason));
  }

  /**
   * Shutdown gracefully
   * @param {string} signal - Signal received
   */
  async shutdown(signal) {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log(`\nReceived ${signal}, starting graceful shutdown...`);

    const startTime = Date.now();

    try {
      // Close server
      if (this.server) {
        console.log('Closing HTTP server...');
        await this.closeServer();
      }

      // Run before shutdown hooks
      await this.runHooks(this.hooks.beforeShutdown);

      // Run after shutdown hooks
      await this.runHooks(this.hooks.afterShutdown);

      const duration = Date.now() - startTime;
      console.log(`Shutdown completed in ${duration}ms`);

      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      this.runErrorHandlers(error);
      process.exit(1);
    }

    // Force exit after timeout
    setTimeout(() => {
      console.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, this.timeout);
  }

  /**
   * Close server
   * @returns {Promise}
   */
  closeServer() {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        return resolve();
      }

      this.server.close(error => {
        if (error) {
          reject(error);
        } else {
          console.log('HTTP server closed');
          resolve();
        }
      });

      // Force close after timeout
      setTimeout(() => {
        console.warn('Server did not close within timeout, forcing close');
        resolve();
      }, this.timeout / 2);
    });
  }

  /**
   * Run shutdown hooks
   * @param {array} hooks - Hooks to run
   */
  async runHooks(hooks) {
    for (const { name, handler } of hooks) {
      try {
        console.log(`Running hook: ${name}`);
        await handler();
      } catch (error) {
        console.error(`Error in hook ${name}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Run error handlers
   * @param {error} error - Error object
   */
  runErrorHandlers(error) {
    this.hooks.onError.forEach(handler => {
      try {
        handler(error);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });
  }

  /**
   * Handle uncaught exception
   * @param {error} error - Error object
   */
  handleUncaughtException(error) {
    console.error('Uncaught Exception:', error);
    this.runErrorHandlers(error);
    this.shutdown('uncaughtException');
  }

  /**
   * Handle unhandled rejection
   * @param {*} reason - Rejection reason
   */
  handleUnhandledRejection(reason) {
    console.error('Unhandled Rejection:', reason);
    this.runErrorHandlers(new Error(String(reason)));
    this.shutdown('unhandledRejection');
  }
}

export { GracefulShutdown };

export const gracefulShutdown = new GracefulShutdown();

export default GracefulShutdown;
