import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalCount,
  limit,
  onPageChange,
}) => {
  if (totalPages <= 1 && totalCount <= limit) return null;

  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs text-slate-400">
      <div>
        Showing <span className="font-semibold text-white">{startItem}</span> to{' '}
        <span className="font-semibold text-white">{endItem}</span> of{' '}
        <span className="font-semibold text-white">{totalCount}</span> records
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-brand-300 font-semibold font-mono text-xs">
          {page} / {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-white transition"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

