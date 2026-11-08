import authStore from '../services/authStore.js';
import { generateToken, sendAuthCookie, clearAuthCookie } from '../utils/tokenUtils.js';

/**
 * Register student account
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required fields.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_SHORT',
        message: 'Password must be at least 8 characters long.',
      });
    }

    const existing = await authStore.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
      });
    }

    const newUser = await authStore.createUser({
      name,
      email,
      password,
      role: 'Student',
    });

    const token = generateToken(newUser);
    sendAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      data: {
        user: {
          id: newUser._id ? newUser._id.toString() : String(newUser.id),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          github: newUser.github,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      });
    }

    const user = await authStore.findByEmail(email, { includePassword: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);
    sendAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user._id ? user._id.toString() : String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          github: user.github,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current session profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

/**
 * Sign out user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Signed out successfully',
  });
};

export default { register, login, getMe, logout };

