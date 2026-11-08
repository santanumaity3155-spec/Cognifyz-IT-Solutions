import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentForm } from '../components/students/StudentForm';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { studentService } from '../services/studentService';
import { ApiError } from '../services/api';
import { StudentFormData } from '../types/student';

export const AddStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (formData: StudentFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await studentService.createStudent(formData);
      toast.success(
        response.message || `Student ${response.data.fullName} registered successfully!`
      );
      // Navigate to student directory after successful creation
      navigate('/students');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        toast.error(err.message);
      } else {
        const fallbackMsg = 'Failed to create student record. Please try again.';
        setSubmitError(fallbackMsg);
        toast.error(fallbackMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <UserPlus className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Register New Student</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add a verified student record to the institution repository via the Express REST API
        </p>
      </div>

      {submitError && (
        <ErrorBanner
          message={submitError}
          onRetry={() => setSubmitError(null)}
        />
      )}

      <StudentForm
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEdit={false}
      />
    </div>
  );
};
