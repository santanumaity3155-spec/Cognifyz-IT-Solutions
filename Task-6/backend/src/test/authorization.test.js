import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app, { stopServer } from '../server.js';
import authStore from '../services/authStore.js';
import studentStore from '../services/studentStore.js';
import { generateToken, AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';

describe('Phase 8: Role-Based Access Control (RBAC) & Resource Ownership Test Suite', () => {
  let adminUser;
  let adminToken;
  let studentUser;
  let studentToken;
  let secondStudentUser;
  let secondStudentToken;

  beforeEach(async () => {
    await authStore.resetStore();
    await studentStore.resetSeedData();

    // 1. Admin account: Forma Administrator (admin@forma.edu)
    adminUser = await authStore.findByEmail('admin@forma.edu');
    adminToken = generateToken(adminUser);

    // 2. Student account 1: Alex Mercer (alex.mercer@forma.edu)
    studentUser = await authStore.findByEmail('alex.mercer@forma.edu');
    studentToken = generateToken(studentUser);

    // 3. Student account 2: Register a second distinct student user for cross-user tests
    secondStudentUser = await authStore.createUser({
      name: 'Second Student',
      email: 'student2@forma.edu',
      password: 'StrongP@ss2026!',
      role: 'Student',
    });
    secondStudentToken = generateToken(secondStudentUser);
  });

  afterAll(async () => {
    await stopServer();
  });

  // ========================================================
  // 1. RBAC: ADMIN-ONLY ENDPOINTS
  // ========================================================
  describe('1. Role-Based Access Control (authorizeRoles)', () => {
    it('1.1 should allow Admin to access GET /api/dashboard/admin-overview', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin-overview')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scope).toBe('administrative');
      expect(res.body.data.audit.requestedBy).toBe('admin@forma.edu');
    });

    it('1.2 should reject Student accessing GET /api/dashboard/admin-overview with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin-overview')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN_ROLE');
      expect(res.body.message).toContain('not authorized to access this resource');
    });

    it('1.3 should allow Admin to reset seed data via POST /api/students/reset-seed', async () => {
      const res = await request(app)
        .post('/api/students/reset-seed')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('seed data reset successfully');
    });

    it('1.4 should reject Student attempting POST /api/students/reset-seed with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/students/reset-seed')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN_ROLE');
    });
  });

  // ========================================================
  // 2. RESOURCE OWNERSHIP: LIST & DASHBOARD SCOPING
  // ========================================================
  describe('2. Query Scoping by User Role', () => {
    it('2.1 Admin should retrieve all student records across all owners', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(5); // All 5 seed students
    });

    it('2.2 Student should retrieve only student records created by their account', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Alex Mercer created STU-2026-001 and STU-2026-004 in seedData
      expect(res.body.total).toBe(2);
      res.body.data.forEach((student) => {
        const ownerId = student.createdBy._id ? student.createdBy._id.toString() : student.createdBy.toString();
        expect(ownerId).toBe(studentUser._id.toString());
      });
    });

    it('2.3 Newly registered student with zero records should receive empty array safely', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${secondStudentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('2.4 Dashboard analytics should scope metrics to personal records for Student', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.scope).toBe('personal');
      expect(res.body.data.totalStudents).toBe(2);
    });

    it('2.5 Dashboard analytics should present global metrics for Admin', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.scope).toBe('global');
      expect(res.body.data.totalStudents).toBe(5);
    });
  });

  // ========================================================
  // 3. RESOURCE OWNERSHIP: DIRECT RECORD ACCESS & MUTATION
  // ========================================================
  describe('3. Single-Record Ownership Protection (verifyResourceOwnership)', () => {
    // STU-2026-001 is owned by studentUser (Alex Mercer)
    // STU-2026-002 is owned by adminUser

    it('3.1 Student should successfully view their own student record', async () => {
      const res = await request(app)
        .get('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentId).toBe('STU-2026-001');
    });

    it('3.2 Student attempting to view another user\'s record should receive 403 Forbidden', async () => {
      // Alex Mercer attempts to view Sophia Chen (STU-2026-002, created by Admin)
      const res = await request(app)
        .get('/api/students/STU-2026-002')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN_RESOURCE');
      expect(res.body.message).toContain('You do not have permission');
    });

    it('3.3 Student should successfully update their own student record', async () => {
      const res = await request(app)
        .put('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({
          fullName: 'Alex Mercer (Updated)',
          course: 'Artificial Intelligence',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Alex Mercer (Updated)');
      expect(res.body.data.course).toBe('Artificial Intelligence');
    });

    it('3.4 Student attempting to update another user\'s record should receive 403 Forbidden', async () => {
      // Alex Mercer attempts to mutate STU-2026-002
      const res = await request(app)
        .put('/api/students/STU-2026-002')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({
          fullName: 'Malicious Update Attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN_RESOURCE');
    });

    it('3.5 Student attempting to delete another user\'s record should receive 403 Forbidden', async () => {
      // Alex Mercer attempts to delete STU-2026-002
      const res = await request(app)
        .delete('/api/students/STU-2026-002')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN_RESOURCE');
    });

    it('3.6 Student can delete their own student record', async () => {
      const res = await request(app)
        .delete('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion occurred
      const verifyRes = await request(app)
        .get('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(verifyRes.status).toBe(404);
    });

    it('3.7 Admin should be able to view, update, and delete any student record', async () => {
      // Admin views Alex Mercer's record
      const getRes = await request(app)
        .get('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(getRes.status).toBe(200);

      // Admin updates Alex Mercer's record
      const updateRes = await request(app)
        .put('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ registrationStatus: 'Graduated' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.registrationStatus).toBe('Graduated');

      // Admin deletes Sophia Chen's record
      const deleteRes = await request(app)
        .delete('/api/students/STU-2026-002')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(deleteRes.status).toBe(200);
    });

    it('3.8 Requests for non-existent student IDs should return 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/students/NON_EXISTENT_ID_999')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('STUDENT_NOT_FOUND');
    });
  });

  // ========================================================
  // 4. CREATION & IMMUTABILITY ENFORCEMENT
  // ========================================================
  describe('4. Ownership Immutability and Creation Security', () => {
    it('4.1 Server must assign createdBy from authenticated session and discard client-supplied createdBy', async () => {
      const spoofedPayload = {
        fullName: 'New Authed Student',
        email: 'authed.new@example.com',
        phone: '+1 (555) 234-5678',
        dateOfBirth: '2004-06-11',
        gender: 'Female',
        collegeName: 'Cognifyz Institute of Technology',
        course: 'Software Engineering',
        academicYear: '2nd Year',
        createdBy: '672e00000000000000000999', // Attacker attempts to spoof creator
      };

      const res = await request(app)
        .post('/api/students')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send(spoofedPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify createdBy equals authenticated user's ID, NOT the spoofed ID
      const createdOwnerId = res.body.data.createdBy.toString();
      expect(createdOwnerId).toBe(studentUser._id.toString());
      expect(createdOwnerId).not.toBe('672e00000000000000000999');
    });

    it('4.2 PUT update requests must not be able to mutate the createdBy ownership field', async () => {
      const res = await request(app)
        .put('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({
          fullName: 'Alex Mercer (Ownership Test)',
          createdBy: '672e00000000000000000999', // Attempt to reassign owner
        });

      expect(res.status).toBe(200);

      // Verify the owner remains Alex Mercer
      const getRes = await request(app)
        .get('/api/students/STU-2026-001')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      const actualOwner = getRes.body.data.createdBy._id
        ? getRes.body.data.createdBy._id.toString()
        : getRes.body.data.createdBy.toString();

      expect(actualOwner).toBe(studentUser._id.toString());
      expect(actualOwner).not.toBe('672e00000000000000000999');
    });
  });
});

