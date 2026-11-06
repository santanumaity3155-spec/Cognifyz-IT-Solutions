import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { studentStore } from '../services/studentStore.js';
import { getDatabaseStatus } from '../config/db.js';

describe('Phase 5: Exhaustive Independent RESTful API Test Suite', () => {
  // Reset store to fresh 10 seed students before each test to guarantee complete test isolation
  beforeEach(async () => {
    await studentStore.resetSeedData();
  });

  // Requirement 1: Verify GET /api/health
  describe('1. Health Check Endpoint (GET /api/health)', () => {
    it('should return 200 with service health, uptime, and database storage mode', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.service).toContain('Forma – Student Intelligence Platform');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.database).toHaveProperty('mode');
      expect(['mongodb', 'in-memory-fallback']).toContain(res.body.database.mode);
      expect(res.body.database).toHaveProperty('statusMessage');
    });
  });

  // Requirement 2: Verify GET /api/students
  describe('2. Retrieve Students (GET /api/students)', () => {
    it('should retrieve array of students with total count and pagination structure', async () => {
      const res = await request(app).get('/api/students');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Students retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBe(10);
      expect(res.body.count).toBe(10);
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      // Verify student data model contract
      const firstStudent = res.body.data[0];
      expect(firstStudent).toHaveProperty('_id');
      expect(firstStudent).toHaveProperty('studentId');
      expect(firstStudent).toHaveProperty('fullName');
      expect(firstStudent).toHaveProperty('email');
      expect(firstStudent).toHaveProperty('phone');
      expect(firstStudent).toHaveProperty('course');
      expect(firstStudent).toHaveProperty('academicYear');
      expect(firstStudent).toHaveProperty('registrationStatus');
      expect(firstStudent).toHaveProperty('createdAt');
      expect(firstStudent).toHaveProperty('updatedAt');
    });
  });

  // Requirements 3, 4, 5, 6: Sequential Lifecycle Test (POST -> GET -> PUT -> DELETE)
  describe('3-6. Full End-to-End CRUD Lifecycle Flow', () => {
    const newStudentData = {
      fullName: 'Natasha Romanova',
      email: 'natasha.r@example.com',
      phone: '+1 (555) 888-9999',
      dateOfBirth: '2003-11-22',
      gender: 'Female',
      collegeName: 'Cognifyz Institute of Technology',
      course: 'Computer Science',
      academicYear: '3rd Year',
      skills: ['Go', 'Kubernetes', 'TypeScript', 'gRPC'],
      registrationStatus: 'Active',
    };

    it('should complete the entire CRUD lifecycle from creation to deletion', async () => {
      // 3. POST /api/students
      const createRes = await request(app)
        .post('/api/students')
        .send(newStudentData);

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data).toHaveProperty('_id');
      expect(createRes.body.data).toHaveProperty('studentId');
      expect(createRes.body.data.fullName).toBe(newStudentData.fullName);
      expect(createRes.body.data.email).toBe(newStudentData.email);

      const createdId = createRes.body.data._id;
      const createdStudentId = createRes.body.data.studentId;

      // 4. GET /api/students/:id by custom studentId
      const getByIdRes = await request(app).get(`/api/students/${createdStudentId}`);
      expect(getByIdRes.status).toBe(200);
      expect(getByIdRes.body.success).toBe(true);
      expect(getByIdRes.body.data.email).toBe(newStudentData.email);

      // Also verify lookup by Mongo _id
      const getByMongoIdRes = await request(app).get(`/api/students/${createdId}`);
      expect(getByMongoIdRes.status).toBe(200);
      expect(getByMongoIdRes.body.data.studentId).toBe(createdStudentId);

      // 5. PUT /api/students/:id
      const updatePayload = {
        fullName: 'Natasha Romanova (Updated)',
        course: 'Information Technology',
        academicYear: '4th Year',
        registrationStatus: 'Graduated',
      };

      const putRes = await request(app)
        .put(`/api/students/${createdStudentId}`)
        .send(updatePayload);

      expect(putRes.status).toBe(200);
      expect(putRes.body.success).toBe(true);
      expect(putRes.body.data.fullName).toBe('Natasha Romanova (Updated)');
      expect(putRes.body.data.course).toBe('Information Technology');
      expect(putRes.body.data.academicYear).toBe('4th Year');
      expect(putRes.body.data.registrationStatus).toBe('Graduated');

      // 6. DELETE /api/students/:id
      const deleteRes = await request(app).delete(`/api/students/${createdStudentId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toContain('deleted');

      // Subsequent lookup MUST return 404
      const verifyRes = await request(app).get(`/api/students/${createdStudentId}`);
      expect(verifyRes.status).toBe(404);
      expect(verifyRes.body.error).toBe('STUDENT_NOT_FOUND');
    });
  });

  // Requirement 7: Test invalid request bodies
  describe('7. Request Body Validation Edge Cases (POST / PUT)', () => {
    it('should reject creation when fullName is missing or too short', async () => {
      const res = await request(app).post('/api/students').send({
        fullName: 'A',
        email: 'valid@example.com',
        phone: '1234567890',
        dateOfBirth: '2004-01-01',
        course: 'Computer Science',
        academicYear: '1st Year',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.errors.some((e) => e.field === 'fullName')).toBe(true);
    });

    it('should reject creation when email format is invalid', async () => {
      const res = await request(app).post('/api/students').send({
        fullName: 'Valid Name',
        email: 'not-an-email',
        phone: '1234567890',
        dateOfBirth: '2004-01-01',
        course: 'Computer Science',
        academicYear: '1st Year',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should reject creation when phone is too short (< 7 chars)', async () => {
      const res = await request(app).post('/api/students').send({
        fullName: 'Valid Name',
        email: 'valid@example.com',
        phone: '1234',
        dateOfBirth: '2004-01-01',
        course: 'Computer Science',
        academicYear: '1st Year',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'phone')).toBe(true);
    });

    it('should reject creation when academicYear is not in allowed enum', async () => {
      const res = await request(app).post('/api/students').send({
        fullName: 'Valid Name',
        email: 'valid@example.com',
        phone: '1234567890',
        dateOfBirth: '2004-01-01',
        course: 'Computer Science',
        academicYear: '10th Year', // Invalid
      });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'academicYear')).toBe(true);
    });

    it('should reject update when provided field is invalid', async () => {
      const res = await request(app).put('/api/students/STU-2026-001').send({
        email: 'not-valid-email',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // Requirement 8: Test duplicate email prevention
  describe('8. Duplicate Email Prevention (409 Conflict)', () => {
    it('should return 409 Conflict when creating a student with an existing email', async () => {
      // alex.rivera@example.com is used by STU-2026-001
      const res = await request(app).post('/api/students').send({
        fullName: 'Duplicate Alex',
        email: 'alex.rivera@example.com',
        phone: '1234567890',
        dateOfBirth: '2004-01-01',
        course: 'Computer Science',
        academicYear: '1st Year',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('DUPLICATE_EMAIL');
      expect(res.body.message).toContain('already exists');
    });

    it('should return 409 Conflict when updating a student email to another students email', async () => {
      // Trying to update STU-2026-001 to priya.sharma@example.com (used by STU-2026-002)
      const res = await request(app).put('/api/students/STU-2026-001').send({
        email: 'priya.sharma@example.com',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('DUPLICATE_EMAIL');
    });

    it('should permit updating other fields without email conflict when email is unchanged', async () => {
      const res = await request(app).put('/api/students/STU-2026-001').send({
        email: 'alex.rivera@example.com', // same email
        fullName: 'Alex Rivera Renamed',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Alex Rivera Renamed');
    });
  });

  // Requirements 9 & 10: Invalid and Nonexistent Student IDs
  describe('9-10. Invalid and Nonexistent Student IDs (404 Not Found)', () => {
    it('should return 404 for nonexistent ID on GET', async () => {
      const res = await request(app).get('/api/students/NONEXISTENT-ID-999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('STUDENT_NOT_FOUND');
    });

    it('should return 404 for nonexistent ID on PUT', async () => {
      const res = await request(app).put('/api/students/NONEXISTENT-ID-999').send({
        fullName: 'Ghost Student',
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('STUDENT_NOT_FOUND');
    });

    it('should return 404 for nonexistent ID on DELETE', async () => {
      const res = await request(app).delete('/api/students/NONEXISTENT-ID-999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('STUDENT_NOT_FOUND');
    });
  });

  // Requirement 11: Pagination, Search and Filters
  describe('11. Query Parameters: Search, Filter, Pagination & Sorting', () => {
    it('should filter by course accurately', async () => {
      const res = await request(app).get('/api/students?course=Data Science');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((s) => {
        expect(s.course).toBe('Data Science');
      });
    });

    it('should filter by academic year', async () => {
      const res = await request(app).get('/api/students?academicYear=4th Year');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((s) => {
        expect(s.academicYear).toBe('4th Year');
      });
    });

    it('should filter by registration status', async () => {
      const res = await request(app).get('/api/students?status=Pending');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((s) => {
        expect(s.registrationStatus).toBe('Pending');
      });
    });

    it('should return empty list when search yields zero matches without throwing an error', async () => {
      const res = await request(app).get('/api/students?search=NonexistentQueryXYZ123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
      expect(res.body.count).toBe(0);
    });

    it('should paginate correctly across pages', async () => {
      const page1 = await request(app).get('/api/students?page=1&limit=3');
      const page2 = await request(app).get('/api/students?page=2&limit=3');

      expect(page1.body.data.length).toBe(3);
      expect(page2.body.data.length).toBe(3);
      // Ensure records on page 1 and page 2 are different
      const page1Ids = page1.body.data.map((s) => s.studentId);
      const page2Ids = page2.body.data.map((s) => s.studentId);
      expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
    });

    it('should sort correctly by fullName asc and desc', async () => {
      const ascRes = await request(app).get('/api/students?sortBy=fullName&sortOrder=asc&limit=10');
      const descRes = await request(app).get('/api/students?sortBy=fullName&sortOrder=desc&limit=10');

      const namesAsc = ascRes.body.data.map((s) => s.fullName);
      const namesDesc = descRes.body.data.map((s) => s.fullName);

      expect(namesAsc[0] <= namesAsc[namesAsc.length - 1]).toBe(true);
      expect(namesDesc[0] >= namesDesc[namesDesc.length - 1]).toBe(true);
    });
  });

  // Requirement 12: Database & Fallback Mode Verification
  describe('12. Database Fallback Mode & Dashboard Aggregations', () => {
    it('should verify database status reports cleanly without crashing', () => {
      const status = getDatabaseStatus();
      expect(['mongodb', 'in-memory-fallback']).toContain(status.mode);
      expect(typeof status.isConnected).toBe('boolean');
    });

    it('should return accurate dashboard statistics via GET /api/dashboard/stats', async () => {
      const res = await request(app).get('/api/dashboard/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalStudents).toBe(10);
      expect(res.body.data.activeStudents).toBeGreaterThan(0);
      expect(res.body.data.pendingStudents).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.courseDistribution)).toBe(true);
      expect(Array.isArray(res.body.data.academicYearDistribution)).toBe(true);
      expect(Array.isArray(res.body.data.recentStudents)).toBe(true);
      expect(res.body.data.recentStudents.length).toBeLessThanOrEqual(5);
    });

    it('should support resetting the seed data via POST /api/students/reset-seed', async () => {
      // First delete a student
      await request(app).delete('/api/students/STU-2026-001');
      const countRes = await request(app).get('/api/students');
      expect(countRes.body.total).toBe(9);

      // Now reset seed data
      const resetRes = await request(app).post('/api/students/reset-seed');
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify total is restored to 10
      const restoredRes = await request(app).get('/api/students');
      expect(restoredRes.body.total).toBe(10);
    });
  });
});
