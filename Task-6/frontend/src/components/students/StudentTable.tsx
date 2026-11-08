import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2, GraduationCap, Phone, Mail, Calendar, BookOpen, User } from 'lucide-react';
import { Student } from '../../types/student';
import { Badge } from '../common/Badge';

interface StudentTableProps {
  students: Student[];
  isAdmin?: boolean;
  onDeleteClick?: (student: Student) => void;
  isLoading?: boolean;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  isAdmin = false,
  onDeleteClick,
  isLoading = false,
}) => {
  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
          <div className="h-6 bg-slate-800 rounded-lg animate-pulse w-48 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-12 bg-slate-950/60 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="md:hidden space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded w-24" />
                <div className="h-5 bg-slate-800 rounded-full w-16" />
              </div>
              <div className="h-5 bg-slate-800 rounded w-40" />
              <div className="h-4 bg-slate-800 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Zero State Placeholder
  if (students.length === 0) {
    return (
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-10 sm:p-14 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 mx-auto flex items-center justify-center border border-brand-500/20">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-base font-bold text-white">No Student Records Found</h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            {isAdmin
              ? 'No student records match your query across the database. Try clearing your filters or create a new student record.'
              : 'You have not created any student records yet, or none match the active filters. Create your student record to get started.'}
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/students/new"
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-indigo-600/30 transition focus:outline-none"
          >
            <span>Create Student Record</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Desktop & Tablet Table (>= 768px) */}
      <div className="hidden md:block bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Student Directory">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th scope="col" className="py-3.5 px-4 md:px-6">Student ID</th>
                <th scope="col" className="py-3.5 px-4">Name &amp; Contact</th>
                <th scope="col" className="py-3.5 px-4">Course</th>
                <th scope="col" className="py-3.5 px-4">Academic Year</th>
                <th scope="col" className="py-3.5 px-4">Status</th>
                {isAdmin && <th scope="col" className="py-3.5 px-4">Created By</th>}
                <th scope="col" className="py-3.5 px-4 md:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {students.map((student) => {
                const owner = typeof student.createdBy === 'object' ? student.createdBy : null;

                return (
                  <tr
                    key={student._id || student.studentId}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Student ID */}
                    <td className="py-3.5 px-4 md:px-6 font-mono font-semibold text-brand-400 whitespace-nowrap">
                      <Link
                        to={`/students/${student.studentId || student._id}`}
                        className="hover:underline focus:outline-none"
                      >
                        {student.studentId}
                      </Link>
                    </td>

                    {/* Name & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{student.fullName}</div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{student.email}</span>
                        </span>
                        <span className="hidden sm:inline text-slate-700">•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{student.phone}</span>
                        </span>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {student.course}
                    </td>

                    {/* Academic Year */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {student.academicYear}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge status={student.registrationStatus} size="sm" />
                    </td>

                    {/* Created By (Admin Only) */}
                    {isAdmin && (
                      <td className="py-3.5 px-4">
                        {owner ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[11px] font-semibold text-slate-300">
                              {owner.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {owner.role || 'User'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">System</span>
                        )}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-3.5 px-4 md:px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1 justify-end">
                        <Link
                          to={`/students/${student.studentId || student._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-500/10 transition"
                          title="View Details"
                          aria-label={`View details for ${student.fullName}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          to={`/students/${student.studentId || student._id}/edit`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition"
                          title="Edit Student"
                          aria-label={`Edit ${student.fullName}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => onDeleteClick && onDeleteClick(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Student"
                          aria-label={`Delete ${student.fullName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Responsive Card View (< 768px) */}
      <div className="md:hidden space-y-3" role="list" aria-label="Student Directory Cards">
        {students.map((student) => {
          const owner = typeof student.createdBy === 'object' ? student.createdBy : null;

          return (
            <div
              key={student._id || student.studentId}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-lg space-y-3"
              role="listitem"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-brand-400">
                  {student.studentId}
                </span>
                <Badge status={student.registrationStatus} size="sm" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{student.fullName}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{student.email}</span>
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{student.phone}</span>
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>{student.course}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{student.academicYear}</span>
                </div>
              </div>

              {isAdmin && owner && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <User className="w-3 h-3 text-amber-400" />
                  <span>Owner: <strong className="text-white">{owner.name}</strong></span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Link
                  to={`/students/${student.studentId || student._id}`}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Link>

                <Link
                  to={`/students/${student.studentId || student._id}/edit`}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>

                <button
                  type="button"
                  onClick={() => onDeleteClick && onDeleteClick(student)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTable;

