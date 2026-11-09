import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { app } from '../server.js';
import { oauthStateStore } from '../services/oauthStateStore.js';
import { encrypt, decrypt } from '../services/encryptionService.js';
import { cacheService } from '../services/cacheService.js';
import authStore from '../services/authStore.js';
import { generateToken, AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';
import { setEnvOverridesForTesting, resetEnvOverridesForTesting } from '../config/environment.js';

vi.mock('axios');

describe('Phase 11: Security, Authorization & Tenant Isolation Audit Suite', () => {
  let userA;
  let userB;
  let tokenA;
  let tokenB;

  const mockTokenA = 'gho_UserATestAccessToken1234567890abcdef';
  const mockTokenB = 'gho_UserBTestAccessToken0987654321fedcba';

  beforeEach(async () => {
    vi.clearAllMocks();
    authStore.clearMemoryStoreForTesting();
    cacheService.clear();
    oauthStateStore.clear();

    // Create User A
    userA = await authStore.createUser({
      name: 'Alice Security',
      email: 'alice@forma.edu',
      password: 'StrongPassword123!',
      role: 'Student',
    });

    // Create User B
    userB = await authStore.createUser({
      name: 'Bob Isolation',
      email: 'bob@forma.edu',
      password: 'StrongPassword123!',
      role: 'Student',
    });

    tokenA = generateToken({ id: userA.id, email: userA.email, role: userA.role });
    tokenB = generateToken({ id: userB.id, email: userB.email, role: userB.role });

    // Link GitHub for User A
    await authStore.updateGitHubConnection(userA.id, {
      githubId: '11111',
      username: 'alice-octocat',
      avatarUrl: 'https://avatars.github.com/u/11111',
      profileUrl: 'https://github.com/alice-octocat',
      encryptedAccessToken: encrypt(mockTokenA),
      scopes: ['read:user'],
    });

    // Link GitHub for User B
    await authStore.updateGitHubConnection(userB.id, {
      githubId: '22222',
      username: 'bob-octocat',
      avatarUrl: 'https://avatars.github.com/u/22222',
      profileUrl: 'https://github.com/bob-octocat',
      encryptedAccessToken: encrypt(mockTokenB),
      scopes: ['read:user'],
    });
  });

  // =========================================================================
  // 1. OAuth Security Audit
  // =========================================================================
  describe('1. OAuth State Nonce & CSRF Protection Audit', () => {
    it('generates cryptographically random 64-character hex state with high entropy', () => {
      const state1 = oauthStateStore.generateState(userA.id);
      const state2 = oauthStateStore.generateState(userA.id);

      expect(state1).toHaveLength(64);
      expect(state2).toHaveLength(64);
      expect(state1).toMatch(/^[0-9a-f]{64}$/);
      expect(state1).not.toBe(state2); // Non-repeating
    });

    it('rejects malformed or truncated OAuth states', () => {
      expect(oauthStateStore.validateAndConsumeState('')).toEqual({
        valid: false,
        error: 'MALFORMED_STATE',
      });
      expect(oauthStateStore.validateAndConsumeState('short-state')).toEqual({
        valid: false,
        error: 'MALFORMED_STATE',
      });
      expect(oauthStateStore.validateAndConsumeState('a'.repeat(63))).toEqual({
        valid: false,
        error: 'MALFORMED_STATE',
      });
      expect(oauthStateStore.validateAndConsumeState('a'.repeat(65))).toEqual({
        valid: false,
        error: 'MALFORMED_STATE',
      });
    });

    it('enforces single-use consumption and strictly prevents state replay attacks', () => {
      const state = oauthStateStore.generateState(userA.id);

      // First validation consumes the state
      const firstConsumption = oauthStateStore.validateAndConsumeState(state);
      expect(firstConsumption.valid).toBe(true);
      expect(firstConsumption.userId).toBe(userA.id);

      // Replay attempt must be rejected
      const secondConsumption = oauthStateStore.validateAndConsumeState(state);
      expect(secondConsumption.valid).toBe(false);
      expect(secondConsumption.error).toBe('STATE_NOT_FOUND');
    });

    it('rejects expired OAuth states after TTL has elapsed', () => {
      // Create a store with 50ms TTL for testing
      const expiringStore = new (oauthStateStore.constructor)(50);
      const state = expiringStore.generateState(userA.id);

      // Force simulated clock advance beyond TTL
      const record = expiringStore.states.get(state);
      record.createdAt = Date.now() - 60000; // 60s ago

      const result = expiringStore.validateAndConsumeState(state);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('STATE_EXPIRED');
    });

    it('sets HTTP-only SameSite state cookie on /api/github/connect', async () => {
      setEnvOverridesForTesting({
        GITHUB_CLIENT_ID: 'test_client_id_123',
        GITHUB_CLIENT_SECRET: 'test_client_secret_456',
        isOAuthConfigured: true,
      });

      try {
        const res = await request(app)
          .get('/api/github/connect')
          .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

        expect(res.status).toBe(302);
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const stateCookie = cookies.find((c) => c.includes('forma_github_oauth_state'));
        expect(stateCookie).toBeDefined();
        expect(stateCookie).toMatch(/HttpOnly/i);
        expect(stateCookie).toMatch(/SameSite=Lax/i);
      } finally {
        resetEnvOverridesForTesting();
      }
    });
  });

  // =========================================================================
  // 2. Token Protection & Encryption Boundary Audit
  // =========================================================================
  describe('2. Token Protection & AES-256-GCM Boundary', () => {
    it('encrypts tokens with unique IVs yielding different ciphertexts for identical plaintexts', () => {
      const plain = 'gho_SuperSecretToken12345';
      const encrypted1 = encrypt(plain);
      const encrypted2 = encrypt(plain);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(plain);
      expect(decrypt(encrypted2)).toBe(plain);
    });

    it('detects and rejects ciphertext tampering or invalid auth tags', () => {
      const encrypted = encrypt('gho_TargetToken');
      const parts = encrypted.split(':');

      // Tamper with ciphertext payload
      const tampered = `${parts[0]}:${parts[1]}:bad00000${parts[2].slice(8)}`;
      expect(() => decrypt(tampered)).toThrow(/Decryption failed/i);

      // Tamper with authentication tag
      const tamperedTag = `${parts[0]}:00112233445566778899aabbccddeeff:${parts[2]}`;
      expect(() => decrypt(tamperedTag)).toThrow(/Decryption failed/i);
    });

    it('never leaks raw or encrypted access tokens in GET /api/github/status', async () => {
      const res = await request(app)
        .get('/api/github/status')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(res.status).toBe(200);
      const bodyStr = JSON.stringify(res.body);

      expect(bodyStr).not.toContain(mockTokenA);
      expect(bodyStr).not.toContain('encryptedAccessToken');
      expect(bodyStr).not.toContain('gho_');
      expect(res.body.data.username).toBe('alice-octocat');
    });

    it('completely purges stored encrypted credentials and invalidates user cache on disconnect', async () => {
      // Populate cache for User A
      cacheService.set(cacheService.profileKey(userA.id), { profile: { login: 'alice' } }, 60000);
      expect(cacheService.get(cacheService.profileKey(userA.id))).not.toBeNull();

      const res = await request(app)
        .delete('/api/github/disconnect')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(res.status).toBe(200);

      // Verify DB record is disconnected and credentials nullified
      const updatedUserA = await authStore.findById(userA.id);
      expect(updatedUserA.github.connected).toBe(false);
      expect(updatedUserA.github.encryptedAccessToken).toBeNull();

      // Verify User A cache is purged
      expect(cacheService.get(cacheService.profileKey(userA.id))).toBeNull();
    });
  });

  // =========================================================================
  // 3. Multi-User & Tenant Isolation Audit
  // =========================================================================
  describe('3. Multi-User & Tenant Isolation Audit', () => {
    it('ensures User A and User B execute queries using strictly their own tokens', async () => {
      // Mock GitHub /user response dynamically based on Bearer token
      axios.mockImplementation((config) => {
        const auth = config.headers?.Authorization;
        if (auth === `Bearer ${mockTokenA}`) {
          return Promise.resolve({
            data: { id: 11111, login: 'alice-octocat', name: 'Alice Security' },
            headers: { 'x-ratelimit-remaining': '4990' },
          });
        }
        if (auth === `Bearer ${mockTokenB}`) {
          return Promise.resolve({
            data: { id: 22222, login: 'bob-octocat', name: 'Bob Isolation' },
            headers: { 'x-ratelimit-remaining': '4980' },
          });
        }
        return Promise.reject(new Error('Invalid Bearer Token'));
      });

      // User A requests profile
      const resA = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(resA.status).toBe(200);
      expect(resA.body.data.profile.login).toBe('alice-octocat');
      expect(resA.body.data.profile.name).toBe('Alice Security');

      // User B requests profile
      const resB = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenB}`]);

      expect(resB.status).toBe(200);
      expect(resB.body.data.profile.login).toBe('bob-octocat');
      expect(resB.body.data.profile.name).toBe('Bob Isolation');
    });

    it('prevents cache cross-contamination between tenants', async () => {
      cacheService.set(cacheService.profileKey(userA.id), { profile: { login: 'cached-alice' } }, 60000);
      cacheService.set(cacheService.profileKey(userB.id), { profile: { login: 'cached-bob' } }, 60000);

      const resA = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      const resB = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenB}`]);

      expect(resA.body.data.profile.login).toBe('cached-alice');
      expect(resB.body.data.profile.login).toBe('cached-bob');

      // User A disconnects -> User A's cache purged, User B's cache intact
      await request(app)
        .delete('/api/github/disconnect')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(cacheService.get(cacheService.profileKey(userA.id))).toBeNull();
      expect(cacheService.get(cacheService.profileKey(userB.id))).not.toBeNull();
    });
  });

  // =========================================================================
  // 4. Input Validation & Parameter Tampering
  // =========================================================================
  describe('4. Input Validation & Parameter Sanitization', () => {
    it('rejects invalid repository owner/repo parameters with regex validation', async () => {
      // Path traversal attempt in owner parameter
      const resTraversal = await request(app)
        .get('/api/github/repositories/..%2F..%2Fetc/passwd')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(resTraversal.status).toBe(400);
      expect(resTraversal.body.error).toBe('VALIDATION_ERROR');

      // Shell metacharacters in repo parameter
      const resInjection = await request(app)
        .get('/api/github/repositories/valid-owner/repo%3Brm%20-rf')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(resInjection.status).toBe(400);
      expect(resInjection.body.error).toBe('VALIDATION_ERROR');
    });

    it('validates repository pagination parameters', async () => {
      // Negative page
      const resNegPage = await request(app)
        .get('/api/github/repositories?page=-5')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(resNegPage.status).toBe(400);

      // Oversized per_page (> 100)
      const resLargePage = await request(app)
        .get('/api/github/repositories?per_page=500')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(resLargePage.status).toBe(400);

      // Invalid sort criteria
      const resBadSort = await request(app)
        .get('/api/github/repositories?sort=sql_injection')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(resBadSort.status).toBe(400);
    });
  });

  // =========================================================================
  // 5. Authentication & Authorization Guards
  // =========================================================================
  describe('5. Authentication Boundaries & Status Codes', () => {
    it('rejects unauthenticated requests to protected endpoints with 401 UNAUTHORIZED', async () => {
      const endpoints = [
        { method: 'get', url: '/api/github/connect' },
        { method: 'get', url: '/api/github/status' },
        { method: 'get', url: '/api/github/profile' },
        { method: 'get', url: '/api/github/repositories' },
        { method: 'get', url: '/api/github/repositories/owner/repo' },
        { method: 'get', url: '/api/github/rate-limit' },
        { method: 'delete', url: '/api/github/disconnect' },
      ];

      for (const ep of endpoints) {
        const res = await request(app)[ep.method](ep.url);
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('UNAUTHORIZED');
      }
    });

    it('rejects deactivated user accounts with 403 ACCOUNT_DEACTIVATED', async () => {
      userA.isActive = false;

      const res = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${tokenA}`]);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('ACCOUNT_DEACTIVATED');
    });
  });
});
