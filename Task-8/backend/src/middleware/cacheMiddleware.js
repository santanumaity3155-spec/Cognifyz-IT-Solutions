import { CacheService } from '../cache/cacheService.js';
import { logger } from '../utils/logger.js';

/**
 * Route-level caching middleware.
 * @param {object} options
 * @param {number} [options.ttlSeconds=60]
 * @param {string} [options.keyPrefix='route']
 * @param {(req: import('express').Request) => string} [options.keyBuilder]
 */
export const cacheResponse = (options = {}) => {
  const ttl = options.ttlSeconds || 60;
  const prefix = options.keyPrefix || 'route';

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Determine cache key
    const rawKey = options.keyBuilder
      ? options.keyBuilder(req)
      : `${prefix}:${req.baseUrl || ''}${req.path}:${JSON.stringify(req.query)}`;

    const isBypass = req.headers['x-cache-bypass'] === 'true';

    if (!isBypass) {
      try {
        const cached = await CacheService.get(rawKey);
        if (cached && cached.value) {
          res.setHeader('X-Cache', 'HIT');
          if (cached.ttl !== null) {
            res.setHeader('X-Cache-TTL', cached.ttl.toString());
          }
          return res.status(200).json(cached.value);
        }
      } catch (err) {
        logger.warn(`[CACHE MIDDLEWARE READ ERROR] ${err.message}`);
      }
    }

    // Mark as MISS or BYPASS
    res.setHeader('X-Cache', isBypass ? 'BYPASS' : 'MISS');

    // Intercept res.json to populate cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Restore original method
      res.json = originalJson;

      // Only cache successful 200 responses
      if (res.statusCode === 200 && body && body.success !== false) {
        CacheService.set(rawKey, body, ttl).catch((err) => {
          logger.warn(`[CACHE MIDDLEWARE WRITE ERROR] ${err.message}`);
        });
      }

      return originalJson(body);
    };

    next();
  };
};

export default cacheResponse;

