import Redis from 'ioredis';
import { env, maskConnectionString } from './environment.js';
import { logger } from '../utils/logger.js';

let redisClient = null;

let redisStatus = {
  mode: 'fallback', // 'redis' | 'fallback'
  state: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
  isConnected: false,
  isAvailable: false,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  uri: maskConnectionString(env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`),
  error: null,
  latencyMs: null,
  connectedAt: null,
  lastStateChange: new Date().toISOString(),
};

/**
 * Build Redis connection options.
 */
export const getRedisConnectionOptions = () => {
  if (env.REDIS_URL) {
    return {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
      },
    };
  }

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 2000,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  };
};

/**
 * Initialize Redis connection with safe error capture.
 */
export const initRedis = async () => {
  try {
    redisStatus.state = 'connecting';
    redisStatus.lastStateChange = new Date().toISOString();

    const options = getRedisConnectionOptions();
    if (env.REDIS_URL) {
      redisClient = new Redis(env.REDIS_URL, options);
    } else {
      redisClient = new Redis(options);
    }

    redisClient.on('connect', () => {
      logger.info(`[REDIS] Connecting to ${redisStatus.host}:${redisStatus.port}...`);
    });

    redisClient.on('ready', () => {
      redisStatus.state = 'connected';
      redisStatus.isConnected = true;
      redisStatus.isAvailable = true;
      redisStatus.mode = 'redis';
      redisStatus.error = null;
      redisStatus.connectedAt = new Date().toISOString();
      redisStatus.lastStateChange = new Date().toISOString();
      logger.info(`[REDIS] Connection established and ready on port ${redisStatus.port}`);
    });

    redisClient.on('error', (err) => {
      redisStatus.state = 'error';
      redisStatus.isConnected = false;
      redisStatus.isAvailable = false;
      redisStatus.error = err.message;
      redisStatus.lastStateChange = new Date().toISOString();
      logger.warn(`[REDIS WARNING] Connection error: ${err.message}`);
    });

    redisClient.on('close', () => {
      redisStatus.state = 'disconnected';
      redisStatus.isConnected = false;
      redisStatus.isAvailable = false;
      redisStatus.lastStateChange = new Date().toISOString();
    });

    // Test initial connection with ping
    const start = Date.now();
    await Promise.race([
      redisClient.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timed out after 2000ms')), 2000)),
    ]);
    redisStatus.latencyMs = Date.now() - start;
    redisStatus.mode = 'redis';
    redisStatus.isConnected = true;
    redisStatus.isAvailable = true;
    redisStatus.state = 'connected';
    return redisClient;
  } catch (err) {
    redisStatus.mode = 'fallback';
    redisStatus.state = 'disconnected';
    redisStatus.isConnected = false;
    redisStatus.isAvailable = false;
    redisStatus.error = `Redis connection failed: ${err.message}. Operating in documented In-Memory Development Fallback mode.`;
    redisStatus.lastStateChange = new Date().toISOString();

    logger.warn(`[REDIS FALLBACK] ${redisStatus.error}`);
    return null;
  }
};

/**
 * Ping Redis and measure roundtrip latency.
 */
export const pingRedis = async () => {
  if (!redisClient || !redisStatus.isConnected) {
    return { ok: false, error: redisStatus.error || 'Redis client not connected', latencyMs: null };
  }
  try {
    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;
    redisStatus.latencyMs = latency;
    return { ok: true, error: null, latencyMs: latency };
  } catch (err) {
    redisStatus.error = err.message;
    return { ok: false, error: err.message, latencyMs: null };
  }
};

/**
 * Disconnect Redis gracefully.
 */
export const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      redisStatus.isConnected = false;
      redisStatus.isAvailable = false;
      redisStatus.state = 'disconnected';
      redisStatus.lastStateChange = new Date().toISOString();
    }
  }
};

export const getRedisClient = () => redisClient;
export const getRedisStatus = () => ({ ...redisStatus });

export default {
  initRedis,
  getRedisClient,
  getRedisStatus,
  pingRedis,
  disconnectRedis,
  getRedisConnectionOptions,
};

