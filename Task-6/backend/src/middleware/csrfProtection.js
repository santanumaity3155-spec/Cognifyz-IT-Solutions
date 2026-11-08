import { env } from '../config/environment.js';
import { AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';

/**
 * CSRF & Origin Verification Middleware
 * Protects cookie-authenticated state-changing requests (POST, PUT, DELETE, PATCH)
 * from Cross-Site Request Forgery (CSRF) by validating the request Origin / Referer
 * against the trusted CLIENT_URL allowlist or verifying custom headers.
 */
export const csrfProtection = (req, res, next) => {
  // Safe HTTP read methods are exempt
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Only state-changing requests utilizing cookie-based authentication require CSRF verification
  const hasAuthCookie = req.cookies && req.cookies[AUTH_COOKIE_NAME];
  if (!hasAuthCookie) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;

  // Verify origin matches trusted client
  if (origin) {
    try {
      const requestOrigin = new URL(origin).origin;
      const trustedClientOrigin = new URL(env.CLIENT_URL).origin;

      if (
        requestOrigin === trustedClientOrigin ||
        requestOrigin === 'http://localhost:5173' ||
        requestOrigin === 'http://127.0.0.1:5173' ||
        requestOrigin === 'http://localhost:5000' ||
        requestOrigin === 'http://127.0.0.1:5000'
      ) {
        return next();
      }
    } catch {
      // Malformed Origin/Referer URL
    }
  } else if (process.env.NODE_ENV === 'test' || req.headers['x-requested-with'] || req.headers['x-csrf-token']) {
    // Permit test harness and API requests presenting custom CORS-gated headers
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'CSRF_REJECTED',
    message: 'Cross-Site Request Forgery verification failed. Request origin is not permitted.',
  });
};

export default csrfProtection;

