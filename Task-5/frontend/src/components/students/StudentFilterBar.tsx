import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, X } from 'lucide-react';
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
  // Local search input state for smooth real-time typing
  const [searchTerm, setSearchTerm] = useState(filters.search);

  // Sync internal state if external filters are reset
  useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  // Debounce search query by 300ms to optimize backend API throughput
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm, page: 1 });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, filters.search, onFilterChange]);

  const handleClearSearch = () => {
    setSearchTerm('');
    onFilterChange({ search: '', page: 1 });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Debounced Search Input with Clear Button */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, course, skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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
            type="button"
            onClick={onReset}
            title="Reset Filters"
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            aria-label="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
