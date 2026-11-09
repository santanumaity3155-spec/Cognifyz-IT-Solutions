import { logger } from '../utils/logger.js';
import { env } from '../config/environment.js';

/**
 * Centralized error handling middleware.
 * Intercepts all synchronous and asynchronous errors and normalizes them into
 * a standardized JSON envelope.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const requestId = req.id || 'unknown';

  // Handle SyntaxError from express.json() when request body contains malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn(`[PARSER ERROR] Malformed JSON received: ${err.message}`, { requestId });
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON_SYNTAX',
        message: 'The request body contains invalid JSON syntax.',
        details: err.message,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle payload too large (e.g. >1MB body)
  if (err.type === 'entity.too.large') {
    logger.warn(`[PAYLOAD TOO LARGE] ${err.message}`, { requestId });
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds the maximum permitted limit of 1MB.',
        details: null,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  const isProduction = env.NODE_ENV === 'production';
  const responsePayload = {
    success: false,
    error: {
      code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
      message: err.message || 'An unexpected server error occurred.',
      details: err.details || null,
      requestId,
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { stack: err.stack }),
    },
  };

  logger.error(`[ERROR HANDLER] ${err.message}`, {
    requestId,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json(responsePayload);
};

export default errorHandler;

