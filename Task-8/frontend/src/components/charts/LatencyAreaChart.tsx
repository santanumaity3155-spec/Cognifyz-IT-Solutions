import React, { useState } from 'react';
import type { RequestLogEntry } from '../../types';

interface LatencyAreaChartProps {
  requests: RequestLogEntry[];
  avgLatency?: number;
}

export const LatencyAreaChart: React.FC<LatencyAreaChartProps> = ({ requests, avgLatency }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!requests || requests.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-[#34435B] rounded-xl bg-[#172235]/40">
        <span>No telemetry requests logged yet</span>
        <span className="text-[11px] text-slate-600 mt-1">Make API requests to visualize live latency profile</span>
      </div>
    );
  }

  // Reverse so older is on left, latest is on right (chronological order)
  const chronological = [...requests].reverse().slice(-14);
  const durations = chronological.map((r) => r.durationMs);
  const maxVal = Math.max(...durations, 10);
  const minVal = Math.min(...durations);
  const height = 140;
  const width = 500;
  const paddingX = 20;
  const paddingY = 24;

  const points = chronological.map((req, i) => {
    const x = paddingX + (i / Math.max(chronological.length - 1, 1)) * (width - 2 * paddingX);
    const normalizedY = (req.durationMs / maxVal) * (height - 2 * paddingY);
    const y = height - paddingY - normalizedY;
    return { x, y, req };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  const hoveredItem = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full flex flex-col">
      {/* Top metrics bar */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Stream Window: <strong className="text-white font-mono">{chronological.length}</strong></span>
          <span className="text-slate-400">Max: <strong className="text-[#F16C80] font-mono">{maxVal.toFixed(1)}ms</strong></span>
          <span className="text-slate-400">Min: <strong className="text-[#65DDA5] font-mono">{minVal.toFixed(1)}ms</strong></span>
        </div>
        {avgLatency !== undefined && (
          <span className="text-xs text-slate-400">
            Avg: <span className="text-[#A99CFB] font-bold font-mono">{avgLatency}ms</span>
          </span>
        )}
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden bg-[#141F30]/60 rounded-xl border border-[#34435B]/50 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6257F5" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6257F5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5379F5" />
              <stop offset="50%" stopColor="#6257F5" />
              <stop offset="100%" stopColor="#A99CFB" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#34435B" strokeDasharray="3 3" strokeOpacity="0.4" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#34435B" strokeDasharray="3 3" strokeOpacity="0.4" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#34435B" strokeOpacity="0.7" />

          {/* Area under curve */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}

          {/* Smooth line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 5 : 3}
              fill={hoveredIdx === idx ? '#FFFFFF' : '#6257F5'}
              stroke="#1B2638"
              strokeWidth={hoveredIdx === idx ? 2 : 1.5}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredItem && (
          <div className="absolute top-2 right-2 bg-[#172235] border border-[#6257F5]/50 px-2.5 py-1.5 rounded-lg shadow-lg text-[11px] font-mono text-slate-200 z-10 animate-fadeIn pointer-events-none">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-[#65DDA5]">{hoveredItem.req.method}</span>
              <span className="truncate max-w-[120px] text-white">{hoveredItem.req.path}</span>
            </div>
            <div className="text-slate-400 mt-0.5">
              Duration: <span className="text-[#A99CFB] font-bold">{hoveredItem.req.durationMs}ms</span> &bull; Status: {hoveredItem.req.status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LatencyAreaChart;

