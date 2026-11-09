import React from 'react';
import { Search, X, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';
import Button from '../common/Button.tsx';

export interface RepoFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  availableLanguages: string[];
  sortBy: 'updated' | 'stars' | 'forks' | 'name';
  onSortByChange: (sort: 'updated' | 'stars' | 'forks' | 'name') => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionToggle: () => void;
  onClearFilters: () => void;
  totalResults?: number;
  className?: string;
}

export const RepoFilterBar: React.FC<RepoFilterBarProps> = ({
  search,
  onSearchChange,
  language,
  onLanguageChange,
  availableLanguages,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionToggle,
  onClearFilters,
  totalResults,
  className = '',
}) => {
  const hasActiveFilters = Boolean(search || language || sortBy !== 'updated' || sortDirection !== 'desc');

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 ${className}`}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search repositories by name or topic..."
            aria-label="Search repositories"
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label="Filter by programming language"
              className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition cursor-pointer"
            >
              <option value="">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sortBy}
              onChange={(e) =>
                onSortByChange(e.target.value as 'updated' | 'stars' | 'forks' | 'name')
              }
              aria-label="Sort repositories by criteria"
              className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="stars">Most Stars</option>
              <option value="forks">Most Forks</option>
              <option value="name">Alphabetical (Name)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Direction Toggle */}
          <button
            onClick={onSortDirectionToggle}
            type="button"
            aria-label={`Sort order: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}. Click to toggle.`}
            title={`Order: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}`}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition flex items-center gap-1"
          >
            <span className="font-mono">{sortDirection === 'desc' ? 'DESC' : 'ASC'}</span>
            <span className="text-slate-400">{sortDirection === 'desc' ? '↓' : '↑'}</span>
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-slate-500 hover:text-slate-800"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Results Count & Filter Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span>
          {typeof totalResults === 'number'
            ? `Showing ${totalResults} ${totalResults === 1 ? 'repository' : 'repositories'}`
            : 'Repository Filter Active'}
        </span>
        {hasActiveFilters && (
          <span className="text-[11px] text-brand-600 font-medium">
            Filters applied
          </span>
        )}
      </div>
    </div>
  );
};

export default RepoFilterBar;

