import React from 'react';
import { Code2, PieChart } from 'lucide-react';
import { LanguageBreakdownData, LanguageItem } from '../../types/index.ts';
import Card from '../common/Card.tsx';

export interface LanguageBreakdownProps {
  data: LanguageBreakdownData | null;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
}

// Curated map of common GitHub language brand colors with fallback palette
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Scala: '#c22d40',
  R: '#198CE7',
};

const FALLBACK_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export const getLanguageColor = (language: string, index: number = 0): string => {
  if (LANGUAGE_COLORS[language]) {
    return LANGUAGE_COLORS[language];
  }
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
};

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const LanguageBreakdown: React.FC<LanguageBreakdownProps> = ({
  data,
  title = 'Programming Language Breakdown',
  subtitle = 'Byte distribution across analyzed repositories',
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <Card title={title} subtitle={subtitle} className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 rounded-full w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const rawLanguages: LanguageItem[] = data?.languages || [];
  const rawTotalBytes: number = data?.totalBytes || 0;

  // Filter valid non-negative items
  const validLanguages = rawLanguages.filter(
    (item) => typeof item.bytes === 'number' && item.bytes > 0 && item.language
  );

  // Recalculate/verify total bytes safely to prevent division-by-zero
  const calculatedTotal =
    rawTotalBytes > 0
      ? rawTotalBytes
      : validLanguages.reduce((sum, item) => sum + (item.bytes || 0), 0);

  const hasData = validLanguages.length > 0 && calculatedTotal > 0;

  if (!hasData) {
    return (
      <Card title={title} subtitle={subtitle} className={className}>
        <div className="text-center py-8">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <PieChart className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-700">No Language Telemetry Available</p>
          <p className="text-xs text-slate-500 mt-1">
            Repositories may be empty or contain non-code assets only.
          </p>
        </div>
      </Card>
    );
  }

  // Ensure normalized percentages summing accurately without zero divisions
  const normalizedLanguages = validLanguages.map((item, idx) => {
    const computedPercentage =
      calculatedTotal > 0 ? Number(((item.bytes / calculatedTotal) * 100).toFixed(1)) : 0;
    return {
      ...item,
      percentage: item.percentage || computedPercentage,
      color: getLanguageColor(item.language, idx),
    };
  });

  return (
    <Card
      title={title}
      subtitle={subtitle}
      headerAction={
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          <Code2 className="w-3.5 h-3.5 text-slate-600" />
          <span>Total: {formatBytes(calculatedTotal)}</span>
        </div>
      }
      className={className}
    >
      <div className="space-y-6">
        {/* Horizontal Multi-Color Percentage Bar */}
        <div>
          <div
            className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200 shadow-inner"
            role="progressbar"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Language distribution bar"
          >
            {normalizedLanguages.map((item) => (
              <div
                key={item.language}
                style={{
                  width: `${Math.max(item.percentage, 1)}%`,
                  backgroundColor: item.color,
                }}
                className="h-full transition-all duration-300 relative group cursor-pointer"
                title={`${item.language}: ${item.percentage}% (${formatBytes(item.bytes)})`}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 text-right">
            Hover over segments to inspect language shares
          </p>
        </div>

        {/* Language Grid & Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {normalizedLanguages.map((item) => (
            <div
              key={item.language}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-semibold text-slate-800 truncate" title={item.language}>
                  {item.language}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-500">
                  {formatBytes(item.bytes)}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LanguageBreakdown;

