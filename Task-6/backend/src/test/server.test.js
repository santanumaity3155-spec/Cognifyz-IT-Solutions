import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app, { stopServer } from '../server.js';

describe('Phase 2 & 3: Server Routing & Health Verification', () => {
  afterAll(async () => {
    await stopServer();
  });

  it('GET /api/health should respond with 200 and operational status payload', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toContain('Forma – Student Intelligence Platform');
    expect(res.body.task).toContain('Task 6');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('database');
  });

  it('GET /api/unknown-endpoint should return 404 with structured error', async () => {
    const res = await request(app).get('/api/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('ENDPOINT_NOT_FOUND');
  });
});
