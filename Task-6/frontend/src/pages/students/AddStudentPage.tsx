import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import { StudentFormData } from '../../types/student';
import { StudentForm } from '../../components/students/StudentForm';

export const AddStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: StudentFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await studentService.createStudent(formData);
      if (res.success) {
        navigate('/students');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to register student record.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <Link
            to="/students"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Student Directory</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <UserPlus className="w-7 h-7 text-brand-400" />
            <span>Register New Student Record</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Create a student record under administrator authority.'
              : `Create a student record linked directly to your account (${user?.email}). Ownership will be securely bound by the server.`}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <StudentForm onSubmit={handleSubmit} isLoading={isLoading} isEdit={false} />
    </div>
  );
};

export default AddStudentPage;

