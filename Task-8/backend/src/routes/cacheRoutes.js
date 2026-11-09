import { Router } from 'express';
import {
  getCacheStats,
  purgeCache,
  deleteCacheKey,
  getDemoStats,
  getHeavyAnalytics,
  runBenchmark,
} from '../controllers/cacheController.js';
import { cacheResponse } from '../middleware/cacheMiddleware.js';
import { benchmarkLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Cache Telemetry and Administration
router.get('/stats', getCacheStats);
router.post('/purge', purgeCache);
router.delete('/key/:key', deleteCacheKey);

// Live performance comparison benchmark
router.post('/benchmark', benchmarkLimiter, runBenchmark);

// Cached Demo Endpoints with cacheResponse middleware
router.get('/demo/stats', cacheResponse({ ttlSeconds: 60, keyPrefix: 'stats' }), getDemoStats);
router.get('/demo/heavy-analytics', cacheResponse({ ttlSeconds: 120, keyPrefix: 'heavy' }), getHeavyAnalytics);

export default router;

