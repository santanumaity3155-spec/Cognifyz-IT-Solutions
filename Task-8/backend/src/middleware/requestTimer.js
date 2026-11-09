/**
 * High-resolution request timing middleware.
 * Records the exact start time with nanosecond precision and sets
 * X-Response-Time header on completion.
 */
export const requestTimerMiddleware = (req, res, next) => {
  const startHrTime = process.hrtime.bigint();
  req.startTime = Date.now();

  res.on('finish', () => {
    const endHrTime = process.hrtime.bigint();
    const durationNs = endHrTime - startHrTime;
    const durationMs = Number(durationNs) / 1_000_000;
    req.durationMs = Math.round(durationMs * 100) / 100;
  });

  // Calculate and set header before headers are sent
  const originalEnd = res.end;
  res.end = function (...args) {
    const endHrTime = process.hrtime.bigint();
    const durationNs = endHrTime - startHrTime;
    const durationMs = (Number(durationNs) / 1_000_000).toFixed(2);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
    return originalEnd.apply(this, args);
  };

  next();
};

export default requestTimerMiddleware;

