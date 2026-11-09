import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
  TrendingUp,
  Database,
  Radio,
  Server,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LatencyAreaChart from '../components/charts/LatencyAreaChart';
import StatusDistributionChart from '../components/charts/StatusDistributionChart';
import {
  fetchMiddlewareTelemetry,
  fetchQueueStats,
  fetchCacheStats,
  fetchJobs,
  fetchHealth,
  enqueueEmailJob,
  enqueueReportJob,
} from '../services/api';
import type {
  MiddlewareTelemetryData,
  QueueDiagnostics,
  CacheStats,
  BackgroundJob,
  SystemHealth,
} from '../types';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState<MiddlewareTelemetryData | null>(null);
  const [queueStats, setQueueStats] = useState<QueueDiagnostics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<BackgroundJob[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [tel, qStats, cStats, jobsData, healthData] = await Promise.all([
        fetchMiddlewareTelemetry(),
        fetchQueueStats(),
        fetchCacheStats(),
        fetchJobs({ limit: 6 }),
        fetchHealth().catch(() => null),
      ]);
      setTelemetry(tel);
      setQueueStats(qStats);
      setCacheStats(cStats);
      setRecentJobs(jobsData.jobs);
      if (healthData) setHealth(healthData);
    } catch (err) {
      console.error('Failed to load dashboard overview data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickEmail = async () => {
    try {
      setActionMessage('Dispatching background welcome email...');
      await enqueueEmailJob({
        recipient: 'developer@forma-platform.internal',
        subject: 'Welcome to Forma Server Intelligence Platform',
        template: 'welcome',
      });
      setActionMessage('Background email successfully enqueued in emailQueue!');
      loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Failed to enqueue job: ${err.message || 'Error'}`);
    }
  };

  const handleQuickReport = async () => {
    try {
      setActionMessage('Dispatching Performance Audit Report job...');
      await enqueueReportJob({
        reportType: 'performance_audit',
        timeframe: '24h',
        computationDelayMs: 800,
      });
      setActionMessage('Report generation job queued in reportQueue!');
      loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Failed to enqueue job: ${err.message || 'Error'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm" dot>Completed</Badge>;
      case 'active':
        return <Badge variant="warning" size="sm" dot>Active</Badge>;
      case 'failed':
        return <Badge variant="error" size="sm" dot>Failed</Badge>;
      default:
        return <Badge variant="neutral" size="sm" dot>Waiting</Badge>;
    }
  };

  const getStatusCodeBadge = (code: number) => {
    if (code >= 500) return <Badge variant="error" size="sm">{code}</Badge>;
    if (code >= 400) return <Badge variant="warning" size="sm">{code}</Badge>;
    if (code >= 300) return <Badge variant="info" size="sm">{code}</Badge>;
    return <Badge variant="success" size="sm">{code}</Badge>;
  };

  // Accurate infrastructure states derived directly from real backend
  const isRedisLive = Boolean(health?.infrastructure?.redis?.isConnected);
  const isMongoLive = Boolean(health?.infrastructure?.database?.isConnected);
  const isBullMQLive = queueStats?.mode === 'redis_bullmq' && queueStats?.isRedisConnected;
  const isCacheRedisLive = cacheStats?.mode === 'redis' && cacheStats?.isRedisConnected;

  return (
    <div className="space-y-6 sm:space-y-7 min-w-0 max-w-full font-sans">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#172235] via-[#1D2A3D] to-[#172235] p-5 sm:p-7 rounded-2xl border border-[#34435B] shadow-card">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6257F5]/15 border border-[#6257F5]/30 text-[11px] font-bold text-[#A99CFB] mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#65DDA5] animate-pulse" />
              Real-Time Server Telemetry Active
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              Forma Server Intelligence Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Real-time server telemetry, asynchronous background queue workers, and server-side cache monitoring.
            </p>
          </div>

          {/* Quick Action Dispatch Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={handleQuickEmail}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#6257F5] hover:bg-[#5346EE] text-white shadow-lg shadow-[#6257F5]/30 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Zap className="w-4 h-4 text-[#A99CFB]" />
              Dispatch Email Job
            </button>
            <button
              onClick={handleQuickReport}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#223249] hover:bg-[#283A54] text-slate-200 border border-[#34435B] shadow-sm transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Activity className="w-4 h-4 text-[#5379F5]" />
              Dispatch Report Job
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-[#6257F5]/10 border border-[#6257F5]/30 rounded-xl text-xs text-[#A99CFB] flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-[#65DDA5] flex-shrink-0" />
          <span className="font-semibold">{actionMessage}</span>
        </div>
      )}

      {/* 4 Statistics KPI Cards Grid - Full Width, Consistent Height, Zero Text Clipping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total API Requests"
          value={telemetry?.summary.totalRequests ?? 0}
          subtitle={`Buffer size: ${telemetry?.summary.bufferSize ?? 0} requests`}
          icon={<ShieldCheck className="w-5 h-5 text-[#5379F5]" />}
          badge="Live Middleware"
          badgeColor="blue"
          trend="100% Captured"
          trendPositive={true}
        />

        <StatCard
          title="Avg Latency"
          value={`${telemetry?.summary.avgDurationMs ?? 0}ms`}
          subtitle={`P95: ${telemetry?.summary.p95DurationMs ?? 0}ms`}
          icon={<Clock className="w-5 h-5 text-[#65DDA5]" />}
          badge="High-Res Timer"
          badgeColor="green"
          trend="hrtime precision"
          trendPositive={true}
        />

        <StatCard
          title="Background Jobs"
          value={queueStats?.counts.total ?? 0}
          subtitle={`${queueStats?.counts.completed ?? 0} completed · ${queueStats?.counts.failed ?? 0} failed`}
          icon={<Layers className="w-5 h-5 text-[#F5B94C]" />}
          badge={queueStats?.mode === 'redis_bullmq' ? 'Redis BullMQ' : 'Async Fallback'}
          badgeColor={queueStats?.isRedisConnected ? 'green' : 'amber'}
          trend={`${queueStats?.counts.active ?? 0} active`}
        />

        <StatCard
          title="Cache Hit Ratio"
          value={cacheStats?.hitRatio ?? '0.0%'}
          subtitle={`${cacheStats?.hits ?? 0} hits · ${cacheStats?.misses ?? 0} misses`}
          icon={<Cpu className="w-5 h-5 text-[#A99CFB]" />}
          badge={`${cacheStats?.activeKeysCount ?? 0} Keys`}
          badgeColor="purple"
          trend={cacheStats?.mode === 'redis' ? 'Redis' : 'Memory'}
          trendPositive={true}
        />
      </div>

      {/* Visual Telemetry & Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Stream Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#34435B]/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#6257F5]" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Live Request Latency Trend
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              High-Resolution Nanosecond hrtime
            </span>
          </div>

          <div className="flex-1 py-1">
            <LatencyAreaChart
              requests={telemetry?.recentRequests || []}
              avgLatency={telemetry?.summary.avgDurationMs}
            />
          </div>
        </div>

        {/* Status Distribution Chart (1 Col) */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#34435B]/50">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#65DDA5]" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Response Status Distribution
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Total: {telemetry?.summary.totalRequests ?? 0}
            </span>
          </div>

          <div className="py-2 flex-1 flex flex-col justify-center">
            <StatusDistributionChart
              statusCounts={telemetry?.summary.statusCounts || { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 }}
            />
          </div>

          <div className="pt-3 border-t border-[#34435B]/40 text-xs text-slate-400 flex items-center justify-between">
            <span>Client errors (4xx): <strong className="text-[#F5B94C] font-mono">{telemetry?.summary.statusCounts['4xx'] ?? 0}</strong></span>
            <span>Server errors (5xx): <strong className="text-[#F16C80] font-mono">{telemetry?.summary.statusCounts['5xx'] ?? 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Jobs & Live Request Stream (Clean layout without nested scroll clipping) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Background Jobs */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#34435B]/60">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6257F5]" />
              <h3 className="text-sm font-bold text-white">Recent Background Jobs</h3>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs text-[#A99CFB] hover:text-white font-semibold flex items-center gap-1 transition"
            >
              View Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentJobs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No jobs processed yet. Click &apos;Dispatch Email Job&apos; above!
              </div>
            ) : (
              recentJobs.slice(0, 5).map((job) => (
                <div
                  key={job.jobId}
                  className="p-3.5 rounded-xl bg-[#172235]/80 border border-[#34435B]/60 hover:border-[#6257F5]/40 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-200 truncate max-w-[200px]" title={job.jobId}>
                      {job.jobId}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-sans">
                    <span className="capitalize font-medium text-slate-300">
                      {job.queueName.replace('Queue', '')} &bull; {job.jobType}
                    </span>
                    <span className="font-mono">
                      {job.processingTimeMs ? `${job.processingTimeMs}ms` : `${job.progress}%`}
                    </span>
                  </div>

                  {job.status === 'active' && (
                    <div className="w-full bg-[#1B2638] h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="bg-[#6257F5] h-full transition-all duration-300 shadow-glow-purple"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Request Stream */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#34435B]/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5379F5]" />
              <h3 className="text-sm font-bold text-white">Live Request Stream</h3>
            </div>
            <button
              onClick={() => navigate('/middleware')}
              className="text-xs text-[#7DA4F8] hover:text-white font-semibold flex items-center gap-1 transition"
            >
              Inspect All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {telemetry?.recentRequests.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">No requests recorded yet.</div>
            ) : (
              telemetry?.recentRequests.slice(0, 6).map((req) => (
                <div
                  key={req.id + req.timestamp}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#172235]/80 border border-[#34435B]/50 text-xs font-mono hover:bg-[#202E42] transition"
                >
                  <div className="flex items-center gap-2.5 truncate max-w-[280px]">
                    <span className="font-bold text-white px-1.5 py-0.5 rounded bg-[#223249]">
                      {req.method}
                    </span>
                    <span className="text-slate-300 truncate">{req.path}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-400 text-[11px]">{req.durationMs}ms</span>
                    {getStatusCodeBadge(req.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Infrastructure Summary Panel: Consistent, Accurate Statuses with Zero Conflicts */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 sm:p-6 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#6257F5]" />
          Infrastructure Summary & Verified Telemetry
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MongoDB Persistence */}
          <div className="p-4 rounded-xl bg-[#172235] border border-[#34435B]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#5379F5]/10 text-[#5379F5]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">MongoDB Store</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">
                  {isMongoLive ? (health?.infrastructure?.database?.databaseName || 'forma_task8') : 'In-Memory Store'}
                </div>
              </div>
            </div>
            <Badge variant={isMongoLive ? 'success' : 'warning'} size="sm" dot>
              {isMongoLive ? 'Connected' : 'Fallback'}
            </Badge>
          </div>

          {/* Redis Server (6379) */}
          <div className="p-4 rounded-xl bg-[#172235] border border-[#34435B]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#6257F5]/10 text-[#6257F5]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Redis (Port 6379)</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">
                  {isRedisLive ? 'Redis 127.0.0.1' : 'Disconnected'}
                </div>
              </div>
            </div>
            <Badge variant={isRedisLive ? 'success' : 'error'} size="sm" dot>
              {isRedisLive ? 'Connected' : 'Offline'}
            </Badge>
          </div>

          {/* Queue Engine (BullMQ vs Async Fallback) */}
          <div className="p-4 rounded-xl bg-[#172235] border border-[#34435B]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#F5B94C]/10 text-[#F5B94C]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Queue Engine</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">
                  {isBullMQLive ? 'BullMQ Distributed' : 'Async Queue'}
                </div>
              </div>
            </div>
            <Badge variant={isBullMQLive ? 'success' : 'warning'} size="sm" dot>
              {isBullMQLive ? 'BullMQ Active' : 'Async Fallback'}
            </Badge>
          </div>

          {/* Cache Layer (Redis Cache vs In-Memory Store) */}
          <div className="p-4 rounded-xl bg-[#172235] border border-[#34435B]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#65DDA5]/10 text-[#65DDA5]">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Cache Layer</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">
                  {isCacheRedisLive ? 'Redis Cache' : 'In-Memory Cache'}
                </div>
              </div>
            </div>
            <Badge variant={isCacheRedisLive ? 'success' : 'warning'} size="sm" dot>
              {isCacheRedisLive ? 'Redis Live' : 'Memory Fallback'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
