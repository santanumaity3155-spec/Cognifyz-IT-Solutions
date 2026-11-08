import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply auth rate limiter across sensitive registration and authentication endpoints
router.use(authLimiter);

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateUser, getMe);
router.post('/logout', logout);

export default router;
