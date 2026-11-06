import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Demonstration preview record for Phase 6 UI layout
  const student = {
    _id: '672b1001a1b2c3d4e5f60001',
    studentId: id || 'STU-2026-001',
    fullName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 234-5678',
    dateOfBirth: '2003-04-12',
    gender: 'Male',
    collegeName: 'Cognifyz Institute of Technology',
    course: 'Computer Science',
    academicYear: '3rd Year',
    skills: ['React', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Docker', 'GraphQL'],
    registrationStatus: 'Active',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/students')}
        >
          Back to Students
        </Button>

        <div className="flex items-center gap-2">
          <Link to={`/students/${student.studentId}/edit`}>
            <Button size="sm" variant="secondary" icon={Pencil}>
              Edit Student
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={() => {
              alert(`Phase 6 UI demonstration: Delete button clicked for ${student.studentId}. Live DELETE API connects in Phase 8.`);
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Student Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200 dark:shadow-none">
              {student.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {student.fullName}
                </h1>
                <Badge status={student.registrationStatus} />
              </div>
              <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                {student.studentId}
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact & Personal */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Personal & Contact Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white">{student.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Date of Birth: {student.dateOfBirth} ({student.gender})</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Academic Information
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{student.course}</span>
                  <span className="text-xs text-slate-400 ml-2">({student.academicYear})</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Building className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{student.collegeName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Technical Skills & Competencies</span>
          </h3>

          <div className="flex flex-wrap gap-2 pt-1">
            {student.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Audit Timestamps */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Registered: {new Date(student.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Updated: {new Date(student.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

