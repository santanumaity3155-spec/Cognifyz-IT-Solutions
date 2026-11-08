import React from 'react';
import { RegistrationStatus } from '../../types/student';

interface BadgeProps {
  status?: RegistrationStatus | string;
  role?: 'Admin' | 'Student' | string;
  variant?: 'emerald' | 'amber' | 'rose' | 'purple' | 'blue' | 'slate';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  role,
  variant,
  size = 'md',
  children,
}) => {
  let colorStyles = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let dotColor = 'bg-slate-400';
  let label = children || status || role || '';

  if (status) {
    switch (status) {
      case 'Active':
        colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        dotColor = 'bg-emerald-400';
        break;
      case 'Pending':
        colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        dotColor = 'bg-amber-400';
        break;
      case 'Suspended':
        colorStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        dotColor = 'bg-rose-400';
        break;
      case 'Graduated':
        colorStyles = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        dotColor = 'bg-purple-400';
        break;
    }
  } else if (role) {
    switch (role) {
      case 'Admin':
        colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        dotColor = 'bg-amber-400';
        break;
      case 'Student':
        colorStyles = 'bg-brand-500/10 text-brand-400 border-brand-500/30';
        dotColor = 'bg-brand-400';
        break;
    }
  } else if (variant) {
    switch (variant) {
      case 'emerald':
        colorStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        dotColor = 'bg-emerald-400';
        break;
      case 'amber':
        colorStyles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        dotColor = 'bg-amber-400';
        break;
      case 'rose':
        colorStyles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        dotColor = 'bg-rose-400';
        break;
      case 'purple':
        colorStyles = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        dotColor = 'bg-purple-400';
        break;
      case 'blue':
        colorStyles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        dotColor = 'bg-blue-400';
        break;
      default:
        colorStyles = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        dotColor = 'bg-slate-400';
        break;
    }
  }

  const sizeStyles =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-semibold rounded-full border ${colorStyles} ${sizeStyles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};

export default Badge;

