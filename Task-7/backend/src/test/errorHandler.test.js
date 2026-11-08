import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../middleware/errorHandler.js';
import { GitHubServiceError } from '../services/githubService.js';
import { env, setEnvOverridesForTesting, resetEnvOverridesForTesting } from '../config/environment.js';

describe('Centralized Error Handler Middleware Tests', () => {
  const createAppWithError = (errorToThrow) => {
    const testApp = express();
    testApp.get('/throw', (req, res, next) => {
      next(errorToThrow);
    });
    testApp.use(errorHandler);
    return testApp;
  };

  it('translates GitHubServiceError with accurate status code and details', async () => {
    const ghError = new GitHubServiceError('GitHub rate limit reached', 'GITHUB_RATE_LIMIT_EXCEEDED', 429, {
      resetInSeconds: 300,
    });
    const app = createAppWithError(ghError);

    const res = await request(app).get('/throw');
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('GITHUB_RATE_LIMIT_EXCEEDED');
    expect(res.body.message).toBe('GitHub rate limit reached');
    expect(res.body.details.resetInSeconds).toBe(300);
  });

  it('handles JWT TokenExpiredError with 401 TOKEN_EXPIRED', async () => {
    const jwtErr = new Error('jwt expired');
    jwtErr.name = 'TokenExpiredError';
    const app = createAppWithError(jwtErr);

    const res = await request(app).get('/throw');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('TOKEN_EXPIRED');
  });

  it('handles JWT JsonWebTokenError with 401 INVALID_TOKEN', async () => {
    const jwtErr = new Error('invalid signature');
    jwtErr.name = 'JsonWebTokenError';
    const app = createAppWithError(jwtErr);

    const res = await request(app).get('/throw');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });

  it('handles Mongoose duplicate key error (code 11000) with 409 DUPLICATE_KEY_ERROR', async () => {
    const mongoErr = new Error('E11000 duplicate key error');
    mongoErr.code = 11000;
    mongoErr.keyValue = { email: 'duplicate@test.com' };
    const app = createAppWithError(mongoErr);

    const res = await request(app).get('/throw');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('DUPLICATE_KEY_ERROR');
    expect(res.body.message).toContain('email');
  });

  it('handles Axios timeout errors with 504 GATEWAY_TIMEOUT', async () => {
    const axiosErr = new Error('timeout of 8000ms exceeded');
    axiosErr.isAxiosError = true;
    axiosErr.code = 'ETIMEDOUT';
    const app = createAppWithError(axiosErr);

    const res = await request(app).get('/throw');
    expect(res.status).toBe(504);
    expect(res.body.error).toBe('GATEWAY_TIMEOUT');
    expect(res.body.message).toContain('timed out');
  });

  it('suppresses internal stack traces and error details in production mode', async () => {
    setEnvOverridesForTesting({
      NODE_ENV: 'production',
    });

    try {
      const internalErr = new Error('Sensitive internal database stack trace details');
      const app = createAppWithError(internalErr);

      const res = await request(app).get('/throw');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
      expect(res.body.message).toBe('An unexpected internal error occurred on the server.');
      expect(res.body.stack).toBeUndefined(); // Stack trace MUST be hidden in production
    } finally {
      resetEnvOverridesForTesting();
    }
  });
});

