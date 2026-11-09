export interface SystemHealth {
  status: 'UP' | 'DOWN';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  port: number;
  uptimeSeconds: number;
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
  };
  system: {
    platform: string;
    nodeVersion: string;
    cpuCount: number;
    freeMemMb: number;
    totalMemMb: number;
  };
  infrastructure: {
    database: {
      mode: string;
      state: string;
      isConnected: boolean;
      isPersistent: boolean;
      host: string | null;
      databaseName: string | null;
      error: string | null;
    };
    redis: {
      mode: string;
      state: string;
      isConnected: boolean;
      isAvailable: boolean;
      host: string;
      port: number;
      latencyMs: number | null;
      error: string | null;
    };
  };
}

export interface RequestLogEntry {
  id: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip: string;
  userAgent: string;
  contentLength: number;
  timestamp: string;
}

export interface TelemetrySummary {
  totalRequests: number;
  statusCounts: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  p95DurationMs: number;
  bufferSize: number;
}

export interface MiddlewareTelemetryData {
  summary: TelemetrySummary;
  recentRequests: RequestLogEntry[];
}

export interface BackgroundJob {
  _id?: string;
  jobId: string;
  queueName: string;
  jobType: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'cancelled';
  payload: Record<string, any>;
  result: any;
  progress: number;
  error: string | null;
  attemptsMade: number;
  maxAttempts: number;
  processingTimeMs: number | null;
  processedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueDiagnostics {
  mode: 'redis_bullmq' | 'in_memory_async_fallback';
  isRedisConnected: boolean;
  concurrency: number;
  activeWorkers: number;
  pendingInFallbackQueue: number;
  queues: string[];
  counts: {
    total: number;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    byQueue: Record<string, number>;
  };
}

export interface CacheKeyMeta {
  key: string;
  ttlSeconds: number;
  sizeBytes: number;
  createdAt: string;
}

export interface CacheStats {
  mode: 'redis' | 'in_memory_fallback';
  isRedisConnected: boolean;
  namespace: string;
  hits: number;
  misses: number;
  totalReads: number;
  hitRatio: string;
  totalWrites: number;
  activeKeysCount: number;
  keys: CacheKeyMeta[];
}

export interface BenchmarkResult {
  timestamp: string;
  measurements: {
    uncachedMs: number;
    coldCacheWriteMs: number;
    cacheHit1Ms: number;
    cacheHit2Ms: number;
    avgCacheHitMs: number;
  };
  comparison: {
    speedupMultiplier: string;
    latencyReduction: string;
    cacheStatus: string;
    storageSource: string;
  };
}

