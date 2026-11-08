import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { studentStore } from '../services/studentStore.js';

describe('Phase 11: Complete End-to-End Workflow Integration Test', () => {
  beforeEach(async () => {
    await studentStore.resetSeedData();
  });

  it('executes full 17-step lifecycle: create -> verify -> detail -> edit -> filter -> dashboard stats -> delete -> verify cleanup', async () => {
    // Step 1: Verify server & health endpoint
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.success).toBe(true);

    // Step 2 & 3: Initial student directory & dashboard stats before workflow
    const initialList = await request(app).get('/api/students');
    expect(initialList.status).toBe(200);
    const initialCount = initialList.body.total;

    const initialStats = await request(app).get('/api/dashboard/stats');
    expect(initialStats.status).toBe(200);
    expect(initialStats.body.data.totalStudents).toBe(initialCount);

    // Step 4 & 5: Create a new student (POST /api/students)
    const newStudentData = {
      fullName: 'Samantha Sterling',
      email: 'samantha.sterling@example.com',
      phone: '+1 (555) 789-0123',
      dateOfBirth: '2004-05-18',
      gender: 'Female',
      collegeName: 'Cognifyz Institute of Technology',
      course: 'Data Science',
      academicYear: '2nd Year',
      skills: ['Python', 'Pandas', 'PyTorch'],
      registrationStatus: 'Active',
    };

    const createRes = await request(app)
      .post('/api/students')
      .send(newStudentData);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toHaveProperty('_id');
    expect(createRes.body.data.studentId).toMatch(/^STU-\d{4}-\d{3,}$/);
    expect(createRes.body.data.fullName).toBe('Samantha Sterling');
    expect(createRes.body.data.email).toBe('samantha.sterling@example.com');

    const createdId = createRes.body.data._id;
    const studentCode = createRes.body.data.studentId;

    // Step 6 & 7: Verify new student appears in listing & persists (simulating page reload)
    const updatedList = await request(app).get('/api/students');
    expect(updatedList.status).toBe(200);
    expect(updatedList.body.total).toBe(initialCount + 1);
    const foundInList = updatedList.body.data.find((s) => s._id === createdId);
    expect(foundInList).toBeDefined();
    expect(foundInList.fullName).toBe('Samantha Sterling');

    // Step 8 & 9: Open student details page (GET /api/students/:id)
    const detailRes = await request(app).get(`/api/students/${createdId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.studentId).toBe(studentCode);
    expect(detailRes.body.data.course).toBe('Data Science');

    // Step 10 & 11: Edit student's information (PUT /api/students/:id)
    const updatePayload = {
      skills: ['Python', 'Pandas', 'PyTorch', 'TensorFlow', 'FastAPI'],
      academicYear: '3rd Year',
    };

    const putRes = await request(app)
      .put(`/api/students/${createdId}`)
      .send(updatePayload);

    expect(putRes.status).toBe(200);
    expect(putRes.body.success).toBe(true);
    expect(putRes.body.data.academicYear).toBe('3rd Year');
    expect(putRes.body.data.skills).toContain('FastAPI');

    // Verify GET /api/students/:id reflects updated info
    const verifyUpdate = await request(app).get(`/api/students/${createdId}`);
    expect(verifyUpdate.body.data.skills).toContain('FastAPI');
    expect(verifyUpdate.body.data.academicYear).toBe('3rd Year');

    // Step 12: Search for the student by name and email
    const searchRes = await request(app).get('/api/students?search=Samantha');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.some((s) => s.email === 'samantha.sterling@example.com')).toBe(true);

    // Step 13: Apply course, academicYear, and status filters
    const filterRes = await request(app).get(
      '/api/students?course=Data+Science&academicYear=3rd+Year&status=Active'
    );
    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.some((s) => s._id === createdId)).toBe(true);

    // Step 14: Verify dashboard statistics reflect the new student
    const statsAfterCreate = await request(app).get('/api/dashboard/stats');
    expect(statsAfterCreate.status).toBe(200);
    expect(statsAfterCreate.body.data.totalStudents).toBe(initialCount + 1);
    const dsCourse = statsAfterCreate.body.data.courseDistribution.find(
      (c) => c.course === 'Data Science'
    );
    expect(dsCourse).toBeDefined();
    expect(dsCourse.count).toBeGreaterThanOrEqual(1);

    // Step 15 & 16: Delete the student (DELETE /api/students/:id)
    const deleteRes = await request(app).delete(`/api/students/${createdId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // Verify student is gone (GET returns 404)
    const getDeleted = await request(app).get(`/api/students/${createdId}`);
    expect(getDeleted.status).toBe(404);

    // Verify list count returned to initialCount
    const listAfterDelete = await request(app).get('/api/students');
    expect(listAfterDelete.body.total).toBe(initialCount);
    expect(listAfterDelete.body.data.some((s) => s._id === createdId)).toBe(false);

    // Step 17: Verify dashboard statistics update after deletion
    const statsAfterDelete = await request(app).get('/api/dashboard/stats');
    expect(statsAfterDelete.status).toBe(200);
    expect(statsAfterDelete.body.data.totalStudents).toBe(initialCount);
  });
});
