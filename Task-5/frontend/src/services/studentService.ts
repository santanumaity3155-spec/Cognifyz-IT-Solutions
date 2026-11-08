import api from './api';
import { Student, StudentFormData, StudentFilterOptions, ApiResponse } from '../types/student';

/**
 * Service for handling all Student CRUD communication with the Express backend
 */
export const studentService = {
  /**
   * GET /api/students
   * Retrieve students list with optional search, filters, pagination, and sorting
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
   * Fetch single student by Mongo _id or custom studentId
   */
  async getStudentById(id: string): Promise<ApiResponse<Student>> {
    const response = await api.get<ApiResponse<Student>>(`/students/${encodeURIComponent(id)}`);
    return response.data;
  },

  /**
   * POST /api/students
   * Register a new student record
   */
  async createStudent(data: StudentFormData): Promise<ApiResponse<Student>> {
    const response = await api.post<ApiResponse<Student>>('/students', data);
    return response.data;
  },

  /**
   * PUT /api/students/:id
   * Update an existing student record
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
   * Remove a student record from the system
   */
  async deleteStudent(id: string): Promise<ApiResponse<Student>> {
    const response = await api.delete<ApiResponse<Student>>(
      `/students/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  /**
   * POST /api/students/reset-seed
   * Reset data to the initial 10 seed students (for demo / testing reset)
   */
  async resetSeedData(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.post<ApiResponse<{ count: number }>>('/students/reset-seed');
    return response.data;
  },
};

