import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Registration: Rate limited + Input validation + Student role enforcement
router.post('/register', registerLimiter, validateRegister, register);

// Login: Rate limited + Input validation + Generic credential rejection
router.post('/login', loginLimiter, validateLogin, login);

// Current user profile
router.get('/me', getMe);

// Logout
router.post('/logout', logout);

export default router;
