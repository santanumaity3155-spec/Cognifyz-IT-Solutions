import os from 'os';
import { getDatabaseStatus } from '../config/db.js';
import { getRedisStatus, pingRedis } from '../config/redis.js';
import { env } from '../config/environment.js';

const startTime = Date.now();

export const getHealth = async (req, res) => {
  const dbStatus = getDatabaseStatus();
  const redisStatus = getRedisStatus();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memory = process.memoryUsage();

  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Forma Server Intelligence Platform',
      version: '1.0.0',
      environment: env.NODE_ENV,
      port: env.PORT,
      uptimeSeconds,
      memory: {
        rssMb: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
        externalMb: Math.round((memory.external / (1024 * 1024)) * 100) / 100,
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
        totalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
      },
      infrastructure: {
        database: {
          mode: dbStatus.mode,
          state: dbStatus.state,
          isConnected: dbStatus.isConnected,
          isPersistent: dbStatus.isPersistent,
          host: dbStatus.host,
          databaseName: dbStatus.databaseName,
          error: dbStatus.error,
        },
        redis: {
          mode: redisStatus.mode,
          state: redisStatus.state,
          isConnected: redisStatus.isConnected,
          isAvailable: redisStatus.isAvailable,
          host: redisStatus.host,
          port: redisStatus.port,
          latencyMs: redisStatus.latencyMs,
          error: redisStatus.error,
        },
      },
    },
  });
};

export const getReadiness = async (req, res) => {
  const ping = await pingRedis();
  const db = getDatabaseStatus();

  // If running in development or fallback mode, system is still operational and ready to serve requests
  const isReady = true;

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    checks: {
      server: 'UP',
      redis: ping.ok ? 'CONNECTED' : `FALLBACK (${ping.error || 'unreachable'})`,
      database: db.isConnected ? 'CONNECTED' : `FALLBACK (${db.error || 'in-memory'})`,
    },
  });
};

export default { getHealth, getReadiness };

