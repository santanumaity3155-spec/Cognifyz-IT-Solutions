import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Health API & Diagnostic Probe Tests', () => {
  it('GET /api/health returns 200 OK with sanitized operational metadata', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.project).toBe('Forma Developer Intelligence Platform');
    expect(res.body.level).toBe('Cognifyz Level 4: Expert');
    expect(res.body.task).toContain('Task 7');
    expect(res.body.phase).toBe('Phase 3: Backend Configuration and External API Foundation');
  });

  it('GET /api/health exposes database and OAuth diagnostic states without secrets', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.database).toBeDefined();
    expect(res.body.database.mode).toBeDefined();
    expect(typeof res.body.database.isPersistent).toBe('boolean');

    expect(res.body.oauth).toBeDefined();
    expect(typeof res.body.oauth.configured).toBe('boolean');
    expect(res.body.oauth.clientSecretConfigured).toBeDefined();

    // Verify secrets are strictly not exposed
    const responseString = JSON.stringify(res.body);
    expect(responseString).not.toContain('your_github_oauth_client_secret');
    expect(responseString).not.toContain('TOKEN_ENCRYPTION_KEY');
    expect(responseString).not.toContain('JWT_SECRET');
  });

  it('GET /api/undefined-endpoint returns structured 404 ENDPOINT_NOT_FOUND', async () => {
    const res = await request(app).get('/api/invalid-route-probe');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('ENDPOINT_NOT_FOUND');
  });
});

