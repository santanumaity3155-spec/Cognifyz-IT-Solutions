import { app } from './app.js';
import { env } from './config/environment.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initRedis, disconnectRedis } from './config/redis.js';
import { initQueues, shutdownQueues } from './queues/queueManager.js';
import { logger } from './utils/logger.js';

let serverInstance = null;

export const startServer = async (port = env.PORT) => {
  // Initialize Database
  await connectDB();

  // Initialize Redis
  await initRedis();

  // Initialize Background Queues and Workers
  await initQueues();

  return new Promise((resolve) => {
    serverInstance = app.listen(port, () => {
      logger.info(`=======================================================`);
      logger.info(` Forma Server Intelligence Platform - Backend Server   `);
      logger.info(` Port: ${port} | Node: ${process.version} | Mode: ${env.NODE_ENV} `);
      logger.info(` Health endpoint: http://localhost:${port}/api/health   `);
      logger.info(`=======================================================`);
      resolve(serverInstance);
    });
  });
};

export const stopServer = async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
    logger.info('[SERVER] HTTP server closed.');
  }
  await shutdownQueues();
  await disconnectDB();
  await disconnectRedis();
};

// Graceful shutdown signals
process.on('SIGINT', async () => {
  logger.info('\n[SERVER] Received SIGINT. Performing graceful shutdown...');
  await stopServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n[SERVER] Received SIGTERM. Performing graceful shutdown...');
  await stopServer();
  process.exit(0);
});

// Auto-start when executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('[SERVER FATAL STARTUP ERROR]', { message: err.message, stack: err.stack });
    process.exit(1);
  });
}

export default { startServer, stopServer, app };
