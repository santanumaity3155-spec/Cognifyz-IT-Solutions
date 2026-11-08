import api from './api';
import { Student, StudentFormData, StudentFilterOptions, ApiResponse } from '../types/student';

/**
 * Service for communicating with authenticated Student endpoints in Task 6
 */
export const studentService = {
  /**
   * GET /api/students
   * Retrieve students list with optional search, filters, pagination, and sorting.
   * Backend scopes records automatically: Admin gets all, Student gets only owned records.
   */
  async getAllStudents(
    params?: Partial<StudentFilterOptions>
  ): Promise<ApiResponse<Student[]>> {
    const queryParams: Record<string, string | number> = {};

    if (params) {
      if (params.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params.course && params.course !== 'All') {
        queryParams.course = params.course;
      }
      if (params.academicYear && params.academicYear !== 'All') {
        queryParams.academicYear = params.academicYear;
      }
      if (params.status && params.status !== 'All') {
        queryParams.status = params.status;
      }
      if (params.page !== undefined) {
        queryParams.page = params.page;
      }
      if (params.limit !== undefined) {
        queryParams.limit = params.limit;
      }
      if (params.sortBy) {
        queryParams.sortBy = params.sortBy;
      }
      if (params.sortOrder) {
        queryParams.sortOrder = params.sortOrder;
      }
    }

    const response = await api.get<ApiResponse<Student[]>>('/students', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * GET /api/students/:id
   * Fetch single student by Mongo _id or studentId.
   * Backend verifies ownership: returns 403 if Student tries to view another user's record.
   */
  async getStudentById(id: string): Promise<ApiResponse<Student>> {
    const response = await api.get<ApiResponse<Student>>(`/students/${encodeURIComponent(id)}`);
    return response.data;
  },

  /**
   * POST /api/students
   * Create a new student record.
   * Backend automatically assigns createdBy = req.user.id.
   */
  async createStudent(data: StudentFormData): Promise<ApiResponse<Student>> {
    const response = await api.post<ApiResponse<Student>>('/students', data);
    return response.data;
  },

  /**
   * PUT /api/students/:id
   * Update an existing student record.
   * Backend verifies ownership: returns 403 if Student attempts to edit another user's record.
   */
  async updateStudent(
    id: string,
    data: Partial<StudentFormData>
  ): Promise<ApiResponse<Student>> {
    const response = await api.put<ApiResponse<Student>>(
      `/students/${encodeURIComponent(id)}`,
      data
    );
    return response.data;
  },

  /**
   * DELETE /api/students/:id
   * Remove a student record.
   * Backend verifies ownership: returns 403 if Student attempts to delete another user's record.
   */
  async deleteStudent(id: string): Promise<ApiResponse<Student>> {
    const response = await api.delete<ApiResponse<Student>>(
      `/students/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  /**
   * POST /api/students/reset-seed
   * Admin-only endpoint to reset sample student seed data.
   */
  async resetSeedData(): Promise<ApiResponse<{ count?: number }>> {
    const response = await api.post<ApiResponse<{ count?: number }>>('/students/reset-seed');
    return response.data;
  },
};

export default studentService;

