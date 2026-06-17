import mongoose from 'mongoose';
import { getRedisHealth, pingRedis } from '../config/redis.js';

const startTime = Date.now();

export const getSystemHealth = async () => {
  const dbState = mongoose?.connection?.readyState ?? 0;
  const redisHealth = typeof getRedisHealth === 'function' ? getRedisHealth() : { connected: false };
  const redisPing = typeof pingRedis === 'function' ? await pingRedis(1500) : false;

  const memUsage = process.memoryUsage();
  const uptime = Date.now() - startTime;

  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime / 1000),
    environment: process.env.NODE_ENV,
    services: {
      database: {
        status: dbState === 1 ? 'connected' : 'disconnected',
        readyState: dbState,
      },
      redis: {
        status: redisHealth.connected && redisPing ? 'connected' : 'disconnected',
        connected: redisHealth.connected,
        ping: redisPing,
      },
    },
    system: {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      nodeVersion: process.version,
    },
  };
};

export const isHealthy = async () => {
  const health = await getSystemHealth();
  return (
    health.services.database.status === 'connected' &&
    health.services.redis.status === 'connected'
  );
};
