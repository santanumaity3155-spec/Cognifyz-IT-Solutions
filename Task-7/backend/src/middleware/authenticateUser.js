import { verifyToken, AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';
import authStore from '../services/authStore.js';

/**
 * Authentication middleware validating JWT sessions from cookies or Bearer headers.
 * Populates req.user with sanitized account and GitHub metadata.
 */
export const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    // 1. Primary: Extract from HTTP-only cookie
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    }
    // 2. Secondary: Extract from Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. No session cookie or Bearer token provided.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Session has expired. Please sign in again.',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or malformed authentication token.',
      });
    }

    const user = await authStore.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account associated with this session no longer exists.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated.',
      });
    }

    // Attach sanitized user information to request
    req.user = {
      id: user._id ? user._id.toString() : String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      github: user.github || { connected: false },
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticateUser;

