import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message = 'Failed to load data from the server. Please verify backend connection.',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            API Communication Error
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          icon={RotateCw}
          className="border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100/50 shrink-0"
        >
          Retry Request
        </Button>
      )}
    </div>
  );
};

