import { randomUUID } from 'crypto';
import { getTelemetryData, clearTelemetry } from '../services/telemetryService.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Process an email notification job.
 */
export const processEmailJob = async (job, updateProgress) => {
  const { data } = job;
  await updateProgress(15);
  await sleep(200);

  if (data.simulateFailure) {
    throw new Error('Simulated SMTP delivery failure: 554 Transaction failed');
  }

  await updateProgress(50);
  await sleep(200);

  const messageId = `<forma-${randomUUID().slice(0, 8)}@mail.forma-platform.internal>`;
  const renderedContent = `[Mock SMTP Dispatch] Template '${data.template}' sent to ${data.recipient}. Subject: ${data.subject}`;

  await updateProgress(100);

  return {
    delivered: true,
    transport: 'Mock SMTP Transport (Development Mode)',
    messageId,
    recipient: data.recipient,
    subject: data.subject,
    template: data.template,
    dispatchedAt: new Date().toISOString(),
    contentPreview: renderedContent,
  };
};

/**
 * Process a heavy report generation job.
 */
export const processReportJob = async (job, updateProgress) => {
  const { data } = job;
  const delay = data.computationDelayMs || 500;

  await updateProgress(20);
  await sleep(delay * 0.3);

  if (data.simulateFailure) {
    throw new Error('Simulated report generation failure: Out of compute memory during aggregation');
  }

  await updateProgress(50);
  await sleep(delay * 0.4);

  const telemetry = getTelemetryData();
  const generatedAt = new Date().toISOString();

  await updateProgress(85);
  await sleep(delay * 0.3);

  const reportId = `REP-${randomUUID().slice(0, 8).toUpperCase()}`;

  const reportContent = {
    reportId,
    reportType: data.reportType,
    timeframe: data.timeframe,
    format: data.format,
    generatedAt,
    summary: {
      totalRequestsTracked: telemetry.summary.totalRequests,
      avgLatencyMs: telemetry.summary.avgDurationMs,
      p95LatencyMs: telemetry.summary.p95DurationMs,
      statusBreakdown: telemetry.summary.statusCounts,
    },
    recommendations: [
      'Enable server-side caching for hot read-only analytics endpoints.',
      'Maintain background worker concurrency at 3-5 workers to handle burst requests.',
      'Ensure Redis persistence is enabled with AOF (append-only file) in production.',
    ],
  };

  await updateProgress(100);
  return reportContent;
};

/**
 * Process an analytics computation job.
 */
export const processAnalyticsJob = async (job, updateProgress) => {
  const { data } = job;

  await updateProgress(25);
  await sleep(300);

  if (data.simulateFailure) {
    throw new Error('Simulated analytics processing error: Sampling buffer overflow');
  }

  await updateProgress(60);
  await sleep(300);

  const telemetry = getTelemetryData();
  const sampleCount = data.sampleSize || 100;

  // Synthesize realistic percentile curves based on real recorded latency
  const baseLatency = telemetry.summary.avgDurationMs || 3.5;
  const metrics = {
    metricType: data.metricType,
    samplesAnalyzed: Math.min(sampleCount, Math.max(telemetry.summary.totalRequests, 20)),
    resolution: data.resolution,
    computedAt: new Date().toISOString(),
    percentiles: {
      p50: Math.round(baseLatency * 0.85 * 100) / 100,
      p75: Math.round(baseLatency * 1.15 * 100) / 100,
      p90: Math.round(baseLatency * 1.6 * 100) / 100,
      p95: Math.round(baseLatency * 2.1 * 100) / 100,
      p99: Math.round(baseLatency * 3.4 * 100) / 100,
    },
    distribution: telemetry.summary.statusCounts,
  };

  await updateProgress(100);
  return metrics;
};

/**
 * Process a maintenance job.
 */
export const processMaintenanceJob = async (job, updateProgress) => {
  const { data } = job;

  await updateProgress(30);
  await sleep(250);

  if (data.simulateFailure) {
    throw new Error('Simulated maintenance failure: Lock acquisition timeout');
  }

  await updateProgress(70);
  await sleep(250);

  let details = {};
  if (data.task === 'vacuum_telemetry') {
    clearTelemetry();
    details = { message: 'In-memory telemetry buffer reset and compacted.', reclaimedEntries: 50 };
  } else {
    details = { message: `Task '${data.task}' completed successfully.`, status: 'OPTIMIZED' };
  }

  await updateProgress(100);
  return {
    task: data.task,
    executedAt: new Date().toISOString(),
    force: !!data.force,
    details,
  };
};

export default {
  processEmailJob,
  processReportJob,
  processAnalyticsJob,
  processMaintenanceJob,
};

