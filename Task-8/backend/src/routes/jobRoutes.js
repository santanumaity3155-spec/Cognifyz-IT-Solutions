import { Router } from 'express';
import {
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
} from '../controllers/jobController.js';
import { validateRequest } from '../middleware/validate.js';
import { jobEnqueueLimiter } from '../middleware/rateLimiter.js';
import {
  emailJobSchema,
  reportJobSchema,
  analyticsJobSchema,
  maintenanceJobSchema,
} from '../queues/jobTypes.js';

const router = Router();

// Queue Diagnostics & Statistics
router.get('/stats/summary', getQueueStats);

// List and single Job queries
router.get('/', getJobs);
router.get('/:jobId', getJobById);
router.get('/:jobId/result', getJobResult);

// Job Mutators
router.post('/:jobId/retry', retryJobById);
router.delete('/:jobId', deleteJobById);

// Enqueue Background Jobs
router.post(
  '/email',
  jobEnqueueLimiter,
  validateRequest({ body: emailJobSchema }),
  createEmailJob
);

router.post(
  '/report',
  jobEnqueueLimiter,
  validateRequest({ body: reportJobSchema }),
  createReportJob
);

router.post(
  '/analytics',
  jobEnqueueLimiter,
  validateRequest({ body: analyticsJobSchema }),
  createAnalyticsJob
);

router.post(
  '/maintenance',
  jobEnqueueLimiter,
  validateRequest({ body: maintenanceJobSchema }),
  createMaintenanceJob
);

export default router;

