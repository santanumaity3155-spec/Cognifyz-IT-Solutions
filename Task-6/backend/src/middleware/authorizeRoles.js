/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user possesses one of the allowed roles.
 * Returns HTTP 403 Forbidden if the user's role is not authorized.
 * 
 * @param  {...string} allowedRoles - Array of allowed role names (e.g. 'Admin', 'Student')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Defend against unauthenticated invocation
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required before checking role permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: `Access denied. Your role (${req.user.role}) is not authorized to access this resource. Requires: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
};

export default authorizeRoles;

