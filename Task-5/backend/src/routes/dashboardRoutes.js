import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = Router();

// Retrieve aggregated statistics
router.get('/stats', getDashboardStats);

export default router;

