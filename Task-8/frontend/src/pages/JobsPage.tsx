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
import JobQueueDistributionChart from '../components/charts/JobQueueDistributionChart';
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
    <div className="space-y-6 max-w-full min-w-0 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#6257F5]" />
            Background Tasks & BullMQ Job Processing
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Asynchronous task queues, independent workers, retry policies, and progress tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
              autoPoll
                ? 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30'
                : 'bg-[#1D2A3D] text-slate-400 border-[#34435B]'
            }`}
          >
            {autoPoll ? <RotateCw className="w-3.5 h-3.5 animate-spin text-[#65DDA5]" /> : <Pause className="w-3.5 h-3.5" />}
            {autoPoll ? 'Auto-Polling Active' : 'Polling Paused'}
          </button>
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-[#1D2A3D] hover:bg-[#223249] text-slate-200 text-xs font-semibold border border-[#34435B] transition shadow-sm"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-[#6257F5]/10 border border-[#6257F5]/30 rounded-xl text-xs text-[#A99CFB] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#65DDA5] flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Diagnostics Banner */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card max-w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#34435B]/60">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Queue Engine Mode:</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  queueStats?.mode === 'redis_bullmq'
                    ? 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30 shadow-glow-green'
                    : 'bg-[#F5B94C]/10 text-[#F5B94C] border-[#F5B94C]/30'
                }`}
              >
                {queueStats?.mode === 'redis_bullmq' ? 'Redis BullMQ (Distributed)' : 'In-Memory Async Queue (Development Fallback)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {queueStats?.mode === 'redis_bullmq'
                ? 'Jobs persist in Redis with distributed concurrency and exponential backoff.'
                : 'Redis daemon not running on port 6379. Operating in embedded asynchronous queue fallback with identical lifecycle semantics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <div className="bg-[#141F30] px-3.5 py-2 rounded-xl border border-[#34435B] text-slate-300">
              Concurrency: <span className="text-[#6257F5] font-bold">{queueStats?.concurrency || 3}</span>
            </div>
            <div className="bg-[#141F30] px-3.5 py-2 rounded-xl border border-[#34435B] text-slate-300">
              Active Workers: <span className="text-[#F5B94C] font-bold">{queueStats?.activeWorkers || 0}</span>
            </div>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-[#172235] p-3.5 rounded-xl border border-[#34435B]/50 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Jobs</div>
            <div className="text-2xl font-extrabold text-white mt-1 font-sans">{queueStats?.counts.total ?? 0}</div>
          </div>
          <div className="bg-[#172235] p-3.5 rounded-xl border border-[#34435B]/50 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Waiting</div>
            <div className="text-2xl font-extrabold text-[#5379F5] mt-1 font-mono">{queueStats?.counts.waiting ?? 0}</div>
          </div>
          <div className="bg-[#172235] p-3.5 rounded-xl border border-[#34435B]/50 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Active</div>
            <div className="text-2xl font-extrabold text-[#F5B94C] mt-1 font-mono">{queueStats?.counts.active ?? 0}</div>
          </div>
          <div className="bg-[#172235] p-3.5 rounded-xl border border-[#34435B]/50 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Completed</div>
            <div className="text-2xl font-extrabold text-[#65DDA5] mt-1 font-mono">{queueStats?.counts.completed ?? 0}</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-[#172235] p-3.5 rounded-xl border border-[#34435B]/50 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Failed</div>
            <div className="text-2xl font-extrabold text-[#F16C80] mt-1 font-mono">{queueStats?.counts.failed ?? 0}</div>
          </div>
        </div>

        {/* Visual Lifecycle Distribution strip */}
        <div className="mt-4 pt-4 border-t border-[#34435B]/40">
          <JobQueueDistributionChart
            counts={queueStats?.counts || { total: 0, waiting: 0, active: 0, completed: 0, failed: 0, cancelled: 0, byQueue: {} }}
          />
        </div>
      </div>

      {/* Job Enqueue Dispatch Form */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card max-w-full min-w-0">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Play className="w-4 h-4 text-[#6257F5]" />
          Dispatch New Background Job
        </h3>

        {/* Tabs */}
        <div className="flex border-b border-[#34435B] mb-5 gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'email', label: 'Email Job', icon: <Send className="w-3.5 h-3.5" /> },
            { id: 'report', label: 'Report Job', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'analytics', label: 'Analytics Job', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'maintenance', label: 'Maintenance Job', icon: <Wrench className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 pb-2.5 px-3.5 text-xs font-bold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-[#6257F5] text-[#A99CFB]'
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={emailForm.recipient}
                  onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Template</label>
                <select
                  value={emailForm.template}
                  onChange={(e) => setEmailForm({ ...emailForm, template: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                >
                  <option value="welcome">Welcome Onboarding</option>
                  <option value="security_alert">Security Alert</option>
                  <option value="report_ready">Report Ready Notice</option>
                  <option value="system_notification">System Notification</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="simulateFailureEmail"
                  checked={emailForm.simulateFailure}
                  onChange={(e) => setEmailForm({ ...emailForm, simulateFailure: e.target.checked })}
                  className="rounded bg-[#141F30] border-[#34435B] text-[#6257F5] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="simulateFailureEmail" className="text-xs text-[#F16C80] font-medium cursor-pointer">
                  Simulate SMTP delivery failure (tests retry & exponential backoff)
                </label>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Report Type</label>
                <select
                  value={reportForm.reportType}
                  onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                >
                  <option value="performance_audit">Performance Audit</option>
                  <option value="activity_summary">Activity Summary</option>
                  <option value="system_health">System Health Digest</option>
                  <option value="error_analysis">Error Distribution Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Timeframe</label>
                <select
                  value={reportForm.timeframe}
                  onChange={(e) => setReportForm({ ...reportForm, timeframe: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                >
                  <option value="1h">Past 1 Hour</option>
                  <option value="24h">Past 24 Hours</option>
                  <option value="7d">Past 7 Days</option>
                  <option value="30d">Past 30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Compute Delay</label>
                <select
                  value={reportForm.computationDelayMs}
                  onChange={(e) => setReportForm({ ...reportForm, computationDelayMs: Number(e.target.value) })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                >
                  <option value={500}>500ms (Quick)</option>
                  <option value={1500}>1500ms (Heavy)</option>
                  <option value={3000}>3000ms (Intensive)</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="simulateFailureReport"
                  checked={reportForm.simulateFailure}
                  onChange={(e) => setReportForm({ ...reportForm, simulateFailure: e.target.checked })}
                  className="rounded bg-[#141F30] border-[#34435B] text-[#6257F5] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="simulateFailureReport" className="text-xs text-[#F16C80] font-medium cursor-pointer">
                  Simulate compute worker crash (tests retry policy)
                </label>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Metric Type</label>
                <select
                  value={analyticsForm.metricType}
                  onChange={(e) => setAnalyticsForm({ ...analyticsForm, metricType: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                >
                  <option value="latency_percentiles">Latency Percentiles (P50 - P99)</option>
                  <option value="status_distribution">Status Distribution</option>
                  <option value="cache_efficiency">Cache Efficiency Metrics</option>
                  <option value="throughput_trend">Throughput Trend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sample Size</label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={analyticsForm.sampleSize}
                  onChange={(e) => setAnalyticsForm({ ...analyticsForm, sampleSize: Number(e.target.value) })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Resolution</label>
                <select
                  value={analyticsForm.resolution}
                  onChange={(e) => setAnalyticsForm({ ...analyticsForm, resolution: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Maintenance Task</label>
                <select
                  value={maintenanceForm.task}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, task: e.target.value })}
                  className="w-full bg-[#141F30] border border-[#34435B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6257F5]"
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
                  className="rounded bg-[#141F30] border-[#34435B] text-[#6257F5] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="simulateFailureMaint" className="text-xs text-[#F16C80] font-medium cursor-pointer">
                  Simulate lock failure (tests retry)
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#6257F5] hover:bg-[#5346EE] text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-[#6257F5]/30 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting to Queue...' : 'Enqueue Background Job'}
            </button>
          </div>
        </form>
      </div>

      {/* Jobs History Table */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Live Job Queue History ({filteredJobs.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141F30] border border-[#34435B] text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6257F5]"
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
            <thead className="bg-[#141F30] text-slate-400 border-b border-[#34435B] uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Job ID</th>
                <th className="py-3 px-3.5">Queue</th>
                <th className="py-3 px-3.5">Type</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Progress</th>
                <th className="py-3 px-3.5">Attempts</th>
                <th className="py-3 px-3.5">Time</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#34435B]/50 text-slate-300">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No background jobs found. Submit a job using the form above!
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-[#202E42] transition">
                    <td className="py-3 px-3.5 font-bold text-slate-100 truncate max-w-[140px]" title={job.jobId}>
                      {job.jobId}
                    </td>
                    <td className="py-3 px-3.5 text-[#A99CFB] font-semibold">
                      {job.queueName.replace('Queue', '')}
                    </td>
                    <td className="py-3 px-3.5 text-slate-200">{job.jobType}</td>
                    <td className="py-3 px-3.5">{getStatusBadge(job.status)}</td>
                    <td className="py-3 px-3.5">
                      <div className="w-24 bg-[#141F30] h-2 rounded-full overflow-hidden flex items-center border border-[#34435B]/40">
                        <div
                          className={`h-full transition-all duration-300 ${
                            job.status === 'failed'
                              ? 'bg-[#F16C80]'
                              : job.status === 'completed'
                              ? 'bg-[#65DDA5]'
                              : 'bg-[#6257F5]'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{job.progress}%</span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-300">
                      {job.attemptsMade} / {job.maxAttempts}
                    </td>
                    <td className="py-3 px-3.5 text-slate-300">
                      {job.processingTimeMs ? `${job.processingTimeMs}ms` : '—'}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => setSelectedJob(job)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-[#141F30] hover:bg-[#223249] text-slate-300 hover:text-white border border-[#34435B] transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.jobId)}
                            title="Retry Job"
                            className="p-1.5 rounded-lg bg-[#6257F5]/15 hover:bg-[#6257F5]/25 text-[#A99CFB] border border-[#6257F5]/30 transition"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.jobId)}
                          title="Delete Job"
                          className="p-1.5 rounded-lg bg-[#F16C80]/15 hover:bg-[#F16C80]/25 text-[#F16C80] border border-[#F16C80]/30 transition"
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
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#141F30] rounded-xl border border-[#34435B]">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold">Queue:</span>
                <div className="text-white font-bold">{selectedJob.queueName}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold">Status:</span>
                <div className="mt-0.5">{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold">Attempts:</span>
                <div className="text-white">{selectedJob.attemptsMade} of {selectedJob.maxAttempts}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold">Execution Time:</span>
                <div className="text-[#65DDA5] font-bold">
                  {selectedJob.processingTimeMs ? `${selectedJob.processingTimeMs}ms` : 'In progress'}
                </div>
              </div>
            </div>

            {selectedJob.error && (
              <div className="p-3.5 bg-[#F16C80]/15 border border-[#F16C80]/30 rounded-xl text-[#F16C80]">
                <span className="font-bold uppercase text-[10px] block mb-1">Execution Failure:</span>
                {selectedJob.error}
              </div>
            )}

            <div>
              <span className="text-slate-400 uppercase text-[10px] block mb-1 font-bold">Input Payload:</span>
              <pre className="p-3.5 bg-[#141F30] border border-[#34435B] rounded-xl text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>

            {selectedJob.result && (
              <div>
                <span className="text-[#65DDA5] uppercase text-[10px] block mb-1 font-bold">Worker Result Artifact:</span>
                <pre className="p-3.5 bg-[#141F30] border border-[#65DDA5]/30 rounded-xl text-[#65DDA5] overflow-x-auto">
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
