import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Task-7 Backend Scaffolding Smoke Tests', () => {
  it('GET /api/health returns 200 OK with correct Task 7 metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.level).toBe('Cognifyz Level 4: Expert');
    expect(res.body.task).toContain('Task 7');
  });

  it('GET /api/undefined-endpoint returns 404 ENDPOINT_NOT_FOUND', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('ENDPOINT_NOT_FOUND');
  });
});

