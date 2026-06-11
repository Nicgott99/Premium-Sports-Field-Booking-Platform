import logger from './logger.js';

/**
 * Health check system for monitoring service dependencies
 */

class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.results = new Map();
    this.interval = 30000; // 30 seconds
    this.checkTimer = null;
  }

  /**
   * Register health check
   * @param {string} name - Check name
   * @param {function} checkFn - Check function
   * @param {number} timeout - Timeout in milliseconds
   */
  register(name, checkFn, timeout = 5000) {
    this.checks.set(name, { fn: checkFn, timeout });
    logger.info(`Health check registered: ${name}`);
  }

  /**
   * Run single check
   * @param {string} name - Check name
   * @returns {Promise} Check result
   */
  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      return { status: 'unknown', message: 'Check not found' };
    }

    const startTime = Date.now();

    try {
      const result = await Promise.race([
        check.fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
        ),
      ]);

      const duration = Date.now() - startTime;
      const healthResult = {
        status: result.status || 'healthy',
        message: result.message || 'OK',
        duration,
        timestamp: new Date().toISOString(),
        details: result.details || {},
      };

      this.results.set(name, healthResult);
      return healthResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const healthResult = {
        status: 'unhealthy',
        message: error.message,
        duration,
        timestamp: new Date().toISOString(),
        error: error.message,
      };

      this.results.set(name, healthResult);
      return healthResult;
    }
  }

  /**
   * Run all checks
   * @returns {Promise} All results
   */
  async runAllChecks() {
    const results = {};

    for (const name of this.checks.keys()) {
      results[name] = await this.runCheck(name);
    }

    return results;
  }

  /**
   * Get overall health
   * @returns {Promise} Overall health status
   */
  async getOverallHealth() {
    const allResults = await this.runAllChecks();
    const statuses = Object.values(allResults).map(r => r.status);
    const isHealthy = statuses.every(s => s === 'healthy');

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: allResults,
      summary: {
        total: this.checks.size,
        healthy: statuses.filter(s => s === 'healthy').length,
        degraded: statuses.filter(s => s === 'degraded').length,
        unhealthy: statuses.filter(s => s === 'unhealthy').length,
      },
    };
  }

  /**
   * Get check result
   * @param {string} name - Check name
   * @returns {object} Result
   */
  getResult(name) {
    return this.results.get(name);
  }

  /**
   * Start periodic health checks
   * @param {number} interval - Check interval in milliseconds
   */
  startPeriodicChecks(interval = this.interval) {
    if (this.checkTimer) return;

    this.checkTimer = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        logger.error('Periodic health check failed:', error);
      }
    }, interval);

    logger.info(`Periodic health checks started (interval: ${interval}ms)`);
  }

  /**
   * Stop periodic checks
   */
  stopPeriodicChecks() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      logger.info('Periodic health checks stopped');
    }
  }

  /**
   * Get health check report
   * @returns {object} Report
   */
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    for (const [name, result] of this.results) {
      report.checks[name] = {
        status: result.status,
        message: result.message,
        duration: result.duration,
        lastChecked: result.timestamp,
      };
    }

    return report;
  }

  /**
   * Clear all checks
   */
  clear() {
    this.checks.clear();
    this.results.clear();
    this.stopPeriodicChecks();
  }
}

export const healthChecker = new HealthChecker();

/**
 * Health check middleware
 * @returns {function} Express middleware
 */
export const healthCheckMiddleware = () => {
  return async (req, res, next) => {
    if (req.path === '/health') {
      const health = await healthChecker.getOverallHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      return res.status(statusCode).json(health);
    }

    if (req.path === '/health/ready') {
      const health = await healthChecker.getOverallHealth();
      const isReady = health.status === 'healthy';
      return res.status(isReady ? 200 : 503).json({
        ready: isReady,
        status: health.status,
      });
    }

    if (req.path === '/health/live') {
      return res.json({ alive: true });
    }

    next();
  };
};

export default {
  healthChecker,
  healthCheckMiddleware,
};
