/**
 * Lightweight HTTP request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' // Red
      : res.statusCode >= 400 ? '\x1b[33m' // Yellow
      : res.statusCode >= 300 ? '\x1b[36m' // Cyan
      : '\x1b[32m'; // Green
    const reset = '\x1b[0m';

    // Only log in non-test environments or for errors
    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[${timestamp}] ${req.method} ${req.originalUrl} -> ${statusColor}${res.statusCode}${reset} (${duration}ms)`
      );
    }
  });

  next();
};

