import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health & Diagnostic Endpoints', () => {
  it('GET /api/health returns HTTP 200 with complete system diagnostics', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('Forma Server Intelligence Platform');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('memory');
    expect(res.body.data).toHaveProperty('infrastructure');
    expect(res.body.data.infrastructure).toHaveProperty('database');
    expect(res.body.data.infrastructure).toHaveProperty('redis');
  });

  it('GET /api/health/ready returns HTTP 200 readiness status', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('checks');
  });
});

