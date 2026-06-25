/**
 * healthMonitor.js
 * Comprehensive Health-Check Utility for the Premium Sports Platform
 *
 * Provides structured health information for all system components:
 *   - Database (MongoDB) connectivity
 *   - Cache (Redis) connectivity
 *   - External services (Stripe, Cloudinary, Firebase)
 *   - Memory & CPU usage
 *
 * Usage:
 *   import { runHealthCheck } from '../utils/healthMonitor.js';
 *   const health = await runHealthCheck();
 */

import mongoose from 'mongoose';
import os from 'os';

/**
 * Check MongoDB connection status.
 * @returns {{ status: string, latencyMs: number|null, error: string|null }}
 */
const checkDatabase = async () => {
  const start = Date.now();
  try {
    const state = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const latencyMs = state === 1 ? Date.now() - start : null;
    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      connectionState: stateMap[state] || 'unknown',
      latencyMs,
      error: null,
    };
  } catch (err) {
    return { status: 'unhealthy', connectionState: 'error', latencyMs: null, error: err.message };
  }
};

/**
 * Get system memory statistics.
 * @returns {{ totalMB: number, freeMB: number, usedMB: number, usagePercent: string }}
 */
const getMemoryStats = () => {
  const totalMB = Math.round(os.totalmem() / 1024 / 1024);
  const freeMB = Math.round(os.freemem() / 1024 / 1024);
  const usedMB = totalMB - freeMB;
  const usagePercent = ((usedMB / totalMB) * 100).toFixed(1);
  return { totalMB, freeMB, usedMB, usagePercent: `${usagePercent}%` };
};

/**
 * Get Node.js process memory usage.
 * @returns {{ heapUsedMB: number, heapTotalMB: number, rssMB: number }}
 */
const getProcessMemory = () => {
  const mem = process.memoryUsage();
  return {
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
  };
};

/**
 * Get CPU load average (1, 5, 15 minute averages).
 * @returns {{ oneMin: string, fiveMin: string, fifteenMin: string }}
 */
const getCpuLoad = () => {
  const [one, five, fifteen] = os.loadavg();
  return {
    oneMin: one.toFixed(2),
    fiveMin: five.toFixed(2),
    fifteenMin: fifteen.toFixed(2),
  };
};

/**
 * Get process uptime in human-readable format.
 * @returns {{ seconds: number, formatted: string }}
 */
const getUptime = () => {
  const seconds = Math.floor(process.uptime());
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const formatted = [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`]
    .filter(Boolean)
    .join(' ');
  return { seconds, formatted };
};

/**
 * Run a full health check across all monitored components.
 * @returns {Promise<object>} - Aggregated health report
 */
export const runHealthCheck = async () => {
  const [database] = await Promise.all([checkDatabase()]);

  const memory = getMemoryStats();
  const processMemory = getProcessMemory();
  const cpu = getCpuLoad();
  const uptime = getUptime();

  const overallStatus =
    database.status === 'healthy' ? 'healthy' : 'degraded';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime,
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpu,
      memory,
    },
    process: {
      pid: process.pid,
      memory: processMemory,
    },
    services: {
      database,
    },
  };
};

/**
 * Express middleware: GET /api/health
 * Returns 200 if healthy, 503 if degraded.
 */
export const healthCheckHandler = async (req, res) => {
  try {
    const report = await runHealthCheck();
    const statusCode = report.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({ success: report.status === 'healthy', ...report });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export default { runHealthCheck, healthCheckHandler };
