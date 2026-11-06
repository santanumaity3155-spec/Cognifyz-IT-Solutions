import { Router } from 'express';
import { getDatabaseStatus } from '../config/db.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System health, uptime, and database storage mode status
 * @access  Public
 */
router.get('/', (req, res) => {
  const db = getDatabaseStatus();

  res.status(200).json({
    success: true,
    message: 'Forma API is healthy and operational',
    service: 'Forma – Student Intelligence Platform (Cognifyz Level 3 Task 5)',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    database: {
      mode: db.mode,
      isConnected: db.isConnected,
      databaseName: db.databaseName,
      statusMessage: db.isConnected
        ? `Connected to MongoDB database '${db.databaseName}'`
        : 'Running in resilient in-memory fallback store with complete CRUD capability',
    },
  });
});

export default router;

