import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { GitHubServiceError } from '../services/githubService.js';

/**
 * Centralized API Error Handling Middleware.
 * Standardizes HTTP status codes, translates external GitHub service exceptions,
 * redacts sensitive system details, and suppresses stack traces in production.
 */
export const errorHandler = (err, req, res, next) => {
  const isProduction = env.NODE_ENV === 'production';

  // 1. Log error with sanitized logger
  logger.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, {
    name: err.name,
    message: err.message,
    status: err.status || res.statusCode,
    stack: isProduction ? undefined : err.stack,
  });

  // 2. Handle GitHubServiceError (Phase 5/6 external API errors)
  if (err instanceof GitHubServiceError) {
    return res.status(err.status).json({
      success: false,
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // 3. Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Request payload validation failed.',
      details,
    });
  }

  // 4. Handle JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Authentication token is invalid or malformed.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired. Please sign in again.',
    });
  }

  // 5. Handle Mongoose / Database Errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'DATABASE_VALIDATION_ERROR',
      message: 'Database schema validation constraint violation.',
      details,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: 'DUPLICATE_KEY_ERROR',
      message: `An account with this ${field} already exists.`,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_ID_FORMAT',
      message: `Invalid identifier format for ${err.path}.`,
    });
  }

  // 6. Handle Axios Network and Upstream Timeout Errors
  if (err.isAxiosError) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        error: 'GATEWAY_TIMEOUT',
        message: 'External service connection timed out.',
      });
    }

    const upstreamStatus = err.response?.status || 502;
    return res.status(upstreamStatus).json({
      success: false,
      error: 'UPSTREAM_API_ERROR',
      message: err.response?.data?.message || 'External upstream service communication failure.',
    });
  }

  // 7. General Application Exceptions
  const statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  const errorResponse = {
    success: false,
    error: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : err.name || 'INTERNAL_SERVER_ERROR'),
    message:
      isProduction && statusCode === 500
        ? 'An unexpected internal error occurred on the server.'
        : err.message || 'An internal server error occurred.',
  };

  if (!isProduction && err.stack) {
    errorResponse.stack = err.stack;
  }

  return res.status(statusCode).json(errorResponse);
};

export default errorHandler;
