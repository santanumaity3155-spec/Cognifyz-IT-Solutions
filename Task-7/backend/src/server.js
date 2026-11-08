import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/environment.js';
import { connectDB, disconnectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

export const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration with credentials support
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  })
);

// Request Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// Global API Rate Limiter (100 req / 15 min default)
app.use('/api', generalLimiter);

// Health Check API Route (Public)
app.use('/api/health', healthRoutes);

// Authentication Routes (includes authLimiter)
app.use('/api/auth', authRoutes);

// GitHub OAuth & Integration Routes (includes authLimiter & githubProxyLimiter)
app.use('/api/github', githubRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Centralized Error Handling Middleware (Catches and normalizes all application errors)
app.use(errorHandler);

let serverInstance = null;

export const startServer = async (port = env.PORT) => {
  // Initialize Database connection (persistent MongoDB or documented in-memory fallback)
  await connectDB();

  return new Promise((resolve) => {
    serverInstance = app.listen(port, () => {
      logger.info(`[SERVER] Forma Task-7 Backend running on port ${port} (${env.NODE_ENV})`);
      logger.info(`[SERVER] Health endpoint available at http://localhost:${port}/api/health`);
      resolve(serverInstance);
    });
  });
};

export const stopServer = async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
    logger.info('[SERVER] HTTP server stopped.');
  }
  await disconnectDB();
};

// Graceful Shutdown Handlers
process.on('SIGINT', async () => {
  logger.info('\n[SERVER] SIGINT received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n[SERVER] SIGTERM received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

// Auto-start only when executed directly (not during vitest testing)
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('[FATAL STARTUP ERROR]:', { message: err.message, stack: err.stack });
    process.exit(1);
  });
}

export default app;
