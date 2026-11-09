import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Cpu,
  RotateCw,
  Terminal,
  Zap,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { fetchHealth, fetchReadiness } from '../services/api';
import type { SystemHealth } from '../types';

export const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [isProbing, setIsProbing] = useState(false);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to load health:', err);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRunReadinessProbe = async () => {
    setIsProbing(true);
    try {
      const res = await fetchReadiness();
      setReadiness(res);
      await loadHealth();
    } catch (err: any) {
      setReadiness({ error: err.message || 'Probe failed' });
    } finally {
      setIsProbing(false);
    }
  };

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const isRedisLive = health?.infrastructure.redis.isConnected;
  const isMongoLive = health?.infrastructure.database.isConnected;

  const heapUsed = health?.memory.heapUsedMb ?? 0;
  const heapTotal = health?.memory.heapTotalMb ?? 1;
  const heapPercent = Math.min(Math.round((heapUsed / heapTotal) * 100), 100);

  return (
    <div className="space-y-6 min-w-0 max-w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#6257F5]" />
            System Health & Infrastructure Diagnostics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Node.js process status, memory heap allocation, and external service availability probes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunReadinessProbe}
            disabled={isProbing}
            className="px-4 py-2.5 rounded-xl bg-[#6257F5] hover:bg-[#5346EE] text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-[#6257F5]/30 active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
            Run Readiness Probe
          </button>
        </div>
      </div>

      {readiness && (
        <div className="p-5 bg-[#1D2A3D] border border-[#34435B] rounded-2xl shadow-card animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#65DDA5]" />
              Readiness Probe Output:
            </span>
            <Badge variant={readiness.success ? 'success' : 'warning'} size="sm" dot>
              {readiness.status || 'PROBE_CHECK'}
            </Badge>
          </div>
          <pre className="p-3.5 bg-[#141F30] rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-[#34435B]">
            {JSON.stringify(readiness, null, 2)}
          </pre>
        </div>
      )}

      {/* Process & System Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Status */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Server Status</div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#65DDA5] shadow-glow-green animate-pulse" />
              <span className="text-3xl font-extrabold text-white">{health?.status || 'UP'}</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4 pt-3 border-t border-[#34435B]/40 flex items-center justify-between">
            <span>Uptime:</span>
            <span className="text-[#A99CFB] font-bold font-mono">{formatUptime(health?.uptimeSeconds || 0)}</span>
          </div>
        </div>

        {/* Node.js Heap Memory */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Node.js Heap Memory</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#65DDA5] font-mono">{heapUsed} MB</span>
              <span className="text-xs text-slate-400">/ {heapTotal} MB</span>
            </div>
            {/* Memory progress bar */}
            <div className="w-full bg-[#141F30] h-2 rounded-full overflow-hidden mt-3 border border-[#34435B]/40">
              <div
                className="bg-gradient-to-r from-[#6257F5] to-[#65DDA5] h-full transition-all duration-300"
                style={{ width: `${heapPercent}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-[#34435B]/40 flex items-center justify-between">
            <span>Allocation:</span>
            <span className="text-slate-200 font-mono font-bold">{heapPercent}% used</span>
          </div>
        </div>

        {/* Resident Set (RSS) */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Resident Set (RSS)</div>
            <div className="text-3xl font-extrabold text-[#5379F5] font-mono">
              {health?.memory.rssMb ?? 0} MB
            </div>
            <div className="text-xs text-slate-400 mt-2">
              External Buffers: <span className="text-slate-300 font-mono">{health?.memory.externalMb ?? 0} MB</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-[#34435B]/40 flex items-center justify-between">
            <span>Runtime:</span>
            <span className="text-slate-200 font-mono font-semibold">{health?.system.nodeVersion || 'v20+'}</span>
          </div>
        </div>

        {/* Host Platform */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Host Platform</div>
            <div className="text-3xl font-extrabold text-white capitalize font-sans">
              {health?.system.platform || 'windows'}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Free RAM: <span className="text-slate-300 font-mono font-semibold">{health?.system.freeMemMb || 0} MB</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-[#34435B]/40 flex items-center justify-between">
            <span>CPU Cores:</span>
            <span className="text-[#65DDA5] font-mono font-bold">{health?.system.cpuCount || 0} cores</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Diagnostic Card */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#34435B]/60">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#5379F5]" />
              <h3 className="text-sm font-bold text-white">MongoDB Persistence Store</h3>
            </div>
            <Badge variant={isMongoLive ? 'success' : 'warning'} size="sm" dot>
              {isMongoLive ? 'CONNECTED' : 'IN-MEMORY STORE'}
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Mode:</span>
              <span className="text-slate-200 font-semibold">{health?.infrastructure.database.mode}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Host:</span>
              <span className="text-slate-200 font-semibold">{health?.infrastructure.database.host || '127.0.0.1 (local)'}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Database Name:</span>
              <span className="text-[#A99CFB] font-bold">{health?.infrastructure.database.databaseName || 'forma_task8'}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Persistence Guaranteed:</span>
              <span className={health?.infrastructure.database.isPersistent ? 'text-[#65DDA5] font-bold' : 'text-[#F5B94C] font-bold'}>
                {health?.infrastructure.database.isPersistent ? 'YES (Disk/Atlas)' : 'NON-PERSISTENT (Fallback)'}
              </span>
            </div>
          </div>
        </div>

        {/* Redis Diagnostic Card */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#34435B]/60">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-[#6257F5]" />
              <h3 className="text-sm font-bold text-white">Redis & Task Queue Engine</h3>
            </div>
            <Badge variant={isRedisLive ? 'success' : 'warning'} size="sm" dot>
              {isRedisLive ? 'CONNECTED' : 'IN-MEMORY FALLBACK'}
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Engine Mode:</span>
              <span className="text-slate-200 font-semibold">{health?.infrastructure.redis.mode}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Configured Host:Port:</span>
              <span className="text-slate-200 font-semibold">{health?.infrastructure.redis.host}:{health?.infrastructure.redis.port}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Roundtrip Latency:</span>
              <span className="text-[#65DDA5] font-bold">
                {health?.infrastructure.redis.latencyMs !== null ? `${health?.infrastructure.redis.latencyMs}ms` : 'N/A (Memory)'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#141F30] border border-[#34435B]/40">
              <span className="text-slate-400">Diagnostic Note:</span>
              <span className="text-slate-300 truncate max-w-[240px]" title={health?.infrastructure.redis.error || 'Ready'}>
                {health?.infrastructure.redis.error || 'Operational'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Windows Local Infrastructure Guide */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-6 shadow-card">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#6257F5]" />
          Windows Infrastructure Setup Guide (Optional Local Services)
        </h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          The application automatically operates in documented development fallback mode if Redis or MongoDB is offline.
          To run native external Redis or MongoDB instances on Windows, execute the following commands in PowerShell:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#141F30] p-4 rounded-xl border border-[#34435B] text-xs font-mono">
            <div className="text-[#A99CFB] font-bold mb-2">Option A: Native Redis on Windows</div>
            <div className="text-slate-400 mb-1"># Install Redis via Windows Package Manager:</div>
            <div className="text-slate-200 select-all mb-2 bg-[#1D2A3D] p-2 rounded border border-[#34435B]/50">
              winget install Redis.Redis
            </div>
            <div className="text-slate-400 mb-1"># Or install Memurai Developer (Redis 7 compatible):</div>
            <div className="text-slate-200 select-all mb-2 bg-[#1D2A3D] p-2 rounded border border-[#34435B]/50">
              winget install Memurai.MemuraiDeveloper
            </div>
            <div className="text-slate-400 mb-1"># Verify listening port:</div>
            <div className="text-slate-200 select-all bg-[#1D2A3D] p-2 rounded border border-[#34435B]/50">
              Test-NetConnection -ComputerName 127.0.0.1 -Port 6379
            </div>
          </div>

          <div className="bg-[#141F30] p-4 rounded-xl border border-[#34435B] text-xs font-mono">
            <div className="text-[#5379F5] font-bold mb-2">Option B: Docker Compose (All-In-One)</div>
            <div className="text-slate-400 mb-1"># From Task-8/ root directory:</div>
            <div className="text-slate-200 select-all mb-2 bg-[#1D2A3D] p-2 rounded border border-[#34435B]/50">
              docker compose up -d
            </div>
            <div className="text-slate-400 mb-1"># Check running containers:</div>
            <div className="text-slate-200 select-all mb-2 bg-[#1D2A3D] p-2 rounded border border-[#34435B]/50">
              docker ps
            </div>
            <div className="text-slate-400 mb-1"># To stop containers:</div>
            <div className="text-slate-200 select-all bg-[#1D2A3D] p-2 rounded border border-[#34435B]/50">
              docker compose down
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthPage;
