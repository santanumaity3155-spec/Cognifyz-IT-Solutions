import { CacheService } from '../cache/cacheService.js';
import { getTelemetryData } from '../services/telemetryService.js';
import { JobLogRepository } from '../models/JobLog.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get cache operational status and active key metadata.
 */
export const getCacheStats = async (req, res, next) => {
  try {
    const stats = await CacheService.getStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Purge cache (all or by pattern).
 */
export const purgeCache = async (req, res, next) => {
  try {
    const { pattern } = req.body || {};
    let deletedCount = 0;
    if (pattern && pattern.trim() !== '') {
      deletedCount = await CacheService.delPattern(pattern.trim());
    } else {
      deletedCount = await CacheService.flush();
    }

    res.status(200).json({
      success: true,
      message: `Cache purged successfully. ${deletedCount} key(s) removed.`,
      deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a specific cache key.
 */
export const deleteCacheKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    await CacheService.del(key);
    res.status(200).json({
      success: true,
      message: `Key '${key}' deleted from cache.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Demo endpoint: Platform overview statistics (cached with TTL 60s).
 */
export const getDemoStats = async (req, res, next) => {
  try {
    // Simulate lightweight database query latency
    await sleep(40);

    const telemetry = getTelemetryData();
    const jobCounts = await JobLogRepository.getCounts();

    res.status(200).json({
      success: true,
      data: {
        computedAt: new Date().toISOString(),
        summary: telemetry.summary,
        jobs: jobCounts,
        note: 'This payload is cached for 60 seconds unless bypassed with X-Cache-Bypass: true.',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Demo endpoint: Expensive analytics query (cached with TTL 120s).
 */
export const getHeavyAnalytics = async (req, res, next) => {
  try {
    // Simulate heavy computational aggregation
    const startCompute = Date.now();
    await sleep(150);

    // Compute CPU-bound primes count for measurable load
    let primeCount = 0;
    for (let i = 2; i < 25000; i++) {
      let isPrime = true;
      for (let j = 2; j * j <= i; j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primeCount++;
    }

    const computeTimeMs = Date.now() - startCompute;

    res.status(200).json({
      success: true,
      data: {
        primeCount,
        computeTimeMs,
        computedAt: new Date().toISOString(),
        dataset: '25,000 algorithmic nodes analyzed',
        note: 'High-cost computational query. Cached for 120s.',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Live performance benchmark comparing Uncached vs First Cached vs Subsequent Cache-Hit.
 */
export const runBenchmark = async (req, res, next) => {
  try {
    const benchmarkKey = 'benchmark:live_computation';

    // 1. Invalidate benchmark key before test to guarantee cold baseline
    await CacheService.del(benchmarkKey);

    // Step 1: Uncached Run (Cold computation)
    const uncachedStart = process.hrtime.bigint();
    await sleep(75); // Simulated database lookup
    let sum = 0;
    for (let i = 0; i < 50000; i++) {
      sum += (i * 3) % 7;
    }
    const uncachedData = { sum, timestamp: new Date().toISOString() };
    const uncachedEnd = process.hrtime.bigint();
    const uncachedMs = Number(uncachedEnd - uncachedStart) / 1_000_000;

    // Step 2: First Cached Run (Cold cache write)
    const writeStart = process.hrtime.bigint();
    await CacheService.set(benchmarkKey, uncachedData, 30);
    const writeEnd = process.hrtime.bigint();
    const writeMs = Number(writeEnd - writeStart) / 1_000_000;

    // Step 3: Cache Hit Run 1 (Hot read)
    const hit1Start = process.hrtime.bigint();
    const hit1Result = await CacheService.get(benchmarkKey);
    const hit1End = process.hrtime.bigint();
    const hit1Ms = Number(hit1End - hit1Start) / 1_000_000;

    // Step 4: Cache Hit Run 2 (Warm memory/redis read)
    const hit2Start = process.hrtime.bigint();
    const hit2Result = await CacheService.get(benchmarkKey);
    const hit2End = process.hrtime.bigint();
    const hit2Ms = Number(hit2End - hit2Start) / 1_000_000;

    const avgHitMs = (hit1Ms + hit2Ms) / 2;
    const speedupMultiplier = avgHitMs > 0 ? (uncachedMs / avgHitMs).toFixed(1) : 'N/A';
    const latencyReductionPct = uncachedMs > 0 ? (((uncachedMs - avgHitMs) / uncachedMs) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        measurements: {
          uncachedMs: Math.round(uncachedMs * 100) / 100,
          coldCacheWriteMs: Math.round(writeMs * 100) / 100,
          cacheHit1Ms: Math.round(hit1Ms * 100) / 100,
          cacheHit2Ms: Math.round(hit2Ms * 100) / 100,
          avgCacheHitMs: Math.round(avgHitMs * 100) / 100,
        },
        comparison: {
          speedupMultiplier: `${speedupMultiplier}x`,
          latencyReduction: `${latencyReductionPct}%`,
          cacheStatus: hit1Result ? 'HIT' : 'MISS',
          storageSource: hit1Result?.source || 'memory_fallback',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getCacheStats,
  purgeCache,
  deleteCacheKey,
  getDemoStats,
  getHeavyAnalytics,
  runBenchmark,
};

