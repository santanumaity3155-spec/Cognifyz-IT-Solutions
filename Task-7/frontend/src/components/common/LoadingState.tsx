import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  type?: 'spinner' | 'skeleton' | 'card';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  type = 'spinner',
  className = '',
}) => {
  if (type === 'skeleton') {
    return (
      <div className={`space-y-4 animate-pulse ${className}`}>
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        <div className="h-24 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-6 animate-pulse ${className}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
          </div>
        </div>
        <div className="h-16 bg-slate-50 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-slate-500 ${className}`}>
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default LoadingState;

