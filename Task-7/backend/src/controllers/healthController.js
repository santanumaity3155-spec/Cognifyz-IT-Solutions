import { env } from '../config/environment.js';
import { getDatabaseStatus } from '../config/db.js';

/**
 * Health check controller reporting operational status and configuration diagnostics.
 * Sanitizes all output to ensure no secrets or sensitive parameters are revealed.
 * GET /api/health
 */
export const getHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'healthy',
    project: 'Forma Developer Intelligence Platform',
    level: 'Cognifyz Level 4: Expert',
    task: 'Task 7 - Advanced API Usage and External API Integration',
    phase: 'Phase 3: Backend Configuration and External API Foundation',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: {
      mode: dbStatus.mode,
      state: dbStatus.state,
      isConnected: dbStatus.isConnected,
      isPersistent: dbStatus.isPersistent,
      databaseName: dbStatus.databaseName,
    },
    oauth: {
      configured: env.isOAuthConfigured,
      clientIdConfigured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_ID.trim() !== ''),
      clientSecretConfigured: Boolean(env.GITHUB_CLIENT_SECRET && env.GITHUB_CLIENT_SECRET.trim() !== ''),
      maskedClientId: env.maskedClientId,
    },
    features: {
      rateLimiting: 'configured',
      caching: 'in-memory-ttl',
      tokenEncryption: 'aes-256-gcm',
      externalApi: 'github-rest-api',
    },
  });
};

export default { getHealth };

