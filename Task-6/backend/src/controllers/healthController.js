import { getDatabaseStatus } from '../config/db.js';
import { env } from '../config/environment.js';

export const getHealthStatus = (req, res) => {
  const dbStatus = getDatabaseStatus();
  const uptimeSeconds = Math.floor(process.uptime());

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const formattedUptime = `${hours}h ${minutes}m ${seconds}s`;

  const isDegraded = !dbStatus.isConnected;

  const responsePayload = {
    success: true,
    service: 'Forma – Student Intelligence Platform API',
    version: '1.0.0',
    task: 'Cognifyz Level 3 - Task 6 (Database Integration & User Authentication)',
    status: isDegraded ? 'Operational (Fallback Mode)' : 'Operational',
    environment: env.NODE_ENV,
    uptime: formattedUptime,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    database: {
      mode: dbStatus.mode,
      state: dbStatus.state,
      isConnected: dbStatus.isConnected,
      isPersistent: dbStatus.isPersistent,
      databaseName: dbStatus.databaseName,
      host: dbStatus.host,
      port: dbStatus.port,
      notice: dbStatus.isPersistent
        ? 'Connected to persistent MongoDB database.'
        : 'Running in documented non-persistent fallback mode. MongoDB service is unreachable.',
    },
  };

  // Return HTTP 200 with clear degraded status indicators
  res.status(200).json(responsePayload);
};

