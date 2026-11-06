import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { connectDB, getDatabaseStatus } from '../config/db.js';

describe('Phase 3: Express Server & Health Check API', () => {
  beforeAll(async () => {
    // Initialize DB / Fallback layer for test environment
    await connectDB();
  });

  it('GET /api/health should return 200 with operational health status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy');
    expect(res.body.service).toContain('Forma – Student Intelligence Platform');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('mode');
    expect(['mongodb', 'in-memory-fallback']).toContain(res.body.database.mode);
  });

  it('GET / should return 200 with basic greeting and status prompt', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Forma API is running');
  });

  it('GET /api/nonexistent-route should trigger centralized 404 handler', async () => {
    const res = await request(app).get('/api/nonexistent-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('NOT_FOUND');
    expect(res.body.message).toContain('Resource not found');
    expect(res.body.path).toBe('/api/nonexistent-route');
  });

  it('Database status helper should reflect the active storage mode', () => {
    const status = getDatabaseStatus();

    expect(status).toHaveProperty('mode');
    expect(status).toHaveProperty('isConnected');
    expect(['mongodb', 'in-memory-fallback']).toContain(status.mode);
  });
});
