import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  GraduationCap 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import { Student, StudentFilterOptions, PaginationMeta } from '../../types/student';
import { StudentTable } from '../../components/students/StudentTable';
import { StudentFilterBar } from '../../components/students/StudentFilterBar';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmModal } from '../../components/common/ConfirmModal';

const DEFAULT_FILTERS: StudentFilterOptions = {
  search: '',
  course: 'All',
  academicYear: 'All',
  status: 'All',
  page: 1,
  limit: 8,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const StudentsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 8,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<StudentFilterOptions>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Delete modal state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset seed modal state (Admin only)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getAllStudents(filters);
      if (res.success) {
        setStudents(res.data);
        setTotalCount(res.total ?? res.data.length);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve students.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleFilterChange = (newFilters: Partial<StudentFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      const id = studentToDelete.studentId || studentToDelete._id;
      const res = await studentService.deleteStudent(id);
      if (res.success) {
        setFeedback(`Student ${studentToDelete.fullName} (${studentToDelete.studentId}) was deleted successfully.`);
        setStudentToDelete(null);
        await fetchStudents();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete student record.';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetSeedConfirm = async () => {
    setIsResetting(true);
    setError(null);
    try {
      const res = await studentService.resetSeedData();
      if (res.success) {
        setFeedback('Demo seed data has been successfully reset to original 10 records.');
        setIsResetModalOpen(false);
        setFilters(DEFAULT_FILTERS);
        await fetchStudents();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset seed data.';
      setError(message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-300 mb-1">
            <ShieldCheck className="w-3 h-3" />
            <span>
              {isAdmin
                ? 'System Administrator Scope: Full Access'
                : 'Student Scoped: Data Ownership Isolation Active'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <GraduationCap className="w-7 h-7 text-brand-400" />
            <span>{isAdmin ? 'System Student Directory' : 'My Student Directory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'View, search, edit, and manage all student intelligence records across all users.'
              : `Logged in as ${user?.name}. Viewing records created by your authenticated account.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Reset initial seed records"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Seed</span>
            </button>
          )}

          <Link
            to="/students/new"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-indigo-600/30 transition focus:outline-none"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-white text-xs font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-400 hover:text-white text-xs font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <StudentFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Student Table */}
      <StudentTable
        students={students}
        isAdmin={isAdmin}
        isLoading={loading}
        onDeleteClick={(student) => setStudentToDelete(student)}
      />

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalCount={totalCount}
        limit={pagination.limit}
        onPageChange={handlePageChange}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        title="Confirm Student Deletion"
        message={`Are you sure you want to permanently delete "${studentToDelete?.fullName}" (${studentToDelete?.studentId})? This action cannot be undone.`}
        confirmText="Delete Student"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* Reset Seed Modal (Admin Only) */}
      {isAdmin && (
        <ConfirmModal
          isOpen={isResetModalOpen}
          title="Reset Database Seed Records"
          message="This will reset the students collection to the initial 10 academic seed profiles. Any student records added during this session may be replaced."
          confirmText="Reset to Seed"
          cancelText="Cancel"
          isDanger={false}
          isLoading={isResetting}
          onConfirm={handleResetSeedConfirm}
          onCancel={() => setIsResetModalOpen(false)}
        />
      )}
    </div>
  );
};

export default StudentsPage;
