import rateLimit from 'express-rate-limit';

/**
 * Factory to create custom rate limiters
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = 'Too many requests, please try again later.',
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message,
    },
  });
};

/**
 * Production rate limiter for Registration endpoint
 * Limits repeated account creation attempts
 */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many registration attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Production rate limiter for Login endpoint
 * Defends against credential brute-force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});
