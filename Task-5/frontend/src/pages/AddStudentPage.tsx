import React from 'react';
import { UserPlus } from 'lucide-react';
import { StudentForm } from '../components/students/StudentForm';
import { StudentFormData } from '../types/student';

export const AddStudentPage: React.FC = () => {
  const handleSubmit = (data: StudentFormData) => {
    alert(
      `Phase 6 UI demonstration: Student form submitted for "${data.fullName}" (${data.email}). In Phase 8, this dispatches a real POST request to the Express backend.`
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <UserPlus className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Register New Student</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete the form below to register a new student record into the platform
        </p>
      </div>

      <StudentForm onSubmit={handleSubmit} isEdit={false} />
    </div>
  );
};
