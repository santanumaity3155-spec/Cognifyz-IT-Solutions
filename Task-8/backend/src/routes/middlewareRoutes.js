import { Router } from 'express';
import {
  getMiddlewareTelemetry,
  resetMiddlewareTelemetry,
  echoRequest,
  simulateError,
} from '../controllers/middlewareController.js';

const router = Router();

router.get('/metrics', getMiddlewareTelemetry);
router.delete('/metrics', resetMiddlewareTelemetry);
router.post('/echo', echoRequest);
router.get('/simulate-error', simulateError);

export default router;

