import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2, GraduationCap } from 'lucide-react';
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
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
        <div className="inline-block w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading student directory...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Students Found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or adding a new student to the platform.
          </p>
        </div>
        <Link
          to="/students/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
        >
          Add Student
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4 md:px-6">Student ID</th>
              <th className="py-3.5 px-4">Name & Email</th>
              <th className="py-3.5 px-4">Course</th>
              <th className="py-3.5 px-4">Academic Year</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 md:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
            {students.map((student) => (
              <tr
                key={student._id || student.studentId}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
              >
                {/* Student ID */}
                <td className="py-3.5 px-4 md:px-6 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {student.studentId}
                </td>

                {/* Name & Email */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {student.fullName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {student.email}
                  </div>
                </td>

                {/* Course */}
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
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
                <td className="py-3.5 px-4 md:px-6 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    {/* View Details */}
                    <Link
                      to={`/students/${student.studentId || student._id}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Edit Student */}
                    <Link
                      to={`/students/${student.studentId || student._id}/edit`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                      title="Edit Record"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>

                    {/* Delete Student */}
                    <button
                      onClick={() => onDeleteClick && onDeleteClick(student)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                      title="Delete Record"
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
  );
};
