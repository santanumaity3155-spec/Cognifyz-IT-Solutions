import React, { useState } from 'react';
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
  RotateCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useStudent } from '../hooks/useStudent';
import { studentService } from '../services/studentService';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { student, isLoading, error, refetch } = useStudent(id);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!student || !id) return;

    setIsDeleting(true);
    try {
      const targetId = student.studentId || student._id || id;
      const res = await studentService.deleteStudent(targetId);
      toast.success(res.message || `Student ${student.fullName} deleted successfully`);
      setIsDeleteModalOpen(false);
      navigate('/students');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete student record';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse w-36" />
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-48" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-28" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="h-20 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/students')}
        >
          Back to Students Directory
        </Button>

        <ErrorBanner
          message={error?.message || `Student with ID '${id}' was not found in the database.`}
          onRetry={refetch}
        />
      </div>
    );
  }

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
          Back to Students Directory
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            onClick={() => refetch()}
            title="Refresh record from server"
          >
            Refresh
          </Button>

          <Link to={`/students/${student.studentId || student._id}/edit`}>
            <Button size="sm" variant="secondary" icon={Pencil}>
              Edit Student
            </Button>
          </Link>

          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Student Profile Card */}
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
              Personal & Contact Information
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white">{student.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-mono">{student.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  Date of Birth: <span className="font-medium text-slate-900 dark:text-white">{student.dateOfBirth}</span> ({student.gender})
                </span>
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
            {student.skills && student.skills.length > 0 ? (
              student.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No skills specified</span>
            )}
          </div>
        </div>

        {/* Audit Timestamps */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Record Created: {new Date(student.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Modified: {new Date(student.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Student Record"
        message={`Are you sure you want to permanently remove ${student.fullName} (${student.studentId}) from the system? This action will delete the student in the Express backend.`}
        confirmLabel="Confirm Delete"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
