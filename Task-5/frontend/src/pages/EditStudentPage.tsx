import React from 'react';
import { useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { StudentForm } from '../components/students/StudentForm';
import { StudentFormData } from '../types/student';

export const EditStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Sample record populated for Phase 6 edit demonstration
  const initialData: Partial<StudentFormData> = {
    fullName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 234-5678',
    dateOfBirth: '2003-04-12',
    gender: 'Male',
    collegeName: 'Cognifyz Institute of Technology',
    course: 'Computer Science',
    academicYear: '3rd Year',
    skills: ['React', 'Node.js', 'TypeScript', 'Tailwind CSS'],
    registrationStatus: 'Active',
  };

  const handleSubmit = (data: StudentFormData) => {
    alert(
      `Phase 6 UI demonstration: Student form updated for "${data.fullName}" (${id || 'STU-2026-001'}). In Phase 8, this dispatches a real PUT request to the Express backend.`
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Pencil className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Edit Student Profile</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Updating record for <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{id || 'STU-2026-001'}</span>
        </p>
      </div>

      <StudentForm initialData={initialData} onSubmit={handleSubmit} isEdit={true} />
    </div>
  );
};
