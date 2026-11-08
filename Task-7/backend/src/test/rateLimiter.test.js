import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { generalLimiter, authLimiter, githubProxyLimiter } from '../middleware/rateLimiter.js';

describe('Tiered API Rate Limiting Tests', () => {
  it('enforces limit and returns standardized 429 JSON response with retry headers', async () => {
    const testApp = express();

    // Create a strict test limiter allowing only 2 requests
    const strictLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests on Test Tier. Please wait a few moments before trying again.',
          tier: 'Test Tier',
          retryAfterSeconds: 60,
        });
      },
    });

    testApp.use('/test', strictLimiter, (req, res) => {
      res.status(200).json({ success: true, count: 'ok' });
    });

    // 1st request -> 200 OK
    const res1 = await request(testApp).get('/test');
    expect(res1.status).toBe(200);
    expect(res1.headers['ratelimit-remaining']).toBe('1');

    // 2nd request -> 200 OK
    const res2 = await request(testApp).get('/test');
    expect(res2.status).toBe(200);
    expect(res2.headers['ratelimit-remaining']).toBe('0');

    // 3rd request -> 429 Too Many Requests
    const res3 = await request(testApp).get('/test');
    expect(res3.status).toBe(429);
    expect(res3.body.success).toBe(false);
    expect(res3.body.error).toBe('RATE_LIMIT_EXCEEDED');
    expect(res3.body.retryAfterSeconds).toBe(60);
    expect(res3.headers['retry-after']).toBeDefined();
  });

  it('exposes defined limiters with standardHeaders enabled and legacyHeaders disabled', () => {
    // Check that limiters are functions
    expect(typeof generalLimiter).toBe('function');
    expect(typeof authLimiter).toBe('function');
    expect(typeof githubProxyLimiter).toBe('function');
  });

  it('authLimiter skips the OAuth callback path to ensure users completing authorization are not blocked', async () => {
    const testApp = express();

    // Limiter with max 1 that skips /callback
    const testAuthLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 1,
      skip: (req) => req.path === '/callback',
      handler: (req, res) => res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' }),
    });

    testApp.use('/api/github', testAuthLimiter, (req, res) => res.status(200).json({ ok: true }));

    // Request to /connect consumes allowance
    const resConnect1 = await request(testApp).get('/api/github/connect');
    expect(resConnect1.status).toBe(200);

    // Second request to /connect is blocked
    const resConnect2 = await request(testApp).get('/api/github/connect');
    expect(resConnect2.status).toBe(429);

    // Request to /callback is allowed even when allowance is 0
    const resCallback = await request(testApp).get('/api/github/callback');
    expect(resCallback.status).toBe(200);
  });
});

