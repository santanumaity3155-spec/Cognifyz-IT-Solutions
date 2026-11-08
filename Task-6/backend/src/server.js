import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/environment.js';
import { connectDB, disconnectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

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

// Health Check API Route (Public)
app.use('/api/health', healthRoutes);

// Authentication API Routes
app.use('/api/auth', authRoutes);

// Dashboard Analytics Routes (Protected)
app.use('/api/dashboard', dashboardRoutes);

// Student Management Routes (Protected)
app.use('/api/students', studentRoutes);

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

  const statusCode = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  const isProduction = env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message:
      isProduction && statusCode === 500
        ? 'An unexpected error occurred on the server.'
        : err.message || 'An unexpected error occurred on the server.',
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
