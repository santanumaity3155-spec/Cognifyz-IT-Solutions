import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { initQueues, shutdownQueues } from '../src/queues/queueManager.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Background Job Queues & Worker Lifecycle', () => {
  beforeAll(async () => {
    await initQueues();
  });

  afterAll(async () => {
    await shutdownQueues();
  });

  it('rejects invalid email job payload with HTTP 422', async () => {
    const res = await request(app)
      .post('/api/jobs/email')
      .send({ recipient: 'not-an-email', subject: 'Hi' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('enqueues an email job and processes it to completion', async () => {
    const res = await request(app)
      .post('/api/jobs/email')
      .send({
        recipient: 'test.user@forma-example.com',
        subject: 'Weekly Platform Summary',
        template: 'system_notification',
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    const { jobId } = res.body.data;
    expect(jobId).toBeDefined();

    // Poll until completed (timeout 5s)
    let completed = false;
    let jobDetails = null;

    for (let i = 0; i < 20; i++) {
      await sleep(200);
      const pollRes = await request(app).get(`/api/jobs/${jobId}`);
      if (pollRes.body.data.status === 'completed') {
        completed = true;
        jobDetails = pollRes.body.data;
        break;
      }
    }

    expect(completed).toBe(true);
    expect(jobDetails.progress).toBe(100);
    expect(jobDetails.result).toHaveProperty('delivered', true);
    expect(jobDetails.result).toHaveProperty('messageId');
  });

  it('retrieves completed job result via /api/jobs/:id/result', async () => {
    // Enqueue lightweight report
    const res = await request(app)
      .post('/api/jobs/report')
      .send({
        reportType: 'activity_summary',
        timeframe: '24h',
        computationDelayMs: 100,
      });

    const { jobId } = res.body.data;

    // Wait for completion
    for (let i = 0; i < 20; i++) {
      await sleep(150);
      const poll = await request(app).get(`/api/jobs/${jobId}`);
      if (poll.body.data.status === 'completed') break;
    }

    const resultRes = await request(app).get(`/api/jobs/${jobId}/result`);
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.success).toBe(true);
    expect(resultRes.body.data.result).toHaveProperty('reportId');
    expect(resultRes.body.data.result).toHaveProperty('reportType', 'activity_summary');
  });

  it('handles simulated worker failures and handles retry', async () => {
    // Enqueue job with simulateFailure: true
    const res = await request(app)
      .post('/api/jobs/maintenance')
      .send({
        task: 'purge_cache',
        simulateFailure: true,
      });

    const { jobId } = res.body.data;

    // Wait until failed
    let isFailed = false;
    for (let i = 0; i < 25; i++) {
      await sleep(200);
      const poll = await request(app).get(`/api/jobs/${jobId}`);
      if (poll.body.data.status === 'failed') {
        isFailed = true;
        break;
      }
    }

    expect(isFailed).toBe(true);

    // Test retry endpoint
    const retryRes = await request(app).post(`/api/jobs/${jobId}/retry`);
    expect(retryRes.status).toBe(200);
    expect(retryRes.body.success).toBe(true);
  });

  it('returns queue statistics summary', async () => {
    const res = await request(app).get('/api/jobs/stats/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('mode');
    expect(res.body.data).toHaveProperty('counts');
    expect(res.body.data.counts).toHaveProperty('total');
  });

  it('deletes a job cleanly', async () => {
    const res = await request(app)
      .post('/api/jobs/email')
      .send({
        recipient: 'delete.me@forma-example.com',
        subject: 'Job to be deleted',
      });

    const { jobId } = res.body.data;
    const delRes = await request(app).delete(`/api/jobs/${jobId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const checkRes = await request(app).get(`/api/jobs/${jobId}`);
    expect(checkRes.status).toBe(404);
  });
});

