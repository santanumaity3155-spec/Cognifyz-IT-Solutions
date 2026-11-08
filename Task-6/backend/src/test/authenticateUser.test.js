import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app, { stopServer } from '../server.js';
import authStore from '../services/authStore.js';
import { generateToken, AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';

describe('Phase 7: Authentication Middleware & Route Protection Test Suite', () => {
  let validUser;
  let validToken;
  let inactiveUser;
  let inactiveToken;

  beforeEach(async () => {
    await authStore.resetStore();

    // Retrieve seed active user (Alex Mercer)
    validUser = await authStore.findByEmail('alex.mercer@forma.edu');
    validToken = generateToken(validUser);

    // Retrieve seed inactive user
    inactiveUser = await authStore.findByEmail('inactive@forma.edu');
    inactiveToken = generateToken(inactiveUser);
  });

  afterAll(async () => {
    await stopServer();
  });

  // ========================================================
  // 1. PUBLIC ENDPOINTS ACCESSIBILITY
  // ========================================================
  describe('1. Public Endpoints Verification', () => {
    it('1.1 GET /api/health should remain publicly accessible without auth', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('1.2 POST /api/auth/register should remain publicly accessible without auth', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Public Applicant',
          email: 'public.applicant@example.com',
          password: 'Passw0rdApplicant!',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('1.3 POST /api/auth/login should remain publicly accessible without auth', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ========================================================
  // 2. PROTECTED PROFILE ENDPOINT (GET /api/auth/me)
  // ========================================================
  describe('2. Protected Profile API (GET /api/auth/me)', () => {
    it('2.1 should reject requests without session cookie or token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('UNAUTHORIZED');
      expect(res.body.message).toContain('Authentication required');
    });

    it('2.2 should reject requests with invalid or malformed JWT token with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=malformed.garbage.token`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_TOKEN');
      expect(res.body.message).toContain('Invalid or malformed authentication token');
    });

    it('2.3 should reject requests with an expired JWT token with 401 Unauthorized', async () => {
      const expiredToken = generateToken(validUser, { expiresIn: '1ms' });
      await new Promise((resolve) => setTimeout(resolve, 15));

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('TOKEN_EXPIRED');
      expect(res.body.message).toContain('token has expired');
    });

    it('2.4 should successfully authenticate via HTTP-only cookie and return safe user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile retrieved successfully');
      expect(res.body.data).toHaveProperty('user');

      const user = res.body.data.user;
      expect(user.email).toBe('alex.mercer@forma.edu');
      expect(user.role).toBe('Student');
      expect(user.isActive).toBe(true);

      // Crucial security check: Password and hash must never be returned
      expect(user.password).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('$2a$');
    });

    it('2.5 should successfully authenticate via Authorization: Bearer <token> header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alex.mercer@forma.edu');
    });

    it('2.6 should reject token for non-existent / deleted user account with 401 Unauthorized', async () => {
      const nonExistentToken = generateToken({
        _id: '672e00000000000000000999',
        email: 'ghost@example.com',
        role: 'Student',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${nonExistentToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('USER_NOT_FOUND');
      expect(res.body.message).toContain('account associated with this session no longer exists');
    });

    it('2.7 should reject token for deactivated / inactive user account with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${inactiveToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ACCOUNT_INACTIVE');
      expect(res.body.message).toContain('account has been deactivated');
    });
  });

  // ========================================================
  // 3. PROTECTED APPLICATION ROUTES (Dashboard & Students)
  // ========================================================
  describe('3. Protected Application Endpoints Verification', () => {
    it('3.1 GET /api/dashboard/stats should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('3.2 GET /api/dashboard/stats should succeed when authenticated', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalStudents');
    });

    it('3.3 GET /api/students should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/students');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('3.4 GET /api/students should succeed when authenticated', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ========================================================
  // 4. CSRF & ORIGIN PROTECTION
  // ========================================================
  describe('4. Cookie-based CSRF Defense Verification', () => {
    it('4.1 should reject mutating POST from untrusted cross-origin with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`])
        .set('Origin', 'http://malicious-attacker-site.com')
        .send({
          fullName: 'Injected Student',
          email: 'injected@example.com',
          phone: '+1 555-999-0000',
          dateOfBirth: '2004-01-01',
          course: 'Computer Science',
          academicYear: '1st Year',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('CSRF_REJECTED');
      expect(res.body.message).toContain('Cross-Site Request Forgery');
    });

    it('4.2 should permit mutating POST when Origin matches trusted client', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${validToken}`])
        .set('Origin', 'http://localhost:5173')
        .send({
          fullName: 'Trusted Origin Student',
          email: 'trusted.origin@example.com',
          phone: '+1 (555) 333-4444',
          dateOfBirth: '2004-02-15',
          gender: 'Female',
          course: 'Data Science',
          academicYear: '2nd Year',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Trusted Origin Student');
    });
  });
});

