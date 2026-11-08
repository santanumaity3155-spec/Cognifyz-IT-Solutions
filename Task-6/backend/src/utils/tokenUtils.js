import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export const AUTH_COOKIE_NAME = 'forma_token';

/**
 * Converts shorthand duration strings (e.g., '1d', '24h', '30m', '60s') to milliseconds
 */
export const parseDurationToMs = (durationStr, defaultMs = 24 * 60 * 60 * 1000) => {
  if (!durationStr || typeof durationStr !== 'string') return defaultMs;
  const match = durationStr.trim().match(/^(\d+)([smhd])$/);
  if (!match) return defaultMs;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return defaultMs;
  }
};

/**
 * Generates options for the secure HTTP-only authentication cookie
 */
export const getAuthCookieOptions = (customMaxAge = null) => {
  const isProduction = env.NODE_ENV === 'production';
  const maxAge = customMaxAge ?? parseDurationToMs(env.JWT_EXPIRES_IN);

  return {
    httpOnly: true, // Prevents access from client-side JavaScript (XSS defense)
    secure: isProduction, // Transmitted only via HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF defense
    maxAge,
    path: '/',
  };
};

/**
 * Signs and generates a JSON Web Token for an authenticated user
 */
export const generateToken = (user, customOptions = {}) => {
  const secret = customOptions.secret !== undefined ? customOptions.secret : env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error('JWT_CONFIGURATION_ERROR: JWT_SECRET environment variable is missing or empty.');
  }

  const userId = user._id ? user._id.toString() : user.id ? user.id.toString() : null;
  if (!userId) {
    throw new Error('JWT_GENERATION_ERROR: Cannot generate token without valid user ID.');
  }

  const payload = {
    id: userId,
    email: user.email,
    role: user.role || 'Student',
  };

  const signOptions = {
    expiresIn: customOptions.expiresIn || env.JWT_EXPIRES_IN || '1d',
    issuer: 'forma-student-intelligence-platform',
    algorithm: 'HS256',
  };

  return jwt.sign(payload, secret, signOptions);
};

/**
 * Cryptographically verifies a JWT token
 */
export const verifyToken = (token, customSecret = undefined) => {
  const secret = customSecret !== undefined ? customSecret : env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error('JWT_CONFIGURATION_ERROR: JWT_SECRET is not configured for token verification.');
  }

  if (!token || typeof token !== 'string') {
    throw new Error('JWT_INVALID_ERROR: No token provided for verification.');
  }

  return jwt.verify(token, secret, {
    issuer: 'forma-student-intelligence-platform',
    algorithms: ['HS256'],
  });
};

/**
 * Attaches the JWT to the HTTP response as a secure HTTP-only cookie
 */
export const sendAuthCookie = (res, token) => {
  const options = getAuthCookieOptions();
  res.cookie(AUTH_COOKIE_NAME, token, options);
};

/**
 * Clears the authentication cookie on logout
 */
export const clearAuthCookie = (res) => {
  const isProduction = env.NODE_ENV === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};
