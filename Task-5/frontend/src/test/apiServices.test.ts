import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { ApiError } from '../services/api';
import { studentService } from '../services/studentService';
import { dashboardService } from '../services/dashboardService';

describe('Phase 7: Axios Centralized API Service Layer Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Axios Instance Configuration
  it('should be configured with correct defaults and base URL', () => {
    expect(api.defaults.timeout).toBe(10000);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
    expect(api.defaults.baseURL).toBeDefined();
  });

  // 2. studentService.getAllStudents
  it('studentService.getAllStudents should dispatch GET /students with query parameters', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Students retrieved successfully',
        data: [{ studentId: 'STU-2026-001', fullName: 'Alex Rivera' }],
        total: 1,
        count: 1,
        pagination: { page: 1, limit: 10, totalPages: 1 },
      },
    };

    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce(mockResponse);

    const result = await studentService.getAllStudents({
      course: 'Computer Science',
      page: 1,
      limit: 10,
    });

    expect(getSpy).toHaveBeenCalledWith('/students', {
      params: { course: 'Computer Science', page: 1, limit: 10 },
    });
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].studentId).toBe('STU-2026-001');
  });

  // 3. studentService.getStudentById
  it('studentService.getStudentById should dispatch GET /students/:id', async () => {
    const mockStudent = {
      studentId: 'STU-2026-001',
      fullName: 'Alex Rivera',
      email: 'alex.rivera@example.com',
    };

    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, message: 'Student retrieved', data: mockStudent },
    });

    const result = await studentService.getStudentById('STU-2026-001');

    expect(getSpy).toHaveBeenCalledWith('/students/STU-2026-001');
    expect(result.data.fullName).toBe('Alex Rivera');
  });

  // 4. studentService.createStudent
  it('studentService.createStudent should dispatch POST /students with payload', async () => {
    const payload = {
      fullName: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      phone: '+1 (555) 777-8888',
      dateOfBirth: '2004-03-12',
      gender: 'Non-Binary' as const,
      collegeName: 'Cognifyz Institute of Technology',
      course: 'Computer Science',
      academicYear: '2nd Year' as const,
      skills: ['TypeScript', 'React'],
      registrationStatus: 'Active' as const,
    };

    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { success: true, message: 'Student created', data: { ...payload, studentId: 'STU-2026-011' } },
    });

    const result = await studentService.createStudent(payload);

    expect(postSpy).toHaveBeenCalledWith('/students', payload);
    expect(result.success).toBe(true);
    expect(result.data.fullName).toBe('Jordan Lee');
  });

  // 5. studentService.updateStudent
  it('studentService.updateStudent should dispatch PUT /students/:id with updates', async () => {
    const updates = { course: 'Data Science' };

    const putSpy = vi.spyOn(api, 'put').mockResolvedValueOnce({
      data: { success: true, message: 'Student updated', data: { studentId: 'STU-2026-001', ...updates } },
    });

    const result = await studentService.updateStudent('STU-2026-001', updates);

    expect(putSpy).toHaveBeenCalledWith('/students/STU-2026-001', updates);
    expect(result.success).toBe(true);
    expect(result.data.course).toBe('Data Science');
  });

  // 6. studentService.deleteStudent
  it('studentService.deleteStudent should dispatch DELETE /students/:id', async () => {
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValueOnce({
      data: { success: true, message: 'Student deleted', data: { studentId: 'STU-2026-001' } },
    });

    const result = await studentService.deleteStudent('STU-2026-001');

    expect(deleteSpy).toHaveBeenCalledWith('/students/STU-2026-001');
    expect(result.success).toBe(true);
  });

  // 7. dashboardService.getDashboardStats
  it('dashboardService.getDashboardStats should dispatch GET /dashboard/stats', async () => {
    const mockStats = {
      totalStudents: 10,
      activeStudents: 7,
      pendingStudents: 2,
      graduatedStudents: 1,
      suspendedStudents: 0,
      totalCourses: 5,
      courseDistribution: [],
      academicYearDistribution: [],
      recentStudents: [],
      storageMode: 'in-memory-fallback',
    };

    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, message: 'Stats retrieved', data: mockStats },
    });

    const result = await dashboardService.getDashboardStats();

    expect(getSpy).toHaveBeenCalledWith('/dashboard/stats');
    expect(result.data.totalStudents).toBe(10);
  });

  // 8. dashboardService.getHealthStatus
  it('dashboardService.getHealthStatus should dispatch GET /health', async () => {
    const mockHealth = {
      success: true,
      message: 'Forma API is healthy',
      service: 'Forma',
      version: '1.0.0',
      environment: 'development',
      uptime: '10s',
      timestamp: '2026-11-08T00:00:00.000Z',
      database: {
        mode: 'in-memory-fallback' as const,
        isConnected: false,
        databaseName: 'in-memory-store',
        statusMessage: 'In memory',
      },
    };

    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: mockHealth,
    });

    const result = await dashboardService.getHealthStatus();

    expect(getSpy).toHaveBeenCalledWith('/health');
    expect(result.success).toBe(true);
    expect(result.database.mode).toBe('in-memory-fallback');
  });

  // 9. Normalized Error Handling via ApiError
  it('ApiError should encapsulate status, error code, and validation errors', () => {
    const error = new ApiError(
      'Duplicate email error',
      409,
      'DUPLICATE_EMAIL',
      [{ field: 'email', message: 'Email taken' }],
      false
    );

    expect(error.message).toBe('Duplicate email error');
    expect(error.status).toBe(409);
    expect(error.code).toBe('DUPLICATE_EMAIL');
    expect(error.errors?.length).toBe(1);
    expect(error.isNetworkError).toBe(false);
  });
});

