import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Forma API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Centralized 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Only listen if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Forma API] Server running on http://localhost:${PORT}`);
    console.log(`[Forma API] Health check at http://localhost:${PORT}/api/health`);
  });
}

export default app;

