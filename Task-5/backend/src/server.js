import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2. CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === CLIENT_URL || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Request Logging Middleware
app.use(requestLogger);

// 5. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route for quick browser sanity checks
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Forma API is running. Visit /api/health or /api/students.',
    service: 'Forma – Student Intelligence Platform (Task 5)',
  });
});

// 6. Centralized 404 Route Handler
app.use(notFoundHandler);

// 7. Centralized Global Error Handler
app.use(errorHandler);

// 8. Server Lifecycle & Graceful Shutdown
let server = null;

export const startServer = async () => {
  await connectDB();

  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[Forma API] Server running successfully on http://localhost:${PORT}`);
      console.log(`[Forma API] Health check endpoint: http://localhost:${PORT}/api/health`);
      console.log(`[Forma API] Students CRUD API: http://localhost:${PORT}/api/students`);
      console.log(`[Forma API] Dashboard Stats API: http://localhost:${PORT}/api/dashboard/stats`);
      console.log(`[Forma API] Frontend client origin allowed: ${CLIENT_URL}`);
      console.log(`[Forma API] Environment: ${process.env.NODE_ENV || 'development'}\n`);
      resolve(server);
    });
  });
};

export const stopServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('[Forma API] HTTP server closed gracefully.');
  }
  await disconnectDB();
};

const handleTermination = async (signal) => {
  console.log(`\n[Forma API] Received ${signal}. Initiating graceful shutdown...`);
  await stopServer();
  process.exit(0);
};

process.on('SIGTERM', () => handleTermination('SIGTERM'));
process.on('SIGINT', () => handleTermination('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[Forma API] Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
