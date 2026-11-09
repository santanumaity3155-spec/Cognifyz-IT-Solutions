import { z } from 'zod';

export const QUEUE_NAMES = {
  EMAIL: 'emailQueue',
  REPORT: 'reportQueue',
  ANALYTICS: 'analyticsQueue',
  MAINTENANCE: 'maintenanceQueue',
};

// 1. Email Job Schema
export const emailJobSchema = z.object({
  recipient: z.string().email('Invalid email address format'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(150),
  template: z.enum(['welcome', 'security_alert', 'report_ready', 'system_notification']).default('system_notification'),
  context: z.record(z.any()).optional().default({}),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  simulateFailure: z.boolean().optional().default(false),
});

// 2. Report Job Schema
export const reportJobSchema = z.object({
  reportType: z.enum(['performance_audit', 'activity_summary', 'system_health', 'error_analysis']),
  format: z.enum(['json', 'markdown', 'summary']).default('json'),
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  includeMetrics: z.boolean().optional().default(true),
  simulateFailure: z.boolean().optional().default(false),
  computationDelayMs: z.number().min(0).max(5000).optional().default(1000),
});

// 3. Analytics Job Schema
export const analyticsJobSchema = z.object({
  metricType: z.enum(['latency_percentiles', 'status_distribution', 'cache_efficiency', 'throughput_trend']),
  sampleSize: z.number().int().min(10).max(10000).default(100),
  resolution: z.enum(['minute', 'hour', 'day']).default('minute'),
  simulateFailure: z.boolean().optional().default(false),
});

// 4. Maintenance Job Schema
export const maintenanceJobSchema = z.object({
  task: z.enum(['purge_cache', 'vacuum_telemetry', 'rotate_logs', 'system_integrity_check']),
  force: z.boolean().optional().default(false),
  simulateFailure: z.boolean().optional().default(false),
});

export default {
  QUEUE_NAMES,
  emailJobSchema,
  reportJobSchema,
  analyticsJobSchema,
  maintenanceJobSchema,
};

