import rateLimit from 'express-rate-limit';

/**
 * Global API rate limiter (200 requests per 15 minutes window)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this client. Please try again after 15 minutes.',
      details: null,
    },
  },
});

/**
 * Strict rate limiter for background job enqueueing (60 jobs per 5 minutes)
 */
export const jobEnqueueLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'JOB_RATE_LIMIT_EXCEEDED',
      message: 'Job enqueue rate limit exceeded. Please wait before submitting more background tasks.',
      details: null,
    },
  },
});

/**
 * Rate limiter for cache benchmark requests (30 runs per minute)
 */
export const benchmarkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'BENCHMARK_RATE_LIMIT_EXCEEDED',
      message: 'Benchmark execution limit reached. Please wait a moment before re-running.',
      details: null,
    },
  },
});

export default { generalLimiter, jobEnqueueLimiter, benchmarkLimiter };

