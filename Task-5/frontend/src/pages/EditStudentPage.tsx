import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentForm } from '../components/students/StudentForm';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useStudent } from '../hooks/useStudent';
import { studentService } from '../services/studentService';
import { ApiError } from '../services/api';
import { StudentFormData } from '../types/student';

export const EditStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { student, isLoading: isFetching, error: fetchError, refetch } = useStudent(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (formData: StudentFormData) => {
    if (!id) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await studentService.updateStudent(id, formData);
      toast.success(
        response.message || `Student ${response.data.fullName} updated successfully!`
      );
      navigate(`/students/${id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        toast.error(err.message);
      } else {
        const fallbackMsg = 'Failed to update student record. Please try again.';
        setSubmitError(fallbackMsg);
        toast.error(fallbackMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-64" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="h-10 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          <div className="h-10 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          <div className="h-10 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (fetchError || !student) {
    return (
      <div className="max-w-4xl space-y-6">
        <ErrorBanner
          message={fetchError?.message || `Student with ID '${id}' was not found.`}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Pencil className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Edit Student Profile</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Modifying database record for <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{student.studentId}</span>
        </p>
      </div>

      {submitError && (
        <ErrorBanner
          message={submitError}
          onRetry={() => setSubmitError(null)}
        />
      )}

      <StudentForm
        initialData={student}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEdit={true}
      />
    </div>
  );
};
