import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2, GraduationCap, Phone, Mail, Calendar, BookOpen } from 'lucide-react';
import { Student } from '../../types/student';
import { Badge } from '../common/Badge';

interface StudentTableProps {
  students: Student[];
  onDeleteClick?: (student: Student) => void;
  isLoading?: boolean;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onDeleteClick,
  isLoading = false,
}) => {
  // Skeleton Loading Table / Cards
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-48 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-16" />
              </div>
              <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-40" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Zero State Placeholder
  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 sm:p-14 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-xs">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Students Found</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            No student records matched your search query or filter criteria. Try clearing filters or register a new student.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/students/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Add Student
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Desktop & Tablet Responsive Table View (>= 768px) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Students Directory">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-3.5 px-4 md:px-6">Student ID</th>
                <th scope="col" className="py-3.5 px-4">Name & Contact</th>
                <th scope="col" className="py-3.5 px-4">Course</th>
                <th scope="col" className="py-3.5 px-4">Academic Year</th>
                <th scope="col" className="py-3.5 px-4">Status</th>
                <th scope="col" className="py-3.5 px-4 md:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {students.map((student) => (
                <tr
                  key={student._id || student.studentId}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Student ID */}
                  <td className="py-3.5 px-4 md:px-6 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    <Link
                      to={`/students/${student.studentId || student._id}`}
                      className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                    >
                      {student.studentId}
                    </Link>
                  </td>

                  {/* Name, Email & Phone */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {student.fullName}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {student.email}
                      </span>
                      <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {student.phone}
                      </span>
                    </div>
                  </td>

                  {/* Course */}
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {student.course}
                  </td>

                  {/* Academic Year */}
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {student.academicYear}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <Badge status={student.registrationStatus} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 md:px-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <Link
                        to={`/students/${student.studentId || student._id}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        title="View Profile Details"
                        aria-label={`View details for ${student.fullName}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/students/${student.studentId || student._id}/edit`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:text-slate-400 dark:hover:text-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        title="Edit Record"
                        aria-label={`Edit ${student.fullName}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => onDeleteClick && onDeleteClick(student)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        title="Delete Record"
                        aria-label={`Delete ${student.fullName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Responsive Card List View (< 768px) */}
      <div className="md:hidden space-y-3" role="list" aria-label="Students Directory Cards">
        {students.map((student) => (
          <div
            key={student._id || student.studentId}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3"
            role="listitem"
          >
            {/* Header: Student ID + Status Badge */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {student.studentId}
              </span>
              <Badge status={student.registrationStatus} size="sm" />
            </div>

            {/* Name */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {student.fullName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{student.phone}</span>
              </p>
            </div>

            {/* Course & Year */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{student.course}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{student.academicYear}</span>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/students/${student.studentId || student._id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </Link>

              <Link
                to={`/students/${student.studentId || student._id}/edit`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 rounded-xl transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={() => onDeleteClick && onDeleteClick(student)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
