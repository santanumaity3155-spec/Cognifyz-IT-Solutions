import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-200 overflow-hidden ${className}`}
    >
      {(title || headerAction) && (
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <div className="px-5 sm:px-6 py-3 bg-slate-50/80 border-t border-slate-100">{footer}</div>}
    </div>
  );
};

export default Card;
