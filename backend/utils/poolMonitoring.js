import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Database Connection Pool Monitoring Utility
 * Tracks and monitors MongoDB connection pool health and performance
 * 
 * Purpose:
 * - Monitor connection pool status
 * - Detect connection issues early
 * - Track connection metrics
 * - Alert on anomalies
 * - Optimize pool configuration
 * 
 * Connection Pool Configuration:
 * - maxPoolSize: 10 (max concurrent connections)
 * - minPoolSize: 5 (minimum idle connections)
 * - waitQueueTimeoutMS: 10000 (timeout for connection request)
 * - serverSelectionTimeoutMS: 5000 (find server timeout)
 * - socketTimeoutMS: 45000 (socket timeout)
 * 
 * Monitoring Metrics:
 * - Active connections: Currently in use
 * - Idle connections: Available but not in use
 * - Queue size: Requests waiting for connection
 * - Average query time: Performance metric
 * - Error rate: Connection failures
 * 
 * Health Indicators:
 * - Pool utilization: Active vs max (target: 30-70%)
 * - Queue backlog: Waiting requests (should be < 5)
 * - Connection errors: Failures per minute
 * - Latency: Query response time
 * 
 * Alerts:
 * - Pool exhaustion: 90%+ utilization
 * - Queue buildup: > 10 waiting requests
 * - Connection errors: > 5 per minute
 * - High latency: > 500ms average query time
 * 
 * Optimization Actions:
 * - Increase maxPoolSize if consistently high utilization
 * - Decrease if pool is rarely used (wasting resources)
 * - Adjust waitQueueTimeoutMS if errors occur
 * - Check for slow queries causing resource hogging
 * 
 * Integration:
 * - Called during server startup
 * - Periodic monitoring (every 60 seconds)
 * - Dashboard metrics API
 * - Alert triggers
 */

let poolStats = {
  activeConnections: 0,
  idleConnections: 0,
  totalConnections: 0,
  queueSize: 0,
  avgQueryTime: 0,
  errorCount: 0,
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * Get current connection pool statistics
 * @returns {Object} Current pool statistics
 */
export const getPoolStats = () => {
  try {
    const client = mongoose.connection;
    
    if (!client?.getClient()) {
      return poolStats;
    }

    const topologyPool = client.getClient().topology?.s?.pool;
    
    if (!topologyPool) {
      return {
        status: 'unavailable',
        message: 'Pool statistics not available',
        timestamp: new Date().toISOString()
      };
    }

    return {
      activeConnections: topologyPool.connectionCount,
      maxPoolSize: topologyPool.options?.maxPoolSize || 10,
      minPoolSize: topologyPool.options?.minPoolSize || 5,
      queueSize: topologyPool.waitQueueSize || 0,
      totalConnections: topologyPool.totalConnectionCount || 0,
      idleConnections: (topologyPool.totalConnectionCount || 0) - (topologyPool.connectionCount || 0),
      utilization: Math.round(((topologyPool.connectionCount || 0) / (topologyPool.options?.maxPoolSize || 10)) * 100),
      status: topologyPool.status || 'unknown',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error getting pool stats: ${error.message}`);
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check pool health and raise alerts if needed
 * @returns {Object} Health status with alerts
 */
export const checkPoolHealth = () => {
  try {
    const stats = getPoolStats();
    const alerts = [];

    if (stats.utilization > 90) {
      alerts.push({
        severity: 'critical',
        message: `Pool utilization critical: ${stats.utilization}%`,
        recommendation: 'Increase maxPoolSize or investigate slow queries'
      });
    } else if (stats.utilization > 70) {
      alerts.push({
        severity: 'warning',
        message: `Pool utilization high: ${stats.utilization}%`,
        recommendation: 'Monitor for potential bottlenecks'
      });
    }

    if (stats.queueSize > 10) {
      alerts.push({
        severity: 'critical',
        message: `Large queue backlog: ${stats.queueSize} requests waiting`,
        recommendation: 'Connection pool may be exhausted'
      });
    } else if (stats.queueSize > 5) {
      alerts.push({
        severity: 'warning',
        message: `Queue backlog building up: ${stats.queueSize} requests`,
        recommendation: 'Monitor connection usage'
      });
    }

    if (stats.status !== 'ok' && stats.status !== 'available') {
      alerts.push({
        severity: 'warning',
        message: `Pool status: ${stats.status}`,
        recommendation: 'Check database connectivity'
      });
    }

    return {
      isHealthy: alerts.filter(a => a.severity === 'critical').length === 0,
      stats,
      alerts,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error checking pool health: ${error.message}`);
    return {
      isHealthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Monitor pool health periodically
 * Called at regular intervals to check and log health
 * @param {number} intervalMs - Check interval in milliseconds (default: 60000 = 1 minute)
 * @returns {NodeJS.Timeout} Timer ID for cleanup
 */
export const startPoolMonitoring = (intervalMs = 60000) => {
  logger.info(`Starting connection pool monitoring (every ${intervalMs}ms)`);

  const monitoringInterval = setInterval(() => {
    try {
      const health = checkPoolHealth();

      if (!health.isHealthy) {
        logger.warn(`⚠️ Connection Pool Health Issues:`);
        health.alerts.forEach(alert => {
          logger.warn(`  [${alert.severity.toUpperCase()}] ${alert.message}`);
          logger.warn(`  → ${alert.recommendation}`);
        });
      }

      // Log current stats every 5 minutes
      if (new Date().getMinutes() % 5 === 0) {
        logger.info(`📊 Connection Pool Stats:`, health.stats);
      }
    } catch (error) {
      logger.error(`Pool monitoring error: ${error.message}`);
    }
  }, intervalMs);

  return monitoringInterval;
};

/**
 * Stop pool monitoring
 * @param {NodeJS.Timeout} intervalId - Timer ID from startPoolMonitoring()
 */
export const stopPoolMonitoring = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    logger.info('Connection pool monitoring stopped');
  }
};

/**
 * Get pool configuration recommendations
 * @returns {Object} Configuration recommendations based on current usage
 */
export const getPoolRecommendations = () => {
  try {
    const health = checkPoolHealth();
    const stats = health.stats;
    const recommendations = [];

    if (stats.utilization > 80) {
      recommendations.push({
        parameter: 'maxPoolSize',
        current: stats.maxPoolSize,
        suggested: stats.maxPoolSize + 5,
        reason: 'High pool utilization'
      });
    }

    if (stats.utilization < 30 && stats.activeConnections < stats.maxPoolSize / 2) {
      recommendations.push({
        parameter: 'maxPoolSize',
        current: stats.maxPoolSize,
        suggested: Math.max(5, stats.maxPoolSize - 3),
        reason: 'Pool is underutilized, could reduce resource usage'
      });
    }

    if (stats.queueSize > 5) {
      recommendations.push({
        parameter: 'waitQueueTimeoutMS',
        current: '10000ms',
        suggested: '15000ms',
        reason: 'Queue buildup suggests need for more wait time'
      });
    }

    return {
      recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error getting recommendations: ${error.message}`);
    return { recommendations: [], error: error.message };
  }
};

/**
 * Get connection pool API endpoint response
 * Used for admin dashboard and monitoring
 * @returns {Object} Complete pool status object
 */
export const getPoolStatus = () => {
  const health = checkPoolHealth();
  const recommendations = getPoolRecommendations();

  return {
    success: true,
    health: health.isHealthy,
    stats: health.stats,
    alerts: health.alerts,
    recommendations: recommendations.recommendations,
    timestamp: new Date().toISOString()
  };
};

export default {
  getPoolStats,
  checkPoolHealth,
  startPoolMonitoring,
  stopPoolMonitoring,
  getPoolRecommendations,
  getPoolStatus
};
