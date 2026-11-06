import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Forma Backend Health Check', () => {
  it('GET /api/health returns 200 and operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toBe('Forma API is running');
  });

  it('GET /api/nonexistent returns 404 with error message', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

