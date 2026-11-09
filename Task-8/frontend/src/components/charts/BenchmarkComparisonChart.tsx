import React from 'react';
import type { BenchmarkResult } from '../../types';

interface BenchmarkComparisonChartProps {
  benchmark: BenchmarkResult;
}

export const BenchmarkComparisonChart: React.FC<BenchmarkComparisonChartProps> = ({ benchmark }) => {
  const { measurements, comparison } = benchmark;
  const uncached = measurements.uncachedMs;
  const coldWrite = measurements.coldCacheWriteMs;
  const hotHit = measurements.avgCacheHitMs;

  const maxVal = Math.max(uncached, coldWrite, hotHit, 1);

  const getWidthPercent = (val: number) => {
    return Math.max(Math.round((val / maxVal) * 100), 2);
  };

  return (
    <div className="w-full bg-[#141F30]/80 border border-[#34435B]/50 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Latency Comparison (Direct vs Cached)
        </span>
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-[#65DDA5]/10 text-[#65DDA5] border border-[#65DDA5]/30">
          {comparison.speedupMultiplier} Faster
        </span>
      </div>

      <div className="space-y-3.5">
        {/* Uncached */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">1. Uncached Query (Cold Database)</span>
            <span className="text-[#F16C80] font-bold font-mono">{uncached} ms</span>
          </div>
          <div className="w-full h-3 bg-[#1B2638] rounded-full overflow-hidden border border-[#34435B]/40">
            <div
              className="h-full bg-gradient-to-r from-[#F16C80] to-[#F5B94C] rounded-full transition-all duration-500"
              style={{ width: `${getWidthPercent(uncached)}%` }}
            />
          </div>
        </div>

        {/* Cold Cache Write */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">2. Cold Cache Store (Serialization & Write)</span>
            <span className="text-[#F5B94C] font-bold font-mono">{coldWrite} ms</span>
          </div>
          <div className="w-full h-3 bg-[#1B2638] rounded-full overflow-hidden border border-[#34435B]/40">
            <div
              className="h-full bg-gradient-to-r from-[#F5B94C] to-[#5379F5] rounded-full transition-all duration-500"
              style={{ width: `${getWidthPercent(coldWrite)}%` }}
            />
          </div>
        </div>

        {/* Hot Cache Hit */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">3. Subsequent Cache Hit (In-Memory / Redis)</span>
            <span className="text-[#65DDA5] font-bold font-mono">{hotHit} ms</span>
          </div>
          <div className="w-full h-3 bg-[#1B2638] rounded-full overflow-hidden border border-[#34435B]/40">
            <div
              className="h-full bg-gradient-to-r from-[#6257F5] to-[#65DDA5] rounded-full transition-all duration-500 shadow-glow-green"
              style={{ width: `${getWidthPercent(hotHit)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkComparisonChart;

