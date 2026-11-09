import React, { useState, useEffect } from 'react';
import {
  Layers,
  Play,
  RotateCw,
  Trash2,
  Eye,
  CheckCircle2,
  Send,
  FileText,
  BarChart3,
  Wrench,
  Pause,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import {
  fetchQueueStats,
  fetchJobs,
  enqueueEmailJob,
  enqueueReportJob,
  enqueueAnalyticsJob,
  enqueueMaintenanceJob,
  retryJob,
  deleteJob,
} from '../services/api';
import type { QueueDiagnostics, BackgroundJob } from '../types';

export const JobsPage: React.FC = () => {
  const [queueStats, setQueueStats] = useState<QueueDiagnostics | null>(null);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [activeTab, setActiveTab] = useState<'email' | 'report' | 'analytics' | 'maintenance'>('email');
  const [autoPoll, setAutoPoll] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<BackgroundJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [emailForm, setEmailForm] = useState({
    recipient: 'developer@forma-platform.internal',
    subject: 'Production Server Alert: High Cache Hit Ratio',
    template: 'security_alert',
    simulateFailure: false,
  });

  const [reportForm, setReportForm] = useState({
    reportType: 'performance_audit',
    format: 'json',
    timeframe: '24h',
    computationDelayMs: 1000,
    simulateFailure: false,
  });

  const [analyticsForm, setAnalyticsForm] = useState({
    metricType: 'latency_percentiles',
    sampleSize: 100,
    resolution: 'minute',
    simulateFailure: false,
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    task: 'purge_cache',
    force: false,
    simulateFailure: false,
  });

  const loadData = async () => {
    try {
      const [stats, jobsData] = await Promise.all([
        fetchQueueStats(),
        fetchJobs({ limit: 50 }),
      ]);
      setQueueStats(stats);
      setJobs(jobsData.jobs);

      // Refresh selected job modal if open
      if (selectedJob) {
        const updated = jobsData.jobs.find((j: BackgroundJob) => j.jobId === selectedJob.jobId);
        if (updated) setSelectedJob(updated);
      }
    } catch (err) {
      console.error('Failed to load queue data:', err);
    }
  };

  useEffect(() => {
    loadData();
    if (!autoPoll) return;
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [autoPoll, selectedJob?.jobId]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let res: any;
      if (activeTab === 'email') {
        res = await enqueueEmailJob(emailForm);
      } else if (activeTab === 'report') {
        res = await enqueueReportJob(reportForm);
      } else if (activeTab === 'analytics') {
        res = await enqueueAnalyticsJob(analyticsForm);
      } else if (activeTab === 'maintenance') {
        res = await enqueueMaintenanceJob(maintenanceForm);
      }
      showNotification(`Job enqueued successfully! Job ID: ${res?.data?.jobId}`);
      await loadData();
    } catch (err: any) {
      showNotification(`Failed to enqueue job: ${err.message || 'Validation error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await retryJob(jobId);
      showNotification(`Job ${jobId} successfully scheduled for retry.`);
      await loadData();
    } catch (err: any) {
      showNotification(`Retry failed: ${err.message}`);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      showNotification(`Job ${jobId} removed from queue.`);
      if (selectedJob?.jobId === jobId) setSelectedJob(null);
      await loadData();
    } catch (err: any) {
      showNotification(`Delete failed: ${err.message}`);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'ALL') return true;
    return job.status === statusFilter;
  });

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

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Background Tasks & BullMQ Job Processing
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Asynchronous task queues, independent workers, retry policies, and progress tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              autoPoll
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {autoPoll ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
            {autoPoll ? 'Auto-Polling Active' : 'Polling Paused'}
          </button>
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Diagnostics Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Queue Engine Mode:</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  queueStats?.mode === 'redis_bullmq'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {queueStats?.mode === 'redis_bullmq' ? 'Redis BullMQ (Distributed)' : 'In-Memory Async Queue (Development Fallback)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {queueStats?.mode === 'redis_bullmq'
                ? 'Jobs persist in Redis with distributed concurrency and exponential backoff.'
                : 'Redis daemon not running on port 6379. Operating in embedded asynchronous queue fallback with identical lifecycle semantics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              Concurrency: <span className="text-indigo-400 font-bold">{queueStats?.concurrency || 3}</span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              Active Workers: <span className="text-amber-400 font-bold">{queueStats?.activeWorkers || 0}</span>
            </div>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] uppercase text-slate-400">Total Jobs</div>
            <div className="text-lg font-bold text-white mt-0.5">{queueStats?.counts.total ?? 0}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] uppercase text-slate-400">Waiting</div>
            <div className="text-lg font-bold text-slate-300 mt-0.5">{queueStats?.counts.waiting ?? 0}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] uppercase text-slate-400">Active</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{queueStats?.counts.active ?? 0}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] uppercase text-slate-400">Completed</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{queueStats?.counts.completed ?? 0}</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-[11px] uppercase text-slate-400">Failed</div>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{queueStats?.counts.failed ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Job Enqueue Dispatch Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-full min-w-0">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Play className="w-4 h-4 text-indigo-400" />
          Dispatch New Background Job
        </h3>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-5 gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'email', label: 'Email Job', icon: <Send className="w-3.5 h-3.5" /> },
            { id: 'report', label: 'Report Job', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'analytics', label: 'Analytics Job', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'maintenance', label: 'Maintenance Job', icon: <Wrench className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleEnqueue} className="space-y-4">
          {activeTab === 'email' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={emailForm.recipient}
                  onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Template</label>
                <select
                  value={emailForm.template}
                  onChange={(e) => setEmailForm({ ...emailForm, template: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="welcome">Welcome Onboarding</option>
                  <option value="security_alert">Security Alert</option>
                  <option value="report_ready">Report Ready Notice</option>
                  <option value="system_notification">System Notification</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="simulateFailureEmail"
                  checked={emailForm.simulateFailure}
                  onChange={(e) => setEmailForm({ ...emailForm, simulateFailure: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="simulateFailureEmail" className="text-xs text-rose-300">
                  Simulate SMTP delivery failure (tests retry & exponential backoff)
                </label>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Report Type</label>
                <select
                  value={reportForm.reportType}
                  onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="performance_audit">Performance Audit</option>
                  <option value="activity_summary">Activity Summary</option>
                  <option value="system_health">System Health Digest</option>
                  <option value="error_analysis">Error Distribution Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Timeframe</label>
                <select
                  value={reportForm.timeframe}
                  onChange={(e) => setReportForm({ ...reportForm, timeframe: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="1h">Past 1 Hour</option>
                  <option value="24h">Past 24 Hours</option>
                  <option value="7d">Past 7 Days</option>
                  <option value="30d">Past 30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Compute Delay</label>
                <select
                  value={reportForm.computationDelayMs}
                  onChange={(e) => setReportForm({ ...reportForm, computationDelayMs: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={500}>500ms (Quick)</option>
                  <option value={1500}>1500ms (Heavy)</option>
                  <option value={3000}>3000ms (Intensive)</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="simulateFailureReport"
                  checked={reportForm.simulateFailure}
                  onChange={(e) => setReportForm({ ...reportForm, simulateFailure: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="simulateFailureReport" className="text-xs text-rose-300">
                  Simulate compute worker crash (tests retry policy)
                </label>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Metric Type</label>
                <select
                  value={analyticsForm.metricType}
                  onChange={(e) => setAnalyticsForm({ ...analyticsForm, metricType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="latency_percentiles">Latency Percentiles (P50 - P99)</option>
                  <option value="status_distribution">Status Distribution</option>
                  <option value="cache_efficiency">Cache Efficiency Metrics</option>
                  <option value="throughput_trend">Throughput Trend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sample Size</label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={analyticsForm.sampleSize}
                  onChange={(e) => setAnalyticsForm({ ...analyticsForm, sampleSize: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Resolution</label>
                <select
                  value={analyticsForm.resolution}
                  onChange={(e) => setAnalyticsForm({ ...analyticsForm, resolution: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="minute">Per Minute</option>
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Maintenance Task</label>
                <select
                  value={maintenanceForm.task}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, task: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="purge_cache">Purge All Expired Cache</option>
                  <option value="vacuum_telemetry">Vacuum & Compact Telemetry Buffer</option>
                  <option value="rotate_logs">Simulate Server Log Rotation</option>
                  <option value="system_integrity_check">System Integrity Check</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="simulateFailureMaint"
                  checked={maintenanceForm.simulateFailure}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, simulateFailure: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="simulateFailureMaint" className="text-xs text-rose-300">
                  Simulate lock failure (tests retry)
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting to Queue...' : 'Enqueue Background Job'}
            </button>
          </div>
        </form>
      </div>

      {/* Jobs History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-white">Live Job Queue History ({filteredJobs.length})</h3>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Job ID</th>
                <th className="py-2.5 px-3">Queue</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Attempts</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                    No background jobs found. Submit a job using the form above!
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-200 truncate max-w-[140px]" title={job.jobId}>
                      {job.jobId}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-400 font-medium">
                      {job.queueName.replace('Queue', '')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{job.jobType}</td>
                    <td className="py-2.5 px-3">{getStatusBadge(job.status)}</td>
                    <td className="py-2.5 px-3">
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden flex items-center">
                        <div
                          className={`h-full transition-all duration-300 ${
                            job.status === 'failed'
                              ? 'bg-rose-500'
                              : job.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{job.progress}%</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {job.attemptsMade} / {job.maxAttempts}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {job.processingTimeMs ? `${job.processingTimeMs}ms` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => setSelectedJob(job)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.jobId)}
                            title="Retry Job"
                            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.jobId)}
                          title="Delete Job"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJob(null)}
          title={`Job Inspection: ${selectedJob.jobId}`}
          maxWidth="xl"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Queue:</span>
                <div className="text-white font-bold">{selectedJob.queueName}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Status:</span>
                <div className="mt-0.5">{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Attempts:</span>
                <div className="text-white">{selectedJob.attemptsMade} of {selectedJob.maxAttempts}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px]">Execution Time:</span>
                <div className="text-emerald-400 font-bold">{selectedJob.processingTimeMs ? `${selectedJob.processingTimeMs}ms` : 'In progress'}</div>
              </div>
            </div>

            {selectedJob.error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
                <span className="font-bold uppercase text-[10px] text-rose-400 block mb-1">Execution Failure:</span>
                {selectedJob.error}
              </div>
            )}

            <div>
              <span className="text-slate-400 uppercase text-[10px] block mb-1">Input Payload:</span>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>

            {selectedJob.result && (
              <div>
                <span className="text-emerald-400 uppercase text-[10px] block mb-1 font-bold">Worker Result Artifact:</span>
                <pre className="p-3 bg-slate-950 border border-emerald-500/20 rounded-xl text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedJob.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default JobsPage;
