import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { app } from '../server.js';
import authStore from '../services/authStore.js';
import { oauthStateStore } from '../services/oauthStateStore.js';
import { generateToken, AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';
import { decrypt } from '../services/encryptionService.js';
import { env, setEnvOverridesForTesting, resetEnvOverridesForTesting } from '../config/environment.js';

vi.mock('axios');

describe('GitHub OAuth 2.0 Integration & Security Test Suite', () => {
  let testUser1;
  let testUser2;
  let authToken1;
  let authToken2;

  beforeEach(async () => {
    vi.clearAllMocks();
    authStore.clearMemoryStoreForTesting();
    oauthStateStore.clear();

    // Create 2 distinct test student users
    testUser1 = await authStore.createUser({
      name: 'Alice Student',
      email: 'alice@student.forma.edu',
      password: 'SecurePassword123!',
      role: 'Student',
    });

    testUser2 = await authStore.createUser({
      name: 'Bob Student',
      email: 'bob@student.forma.edu',
      password: 'SecurePassword123!',
      role: 'Student',
    });

    authToken1 = generateToken(testUser1);
    authToken2 = generateToken(testUser2);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. State Management & CSRF Protection', () => {
    it('generates a 64-character cryptographically secure hex state', () => {
      const state1 = oauthStateStore.generateState(testUser1.id);
      const state2 = oauthStateStore.generateState(testUser1.id);

      expect(typeof state1).toBe('string');
      expect(state1.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(state1)).toBe(true);
      expect(state1).not.toBe(state2); // Nonce uniqueness
    });

    it('validates state and successfully consumes it on first use', () => {
      const state = oauthStateStore.generateState(testUser1.id);
      const result = oauthStateStore.validateAndConsumeState(state);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe(String(testUser1.id));
    });

    it('rejects state reuse (single-use token protection)', () => {
      const state = oauthStateStore.generateState(testUser1.id);

      const firstUse = oauthStateStore.validateAndConsumeState(state);
      expect(firstUse.valid).toBe(true);

      const secondUse = oauthStateStore.validateAndConsumeState(state);
      expect(secondUse.valid).toBe(false);
      expect(secondUse.error).toBe('STATE_NOT_FOUND');
    });

    it('rejects expired state', () => {
      const shortTtlStore = new (oauthStateStore.constructor)(10); // 10ms TTL
      const state = shortTtlStore.generateState(testUser1.id);

      // Artificially age the state
      const entry = shortTtlStore.states.get(state);
      entry.createdAt = Date.now() - 5000;

      const result = shortTtlStore.validateAndConsumeState(state);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('STATE_EXPIRED');
    });
  });

  describe('2. GET /api/github/connect', () => {
    it('returns 401 Unauthorized if user is not authenticated', async () => {
      const res = await request(app).get('/api/github/connect');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('generates authorization URL, state cookie, and minimum scopes for authenticated user', async () => {
      setEnvOverridesForTesting({
        isOAuthConfigured: true,
        GITHUB_CLIENT_ID: 'Iv1.mocked_client_id_123',
      });

      try {
        const res = await request(app)
          .get('/api/github/connect?json=true')
          .set('Cookie', [`${AUTH_COOKIE_NAME}=${authToken1}`])
          .set('Accept', 'application/json');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.authUrl).toContain('https://github.com/login/oauth/authorize');
        expect(res.body.authUrl).toContain('client_id=Iv1.mocked_client_id_123');
        expect(res.body.authUrl).toContain('scope=read%3Auser'); // Minimum scope
        expect(res.body.scopes).toEqual(['read:user']);

        // Verify state cookie is set with httpOnly: true
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        const stateCookie = cookies.find((c) => c.includes('forma_github_oauth_state'));
        expect(stateCookie).toBeDefined();
        expect(stateCookie).toContain('HttpOnly');
      } finally {
        resetEnvOverridesForTesting();
      }
    });

    it('returns 503 OAUTH_CONFIG_REQUIRED when OAuth is not configured on server', async () => {
      setEnvOverridesForTesting({
        isOAuthConfigured: false,
      });

      try {
        const res = await request(app)
          .get('/api/github/connect?json=true')
          .set('Cookie', [`${AUTH_COOKIE_NAME}=${authToken1}`]);

        expect(res.status).toBe(503);
        expect(res.body.error).toBe('OAUTH_CONFIG_REQUIRED');
        expect(res.body.setupGuide).toBeDefined();
      } finally {
        resetEnvOverridesForTesting();
      }
    });
  });

  describe('3. GET /api/github/callback', () => {
    it('handles user authorization denial gracefully', async () => {
      const res = await request(app)
        .get('/api/github/callback?error=access_denied&error_description=The+user+has+denied+your+application')
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('AUTHORIZATION_DENIED');
    });

    it('rejects callback with missing authorization code', async () => {
      const res = await request(app).get('/api/github/callback').set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MISSING_AUTHORIZATION_CODE');
    });

    it('rejects callback with mismatched state (CSRF prevention)', async () => {
      const validState = oauthStateStore.generateState(testUser1.id);

      const res = await request(app)
        .get(`/api/github/callback?code=mock_code_123&state=tampered_state_value_which_does_not_match`)
        .set('Cookie', [`forma_github_oauth_state=${validState}`])
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_OAUTH_STATE');
    });

    it('rejects callback with missing state cookie', async () => {
      const state = oauthStateStore.generateState(testUser1.id);

      const res = await request(app)
        .get(`/api/github/callback?code=mock_code_123&state=${state}`)
        .set('Accept', 'application/json'); // No cookie provided

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_OAUTH_STATE');
    });

    it('executes successful OAuth code exchange, profile fetch, and AES-256 encryption', async () => {
      const state = oauthStateStore.generateState(testUser1.id);
      const mockCode = 'valid_oauth_authorization_code_abc';
      const mockGitHubToken = 'gho_secretAccessTokenFromGitHub_999';

      // 1. Mock GitHub Token Exchange POST
      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          access_token: mockGitHubToken,
          scope: 'read:user',
          token_type: 'bearer',
        },
      });

      // 2. Mock GitHub /user Profile GET
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          id: 9876543,
          login: 'octocat-student',
          avatar_url: 'https://avatars.githubusercontent.com/u/9876543',
          html_url: 'https://github.com/octocat-student',
        },
      });

      const res = await request(app)
        .get(`/api/github/callback?code=${mockCode}&state=${state}&json=true`)
        .set('Cookie', [`forma_github_oauth_state=${state}`])
        .set('Accept', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('octocat-student');
      expect(res.body.data.avatarUrl).toBe('https://avatars.githubusercontent.com/u/9876543');

      // Security check: Raw token or encrypted token is NEVER returned to client
      expect(res.body.data.access_token).toBeUndefined();
      expect(res.body.data.encryptedAccessToken).toBeUndefined();

      // Verify token is encrypted at rest in the database
      const userInDb = await authStore.findById(testUser1.id);
      expect(userInDb.github.connected).toBe(true);
      expect(userInDb.github.username).toBe('octocat-student');
      expect(userInDb.github.encryptedAccessToken).toBeDefined();

      // The stored token MUST NOT be plaintext
      expect(userInDb.github.encryptedAccessToken).not.toBe(mockGitHubToken);

      // Verify stored token decrypts to original plaintext using AES-256-GCM
      const decrypted = decrypt(userInDb.github.encryptedAccessToken);
      expect(decrypted).toBe(mockGitHubToken);
    });

    it('handles GitHub token exchange failure safely without crashing', async () => {
      const state = oauthStateStore.generateState(testUser1.id);

      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          error: 'bad_verification_code',
          error_description: 'The code passed is incorrect or expired.',
        },
      });

      const res = await request(app)
        .get(`/api/github/callback?code=bad_code&state=${state}&json=true`)
        .set('Cookie', [`forma_github_oauth_state=${state}`])
        .set('Accept', 'application/json');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('TOKEN_EXCHANGE_FAILED');
    });
  });

  describe('4. GET /api/github/status & DELETE /api/github/disconnect', () => {
    it('GET /api/github/status returns connected: false for unlinked student', async () => {
      const res = await request(app)
        .get('/api/github/status')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${authToken1}`]);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(false);
      expect(res.body.data).toBeUndefined();
    });

    it('GET /api/github/status returns connected: true with public metadata for linked student', async () => {
      // Connect testUser1 manually
      await authStore.updateGitHubConnection(testUser1.id, {
        githubId: '12345',
        username: 'alice-coder',
        avatarUrl: 'https://example.com/avatar.png',
        profileUrl: 'https://github.com/alice-coder',
        encryptedAccessToken: 'encrypted_val_sample',
        scopes: ['read:user'],
      });

      const res = await request(app)
        .get('/api/github/status')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${authToken1}`]);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(true);
      expect(res.body.data.username).toBe('alice-coder');
      expect(res.body.data.avatarUrl).toBe('https://example.com/avatar.png');

      // Tokens MUST NEVER be exposed in status response
      expect(res.body.data.encryptedAccessToken).toBeUndefined();
      expect(res.body.data.token).toBeUndefined();
    });

    it('DELETE /api/github/disconnect purges GitHub tokens for the authenticated user only', async () => {
      // Connect both Alice and Bob
      await authStore.updateGitHubConnection(testUser1.id, {
        githubId: '111',
        username: 'alice-coder',
        encryptedAccessToken: 'alice_encrypted_token',
      });

      await authStore.updateGitHubConnection(testUser2.id, {
        githubId: '222',
        username: 'bob-coder',
        encryptedAccessToken: 'bob_encrypted_token',
      });

      // Alice disconnects her GitHub account
      const res = await request(app)
        .delete('/api/github/disconnect')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${authToken1}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Alice is disconnected
      const aliceAfter = await authStore.findById(testUser1.id);
      expect(aliceAfter.github.connected).toBe(false);
      expect(aliceAfter.github.encryptedAccessToken).toBeNull();
      expect(aliceAfter.github.username).toBeNull();

      // Verify Bob's connection is COMPLETELY UNTOUCHED (User ownership boundary)
      const bobAfter = await authStore.findById(testUser2.id);
      expect(bobAfter.github.connected).toBe(true);
      expect(bobAfter.github.username).toBe('bob-coder');
      expect(bobAfter.github.encryptedAccessToken).toBe('bob_encrypted_token');
    });
  });
});
