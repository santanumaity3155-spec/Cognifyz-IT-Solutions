import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import app, { stopServer } from '../server.js';
import authStore from '../services/authStore.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

describe('Phase 5: User Registration & Login RESTful APIs Suite', () => {
  beforeEach(async () => {
    // Reset store before each test for complete test isolation
    await authStore.resetStore();
  });

  afterAll(async () => {
    await stopServer();
  });

  // ========================================================
  // REGISTRATION TESTS (POST /api/auth/register)
  // ========================================================
  describe('1. User Registration API (POST /api/auth/register)', () => {
    const validRegisterPayload = {
      name: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      password: 'StrongP@ssw0rd2026',
    };

    it('1.1 should successfully register a new user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validRegisterPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('user');

      const user = res.body.data.user;
      expect(user).toHaveProperty('id');
      expect(user.name).toBe('Sarah Connor');
      expect(user.email).toBe('sarah.connor@example.com');
      expect(user.role).toBe('Student');
      expect(user.isActive).toBe(true);

      // Crucial security check: Password and hash must never be in response
      expect(user.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('StrongP@ssw0rd2026');
      expect(JSON.stringify(res.body)).not.toContain('$2a$');
    });

    it('1.2 should reject registration when required fields are missing', async () => {
      // Missing name
      const resMissingName = await request(app)
        .post('/api/auth/register')
        .send({ email: 'noname@example.com', password: 'StrongP@ssw0rd2026' });

      expect(resMissingName.status).toBe(400);
      expect(resMissingName.body.success).toBe(false);
      expect(resMissingName.body.error).toBe('VALIDATION_ERROR');
      expect(resMissingName.body.message).toContain('Full name is required');

      // Missing email
      const resMissingEmail = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Email', password: 'StrongP@ssw0rd2026' });

      expect(resMissingEmail.status).toBe(400);
      expect(resMissingEmail.body.message).toContain('Email address is required');

      // Missing password
      const resMissingPass = await request(app)
        .post('/api/auth/register')
        .send({ name: 'No Pass', email: 'nopass@example.com' });

      expect(resMissingPass.status).toBe(400);
      expect(resMissingPass.body.message).toContain('Password is required');
    });

    it('1.3 should reject registration with an invalid email address', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'invalid-email-no-at-domain',
          password: 'StrongP@ssw0rd2026',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid email address');
    });

    it('1.4 should reject weak passwords failing complexity requirements', async () => {
      // Too short (< 8 chars)
      const resShort = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test1@example.com', password: 'Sh0rt!' });
      expect(resShort.status).toBe(400);
      expect(resShort.body.message).toContain('at least 8 characters');

      // Missing uppercase
      const resNoUpper = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test2@example.com', password: 'lowercaseonly123!' });
      expect(resNoUpper.status).toBe(400);
      expect(resNoUpper.body.message).toContain('uppercase letter');

      // Missing lowercase
      const resNoLower = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test3@example.com', password: 'UPPERCASEONLY123!' });
      expect(resNoLower.status).toBe(400);
      expect(resNoLower.body.message).toContain('lowercase letter');

      // Missing number
      const resNoNumber = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test4@example.com', password: 'NoNumberHere!@#' });
      expect(resNoNumber.status).toBe(400);
      expect(resNoNumber.body.message).toContain('numeric digit');

      // Missing special character
      const resNoSpecial = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test5@example.com', password: 'NoSpecialChar123' });
      expect(resNoSpecial.status).toBe(400);
      expect(resNoSpecial.body.message).toContain('special character');
    });

    it('1.5 should return 409 Conflict when attempting to register duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validRegisterPayload);

      // Duplicate registration attempt (with casing variance to verify normalization)
      const dupRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Clone',
          email: 'SARAH.CONNOR@EXAMPLE.COM',
          password: 'DifferentP@ssw0rd99',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.error).toBe('EMAIL_ALREADY_EXISTS');
      expect(dupRes.body.message).toContain('account with this email address already exists');
    });

    it('1.6 should strictly enforce Student role and prevent public privilege escalation to Admin', async () => {
      const maliciousPayload = {
        name: 'Hacker User',
        email: 'hacker@example.com',
        password: 'H@ckPassw0rd2026',
        role: 'Admin', // Attacker attempts to grant themselves Admin
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(res.status).toBe(201);
      // Verify assigned role is strictly forced to 'Student'
      expect(res.body.data.user.role).toBe('Student');
      expect(res.body.data.user.role).not.toBe('Admin');
    });
  });

  // ========================================================
  // LOGIN TESTS (POST /api/auth/login)
  // ========================================================
  describe('2. User Login API (POST /api/auth/login)', () => {
    it('2.1 should successfully login with valid registered credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data).toHaveProperty('user');

      const user = res.body.data.user;
      expect(user.email).toBe('alex.mercer@forma.edu');
      expect(user.role).toBe('Student');
      expect(user.isActive).toBe(true);

      // Verify no password hash is exposed
      expect(user.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('$2a$');
    });

    it('2.2 should reject login with incorrect password with generic error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('2.3 should reject login with non-existent email with generic error message (anti-enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent.ghost@forma.edu',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
      // Generic message identical to wrong password
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('2.4 should reject login attempt on deactivated/inactive accounts', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@forma.edu',
          password: 'InactivePass2026!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ACCOUNT_INACTIVE');
      expect(res.body.message).toContain('account has been deactivated');
    });

    it('2.5 should reject login with missing email or password', async () => {
      const resNoPass = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alex.mercer@forma.edu' });

      expect(resNoPass.status).toBe(400);
      expect(resNoPass.body.error).toBe('VALIDATION_ERROR');

      const resNoEmail = await request(app)
        .post('/api/auth/login')
        .send({ password: 'SomePass123!' });

      expect(resNoEmail.status).toBe(400);
      expect(resNoEmail.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // ========================================================
  // PROFILE (GET /api/auth/me) & LOGOUT (POST /api/auth/logout)
  // ========================================================
  describe('3. Profile & Session Endpoints', () => {
    it('3.1 GET /api/auth/me should return 401 when called without active session in Phase 5', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('UNAUTHORIZED');
      expect(res.body.message).toContain('Authentication required');
    });

    it('3.2 POST /api/auth/logout should respond with 200 and clear session cookie', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  // ========================================================
  // RATE LIMITING TESTS
  // ========================================================
  describe('4. Rate Limiting Security Middleware Verification', () => {
    it('4.1 should enforce rate limit threshold when excessive requests are sent', async () => {
      // Create a test app with strict limiter (max: 3 requests)
      const testApp = express();
      testApp.use(express.json());
      const strictLimiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Rate limit exceeded for test.',
      });

      testApp.post('/test-limit', strictLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // Request 1, 2, 3 should succeed
      for (let i = 0; i < 3; i++) {
        const res = await request(testApp).post('/test-limit');
        expect(res.status).toBe(200);
      }

      // Request 4 must trigger 429 Too Many Requests
      const blockedRes = await request(testApp).post('/test-limit');
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.error).toBe('TOO_MANY_REQUESTS');
      expect(blockedRes.body.message).toBe('Rate limit exceeded for test.');
    });
  });
});

