import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';
import { ApiError } from '../services/api';
import { Student, StudentFilterOptions, PaginationMeta } from '../types/student';

interface UseStudentsResult {
  students: Student[];
  total: number;
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage fetching and state for students directory with query filters
 */
export const useStudents = (filters?: Partial<StudentFilterOptions>): UseStudentsResult => {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getAllStudents(filters);
      setStudents(response.data || []);
      setTotal(response.total ?? response.data.length);
      setPagination(response.pagination || null);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('Failed to load students');
      setError(apiErr);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters?.search,
    filters?.course,
    filters?.academicYear,
    filters?.status,
    filters?.page,
    filters?.limit,
    filters?.sortBy,
    filters?.sortOrder,
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    total,
    pagination,
    isLoading,
    error,
    refetch: fetchStudents,
  };
};

