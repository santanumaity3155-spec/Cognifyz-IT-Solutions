import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { StudentFilterOptions } from '../../types/student';

interface StudentFilterBarProps {
  filters: StudentFilterOptions;
  onFilterChange: (newFilters: Partial<StudentFilterOptions>) => void;
  onReset: () => void;
}

const COURSES = [
  'All',
  'Computer Science',
  'Information Technology',
  'Data Science',
  'Electronics',
  'Mechanical',
];

const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

const STATUSES = ['All', 'Active', 'Pending', 'Suspended', 'Graduated'];

export const StudentFilterBar: React.FC<StudentFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, course, skill..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* Course Filter */}
        <div>
          <select
            value={filters.course}
            onChange={(e) => onFilterChange({ course: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="All">All Courses</option>
            {COURSES.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year Filter */}
        <div>
          <select
            value={filters.academicYear}
            onChange={(e) => onFilterChange({ academicYear: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="All">All Years</option>
            {YEARS.filter((y) => y !== 'All').map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Registration Status Filter & Reset */}
        <div className="flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          >
            <option value="All">All Statuses</option>
            {STATUSES.filter((s) => s !== 'All').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
