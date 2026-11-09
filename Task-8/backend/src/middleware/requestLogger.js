import { logger } from '../utils/logger.js';
import { recordRequest } from '../services/telemetryService.js';

/**
 * Structured request logging middleware.
 * Logs method, path, response status, duration, and client IP.
 * Excludes noisy polling endpoints from raw console spam if requested.
 */
export const requestLoggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = req.durationMs !== undefined ? req.durationMs : Date.now() - start;
    const contentLength = res.getHeader('content-length') || 0;

    // Structured metadata
    const meta = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      ip: req.ip || req.socket?.remoteAddress || 'unknown',
    };

    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      meta.body = req.body;
    }

    // Log to console via structured logger
    if (res.statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${meta.path} ${res.statusCode} in ${durationMs}ms`, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${meta.path} ${res.statusCode} in ${durationMs}ms`, meta);
    } else {
      logger.info(`HTTP ${req.method} ${meta.path} ${res.statusCode} in ${durationMs}ms`, meta);
    }

    // Record into telemetry buffer for live dashboard inspection
    recordRequest({
      id: req.id,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      ip: meta.ip,
      userAgent: req.headers['user-agent'],
      contentLength: Number(contentLength),
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

export default requestLoggerMiddleware;

