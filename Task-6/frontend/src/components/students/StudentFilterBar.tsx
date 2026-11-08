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
  const [searchTerm, setSearchTerm] = useState(filters.search);

  useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, onFilterChange]);

  const handleClearSearch = () => {
    setSearchTerm('');
    onFilterChange({ search: '', page: 1 });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Debounced Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student ID, name, email, course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white placeholder-slate-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
            className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white transition"
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
            className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white transition"
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
            className="flex-1 px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white transition"
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
            className="p-2 text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
            aria-label="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentFilterBar;
