import rateLimit from 'express-rate-limit';

/**
 * Custom 429 Rate Limit Exceeded JSON handler.
 * Sanitizes response and includes retry timing metadata.
 */
const createRateLimitHandler = (tierName, windowMs) => (req, res) => {
  const retryAfterSeconds = Math.ceil(windowMs / 1000);
  res.status(429).json({
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: `Too many requests on ${tierName}. Please wait a few moments before trying again.`,
    tier: tierName,
    retryAfterSeconds,
  });
};

/**
 * 1. General API Rate Limiter
 * Default: 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GENERAL, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('General API Tier', 15 * 60 * 1000),
});

/**
 * 2. Authentication & OAuth Rate Limiter
 * Default: 25 requests per 15 minutes
 * Protects against brute-force attacks and OAuth connect flooding.
 * Skips OAuth callback to ensure users completing legitimate GitHub authorization are not blocked.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH, 10) || 25,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/callback' || req.originalUrl.includes('/api/github/callback'),
  handler: createRateLimitHandler('Authentication & OAuth Tier', 15 * 60 * 1000),
});

/**
 * 3. GitHub External API Proxy Limiter
 * Default: 60 requests per 15 minutes
 * Protects server resources and preserves downstream GitHub API quotas.
 */
export const githubProxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GITHUB, 10) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('GitHub External API Tier', 15 * 60 * 1000),
});

export default {
  generalLimiter,
  authLimiter,
  githubProxyLimiter,
};

