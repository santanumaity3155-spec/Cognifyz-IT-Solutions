import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Cpu,
  RotateCw,
  Terminal,
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

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            System Health & Infrastructure Diagnostics
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Node.js process status, memory heap allocation, and external service availability probes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunReadinessProbe}
            disabled={isProbing}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-indigo-600/30"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
            Run Readiness Probe
          </button>
        </div>
      </div>

      {readiness && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Readiness Probe Output:</span>
            <Badge variant={readiness.success ? 'success' : 'warning'} size="sm">
              {readiness.status || 'PROBE_CHECK'}
            </Badge>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
            {JSON.stringify(readiness, null, 2)}
          </pre>
        </div>
      )}

      {/* Process & System Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Server Status</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-2xl font-bold text-white">{health?.status || 'UP'}</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Uptime: <span className="text-indigo-400 font-semibold">{formatUptime(health?.uptimeSeconds || 0)}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Node.js Heap Memory</div>
          <div className="text-2xl font-bold text-emerald-400">
            {health?.memory.heapUsedMb ?? 0} MB
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Total Allocated: <span className="text-slate-300 font-semibold">{health?.memory.heapTotalMb ?? 0} MB</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Resident Set (RSS)</div>
          <div className="text-2xl font-bold text-indigo-400">
            {health?.memory.rssMb ?? 0} MB
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Node Version: <span className="text-slate-300 font-semibold">{health?.system.nodeVersion || 'v24'}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Host Platform</div>
          <div className="text-2xl font-bold text-white capitalize">
            {health?.system.platform || 'windows'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            CPUs: <span className="text-slate-300 font-semibold">{health?.system.cpuCount || 0} cores</span> &bull; Free RAM: {health?.system.freeMemMb || 0} MB
          </div>
        </div>
      </div>

      {/* Infrastructure Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Diagnostic Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">MongoDB Persistence Store</h3>
            </div>
            <Badge variant={health?.infrastructure.database.isConnected ? 'success' : 'warning'} size="sm">
              {health?.infrastructure.database.isConnected ? 'CONNECTED' : 'IN-MEMORY STORE'}
            </Badge>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Mode:</span>
              <span className="text-slate-200">{health?.infrastructure.database.mode}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Host:</span>
              <span className="text-slate-200">{health?.infrastructure.database.host || '127.0.0.1 (local)'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Database Name:</span>
              <span className="text-indigo-300">{health?.infrastructure.database.databaseName || 'forma_task8'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Persistence Guaranteed:</span>
              <span className={health?.infrastructure.database.isPersistent ? 'text-emerald-400' : 'text-amber-400'}>
                {health?.infrastructure.database.isPersistent ? 'YES (Disk/Atlas)' : 'NON-PERSISTENT (Fallback)'}
              </span>
            </div>
          </div>
        </div>

        {/* Redis Diagnostic Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Redis & Task Queue Engine</h3>
            </div>
            <Badge variant={health?.infrastructure.redis.isConnected ? 'success' : 'warning'} size="sm">
              {health?.infrastructure.redis.isConnected ? 'CONNECTED' : 'IN-MEMORY FALLBACK'}
            </Badge>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Engine Mode:</span>
              <span className="text-slate-200">{health?.infrastructure.redis.mode}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Configured Host:Port:</span>
              <span className="text-slate-200">{health?.infrastructure.redis.host}:{health?.infrastructure.redis.port}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Roundtrip Latency:</span>
              <span className="text-emerald-400">{health?.infrastructure.redis.latencyMs !== null ? `${health?.infrastructure.redis.latencyMs}ms` : 'N/A (Memory)'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950">
              <span className="text-slate-400">Diagnostic Note:</span>
              <span className="text-slate-300 truncate max-w-[240px]" title={health?.infrastructure.redis.error || 'Ready'}>
                {health?.infrastructure.redis.error || 'Operational'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Windows Local Infrastructure Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          Windows Infrastructure Setup Guide (Optional Local Services)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          The application automatically operates in documented development fallback mode if Redis or MongoDB is offline.
          To run native external Redis or MongoDB instances on Windows, run the following PowerShell commands:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="text-indigo-400 font-bold mb-2">Option A: Native Redis on Windows</div>
            <div className="text-slate-400 mb-1"># Install Redis via Windows Package Manager:</div>
            <div className="text-slate-200 select-all mb-2">winget install Redis.Redis</div>
            <div className="text-slate-400 mb-1"># Or install Memurai Developer (Redis 7 compatible):</div>
            <div className="text-slate-200 select-all mb-2">winget install Memurai.MemuraiDeveloper</div>
            <div className="text-slate-400 mb-1"># Verify listening port:</div>
            <div className="text-slate-200 select-all">Test-NetConnection -ComputerName 127.0.0.1 -Port 6379</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="text-indigo-400 font-bold mb-2">Option B: Docker Compose (All-In-One)</div>
            <div className="text-slate-400 mb-1"># From Task-8/ root directory:</div>
            <div className="text-slate-200 select-all mb-2">docker compose up -d</div>
            <div className="text-slate-400 mb-1"># Check running containers:</div>
            <div className="text-slate-200 select-all mb-2">docker ps</div>
            <div className="text-slate-400 mb-1"># To stop containers:</div>
            <div className="text-slate-200 select-all">docker compose down</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthPage;
