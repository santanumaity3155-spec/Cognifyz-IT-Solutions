import { getRedisClient, getRedisStatus } from '../config/redis.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

// In-memory fallback TTL store
const memoryStore = new Map();

// Telemetry counters
let hits = 0;
let misses = 0;
let totalWrites = 0;

/**
 * Format full cache key with platform namespace.
 * @param {string} key
 * @returns {string}
 */
export const buildKey = (key) => {
  const ns = env.CACHE_NAMESPACE || 'forma:v1';
  return key.startsWith(ns) ? key : `${ns}:${key}`;
};

/**
 * Clean expired keys from in-memory fallback store periodically.
 */
const cleanupExpiredMemoryKeys = () => {
  const now = Date.now();
  for (const [k, item] of memoryStore.entries()) {
    if (item.expiresAt && item.expiresAt <= now) {
      memoryStore.delete(k);
    }
  }
};

setInterval(cleanupExpiredMemoryKeys, 15000);

export const CacheService = {
  /**
   * Retrieve item from cache.
   * @param {string} rawKey
   */
  async get(rawKey) {
    const key = buildKey(rawKey);
    const redis = getRedisClient();
    const redisStatus = getRedisStatus();

    if (redis && redisStatus.isConnected) {
      try {
        const data = await redis.get(key);
        if (data !== null) {
          hits++;
          const ttl = await redis.ttl(key);
          return {
            value: JSON.parse(data),
            source: 'redis',
            ttl: ttl > 0 ? ttl : null,
          };
        }
        misses++;
        return null;
      } catch (err) {
        logger.warn(`[CACHE WARNING] Redis GET failed: ${err.message}. Checking in-memory store.`);
      }
    }

    // In-memory fallback
    const item = memoryStore.get(key);
    if (item) {
      if (item.expiresAt && item.expiresAt <= Date.now()) {
        memoryStore.delete(key);
        misses++;
        return null;
      }
      hits++;
      const remainingSeconds = item.expiresAt ? Math.max(0, Math.ceil((item.expiresAt - Date.now()) / 1000)) : null;
      return {
        value: item.value,
        source: 'memory_fallback',
        ttl: remainingSeconds,
      };
    }

    misses++;
    return null;
  },

  /**
   * Set item in cache with TTL in seconds.
   * @param {string} rawKey
   * @param {any} value
   * @param {number} [ttlSeconds=60]
   */
  async set(rawKey, value, ttlSeconds = env.CACHE_DEFAULT_TTL_SECONDS) {
    const key = buildKey(rawKey);
    const ttl = Number(ttlSeconds) || 60;
    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    totalWrites++;

    const serialized = JSON.stringify(value);

    // Save in memory store as well (ensures resilience during failovers)
    memoryStore.set(key, {
      value,
      sizeBytes: Buffer.byteLength(serialized, 'utf8'),
      expiresAt: Date.now() + ttl * 1000,
      createdAt: new Date().toISOString(),
    });

    if (redis && redisStatus.isConnected) {
      try {
        await redis.set(key, serialized, 'EX', ttl);
        return true;
      } catch (err) {
        logger.warn(`[CACHE WARNING] Redis SET failed: ${err.message}`);
      }
    }

    return true;
  },

  /**
   * Delete specific key from cache.
   * @param {string} rawKey
   */
  async del(rawKey) {
    const key = buildKey(rawKey);
    const redis = getRedisClient();
    const redisStatus = getRedisStatus();

    memoryStore.delete(key);

    if (redis && redisStatus.isConnected) {
      try {
        await redis.del(key);
        return true;
      } catch (err) {
        logger.warn(`[CACHE WARNING] Redis DEL failed: ${err.message}`);
      }
    }
    return true;
  },

  /**
   * Invalidate keys matching a pattern.
   * @param {string} pattern
   */
  async delPattern(pattern) {
    const fullPattern = buildKey(pattern);
    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    let deletedCount = 0;

    // Remove matching from memory store
    const regex = new RegExp(`^${fullPattern.replace(/\*/g, '.*')}$`);
    for (const k of memoryStore.keys()) {
      if (regex.test(k)) {
        memoryStore.delete(k);
        deletedCount++;
      }
    }

    if (redis && redisStatus.isConnected) {
      try {
        const keys = await redis.keys(fullPattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          deletedCount = Math.max(deletedCount, keys.length);
        }
      } catch (err) {
        logger.warn(`[CACHE WARNING] Redis DEL pattern failed: ${err.message}`);
      }
    }

    return deletedCount;
  },

  /**
   * Flush all keys in current namespace.
   */
  async flush() {
    return this.delPattern('*');
  },

  /**
   * Get cache telemetry, metrics, and active keys.
   */
  async getStats() {
    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    const totalReads = hits + misses;
    const hitRatio = totalReads > 0 ? `${((hits / totalReads) * 100).toFixed(1)}%` : '0.0%';

    const activeKeys = [];
    const now = Date.now();

    for (const [k, v] of memoryStore.entries()) {
      const remainingSeconds = v.expiresAt ? Math.max(0, Math.ceil((v.expiresAt - now) / 1000)) : 0;
      activeKeys.push({
        key: k,
        ttlSeconds: remainingSeconds,
        sizeBytes: v.sizeBytes,
        createdAt: v.createdAt,
      });
    }

    return {
      mode: redisStatus.isConnected ? 'redis' : 'in_memory_fallback',
      isRedisConnected: redisStatus.isConnected,
      namespace: env.CACHE_NAMESPACE,
      hits,
      misses,
      totalReads,
      hitRatio,
      totalWrites,
      activeKeysCount: activeKeys.length,
      keys: activeKeys,
    };
  },

  /**
   * Reset cache stats for testing.
   */
  resetStats() {
    hits = 0;
    misses = 0;
    totalWrites = 0;
    memoryStore.clear();
  },
};

export default CacheService;

