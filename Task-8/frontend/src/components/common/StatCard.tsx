import React from 'react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'green' | 'amber' | 'blue' | 'purple' | 'red' | 'slate';
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor = 'blue',
  trend,
  trendPositive = true,
}) => {
  const badgeClasses = {
    green: 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30',
    amber: 'bg-[#F5B94C]/10 text-[#F5B94C] border-[#F5B94C]/30',
    blue: 'bg-[#5379F5]/10 text-[#7DA4F8] border-[#5379F5]/30',
    purple: 'bg-[#6257F5]/15 text-[#A99CFB] border-[#6257F5]/35',
    red: 'bg-[#F16C80]/10 text-[#F16C80] border-[#F16C80]/30',
    slate: 'bg-[#223249] text-slate-300 border-[#34435B]',
  }[badgeColor];

  const iconBgClasses = {
    green: 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/20',
    amber: 'bg-[#F5B94C]/10 text-[#F5B94C] border-[#F5B94C]/20',
    blue: 'bg-[#5379F5]/10 text-[#5379F5] border-[#5379F5]/20',
    purple: 'bg-[#6257F5]/15 text-[#A99CFB] border-[#6257F5]/30',
    red: 'bg-[#F16C80]/10 text-[#F16C80] border-[#F16C80]/20',
    slate: 'bg-slate-800 text-slate-400 border-slate-700',
  }[badgeColor];

  return (
    <div className="group relative bg-[#1D2A3D] hover:bg-[#202E42] border border-[#34435B] rounded-2xl p-4 sm:p-5 shadow-card transition-all duration-200 hover:border-[#6257F5]/50 hover:shadow-glow-purple flex flex-col justify-between min-h-[155px]">
      {/* Top Header: Title & Icon */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 font-sans leading-snug">
            {title}
          </span>
          {icon && (
            <div
              className={clsx(
                'p-2 rounded-xl border flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105',
                iconBgClasses
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value + Badge */}
        <div className="flex items-baseline gap-2 flex-wrap mb-1">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            {value}
          </span>
          {badge && (
            <span
              className={clsx(
                'text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border font-semibold tracking-wide whitespace-nowrap',
                badgeClasses
              )}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Supporting Info: Subtitle & Trend */}
      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-[#34435B]/50 flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-400">
          {subtitle && (
            <span className="text-[11px] sm:text-xs font-medium text-slate-300 leading-tight">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={clsx(
                'font-semibold text-[11px] sm:text-xs ml-auto whitespace-nowrap',
                trendPositive ? 'text-[#65DDA5]' : 'text-[#F16C80]'
              )}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
