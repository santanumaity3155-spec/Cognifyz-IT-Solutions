/**
 * 404 Route Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    error: 'NOT_FOUND',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Centralized Global Error Handler
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Log error details for server logs
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err.message);
    if (statusCode === 500 && err.stack) {
      console.error(err.stack);
    }
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${err.value}`,
      error: 'INVALID_ID',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A student with this ${duplicateField} already exists`,
      error: 'DUPLICATE_RESOURCE',
      duplicateField,
      timestamp: new Date().toISOString(),
    });
  }

  // Standard JSON error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    ...(isProd ? {} : { stack: err.stack }),
  });
};

