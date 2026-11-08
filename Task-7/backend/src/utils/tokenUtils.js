import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

export const AUTH_COOKIE_NAME = 'forma_token';

/**
 * Generate signed JWT for authenticated user
 * @param {{ _id?: unknown, id?: unknown, role: string, email: string }} user
 * @returns {string} Signed JWT token
 */
export const generateToken = (user) => {
  const userId = user._id ? user._id.toString() : String(user.id);
  const payload = {
    id: userId,
    email: user.email,
    role: user.role || 'Student',
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '1d',
    issuer: 'forma-task7-auth',
  });
};

/**
 * Verify cryptographic JWT signature
 * @param {string} token
 * @returns {jwt.JwtPayload}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'forma-task7-auth',
  });
};

/**
 * Send secure HTTP-only cookie containing session JWT
 * @param {import('express').Response} res
 * @param {string} token
 */
export const sendAuthCookie = (res, token) => {
  const isProduction = env.NODE_ENV === 'production';

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });
};

/**
 * Clear session cookie
 * @param {import('express').Response} res
 */
export const clearAuthCookie = (res) => {
  const isProduction = env.NODE_ENV === 'production';

  res.cookie(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};

export default {
  AUTH_COOKIE_NAME,
  generateToken,
  verifyToken,
  sendAuthCookie,
  clearAuthCookie,
};

