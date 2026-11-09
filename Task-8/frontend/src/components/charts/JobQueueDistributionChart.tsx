import React from 'react';
import type { QueueDiagnostics } from '../../types';

interface JobQueueDistributionChartProps {
  counts: QueueDiagnostics['counts'];
}

export const JobQueueDistributionChart: React.FC<JobQueueDistributionChartProps> = ({ counts }) => {
  const total = counts.total || 0;
  const completed = counts.completed || 0;
  const active = counts.active || 0;
  const waiting = counts.waiting || 0;
  const failed = counts.failed || 0;

  const pComp = total > 0 ? (completed / total) * 100 : 0;
  const pAct = total > 0 ? (active / total) * 100 : 0;
  const pWait = total > 0 ? (waiting / total) * 100 : 0;
  const pFail = total > 0 ? (failed / total) * 100 : 0;

  return (
    <div className="w-full bg-[#141F30]/70 border border-[#34435B]/50 rounded-2xl p-4">
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="font-bold text-slate-300 uppercase tracking-wider">Queue Lifecycle Distribution</span>
        <span className="text-slate-400 font-mono">Total: <strong className="text-white">{total}</strong></span>
      </div>

      {/* Progress strip */}
      <div className="w-full h-3 bg-[#1B2638] rounded-full overflow-hidden flex border border-[#34435B]/40 mb-3">
        {total === 0 ? (
          <div className="w-full h-full bg-[#34435B]/30" />
        ) : (
          <>
            {pComp > 0 && <div style={{ width: `${pComp}%` }} className="bg-[#65DDA5] h-full" title={`Completed: ${completed}`} />}
            {pAct > 0 && <div style={{ width: `${pAct}%` }} className="bg-[#F5B94C] h-full" title={`Active: ${active}`} />}
            {pWait > 0 && <div style={{ width: `${pWait}%` }} className="bg-[#5379F5] h-full" title={`Waiting: ${waiting}`} />}
            {pFail > 0 && <div style={{ width: `${pFail}%` }} className="bg-[#F16C80] h-full" title={`Failed: ${failed}`} />}
          </>
        )}
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-[#1D2A3D] p-2 rounded-xl border border-[#65DDA5]/20">
          <span className="text-[10px] text-[#65DDA5] uppercase font-bold block">Completed</span>
          <span className="text-white font-mono font-bold">{completed}</span>
        </div>
        <div className="bg-[#1D2A3D] p-2 rounded-xl border border-[#F5B94C]/20">
          <span className="text-[10px] text-[#F5B94C] uppercase font-bold block">Active</span>
          <span className="text-white font-mono font-bold">{active}</span>
        </div>
        <div className="bg-[#1D2A3D] p-2 rounded-xl border border-[#5379F5]/20">
          <span className="text-[10px] text-[#5379F5] uppercase font-bold block">Waiting</span>
          <span className="text-white font-mono font-bold">{waiting}</span>
        </div>
        <div className="bg-[#1D2A3D] p-2 rounded-xl border border-[#F16C80]/20">
          <span className="text-[10px] text-[#F16C80] uppercase font-bold block">Failed</span>
          <span className="text-white font-mono font-bold">{failed}</span>
        </div>
      </div>
    </div>
  );
};

export default JobQueueDistributionChart;

