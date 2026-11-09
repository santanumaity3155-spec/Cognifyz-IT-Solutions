import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
}) => {
  const variantStyles = {
    success: 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30',
    warning: 'bg-[#F5B94C]/10 text-[#F5B94C] border-[#F5B94C]/30',
    error: 'bg-[#F16C80]/10 text-[#F16C80] border-[#F16C80]/30',
    info: 'bg-[#5379F5]/10 text-[#7DA4F8] border-[#5379F5]/30',
    purple: 'bg-[#6257F5]/15 text-[#A99CFB] border-[#6257F5]/35',
    neutral: 'bg-[#223249]/70 text-slate-300 border-[#34435B]',
  }[variant];

  const dotColors = {
    success: 'bg-[#65DDA5]',
    warning: 'bg-[#F5B94C]',
    error: 'bg-[#F16C80]',
    info: 'bg-[#5379F5]',
    purple: 'bg-[#A99CFB]',
    neutral: 'bg-slate-400',
  }[variant];

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs',
  }[size];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors',
        sizeStyles,
        variantStyles,
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', dotColors)} />}
      {children}
    </span>
  );
};

export default Badge;
