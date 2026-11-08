import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

// Public: Registration endpoint
router.post('/register', registerLimiter, validateRegister, register);

// Public: Login endpoint
router.post('/login', loginLimiter, validateLogin, login);

// Protected: Current user profile endpoint
router.get('/me', authenticateUser, getMe);

// Public/Session: Logout endpoint
router.post('/logout', logout);

export default router;
