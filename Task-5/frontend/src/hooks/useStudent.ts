import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';
import { ApiError } from '../services/api';
import { Student } from '../types/student';

interface UseStudentResult {
  student: Student | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage fetching and state for an individual student profile
 */
export const useStudent = (id?: string): UseStudentResult => {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<ApiError | null>(null);

  const fetchStudent = useCallback(async () => {
    if (!id) {
      setStudent(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getStudentById(id);
      setStudent(response.data);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('Failed to load student details');
      setError(apiErr);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  return {
    student,
    isLoading,
    error,
    refetch: fetchStudent,
  };
};

