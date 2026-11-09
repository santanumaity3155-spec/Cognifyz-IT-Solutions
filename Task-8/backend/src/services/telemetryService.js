/**
 * In-memory telemetry service recording real-time request logs and metrics.
 * Uses a ring buffer to store the last 100 completed requests.
 */

const MAX_LOG_ENTRIES = 100;
const requestLog = [];
let totalRequests = 0;
let totalDurationMs = 0;
let minDurationMs = Infinity;
let maxDurationMs = 0;
const statusCounts = {
  '2xx': 0,
  '3xx': 0,
  '4xx': 0,
  '5xx': 0,
};

export const recordRequest = (entry) => {
  totalRequests += 1;
  const duration = entry.durationMs || 0;
  totalDurationMs += duration;

  if (duration < minDurationMs) minDurationMs = duration;
  if (duration > maxDurationMs) maxDurationMs = duration;

  const statusGroup = `${Math.floor(entry.status / 100)}xx`;
  if (statusCounts[statusGroup] !== undefined) {
    statusCounts[statusGroup] += 1;
  }

  requestLog.unshift({
    id: entry.id,
    method: entry.method,
    path: entry.path,
    status: entry.status,
    durationMs: entry.durationMs,
    ip: entry.ip,
    userAgent: entry.userAgent || 'unknown',
    contentLength: entry.contentLength || 0,
    timestamp: entry.timestamp || new Date().toISOString(),
  });

  if (requestLog.length > MAX_LOG_ENTRIES) {
    requestLog.pop();
  }
};

export const getTelemetryData = () => {
  const avgDurationMs = totalRequests > 0 ? Math.round((totalDurationMs / totalRequests) * 100) / 100 : 0;
  
  // Calculate P95 latency from recent buffer
  const sortedDurations = requestLog.map((r) => r.durationMs).sort((a, b) => a - b);
  let p95DurationMs = 0;
  if (sortedDurations.length > 0) {
    const idx = Math.floor(sortedDurations.length * 0.95);
    p95DurationMs = sortedDurations[Math.min(idx, sortedDurations.length - 1)];
  }

  return {
    summary: {
      totalRequests,
      statusCounts,
      avgDurationMs,
      minDurationMs: minDurationMs === Infinity ? 0 : minDurationMs,
      maxDurationMs,
      p95DurationMs,
      bufferSize: requestLog.length,
    },
    recentRequests: [...requestLog],
  };
};

export const clearTelemetry = () => {
  requestLog.length = 0;
  totalRequests = 0;
  totalDurationMs = 0;
  minDurationMs = Infinity;
  maxDurationMs = 0;
  statusCounts['2xx'] = 0;
  statusCounts['3xx'] = 0;
  statusCounts['4xx'] = 0;
  statusCounts['5xx'] = 0;
};

export default { recordRequest, getTelemetryData, clearTelemetry };

