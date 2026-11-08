import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import authStore from '../services/authStore.js';
import studentStore from '../services/studentStore.js';

describe('Phase 12: Comprehensive Security Audit & Integration Suite', () => {
  beforeEach(async () => {
    await authStore.resetStore();
    await studentStore.resetSeedData();
  });

  // ========================================================
  // 1. END-TO-END AUTHENTICATION & SESSION LIFECYCLE
  // ========================================================
  describe('1. E2E Authentication Lifecycle & Cookie Transport', () => {
    it('1.1 should register new student, enforce Student role, and issue HTTP-only cookie', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Security Test User',
          email: 'sec.user@forma.edu',
          password: 'SecurePassword123!',
          role: 'Admin', // Attacker privilege escalation attempt
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data.user.role).toBe('Student'); // Escalation rejected
      expect(registerRes.body.data.user.password).toBeUndefined(); // Password excluded

      // Verify HTTP-Only Cookie header
      const cookies = registerRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = cookies.join('; ');
      expect(cookieStr).toContain('forma_token=');
      expect(cookieStr.toLowerCase()).toContain('httponly');
    });

    it('1.2 should authenticate session via HTTP-only cookie and access GET /api/auth/me', async () => {
      // 1. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });

      expect(loginRes.status).toBe(200);
      const authCookie = loginRes.headers['set-cookie'];
      expect(authCookie).toBeDefined();

      // 2. Fetch /api/auth/me using the cookie
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.email).toBe('alex.mercer@forma.edu');
      expect(meRes.body.data.user.role).toBe('Student');
      expect(meRes.body.data.user.password).toBeUndefined();
    });

    it('1.3 should clear cookie on logout and invalidate subsequent protected calls', async () => {
      // 1. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });

      const authCookie = loginRes.headers['set-cookie'];

      // 2. Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(logoutRes.status).toBe(200);
      const clearedCookie = logoutRes.headers['set-cookie']?.join('; ') || '';
      expect(clearedCookie.toLowerCase()).toContain('expires=thu, 01 jan 1970');

      // 3. Requesting /api/auth/me without valid cookie should fail with 401
      const meRes = await request(app).get('/api/auth/me');
      expect(meRes.status).toBe(401);
    });
  });

  // ========================================================
  // 2. ROLE-BASED ACCESS CONTROL & PRIVILEGE ENFORCEMENT
  // ========================================================
  describe('2. RBAC Enforcement & Route Gating', () => {
    it('2.1 Student must receive 403 Forbidden on administrative endpoints', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });

      const studentCookie = loginRes.headers['set-cookie'];

      // Access admin overview
      const adminRes = await request(app)
        .get('/api/dashboard/admin-overview')
        .set('Cookie', studentCookie);

      expect(adminRes.status).toBe(403);
      expect(adminRes.body.error).toBe('FORBIDDEN_ROLE');

      // Attempt to reset seed data
      const resetRes = await request(app)
        .post('/api/students/reset-seed')
        .set('Cookie', studentCookie)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(resetRes.status).toBe(403);
    });

    it('2.2 Administrator should access administrative endpoints successfully', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@forma.edu',
          password: 'AdminPassword2026!',
        });

      const adminCookie = loginRes.headers['set-cookie'];

      const overviewRes = await request(app)
        .get('/api/dashboard/admin-overview')
        .set('Cookie', adminCookie);

      expect(overviewRes.status).toBe(200);
      expect(overviewRes.body.data.scope).toBe('administrative');
      expect(overviewRes.body.data.audit).toBeDefined();
    });
  });

  // ========================================================
  // 3. RESOURCE OWNERSHIP & MASS-ASSIGNMENT DEFENSES
  // ========================================================
  describe('3. Resource Ownership & Immutability Audits', () => {
    it('3.1 Server strictly assigns createdBy to authenticated user and ignores spoofed values', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });

      const studentCookie = loginRes.headers['set-cookie'];
      const studentId = loginRes.body.data.user.id;

      const createRes = await request(app)
        .post('/api/students')
        .set('Cookie', studentCookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          fullName: 'Ownership Audit Student',
          email: 'audit.student@example.com',
          phone: '+1 555-888-9999',
          dateOfBirth: '2002-11-10',
          gender: 'Female',
          collegeName: 'Cognifyz Institute of Technology',
          course: 'Computer Science',
          academicYear: '2nd Year',
          skills: ['Python', 'Django'],
          createdBy: '672e00000000000000000001', // Spoofed admin ID
        });

      expect(createRes.status).toBe(201);
      // Ensure createdBy was assigned to studentId, NOT the spoofed admin ID
      expect(createRes.body.data.createdBy.toString()).toBe(studentId);
    });

    it('3.2 Student cannot access or mutate another student record created by another user', async () => {
      // Alex Mercer (Student) logs in
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });

      const studentCookie = loginRes.headers['set-cookie'];

      // STU-2026-002 was created by Admin in seed data
      const getOtherRes = await request(app)
        .get('/api/students/STU-2026-002')
        .set('Cookie', studentCookie);

      expect(getOtherRes.status).toBe(403);
      expect(getOtherRes.body.error).toBe('FORBIDDEN_RESOURCE');

      // Attempt update on STU-2026-002
      const putOtherRes = await request(app)
        .put('/api/students/STU-2026-002')
        .set('Cookie', studentCookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ fullName: 'Malicious Update' });

      expect(putOtherRes.status).toBe(403);

      // Attempt delete on STU-2026-002
      const delOtherRes = await request(app)
        .delete('/api/students/STU-2026-002')
        .set('Cookie', studentCookie)
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(delOtherRes.status).toBe(403);
    });

    it('3.3 PUT update cannot mutate createdBy ownership or internal IDs', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex.mercer@forma.edu',
          password: 'StudentPass2026!',
        });

      const studentCookie = loginRes.headers['set-cookie'];
      const studentUserId = loginRes.body.data.user.id;

      // STU-2026-001 is owned by Alex Mercer
      const updateRes = await request(app)
        .put('/api/students/STU-2026-001')
        .set('Cookie', studentCookie)
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({
          fullName: 'David Miller Updated',
          createdBy: '672e00000000000000000001', // Attempted ownership transfer
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.fullName).toBe('David Miller Updated');
      expect(updateRes.body.data.createdBy.toString()).toBe(studentUserId);
    });
  });

  // ========================================================
  // 4. INJECTION & SANITIZATION DEFENSES
  // ========================================================
  describe('4. Input Sanitization & Injection Hardening', () => {
    it('4.1 should handle regex special characters in search query without throwing syntax error', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@forma.edu',
          password: 'AdminPassword2026!',
        });

      const adminCookie = loginRes.headers['set-cookie'];

      // Send regex syntax characters: unbalanced parenthesis, asterisks, plus
      const res = await request(app)
        .get('/api/students?search=(.*[+')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('4.2 should reject non-string / object payloads for authentication fields with 400', async () => {
      const badLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' }, // NoSQL operator injection attempt
          password: 'Password123!',
        });

      expect(badLoginRes.status).toBe(400);
      expect(badLoginRes.body.error).toBe('VALIDATION_ERROR');
    });

    it('4.3 should reject deactivated accounts from logging in', async () => {
      const inactiveLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@forma.edu',
          password: 'InactivePass2026!',
        });

      expect(inactiveLoginRes.status).toBe(403);
      expect(inactiveLoginRes.body.error).toBe('ACCOUNT_INACTIVE');
    });
  });
});
