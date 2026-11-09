import { enqueueJob, retryJob, removeJob, getQueueDiagnostics } from '../queues/queueManager.js';
import { QUEUE_NAMES } from '../queues/jobTypes.js';
import { JobLogRepository } from '../models/JobLog.js';

/**
 * Enqueue an Email Job.
 */
export const createEmailJob = async (req, res, next) => {
  try {
    const job = await enqueueJob(QUEUE_NAMES.EMAIL, 'email_notification', req.body, {
      attempts: req.body.simulateFailure ? 2 : 3,
    });

    res.status(202).json({
      success: true,
      message: 'Email job enqueued successfully.',
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Enqueue a Report Generation Job.
 */
export const createReportJob = async (req, res, next) => {
  try {
    const job = await enqueueJob(QUEUE_NAMES.REPORT, 'generate_report', req.body, {
      attempts: req.body.simulateFailure ? 2 : 3,
    });

    res.status(202).json({
      success: true,
      message: 'Report generation job enqueued successfully.',
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Enqueue an Analytics Job.
 */
export const createAnalyticsJob = async (req, res, next) => {
  try {
    const job = await enqueueJob(QUEUE_NAMES.ANALYTICS, 'compile_analytics', req.body, {
      attempts: req.body.simulateFailure ? 2 : 3,
    });

    res.status(202).json({
      success: true,
      message: 'Analytics compilation job enqueued successfully.',
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Enqueue a Maintenance Job.
 */
export const createMaintenanceJob = async (req, res, next) => {
  try {
    const job = await enqueueJob(QUEUE_NAMES.MAINTENANCE, 'system_maintenance', req.body, {
      attempts: req.body.simulateFailure ? 2 : 3,
    });

    res.status(202).json({
      success: true,
      message: 'Maintenance job enqueued successfully.',
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get paginated list of jobs with filtering.
 */
export const getJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.queueName) filter.queueName = req.query.queueName;
    if (req.query.status) filter.status = req.query.status;

    const { docs, total } = await JobLogRepository.find(filter, { skip, limit });

    res.status(200).json({
      success: true,
      data: {
        jobs: docs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single job status and payload by ID.
 */
export const getJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await JobLogRepository.findByJobId(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job with ID '${jobId}' was not found.`,
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get result of a completed job.
 */
export const getJobResult = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await JobLogRepository.findByJobId(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job with ID '${jobId}' was not found.`,
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'JOB_NOT_COMPLETED',
          message: `Job is currently in '${job.status}' state. Result is only available after completion.`,
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: job.jobId,
        status: job.status,
        completedAt: job.completedAt,
        processingTimeMs: job.processingTimeMs,
        result: job.result,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retry a failed job.
 */
export const retryJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const result = await retryJob(jobId);

    res.status(200).json({
      success: true,
      message: `Job ${jobId} successfully re-enqueued for retry.`,
      data: result,
    });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: err.message, requestId: req.id },
      });
    }
    if (err.message.includes('Only failed jobs')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_JOB_STATE', message: err.message, requestId: req.id },
      });
    }
    next(err);
  }
};

/**
 * Delete or cancel a job.
 */
export const deleteJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const deleted = await removeJob(jobId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job with ID '${jobId}' was not found.`,
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Job ${jobId} deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get queue metrics and diagnostics.
 */
export const getQueueStats = async (req, res, next) => {
  try {
    const stats = await getQueueDiagnostics();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createEmailJob,
  createReportJob,
  createAnalyticsJob,
  createMaintenanceJob,
  getJobs,
  getJobById,
  getJobResult,
  retryJobById,
  deleteJobById,
  getQueueStats,
};

