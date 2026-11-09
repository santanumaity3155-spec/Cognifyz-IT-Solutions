import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from './config/environment.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestTimerMiddleware } from './middleware/requestTimer.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';

import healthRoutes from './routes/healthRoutes.js';
import middlewareRoutes from './routes/middlewareRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import cacheRoutes from './routes/cacheRoutes.js';

export const app = express();

// 1. Request ID Middleware
app.use(requestIdMiddleware);

// 2. High-Resolution Request Timer
app.use(requestTimerMiddleware);

// 3. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 4. CORS Configuration
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Cache-Bypass'],
    exposedHeaders: ['X-Request-Id', 'X-Response-Time', 'X-Cache', 'X-Cache-TTL'],
  })
);

// 5. Request Body Parsing with strict limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 6. Request Logging & Telemetry Recording
app.use(requestLoggerMiddleware);

// 7. General API Rate Limiting
app.use('/api', generalLimiter);

// 8. Public Base Routes
app.use('/api/health', healthRoutes);
app.use('/api/middleware', middlewareRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/cache', cacheRoutes);

// 9. 404 Route Not Found Handler
app.use(notFoundHandler);

// 10. Centralized Error Handler
app.use(errorHandler);

export default app;
