import express from 'express';
import { getStats, getAdminOverview } from '../controllers/dashboardController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();

// All dashboard endpoints require authentication
router.use(authenticateUser);

// GET /api/dashboard/stats - Returns role-scoped analytics
router.get('/stats', getStats);

// GET /api/dashboard/admin-overview - Restricted strictly to Admin role
router.get('/admin-overview', authorizeRoles('Admin'), getAdminOverview);

export default router;
