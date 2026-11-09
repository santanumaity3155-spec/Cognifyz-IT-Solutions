import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Trash2,
  TrendingUp,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import Badge from '../components/common/Badge';
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
    } catch (err: any) {
      showNotification(`Benchmark failed: ${err.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Server-Side Caching & Performance Lab
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Redis-backed caching layer, TTL management, key invalidation, and live performance benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCacheStats}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            Refresh Cache
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Cache Diagnostics & Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Cache Mode</div>
          <div className="text-sm font-bold text-indigo-400 mt-1 truncate">
            {stats?.mode === 'redis' ? 'Redis Server' : 'In-Memory Fallback'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Hit Ratio</div>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5">{stats?.hitRatio || '0.0%'}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Cache Hits</div>
          <div className="text-2xl font-bold text-white mt-0.5">{stats?.hits ?? 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Cache Misses</div>
          <div className="text-2xl font-bold text-amber-400 mt-0.5">{stats?.misses ?? 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Total Writes</div>
          <div className="text-2xl font-bold text-slate-300 mt-0.5">{stats?.totalWrites ?? 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Active Keys</div>
          <div className="text-2xl font-bold text-purple-400 mt-0.5">{stats?.activeKeysCount ?? 0}</div>
        </div>
      </div>

      {/* Live Benchmark Comparison Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Live Performance Comparison Benchmark
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Executes cold un-cached database query vs cold cache write vs hot cache read with high-resolution timer.
            </p>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            {isBenchmarking ? 'Running Benchmark...' : 'Execute Live Benchmark'}
          </button>
        </div>

        {benchmarkResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase block">1. Uncached Run (Cold)</span>
                <span className="text-2xl font-bold text-rose-400 mt-1 block">
                  {benchmarkResult.measurements.uncachedMs} ms
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Simulated complex query latency</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase block">2. Cold Cache Write</span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">
                  {benchmarkResult.measurements.coldCacheWriteMs} ms
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Serialization & key store</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase block">3. Subsequent Cache Hit (Hot)</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                  {benchmarkResult.measurements.avgCacheHitMs} ms
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Instant in-memory / redis retrieval</span>
              </div>
            </div>

            {/* Performance Multiplier Highlight */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Speedup: <span className="text-emerald-400">{benchmarkResult.comparison.speedupMultiplier}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Latency reduced by <span className="text-emerald-400 font-semibold">{benchmarkResult.comparison.latencyReduction}</span> with cache hit.
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-300">
                Storage: <span className="text-indigo-400">{benchmarkResult.comparison.storageSource}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            Click &apos;Execute Live Benchmark&apos; above to run real side-by-side latency measurements.
          </div>
        )}
      </div>

      {/* Interactive Cache Middleware Demo Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Cached Route: Platform Stats</h3>
            <span className="text-xs text-slate-400">TTL: 60s</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Endpoint: <code className="text-indigo-300">GET /api/cache/demo/stats</code>. First call is a MISS, subsequent calls return instant cache HIT.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleTestDemoStats}
              disabled={isRunningDemo}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              Test Endpoint
            </button>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={bypassCache}
                onChange={(e) => setBypassCache(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
              />
              Bypass Cache (<code className="text-slate-400">X-Cache-Bypass: true</code>)
            </label>
          </div>

          {demoStatsResult && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
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
                <span className="text-white">{demoStatsResult.cacheTtl ? `${demoStatsResult.cacheTtl}s` : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Server Latency:</span>
                <span className="text-emerald-400 font-bold">{demoStatsResult.responseTimeHeader}</span>
              </div>
            </div>
          )}
        </div>

        {/* Heavy Analytics Query Demo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Heavy Computational Aggregation</h3>
            <span className="text-xs text-slate-400">TTL: 120s</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Endpoint: <code className="text-indigo-300">GET /api/cache/demo/heavy-analytics</code>. Analyzes 25,000 algorithmic prime nodes.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleTestHeavyAnalytics}
              disabled={isRunningDemo}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              Run Heavy Query
            </button>
          </div>

          {heavyAnalyticsResult && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
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
                <span className="text-emerald-400 font-bold">{heavyAnalyticsResult.responseTimeHeader}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Analyzed Nodes:</span>
                <span className="text-white">{heavyAnalyticsResult.data.dataset}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Cache Keys and Purge Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-white">Active Cache Keys ({stats?.activeKeysCount ?? 0})</h3>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Pattern (e.g. stats* or blank for all)"
              value={purgePattern}
              onChange={(e) => setPurgePattern(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full sm:w-56"
            />
            <button
              onClick={handlePurge}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge Cache
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Cache Key</th>
                <th className="py-2.5 px-3">Remaining TTL</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {!stats?.keys || stats.keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                    No active cache keys found in store.
                  </td>
                </tr>
              ) : (
                stats.keys.map((k) => (
                  <tr key={k.key} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-indigo-300 truncate max-w-[200px]" title={k.key}>{k.key}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{k.ttlSeconds}s</td>
                    <td className="py-2.5 px-3 text-slate-400">{k.sizeBytes} B</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(k.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => handleDeleteKey(k.key)}
                        title="Delete Key"
                        className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
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
