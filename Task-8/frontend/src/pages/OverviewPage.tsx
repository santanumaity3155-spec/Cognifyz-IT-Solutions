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
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import {
  fetchMiddlewareTelemetry,
  fetchQueueStats,
  fetchCacheStats,
  fetchJobs,
  enqueueEmailJob,
  enqueueReportJob,
} from '../services/api';
import type {
  MiddlewareTelemetryData,
  QueueDiagnostics,
  CacheStats,
  BackgroundJob,
} from '../types';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState<MiddlewareTelemetryData | null>(null);
  const [queueStats, setQueueStats] = useState<QueueDiagnostics | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<BackgroundJob[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [tel, qStats, cStats, jobsData] = await Promise.all([
        fetchMiddlewareTelemetry(),
        fetchQueueStats(),
        fetchCacheStats(),
        fetchJobs({ limit: 5 }),
      ]);
      setTelemetry(tel);
      setQueueStats(qStats);
      setCacheStats(cStats);
      setRecentJobs(jobsData.jobs);
    } catch (err) {
      console.error('Failed to load dashboard overview data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Forma Server Intelligence Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time server telemetry, background queue workers, and server-side cache monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickEmail}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Dispatch Email Job
          </button>
          <button
            onClick={handleQuickReport}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            Dispatch Report Job
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total API Requests"
          value={telemetry?.summary.totalRequests ?? 0}
          subtitle={`Buffer size: ${telemetry?.summary.bufferSize ?? 0} requests`}
          icon={<ShieldCheck className="w-5 h-5" />}
          badge="Live Middleware"
          badgeColor="blue"
        />

        <StatCard
          title="Avg Latency"
          value={`${telemetry?.summary.avgDurationMs ?? 0}ms`}
          subtitle={`P95: ${telemetry?.summary.p95DurationMs ?? 0}ms`}
          icon={<Clock className="w-5 h-5" />}
          badge="High-Res Timer"
          badgeColor="green"
        />

        <StatCard
          title="Background Jobs"
          value={queueStats?.counts.total ?? 0}
          subtitle={`${queueStats?.counts.completed ?? 0} completed / ${queueStats?.counts.failed ?? 0} failed`}
          icon={<Layers className="w-5 h-5" />}
          badge={queueStats?.mode === 'redis_bullmq' ? 'Redis BullMQ' : 'Async Fallback'}
          badgeColor={queueStats?.isRedisConnected ? 'green' : 'amber'}
        />

        <StatCard
          title="Cache Hit Ratio"
          value={cacheStats?.hitRatio ?? '0.0%'}
          subtitle={`${cacheStats?.hits ?? 0} hits / ${cacheStats?.misses ?? 0} misses`}
          icon={<Cpu className="w-5 h-5" />}
          badge={`${cacheStats?.activeKeysCount ?? 0} Keys`}
          badgeColor="purple"
        />
      </div>

      {/* Two Columns: Recent Jobs & Recent API Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Recent Background Jobs</h3>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px]">
            {recentJobs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No jobs processed yet. Click &apos;Dispatch Email Job&apos; above!
              </div>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-medium text-slate-200 truncate max-w-[200px]">
                      {job.jobId}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="capitalize">{job.queueName.replace('Queue', '')} &bull; {job.jobType}</span>
                    <span>{job.processingTimeMs ? `${job.processingTimeMs}ms` : `${job.progress}%`}</span>
                  </div>

                  {job.status === 'active' && (
                    <div className="w-full bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Requests Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Live Request Stream</h3>
            </div>
            <button
              onClick={() => navigate('/middleware')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Inspect All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[340px]">
            {telemetry?.recentRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No requests recorded yet.</div>
            ) : (
              telemetry?.recentRequests.slice(0, 7).map((req) => (
                <div
                  key={req.id + req.timestamp}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 truncate max-w-[280px]">
                    <span className="font-bold text-slate-300">{req.method}</span>
                    <span className="text-slate-400 truncate">{req.path}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{req.durationMs}ms</span>
                    {getStatusCodeBadge(req.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
