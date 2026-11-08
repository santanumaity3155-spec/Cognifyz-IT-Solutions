import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app, { stopServer } from '../server.js';
import { connectDB, disconnectDB, getDatabaseStatus } from '../config/db.js';
import { maskConnectionString } from '../config/environment.js';

describe('Phase 3: MongoDB Database Integration & Health Suite', () => {
  beforeEach(async () => {
    await disconnectDB();
  });

  afterAll(async () => {
    await stopServer();
  });

  describe('1. Connection String Security & Masking', () => {
    it('should mask user credentials in MongoDB connection string for safe logging', () => {
      const sensitiveUri = 'mongodb://app_admin:SecretPassw0rd123!@cluster0.abcde.mongodb.net:27017/forma_task6?ssl=true';
      const masked = maskConnectionString(sensitiveUri);

      expect(masked).not.toContain('SecretPassw0rd123!');
      expect(masked).toBe('mongodb://app_admin:****@cluster0.abcde.mongodb.net:27017/forma_task6?ssl=true');
    });

    it('should return plain connection string if no credentials exist', () => {
      const localUri = 'mongodb://127.0.0.1:27017/forma_task6';
      expect(maskConnectionString(localUri)).toBe(localUri);
    });

    it('should handle null or invalid inputs safely without crashing', () => {
      expect(maskConnectionString(null)).toBe('');
      expect(maskConnectionString(undefined)).toBe('');
    });
  });

  describe('2. Database Connection Handling & Fallback Activation', () => {
    it('should gracefully handle placeholder or empty connection string', async () => {
      const status = await connectDB('mongodb://your_mongodb_connection_string/forma_task6');

      expect(status.mode).toBe('in-memory-fallback');
      expect(status.isConnected).toBe(false);
      expect(status.isPersistent).toBe(false);
      expect(status.databaseName).toBe('in-memory-store');
      expect(status.error).toContain('MONGODB_URI not configured');
    });

    it('should handle completely invalid connection protocols without throwing unhandled exceptions', async () => {
      const status = await connectDB('invalid-protocol://non-existent-host:9999/db', {
        serverSelectionTimeoutMS: 500,
      });

      expect(status.mode).toBe('in-memory-fallback');
      expect(status.state).toBe('error');
      expect(status.isConnected).toBe(false);
      expect(status.isPersistent).toBe(false);
      expect(status.error).toBeDefined();
    });

    it('should handle unreachable MongoDB server gracefully with short timeout', async () => {
      // Port 27999 is intentionally unused to test offline / unreachable scenario
      const status = await connectDB('mongodb://127.0.0.1:27999/forma_unreachable', {
        serverSelectionTimeoutMS: 800,
      });

      expect(status.mode).toBe('in-memory-fallback');
      expect(status.state).toBe('error');
      expect(status.isConnected).toBe(false);
      expect(status.isPersistent).toBe(false);
      expect(status.error).toBeDefined();
    });
  });

  describe('3. Database Status Reporting Contract', () => {
    it('should return accurate database status snapshot through getDatabaseStatus()', () => {
      const status = getDatabaseStatus();

      expect(status).toHaveProperty('mode');
      expect(['mongodb', 'in-memory-fallback']).toContain(status.mode);
      expect(status).toHaveProperty('state');
      expect(['connected', 'disconnected', 'connecting', 'error']).toContain(status.state);
      expect(typeof status.isConnected).toBe('boolean');
      expect(typeof status.isPersistent).toBe('boolean');
      expect(status).toHaveProperty('lastStateChange');
    });

    it('should cleanly disconnect without errors using disconnectDB()', async () => {
      await expect(disconnectDB()).resolves.not.toThrow();
      const status = getDatabaseStatus();
      expect(status.isConnected).toBe(false);
      expect(status.state).toBe('disconnected');
    });
  });

  describe('4. Health Check Endpoint (GET /api/health)', () => {
    it('should return 200 with complete server, environment, and database metrics', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.service).toContain('Forma – Student Intelligence Platform API');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.task).toContain('Task 6');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('environment');

      // Database block validation
      expect(res.body).toHaveProperty('database');
      expect(res.body.database).toHaveProperty('mode');
      expect(res.body.database).toHaveProperty('state');
      expect(res.body.database).toHaveProperty('isConnected');
      expect(res.body.database).toHaveProperty('isPersistent');
      expect(res.body.database).toHaveProperty('notice');

      // Never expose sensitive connection credentials or raw stack traces in health API
      expect(JSON.stringify(res.body)).not.toContain('password');
      expect(JSON.stringify(res.body)).not.toContain('secret');
    });
  });
});

