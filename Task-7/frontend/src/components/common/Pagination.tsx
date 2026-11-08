import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.tsx';

interface PaginationProps {
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  perPage,
  hasNextPage,
  onPageChange,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white sm:px-6 rounded-b-xl ${className}`}
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Showing page <span className="font-semibold text-slate-900">{currentPage}</span> (
            <span className="font-medium text-slate-700">{perPage}</span> items per page)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">
            {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => onPageChange(currentPage + 1)}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

