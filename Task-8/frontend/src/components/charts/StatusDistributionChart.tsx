import React from 'react';

interface StatusDistributionChartProps {
  statusCounts: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ statusCounts }) => {
  const c2 = statusCounts['2xx'] || 0;
  const c3 = statusCounts['3xx'] || 0;
  const c4 = statusCounts['4xx'] || 0;
  const c5 = statusCounts['5xx'] || 0;
  const total = c2 + c3 + c4 + c5;

  const p2 = total > 0 ? (c2 / total) * 100 : 0;
  const p3 = total > 0 ? (c3 / total) * 100 : 0;
  const p4 = total > 0 ? (c4 / total) * 100 : 0;
  const p5 = total > 0 ? (c5 / total) * 100 : 0;

  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Visual Multi-segment bar */}
      <div className="w-full h-3 bg-[#141F30] rounded-full overflow-hidden flex border border-[#34435B]/40">
        {total === 0 ? (
          <div className="w-full h-full bg-[#34435B]/40" />
        ) : (
          <>
            {p2 > 0 && (
              <div
                style={{ width: `${p2}%` }}
                className="bg-[#65DDA5] h-full transition-all duration-300"
                title={`2xx Success: ${c2} (${p2.toFixed(1)}%)`}
              />
            )}
            {p3 > 0 && (
              <div
                style={{ width: `${p3}%` }}
                className="bg-[#5379F5] h-full transition-all duration-300"
                title={`3xx Redirects: ${c3} (${p3.toFixed(1)}%)`}
              />
            )}
            {p4 > 0 && (
              <div
                style={{ width: `${p4}%` }}
                className="bg-[#F5B94C] h-full transition-all duration-300"
                title={`4xx Client Error: ${c4} (${p4.toFixed(1)}%)`}
              />
            )}
            {p5 > 0 && (
              <div
                style={{ width: `${p5}%` }}
                className="bg-[#F16C80] h-full transition-all duration-300"
                title={`5xx Server Error: ${c5} (${p5.toFixed(1)}%)`}
              />
            )}
          </>
        )}
      </div>

      {/* Breakdown Pills */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="bg-[#141F30] border border-[#65DDA5]/20 rounded-xl p-2 text-center">
          <div className="text-[10px] uppercase font-bold text-[#65DDA5]">2xx OK</div>
          <div className="font-mono font-bold text-white mt-0.5">{c2}</div>
          <div className="text-[10px] text-slate-400 font-mono">{p2.toFixed(0)}%</div>
        </div>

        <div className="bg-[#141F30] border border-[#5379F5]/20 rounded-xl p-2 text-center">
          <div className="text-[10px] uppercase font-bold text-[#5379F5]">3xx Redir</div>
          <div className="font-mono font-bold text-white mt-0.5">{c3}</div>
          <div className="text-[10px] text-slate-400 font-mono">{p3.toFixed(0)}%</div>
        </div>

        <div className="bg-[#141F30] border border-[#F5B94C]/20 rounded-xl p-2 text-center">
          <div className="text-[10px] uppercase font-bold text-[#F5B94C]">4xx Client</div>
          <div className="font-mono font-bold text-white mt-0.5">{c4}</div>
          <div className="text-[10px] text-slate-400 font-mono">{p4.toFixed(0)}%</div>
        </div>

        <div className="bg-[#141F30] border border-[#F16C80]/20 rounded-xl p-2 text-center">
          <div className="text-[10px] uppercase font-bold text-[#F16C80]">5xx Server</div>
          <div className="font-mono font-bold text-white mt-0.5">{c5}</div>
          <div className="text-[10px] text-slate-400 font-mono">{p5.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
};

export default StatusDistributionChart;

