import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Trash2,
  TrendingUp,
  Flame,
  CheckCircle2,
  RotateCw,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import BenchmarkComparisonChart from '../components/charts/BenchmarkComparisonChart';
import {
  fetchCacheStats,
  purgeCache,
  deleteCacheKey,
  fetchDemoStats,
  fetchHeavyAnalytics,
  executeBenchmark,
} from '../services/api';
import type { CacheStats, BenchmarkResult } from '../types';

export const CachePage: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [purgePattern, setPurgePattern] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Demo Route States
  const [demoStatsResult, setDemoStatsResult] = useState<any>(null);
  const [heavyAnalyticsResult, setHeavyAnalyticsResult] = useState<any>(null);
  const [bypassCache, setBypassCache] = useState(false);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  // Live Benchmark States
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const loadCacheStats = async () => {
    try {
      const data = await fetchCacheStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load cache stats:', err);
    }
  };

  useEffect(() => {
    loadCacheStats();
    const interval = setInterval(loadCacheStats, 4000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePurge = async () => {
    try {
      const res = await purgeCache(purgePattern || undefined);
      showNotification(res.message);
      setPurgePattern('');
      await loadCacheStats();
    } catch (err: any) {
      showNotification(`Purge failed: ${err.message}`);
    }
  };

  const handleDeleteKey = async (key: string) => {
    try {
      await deleteCacheKey(key);
      showNotification(`Key '${key}' deleted.`);
      await loadCacheStats();
    } catch (err: any) {
      showNotification(`Delete key failed: ${err.message}`);
    }
  };

  const handleTestDemoStats = async () => {
    setIsRunningDemo(true);
    try {
      const res = await fetchDemoStats(bypassCache);
      setDemoStatsResult(res);
      await loadCacheStats();
    } catch (err: any) {
      showNotification(`Failed: ${err.message}`);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleTestHeavyAnalytics = async () => {
    setIsRunningDemo(true);
    try {
      const res = await fetchHeavyAnalytics(bypassCache);
      setHeavyAnalyticsResult(res);
      await loadCacheStats();
    } catch (err: any) {
      showNotification(`Failed: ${err.message}`);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await executeBenchmark();
      setBenchmarkResult(res);
      await loadCacheStats();
      showNotification(`Benchmark completed: ${res.comparison.speedupMultiplier} speedup factor.`);
    } catch (err: any) {
      showNotification(`Benchmark failed: ${err.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0 max-w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-[#6257F5]" />
            Server-Side Caching & Performance Lab
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Redis-backed caching layer, TTL management, key invalidation, and live performance benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCacheStats}
            className="px-3.5 py-2 rounded-xl bg-[#1D2A3D] hover:bg-[#223249] text-slate-200 text-xs font-semibold border border-[#34435B] transition shadow-sm flex items-center gap-2"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#5379F5]" />
            Refresh Cache
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-[#6257F5]/10 border border-[#6257F5]/30 rounded-xl text-xs text-[#A99CFB] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#65DDA5] flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Cache Diagnostics & Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cache Mode</div>
          <div className="text-sm font-extrabold text-[#6257F5] mt-1 truncate font-mono">
            {stats?.mode === 'redis' ? 'Redis Server' : 'In-Memory Fallback'}
          </div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hit Ratio</div>
          <div className="text-2xl font-extrabold text-[#65DDA5] mt-1 font-mono">{stats?.hitRatio || '0.0%'}</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cache Hits</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">{stats?.hits ?? 0}</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cache Misses</div>
          <div className="text-2xl font-extrabold text-[#F5B94C] mt-1 font-mono">{stats?.misses ?? 0}</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Writes</div>
          <div className="text-2xl font-extrabold text-slate-200 mt-1 font-mono">{stats?.totalWrites ?? 0}</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Keys</div>
          <div className="text-2xl font-extrabold text-[#A99CFB] mt-1 font-mono">{stats?.activeKeysCount ?? 0}</div>
        </div>
      </div>

      {/* Live Benchmark Comparison Section */}
      <div className="bg-gradient-to-r from-[#172235] via-[#1D2A3D] to-[#172235] border border-[#34435B] rounded-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#34435B]/60">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
              <Flame className="w-5 h-5 text-[#F5B94C]" />
              Live Performance Comparison Benchmark
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Executes cold un-cached database query vs cold cache write vs hot cache read with high-resolution timer.
            </p>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
            className="px-5 py-2.5 rounded-xl bg-[#6257F5] hover:bg-[#5346EE] text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-[#6257F5]/30 active:scale-95 flex-shrink-0"
          >
            <Zap className="w-4 h-4 text-[#A99CFB]" />
            {isBenchmarking ? 'Running Benchmark...' : 'Execute Live Benchmark'}
          </button>
        </div>

        {benchmarkResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#141F30] p-4 rounded-xl border border-[#34435B]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Uncached Run (Cold)
                </span>
                <span className="text-3xl font-extrabold text-[#F16C80] mt-1.5 block font-mono">
                  {benchmarkResult.measurements.uncachedMs} ms
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">Simulated complex query latency</span>
              </div>

              <div className="bg-[#141F30] p-4 rounded-xl border border-[#34435B]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  2. Cold Cache Write
                </span>
                <span className="text-3xl font-extrabold text-[#F5B94C] mt-1.5 block font-mono">
                  {benchmarkResult.measurements.coldCacheWriteMs} ms
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">Serialization & key store</span>
              </div>

              <div className="bg-[#141F30] p-4 rounded-xl border border-[#34435B]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  3. Subsequent Cache Hit (Hot)
                </span>
                <span className="text-3xl font-extrabold text-[#65DDA5] mt-1.5 block font-mono">
                  {benchmarkResult.measurements.avgCacheHitMs} ms
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">Instant in-memory / redis retrieval</span>
              </div>
            </div>

            {/* Visual comparative bar chart */}
            <BenchmarkComparisonChart benchmark={benchmarkResult} />

            {/* Performance Multiplier Highlight */}
            <div className="p-4 bg-[#65DDA5]/10 border border-[#65DDA5]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow-green">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#65DDA5]/20 text-[#65DDA5] flex items-center justify-center font-bold text-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Speedup: <span className="text-[#65DDA5] font-mono text-base">{benchmarkResult.comparison.speedupMultiplier}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Latency reduced by <span className="text-[#65DDA5] font-bold font-mono">{benchmarkResult.comparison.latencyReduction}</span> with cache hit.
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-300">
                Storage: <span className="text-[#A99CFB] font-bold">{benchmarkResult.comparison.storageSource}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            Click &apos;Execute Live Benchmark&apos; above to run real side-by-side latency measurements.
          </div>
        )}
      </div>

      {/* Interactive Cache Middleware Demo Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Cached Route: Platform Stats</h3>
              <span className="text-xs font-mono text-[#65DDA5] bg-[#65DDA5]/10 px-2 py-0.5 rounded border border-[#65DDA5]/20">
                TTL: 60s
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Endpoint: <code className="text-[#A99CFB]">GET /api/cache/demo/stats</code>. First call is a MISS, subsequent calls return instant cache HIT.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleTestDemoStats}
                disabled={isRunningDemo}
                className="px-4 py-2 rounded-xl bg-[#6257F5] hover:bg-[#5346EE] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-[#6257F5]/25"
              >
                Test Endpoint
              </button>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bypassCache}
                  onChange={(e) => setBypassCache(e.target.checked)}
                  className="rounded bg-[#141F30] border-[#34435B] text-[#6257F5] focus:ring-0"
                />
                Bypass Cache (<code className="text-slate-400">X-Cache-Bypass: true</code>)
              </label>
            </div>
          </div>

          {demoStatsResult && (
            <div className="p-3.5 rounded-xl bg-[#141F30] border border-[#34435B] font-mono text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">X-Cache Status:</span>
                <Badge
                  variant={
                    demoStatsResult.cacheHeader === 'HIT'
                      ? 'success'
                      : demoStatsResult.cacheHeader === 'BYPASS'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {demoStatsResult.cacheHeader}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Remaining TTL:</span>
                <span className="text-white font-bold">{demoStatsResult.cacheTtl ? `${demoStatsResult.cacheTtl}s` : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Server Latency:</span>
                <span className="text-[#65DDA5] font-bold">{demoStatsResult.responseTimeHeader}</span>
              </div>
            </div>
          )}
        </div>

        {/* Heavy Analytics Query Demo */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Heavy Computational Aggregation</h3>
              <span className="text-xs font-mono text-[#5379F5] bg-[#5379F5]/10 px-2 py-0.5 rounded border border-[#5379F5]/20">
                TTL: 120s
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Endpoint: <code className="text-[#A99CFB]">GET /api/cache/demo/heavy-analytics</code>. Analyzes 25,000 algorithmic prime nodes.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleTestHeavyAnalytics}
                disabled={isRunningDemo}
                className="px-4 py-2 rounded-xl bg-[#6257F5] hover:bg-[#5346EE] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-[#6257F5]/25"
              >
                Run Heavy Query
              </button>
            </div>
          </div>

          {heavyAnalyticsResult && (
            <div className="p-3.5 rounded-xl bg-[#141F30] border border-[#34435B] font-mono text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">X-Cache Status:</span>
                <Badge
                  variant={
                    heavyAnalyticsResult.cacheHeader === 'HIT'
                      ? 'success'
                      : heavyAnalyticsResult.cacheHeader === 'BYPASS'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {heavyAnalyticsResult.cacheHeader}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Response Time:</span>
                <span className="text-[#65DDA5] font-bold">{heavyAnalyticsResult.responseTimeHeader}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Analyzed Nodes:</span>
                <span className="text-white font-bold">{heavyAnalyticsResult.data.dataset}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Cache Keys and Purge Controls */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Active Cache Keys ({stats?.activeKeysCount ?? 0})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Pattern (e.g. stats* or blank for all)"
              value={purgePattern}
              onChange={(e) => setPurgePattern(e.target.value)}
              className="bg-[#141F30] border border-[#34435B] text-xs text-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#6257F5] w-full sm:w-60"
            />
            <button
              onClick={handlePurge}
              className="px-4 py-2 rounded-xl bg-[#F16C80]/15 hover:bg-[#F16C80]/25 text-[#F16C80] border border-[#F16C80]/30 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Cache
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-xs font-mono">
            <thead className="bg-[#141F30] text-slate-400 border-b border-[#34435B] uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Cache Key</th>
                <th className="py-3 px-3.5">Remaining TTL</th>
                <th className="py-3 px-3.5">Size</th>
                <th className="py-3 px-3.5">Created</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#34435B]/50 text-slate-300">
              {!stats?.keys || stats.keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No active cache keys found in store.
                  </td>
                </tr>
              ) : (
                stats.keys.map((k) => (
                  <tr key={k.key} className="hover:bg-[#202E42] transition">
                    <td className="py-3 px-3.5 font-bold text-[#A99CFB] truncate max-w-[200px]" title={k.key}>
                      {k.key}
                    </td>
                    <td className="py-3 px-3.5 text-[#65DDA5] font-semibold">{k.ttlSeconds}s</td>
                    <td className="py-3 px-3.5 text-slate-300">{k.sizeBytes} B</td>
                    <td className="py-3 px-3.5 text-slate-400">{new Date(k.createdAt).toLocaleTimeString()}</td>
                    <td className="py-3 px-3.5 text-right font-sans">
                      <button
                        onClick={() => handleDeleteKey(k.key)}
                        title="Delete Key"
                        className="p-1.5 rounded-lg bg-[#F16C80]/15 hover:bg-[#F16C80]/25 text-[#F16C80] border border-[#F16C80]/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CachePage;
