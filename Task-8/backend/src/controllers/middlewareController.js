import { getTelemetryData, clearTelemetry } from '../services/telemetryService.js';

/**
 * Get recorded telemetry and recent request logs.
 */
export const getMiddlewareTelemetry = (req, res) => {
  const data = getTelemetryData();
  res.status(200).json({
    success: true,
    data,
  });
};

/**
 * Clear recorded request telemetry.
 */
export const resetMiddlewareTelemetry = (req, res) => {
  clearTelemetry();
  res.status(200).json({
    success: true,
    message: 'Middleware telemetry buffer cleared successfully.',
  });
};

/**
 * Echo endpoint to verify body parsing, query parsing, and request headers.
 */
export const echoRequest = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      headers: {
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type'],
        xRequestId: req.headers['x-request-id'],
      },
      query: req.query,
      body: req.body,
      durationMs: req.durationMs,
    },
  });
};

/**
 * Diagnostic endpoint to simulate specific error conditions and verify error handling.
 */
export const simulateError = (req, res, next) => {
  const { type } = req.query;

  if (type === 'validation') {
    const err = new Error('Simulated payload validation error');
    err.statusCode = 422;
    err.code = 'SIMULATED_VALIDATION_ERROR';
    err.details = [{ field: 'testField', message: 'Field is invalid in simulation.' }];
    return next(err);
  }

  if (type === 'bad_request') {
    const err = new Error('Simulated bad request');
    err.statusCode = 400;
    err.code = 'SIMULATED_BAD_REQUEST';
    return next(err);
  }

  if (type === 'unauthorized') {
    const err = new Error('Simulated unauthorized access');
    err.statusCode = 401;
    err.code = 'SIMULATED_UNAUTHORIZED';
    return next(err);
  }

  // Default: 500 Internal Error
  const err = new Error('Simulated internal server failure for middleware error handling test');
  err.statusCode = 500;
  err.code = 'SIMULATED_INTERNAL_ERROR';
  return next(err);
};

export default {
  getMiddlewareTelemetry,
  resetMiddlewareTelemetry,
  echoRequest,
  simulateError,
};

