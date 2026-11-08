import authStore from '../services/authStore.js';

/**
 * Handle user registration
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing account by email
    const existingUser = await authStore.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
      });
    }

    // Role is strictly enforced as 'Student' on public registration
    // Any role supplied by client is discarded to prevent privilege escalation
    const newUser = await authStore.createUser({
      name,
      email,
      password,
      role: 'Student',
    });

    const safeUser = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user login
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Query user by email including the password hash
    const user = await authStore.findByEmail(email, { includePassword: true });

    // Reject unknown email with generic message (avoids user enumeration)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Compare supplied password with bcrypt hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    // Check account active state
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle current user profile retrieval
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  // If req.user was populated by authentication middleware (Phase 7)
  if (req.user) {
    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user,
      },
    });
  }

  // Without auth middleware token, return 401 Unauthorized
  return res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Authentication required. Full token verification is active in Phase 6 & 7.',
  });
};

/**
 * Handle user logout
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  // Clear any existing cookie
  res.clearCookie('forma_token');

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

