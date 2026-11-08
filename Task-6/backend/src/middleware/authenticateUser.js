import { verifyToken, AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';
import authStore from '../services/authStore.js';

/**
 * Middleware to authenticate requests using JWT tokens from HTTP-only cookies
 * or Authorization: Bearer headers.
 * Validates expiration, account existence, and active state.
 */
export const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    // 1. Primary: Extract from secure HTTP-only cookie
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    }
    // 2. Secondary: Extract from Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 3. Reject if no token is present
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required. No session cookie or Bearer token provided.',
      });
    }

    // 4. Verify cryptographic signature and expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or malformed authentication token.',
      });
    }

    // 5. Look up user account in database / auth store
    const user = await authStore.findById(decoded.id);

    // 6. Reject if user account no longer exists (e.g. deleted account)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'The user account associated with this session no longer exists.',
      });
    }

    // 7. Reject if user account is deactivated / inactive
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // 8. Attach sanitized authenticated user information to request
    req.user = {
      id: user._id ? user._id.toString() : user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticateUser;

