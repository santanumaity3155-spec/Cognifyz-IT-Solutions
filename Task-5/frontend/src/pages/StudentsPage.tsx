import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentFilterBar } from '../components/students/StudentFilterBar';
import { StudentTable } from '../components/students/StudentTable';
import { Pagination } from '../components/common/Pagination';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Button } from '../components/common/Button';
import { useStudents } from '../hooks/useStudents';
import { studentService } from '../services/studentService';
import { Student, StudentFilterOptions } from '../types/student';

export const StudentsPage: React.FC = () => {
  const [filters, setFilters] = useState<StudentFilterOptions>({
    search: '',
    course: 'All',
    academicYear: 'All',
    status: 'All',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { students, total, pagination, isLoading, error, refetch } = useStudents(filters);

  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFilterChange = (updates: Partial<StudentFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      course: 'All',
      academicYear: 'All',
      status: 'All',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      const idToDelete = studentToDelete.studentId || studentToDelete._id;
      const res = await studentService.deleteStudent(idToDelete);
      toast.success(res.message || `Student ${studentToDelete.fullName} deleted successfully`);
      setStudentToDelete(null);
      await refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete student record';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Students Directory</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time server-side student records management • {total} registered students
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={() => refetch()}
            title="Refresh from server"
          >
            Refresh
          </Button>

          <Link to="/students/new">
            <Button size="sm" icon={Plus}>
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <ErrorBanner
          message={error.message}
          onRetry={refetch}
          isRetrying={isLoading}
        />
      )}

      {/* Filter Bar */}
      <StudentFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Student Table & Pagination */}
      <div className="space-y-0">
        <StudentTable
          students={students}
          isLoading={isLoading}
          onDeleteClick={(student) => setStudentToDelete(student)}
        />

        <Pagination
          pagination={pagination}
          total={total}
          onPageChange={(newPage) => handleFilterChange({ page: newPage })}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(studentToDelete)}
        title="Delete Student Record"
        message={`Are you sure you want to permanently remove ${studentToDelete?.fullName} (${studentToDelete?.studentId}) from the system? This action cannot be undone.`}
        confirmLabel="Delete Record"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setStudentToDelete(null)}
      />
    </div>
  );
};
