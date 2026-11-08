import { describe, it, expect } from 'vitest';
import { redactSensitiveData } from '../utils/logger.js';

describe('Logger Sensitive Data Redaction Tests', () => {
  it('redacts GitHub OAuth tokens from string logs', () => {
    const raw = 'Received GitHub token: ghp_1234567890abcdef1234567890abcdef for user octocat';
    const redacted = redactSensitiveData(raw);

    expect(redacted).not.toContain('ghp_1234567890abcdef1234567890abcdef');
    expect(redacted).toContain('[REDACTED_GITHUB_TOKEN]');
    expect(redacted).toContain('octocat');
  });

  it('redacts Bearer tokens from authorization strings', () => {
    const raw = 'Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz.123';
    const redacted = redactSensitiveData(raw);

    expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(redacted).toContain('Bearer [REDACTED]');
  });

  it('redacts query parameter secrets from URL strings', () => {
    const raw = 'https://api.github.com/login/oauth/access_token?client_id=123&client_secret=secret999&code=code123';
    const redacted = redactSensitiveData(raw);

    expect(redacted).not.toContain('secret999');
    expect(redacted).not.toContain('code123');
    expect(redacted).toContain('client_secret=[REDACTED]');
    expect(redacted).toContain('code=[REDACTED]');
  });

  it('deeply redacts sensitive keys from complex objects and nested structures', () => {
    const sensitivePayload = {
      user: {
        id: 'u123',
        name: 'Jane Doe',
        password: 'PlainTextPassword!123',
        token: 'secret_jwt_token',
      },
      oauth: {
        client_secret: 'github_secret_abc',
        forma_token: 'cookie_token_val',
      },
      meta: {
        active: true,
        requestsCount: 42,
      },
    };

    const redacted = redactSensitiveData(sensitivePayload);

    expect(redacted.user.name).toBe('Jane Doe');
    expect(redacted.user.password).toBe('[REDACTED]');
    expect(redacted.user.token).toBe('[REDACTED]');
    expect(redacted.oauth.client_secret).toBe('[REDACTED]');
    expect(redacted.oauth.forma_token).toBe('[REDACTED]');
    expect(redacted.meta.active).toBe(true);
    expect(redacted.meta.requestsCount).toBe(42);
  });
});

