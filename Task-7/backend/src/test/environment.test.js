import { describe, it, expect } from 'vitest';
import { validateEnvironment, maskSecret, maskConnectionString } from '../config/environment.js';

describe('Environment Configuration & Validation Tests', () => {
  it('loads valid default development configuration', () => {
    const config = validateEnvironment({
      PORT: '5001',
      NODE_ENV: 'development',
      CLIENT_URL: 'http://localhost:5174',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/forma_task7',
    });

    expect(config.PORT).toBe(5001);
    expect(config.NODE_ENV).toBe('development');
    expect(config.CLIENT_URL).toBe('http://localhost:5174');
    expect(config.isOAuthConfigured).toBe(false);
  });

  it('detects genuine GitHub OAuth configuration when valid credentials are provided', () => {
    const config = validateEnvironment({
      NODE_ENV: 'development',
      GITHUB_CLIENT_ID: 'Iv1.0123456789abcdef',
      GITHUB_CLIENT_SECRET: '9876543210fedcba9876543210fedcba98765432',
    });

    expect(config.isOAuthConfigured).toBe(true);
    expect(config.maskedClientId).toContain('cdef');
    expect(config.maskedClientSecret).toBe('****');
  });

  it('identifies placeholder credentials as OAuth-not-configured', () => {
    const config = validateEnvironment({
      NODE_ENV: 'development',
      GITHUB_CLIENT_ID: 'your_github_oauth_client_id_here',
      GITHUB_CLIENT_SECRET: 'your_github_oauth_client_secret_here',
    });

    expect(config.isOAuthConfigured).toBe(false);
    expect(config.maskedClientId).toBe('[NOT_CONFIGURED]');
    expect(config.maskedClientSecret).toBe('[NOT_CONFIGURED]');
  });

  it('masks sensitive database connection strings properly', () => {
    const rawUri = 'mongodb://app_user:super_secret_password123@cluster0.mongodb.net/forma_task7';
    const masked = maskConnectionString(rawUri);

    expect(masked).not.toContain('super_secret_password123');
    expect(masked).toBe('mongodb://app_user:****@cluster0.mongodb.net/forma_task7');
  });

  it('masks client secret tokens properly with maskSecret', () => {
    expect(maskSecret('ghp_abcdef1234567890', 4)).toBe('****7890');
    expect(maskSecret('short', 4)).toBe('****');
    expect(maskSecret('', 4)).toBe('[NOT_CONFIGURED]');
    expect(maskSecret(null, 4)).toBe('[NOT_CONFIGURED]');
  });
});

