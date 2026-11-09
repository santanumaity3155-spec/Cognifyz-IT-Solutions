import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Advanced Middleware Pipeline', () => {
  it('generates a unique X-Request-Id header when none is provided', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
  });

  it('preserves an incoming X-Request-Id header', async () => {
    const customId = 'custom-client-trace-12345';
    const res = await request(app)
      .get('/api/health')
      .set('X-Request-Id', customId);
    expect(res.headers['x-request-id']).toBe(customId);
  });

  it('calculates and sets high-resolution X-Response-Time header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-response-time']).toBeDefined();
    expect(res.headers['x-response-time']).toMatch(/^[0-9.]+ms$/);
  });

  it('includes security headers from Helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('parses JSON bodies correctly in POST requests', async () => {
    const payload = { testKey: 'formaValue', number: 42 };
    const res = await request(app)
      .post('/api/middleware/echo')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.body).toEqual(payload);
  });

  it('handles malformed JSON syntax gracefully with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/middleware/echo')
      .set('Content-Type', 'application/json')
      .send('{"invalidJson": unquotedString}');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MALFORMED_JSON_SYNTAX');
    expect(res.body.error).toHaveProperty('requestId');
  });

  it('handles 404 for non-existent API routes with standard error envelope', async () => {
    const res = await request(app).get('/api/non-existent-endpoint-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(res.body.error).toHaveProperty('requestId');
  });

  it('intercepts simulated errors and returns standardized error response', async () => {
    const res = await request(app).get('/api/middleware/simulate-error?type=bad_request');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SIMULATED_BAD_REQUEST');
  });

  it('records request metrics into the telemetry buffer', async () => {
    await request(app).get('/api/health');
    const res = await request(app).get('/api/middleware/metrics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalRequests).toBeGreaterThan(0);
    expect(res.body.data.recentRequests.length).toBeGreaterThan(0);
  });

  it('redacts sensitive fields and TEST_SECRET_PLACEHOLDER in structured logger', async () => {
    const { sanitizeData } = await import('../src/utils/logger.js');

    const testObject = {
      service: 'Forma Client',
      testValue: 42,
      secretKey: 'TEST_SECRET_PLACEHOLDER',
      api_token: 'secret123',
      nested: {
        rawPassword: 'password999',
        normalField: 'visible',
      },
    };

    const sanitized = sanitizeData(testObject);
    expect(sanitized.secretKey).toBe('[REDACTED]');
    expect(sanitized.api_token).toBe('[REDACTED]');
    expect(sanitized.nested.rawPassword).toBe('[REDACTED]');
    expect(sanitized.nested.normalField).toBe('visible');
    expect(JSON.stringify(sanitized)).not.toContain('TEST_SECRET_PLACEHOLDER');

    // Test echo request with TEST_SECRET_PLACEHOLDER
    const res = await request(app)
      .post('/api/middleware/echo')
      .send({
        service: 'Forma Client',
        testValue: 42,
        secretKey: 'TEST_SECRET_PLACEHOLDER',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.body.secretKey).toBe('TEST_SECRET_PLACEHOLDER');
  });
});

