/**
 * Health Check Utility
 * Provides comprehensive health checks for all critical services
 * Used by health endpoints and monitoring systems
 */

import logger from './logger.js';
import mongoose from 'mongoose';
import { getRedisClient, isRedisConnected } from '../config/redis.js';
import { getRedisHealth } from '../config/redis.js';

/**
 * Check MongoDB connection status
 * @returns {Object} MongoDB health status
 */
export const checkMongoHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      service: 'MongoDB',
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: states[state],
      db: mongoose.connection.db?.databaseName || 'unknown',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`MongoDB health check failed: ${error.message}`);
    return {
      service: 'MongoDB',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check Redis connection status
 * @returns {Object} Redis health status
 */
export const checkRedisHealth = async () => {
  try {
    const redis = getRedisClient();

    if (!redis) {
      return {
        service: 'Redis',
        status: 'unhealthy',
        reason: 'Redis client not initialized',
        timestamp: new Date().toISOString()
      };
    }

    const isConnected = isRedisConnected();
    const health = getRedisHealth();

    return {
      service: 'Redis',
      status: isConnected ? 'healthy' : 'unhealthy',
      connected: health.connected,
      isOpen: health.isOpen,
      reconnectAttempts: health.reconnectAttempts,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Redis health check failed: ${error.message}`);
    return {
      service: 'Redis',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check system memory and uptime
 * @returns {Object} System health status
 */
export const checkSystemHealth = () => {
  try {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    return {
      service: 'System',
      status: 'healthy',
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      memory: {
        rss: formatBytes(memUsage.rss),
        heapTotal: formatBytes(memUsage.heapTotal),
        heapUsed: formatBytes(memUsage.heapUsed),
        external: formatBytes(memUsage.external),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`System health check failed: ${error.message}`);
    return {
      service: 'System',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Perform comprehensive health check on all services
 * @returns {Object} Complete health status
 */
export const performHealthCheck = async () => {
  try {
    const startTime = Date.now();

    const [mongoHealth, redisHealth, systemHealth] = await Promise.all([
      checkMongoHealth(),
      checkRedisHealth(),
      checkSystemHealth()
    ]);

    const services = [mongoHealth, redisHealth, systemHealth];
    const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded';
    const healthyServices = services.filter(s => s.status === 'healthy').length;

    const duration = Date.now() - startTime;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      services: {
        mongodb: mongoHealth,
        redis: redisHealth,
        system: systemHealth
      },
      summary: {
        total: services.length,
        healthy: healthyServices,
        unhealthy: services.length - healthyServices
      },
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Comprehensive health check failed: ${error.message}`);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        mongodb: { status: 'unknown' },
        redis: { status: 'unknown' },
        system: { status: 'unknown' }
      }
    };
  }
};

/**
 * Get detailed metrics for monitoring
 * @returns {Object} Detailed metrics
 */
export const getMetrics = async () => {
  try {
    const health = await performHealthCheck();
    const memory = process.memoryUsage();
    const uptime = process.uptime();

    return {
      timestamp: new Date().toISOString(),
      health: health.status,
      uptime: formatUptime(uptime),
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100) + '%'
      },
      services: {
        mongodb: health.services.mongodb.status,
        redis: health.services.redis.status,
        system: health.services.system.status
      }
    };
  } catch (error) {
    logger.error(`Metrics retrieval failed: ${error.message}`);
    return {
      timestamp: new Date().toISOString(),
      health: 'unknown',
      error: error.message
    };
  }
};

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted bytes
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format uptime to human readable format
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

export default {
  checkMongoHealth,
  checkRedisHealth,
  checkSystemHealth,
  performHealthCheck,
  getMetrics,
  formatBytes,
  formatUptime
};
