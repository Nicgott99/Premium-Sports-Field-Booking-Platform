import logger from './logger.js';

/**
 * Connection pool for managing database connections
 */

class ConnectionPool {
  constructor(options = {}) {
    this.connections = [];
    this.availableConnections = [];
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 20;
    this.maxIdleTime = options.maxIdleTime || 900000; // 15 minutes
    this.acquireTimeoutMs = options.acquireTimeoutMs || 30000;
    this.connectionFactory = options.connectionFactory;
    this.initialized = false;
    this.stats = {
      acquired: 0,
      released: 0,
      timeouts: 0,
      errors: 0,
    };
  }

  /**
   * Initialize pool
   * @returns {Promise}
   */
  async initialize() {
    if (this.initialized) return;

    logger.info(`Initializing connection pool (min: ${this.minSize}, max: ${this.maxSize})`);

    for (let i = 0; i < this.minSize; i++) {
      try {
        const conn = await this.connectionFactory();
        this.createConnectionWrapper(conn);
      } catch (error) {
        logger.error('Failed to create initial connection:', error);
        this.stats.errors++;
      }
    }

    this.initialized = true;
    this.startCleanupTimer();
  }

  /**
   * Create connection wrapper
   * @param {*} conn - Connection
   */
  createConnectionWrapper(conn) {
    const wrapper = {
      connection: conn,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      inUse: false,
    };

    this.connections.push(wrapper);
    this.availableConnections.push(wrapper);
  }

  /**
   * Acquire connection
   * @returns {Promise} Connection
   */
  async acquire() {
    const startTime = Date.now();

    while (Date.now() - startTime < this.acquireTimeoutMs) {
      // Return available connection
      if (this.availableConnections.length > 0) {
        const wrapper = this.availableConnections.pop();
        wrapper.inUse = true;
        wrapper.lastUsedAt = Date.now();
        this.stats.acquired++;
        return wrapper.connection;
      }

      // Create new connection if under max size
      if (this.connections.length < this.maxSize) {
        try {
          const conn = await this.connectionFactory();
          const wrapper = {
            connection: conn,
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
            inUse: true,
          };
          this.connections.push(wrapper);
          this.stats.acquired++;
          return conn;
        } catch (error) {
          logger.error('Failed to create new connection:', error);
          this.stats.errors++;
        }
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.stats.timeouts++;
    throw new Error('Connection acquire timeout');
  }

  /**
   * Release connection
   * @param {*} conn - Connection
   */
  release(conn) {
    const wrapper = this.connections.find(w => w.connection === conn);

    if (wrapper) {
      wrapper.inUse = false;
      wrapper.lastUsedAt = Date.now();
      this.availableConnections.push(wrapper);
      this.stats.released++;
    }
  }

  /**
   * Close connection
   * @param {*} conn - Connection
   * @returns {Promise}
   */
  async closeConnection(conn) {
    const index = this.connections.findIndex(w => w.connection === conn);

    if (index !== -1) {
      const wrapper = this.connections[index];
      try {
        await wrapper.connection.close?.();
      } catch (error) {
        logger.error('Error closing connection:', error);
      }
      this.connections.splice(index, 1);

      const availIndex = this.availableConnections.indexOf(wrapper);
      if (availIndex !== -1) {
        this.availableConnections.splice(availIndex, 1);
      }
    }
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Check every minute
  }

  /**
   * Cleanup idle connections
   */
  async cleanupIdleConnections() {
    const now = Date.now();
    const toClose = [];

    for (const wrapper of this.connections) {
      if (
        !wrapper.inUse &&
        now - wrapper.lastUsedAt > this.maxIdleTime &&
        this.availableConnections.length > this.minSize
      ) {
        toClose.push(wrapper.connection);
      }
    }

    for (const conn of toClose) {
      await this.closeConnection(conn);
      logger.debug('Closed idle connection');
    }
  }

  /**
   * Get pool statistics
   * @returns {object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalConnections: this.connections.length,
      availableConnections: this.availableConnections.length,
      activeConnections: this.connections.filter(w => w.inUse).length,
    };
  }

  /**
   * Drain pool
   * @returns {Promise}
   */
  async drain() {
    logger.info('Draining connection pool');

    for (const wrapper of this.connections) {
      await this.closeConnection(wrapper.connection);
    }

    this.connections = [];
    this.availableConnections = [];
  }
}

export { ConnectionPool };

export default ConnectionPool;
