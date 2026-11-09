import { Queue, Worker } from 'bullmq';
import { randomUUID } from 'crypto';
import { getRedisClient, getRedisStatus, getRedisConnectionOptions } from '../config/redis.js';
import { JobLogRepository } from '../models/JobLog.js';
import { QUEUE_NAMES } from './jobTypes.js';
import {
  processEmailJob,
  processReportJob,
  processAnalyticsJob,
  processMaintenanceJob,
} from '../workers/jobProcessor.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/environment.js';

let isInitialized = false;
let queueMode = 'fallback'; // 'redis_bullmq' | 'in_memory_async_fallback'

const bullQueues = new Map();
const bullWorkers = new Map();

// In-memory async fallback runner structures
const fallbackQueue = [];
let activeWorkerCount = 0;
const MAX_CONCURRENCY = env.QUEUE_CONCURRENCY || 3;
let fallbackWorkerInterval = null;

const processors = {
  [QUEUE_NAMES.EMAIL]: processEmailJob,
  [QUEUE_NAMES.REPORT]: processReportJob,
  [QUEUE_NAMES.ANALYTICS]: processAnalyticsJob,
  [QUEUE_NAMES.MAINTENANCE]: processMaintenanceJob,
};

/**
 * Handle job execution and lifecycle inside the fallback runner.
 */
const runFallbackJob = async (jobItem) => {
  activeWorkerCount++;
  const { jobId, queueName, data, maxAttempts } = jobItem;
  const startTime = Date.now();

  try {
    await JobLogRepository.updateByJobId(jobId, {
      status: 'active',
      processedAt: new Date(),
      attemptsMade: (jobItem.attemptsMade || 0) + 1,
    });

    const processor = processors[queueName];
    if (!processor) {
      throw new Error(`No worker registered for queue: ${queueName}`);
    }

    const updateProgress = async (percent) => {
      jobItem.progress = percent;
      await JobLogRepository.updateByJobId(jobId, { progress: percent });
    };

    const result = await processor({ id: jobId, data, attemptsMade: jobItem.attemptsMade || 0 }, updateProgress);

    const duration = Date.now() - startTime;
    await JobLogRepository.updateByJobId(jobId, {
      status: 'completed',
      progress: 100,
      result,
      processingTimeMs: duration,
      completedAt: new Date(),
    });
    logger.info(`[QUEUE FALLBACK] Job ${jobId} (${queueName}) completed in ${duration}ms`);
  } catch (err) {
    const duration = Date.now() - startTime;
    const currentAttempts = (jobItem.attemptsMade || 0) + 1;
    jobItem.attemptsMade = currentAttempts;

    if (currentAttempts < maxAttempts) {
      // Exponential backoff retry
      const backoffDelay = Math.pow(2, currentAttempts) * 500;
      logger.warn(`[QUEUE RETRY] Job ${jobId} failed attempt ${currentAttempts}/${maxAttempts}: ${err.message}. Retrying in ${backoffDelay}ms...`);

      setTimeout(() => {
        fallbackQueue.unshift(jobItem);
        triggerFallbackProcessing();
      }, backoffDelay);

      await JobLogRepository.updateByJobId(jobId, {
        error: `Attempt ${currentAttempts} failed: ${err.message}. Retrying...`,
        attemptsMade: currentAttempts,
      });
    } else {
      // Exhausted retries
      logger.error(`[QUEUE FAILURE] Job ${jobId} failed permanently after ${currentAttempts} attempts: ${err.message}`);
      await JobLogRepository.updateByJobId(jobId, {
        status: 'failed',
        error: err.message,
        attemptsMade: currentAttempts,
        processingTimeMs: duration,
        failedAt: new Date(),
      });
    }
  } finally {
    activeWorkerCount--;
    triggerFallbackProcessing();
  }
};

const triggerFallbackProcessing = () => {
  while (activeWorkerCount < MAX_CONCURRENCY && fallbackQueue.length > 0) {
    const nextJob = fallbackQueue.shift();
    if (nextJob) {
      runFallbackJob(nextJob);
    }
  }
};

/**
 * Initialize Queue system (BullMQ with Redis, or asynchronous fallback runner).
 */
export const initQueues = async () => {
  if (isInitialized) return;

  const redisStatus = getRedisStatus();

  if (redisStatus.isConnected) {
    try {
      const connection = getRedisConnectionOptions();

      for (const queueName of Object.values(QUEUE_NAMES)) {
        const queue = new Queue(queueName, { connection });
        bullQueues.set(queueName, queue);

        const worker = new Worker(
          queueName,
          async (bullJob) => {
            const start = Date.now();
            await JobLogRepository.updateByJobId(bullJob.id, {
              status: 'active',
              processedAt: new Date(),
              attemptsMade: bullJob.attemptsMade + 1,
            });

            const processor = processors[queueName];
            const updateProgress = async (pct) => {
              await bullJob.updateProgress(pct);
              await JobLogRepository.updateByJobId(bullJob.id, { progress: pct });
            };

            const result = await processor(bullJob, updateProgress);
            const duration = Date.now() - start;

            await JobLogRepository.updateByJobId(bullJob.id, {
              status: 'completed',
              progress: 100,
              result,
              processingTimeMs: duration,
              completedAt: new Date(),
            });

            return result;
          },
          { connection, concurrency: MAX_CONCURRENCY }
        );

        worker.on('failed', async (bullJob, err) => {
          if (!bullJob) return;
          const currentAttempts = bullJob.attemptsMade;
          const maxAttempts = bullJob.opts.attempts || 3;
          logger.warn(`[BULLMQ WORKER FAILED] Job ${bullJob.id}: ${err.message} (${currentAttempts}/${maxAttempts})`);

          if (currentAttempts >= maxAttempts) {
            await JobLogRepository.updateByJobId(bullJob.id, {
              status: 'failed',
              error: err.message,
              failedAt: new Date(),
            });
          }
        });

        bullWorkers.set(queueName, worker);
      }

      queueMode = 'redis_bullmq';
      logger.info(`[QUEUES] BullMQ initialized with 4 Redis queues and workers.`);
      isInitialized = true;
      return;
    } catch (err) {
      logger.warn(`[QUEUES WARNING] BullMQ Redis initialization failed: ${err.message}. Activating Fallback Runner.`);
    }
  }

  // Fallback mode
  queueMode = 'in_memory_async_fallback';
  logger.info(`[QUEUES] Operating in In-Memory Asynchronous Queue Runner mode.`);
  isInitialized = true;
};

/**
 * Enqueue a new background job.
 * @param {string} queueName
 * @param {string} jobType
 * @param {object} payload
 * @param {object} [options={}]
 */
export const enqueueJob = async (queueName, jobType, payload, options = {}) => {
  const jobId = options.jobId || `job_${randomUUID()}`;
  const maxAttempts = options.attempts || 3;

  // Persist initial record
  await JobLogRepository.create({
    jobId,
    queueName,
    jobType,
    status: 'waiting',
    payload,
    maxAttempts,
    attemptsMade: 0,
    progress: 0,
  });

  if (queueMode === 'redis_bullmq' && bullQueues.has(queueName)) {
    try {
      const bullQueue = bullQueues.get(queueName);
      await bullQueue.add(jobType, payload, {
        jobId,
        attempts: maxAttempts,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      });
      return { jobId, queueName, jobType, mode: 'redis_bullmq', status: 'waiting' };
    } catch (err) {
      logger.warn(`[BULLMQ ADD ERROR] ${err.message}. Falling back to internal async runner for job ${jobId}`);
    }
  }

  // Push to internal async fallback queue
  const jobItem = {
    jobId,
    queueName,
    jobType,
    data: payload,
    maxAttempts,
    attemptsMade: 0,
    progress: 0,
  };

  fallbackQueue.push(jobItem);
  setImmediate(triggerFallbackProcessing);

  return { jobId, queueName, jobType, mode: queueMode, status: 'waiting' };
};

/**
 * Retry a failed job.
 */
export const retryJob = async (jobId) => {
  const jobRecord = await JobLogRepository.findByJobId(jobId);
  if (!jobRecord) {
    throw new Error(`Job ${jobId} not found.`);
  }

  if (jobRecord.status !== 'failed') {
    throw new Error(`Only failed jobs can be retried. Current status: ${jobRecord.status}`);
  }

  // Reset failure state
  await JobLogRepository.updateByJobId(jobId, {
    status: 'waiting',
    error: null,
    progress: 0,
    attemptsMade: 0,
  });

  if (queueMode === 'redis_bullmq' && bullQueues.has(jobRecord.queueName)) {
    const queue = bullQueues.get(jobRecord.queueName);
    const existing = await queue.getJob(jobId);
    if (existing) {
      await existing.retry();
      return { jobId, status: 'waiting', mode: 'redis_bullmq' };
    }
  }

  fallbackQueue.push({
    jobId,
    queueName: jobRecord.queueName,
    jobType: jobRecord.jobType,
    data: jobRecord.payload,
    maxAttempts: jobRecord.maxAttempts || 3,
    attemptsMade: 0,
    progress: 0,
  });
  setImmediate(triggerFallbackProcessing);

  return { jobId, status: 'waiting', mode: queueMode };
};

/**
 * Remove or cancel a job.
 */
export const removeJob = async (jobId) => {
  const jobRecord = await JobLogRepository.findByJobId(jobId);
  if (!jobRecord) return false;

  // Remove from fallback queue if pending
  const idx = fallbackQueue.findIndex((j) => j.jobId === jobId);
  if (idx !== -1) {
    fallbackQueue.splice(idx, 1);
  }

  if (queueMode === 'redis_bullmq' && bullQueues.has(jobRecord.queueName)) {
    try {
      const queue = bullQueues.get(jobRecord.queueName);
      const existing = await queue.getJob(jobId);
      if (existing) {
        await existing.remove();
      }
    } catch {}
  }

  await JobLogRepository.deleteByJobId(jobId);
  return true;
};

/**
 * Get queue status and diagnostics.
 */
export const getQueueDiagnostics = async () => {
  const counts = await JobLogRepository.getCounts();
  return {
    mode: queueMode,
    isRedisConnected: getRedisStatus().isConnected,
    concurrency: MAX_CONCURRENCY,
    activeWorkers: activeWorkerCount,
    pendingInFallbackQueue: fallbackQueue.length,
    queues: Object.values(QUEUE_NAMES),
    counts,
  };
};

/**
 * Gracefully close queues and workers.
 */
export const shutdownQueues = async () => {
  for (const worker of bullWorkers.values()) {
    try {
      await worker.close();
    } catch {}
  }
  for (const queue of bullQueues.values()) {
    try {
      await queue.close();
    } catch {}
  }
  bullWorkers.clear();
  bullQueues.clear();
  isInitialized = false;
};

export default {
  initQueues,
  enqueueJob,
  retryJob,
  removeJob,
  getQueueDiagnostics,
  shutdownQueues,
};

