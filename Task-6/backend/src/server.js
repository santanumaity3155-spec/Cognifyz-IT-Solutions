import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/environment.js';
import { connectDB, disconnectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration with credentials support for HTTP-only cookies
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

// Health Check API Route
app.use('/api/health', healthRoutes);

// Authentication API Routes (Phase 5)
app.use('/api/auth', authRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the server.',
  });
});

// Server Lifecycle Management
let serverInstance = null;

export const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  return new Promise((resolve) => {
    serverInstance = app.listen(env.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`[SERVER] Forma Task-6 Backend running on port: ${env.PORT}`);
      console.log(`[SERVER] Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(`[SERVER] Client Origin: ${env.CLIENT_URL}`);
      console.log(`[SERVER] Environment: ${env.NODE_ENV}`);
      console.log(`======================================================\n`);
      resolve(serverInstance);
    });
  });
};

export const stopServer = async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    console.log('[SERVER] HTTP server closed.');
  }
  await disconnectDB();
};

// Graceful Shutdown Handlers
process.on('SIGINT', async () => {
  console.log('\n[SERVER] SIGINT received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[SERVER] SIGTERM received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

// Auto-start only when executed directly (not when required by tests)
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[FATAL STARTUP ERROR]:', err);
    process.exit(1);
  });
}

export default app;
