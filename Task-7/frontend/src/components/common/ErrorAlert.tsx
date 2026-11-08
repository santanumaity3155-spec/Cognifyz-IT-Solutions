import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import Button from './Button.tsx';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 shadow-sm ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm text-rose-900">{title}</h4>
            <p className="mt-1 text-xs text-rose-700 leading-relaxed">{message}</p>
            {onRetry && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={onRetry}
                  className="bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                >
                  Retry Request
                </Button>
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-rose-400 hover:text-rose-600 p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
