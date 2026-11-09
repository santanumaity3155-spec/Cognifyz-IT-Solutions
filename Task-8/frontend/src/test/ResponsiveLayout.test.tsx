import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import MiddlewarePage from '../pages/MiddlewarePage';
import JobsPage from '../pages/JobsPage';
import CachePage from '../pages/CachePage';

vi.mock('../services/api', () => ({
  fetchHealth: vi.fn().mockResolvedValue({
    status: 'UP',
    uptimeSeconds: 1200,
    timestamp: new Date().toISOString(),
    system: { platform: 'win32', nodeVersion: 'v20.0.0', cpuCount: 8, freeMemMb: 8192 },
    memory: { heapUsedMb: 64, heapTotalMb: 128, rssMb: 150 },
    infrastructure: {
      redis: { isConnected: true, mode: 'redis', host: '127.0.0.1', port: 6379, latencyMs: 1 },
      database: { isConnected: false, mode: 'in-memory-fallback', isPersistent: false },
    },
  }),
  fetchMiddlewareTelemetry: vi.fn().mockResolvedValue({
    summary: { totalRequests: 10, avgDurationMs: 4.5, p95DurationMs: 12, bufferSize: 10, statusCounts: { '2xx': 8, '4xx': 1, '5xx': 1 } },
    recentRequests: [
      { id: 'req_123', method: 'GET', path: '/api/health', status: 200, durationMs: 3.2, timestamp: new Date().toISOString(), ip: '127.0.0.1' },
    ],
  }),
  fetchQueueStats: vi.fn().mockResolvedValue({
    mode: 'redis_bullmq',
    isRedisConnected: true,
    queues: { emailQueue: { waiting: 0, active: 0, completed: 5, failed: 0 } },
    counts: { total: 5, completed: 5, failed: 0, active: 0, waiting: 0 },
  }),
  fetchJobs: vi.fn().mockResolvedValue({
    jobs: [
      {
        jobId: 'job_test_01',
        queueName: 'emailQueue',
        jobType: 'email',
        status: 'completed',
        progress: 100,
        attemptsMade: 1,
        maxAttempts: 3,
        processingTimeMs: 120,
        payload: { to: 'user@test.com' },
        createdAt: new Date().toISOString(),
      },
    ],
    total: 1,
  }),
  fetchCacheStats: vi.fn().mockResolvedValue({
    mode: 'redis',
    hitRatio: '85.0%',
    hits: 17,
    misses: 3,
    activeKeysCount: 2,
    keys: [
      { key: 'stats:dashboard', ttlSeconds: 45, sizeBytes: 256, createdAt: new Date().toISOString() },
    ],
  }),
  clearMiddlewareTelemetry: vi.fn().mockResolvedValue({ success: true }),
  testEchoEndpoint: vi.fn().mockResolvedValue({ success: true }),
  testSimulateError: vi.fn().mockResolvedValue({ success: false }),
  purgeCache: vi.fn().mockResolvedValue({ message: 'Cache purged' }),
  deleteCacheKey: vi.fn().mockResolvedValue({ message: 'Key deleted' }),
  fetchDemoStats: vi.fn().mockResolvedValue({ cacheHeader: 'HIT', responseTimeHeader: '1.2ms' }),
  fetchHeavyAnalytics: vi.fn().mockResolvedValue({ cacheHeader: 'HIT', responseTimeHeader: '2.5ms', data: { dataset: '10k' } }),
  executeBenchmark: vi.fn().mockResolvedValue({ direct: { avgMs: 10 }, cached: { avgMs: 0.5 }, speedupFactor: '20.0x' }),
  enqueueEmailJob: vi.fn().mockResolvedValue({ jobId: 'job_email_01' }),
  enqueueReportJob: vi.fn().mockResolvedValue({ jobId: 'job_report_01' }),
  retryJob: vi.fn().mockResolvedValue({ success: true }),
  deleteJob: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Responsive Layout and Overflow Verifications', () => {
  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Desktop layout (width 1280px) with sidebar and navigation links', async () => {
    setWindowWidth(1280);
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<div data-testid="overview-content">Overview Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('FORMA PLATFORM')).toBeInTheDocument();
    expect(screen.getByText('Background Jobs')).toBeInTheDocument();
    expect(screen.getByText('Middleware Inspector')).toBeInTheDocument();
    expect(screen.getByText('Cache & Performance')).toBeInTheDocument();
    expect(screen.getByTestId('overview-content')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Redis BullMQ')).toBeInTheDocument();
    });
  });

  it('renders Tablet layout (width 768px) with responsive container constraints', async () => {
    setWindowWidth(768);
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<div data-testid="tablet-content">Tablet View Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('overflow-x-hidden');
    expect(mainElement).toHaveClass('min-w-0');
    expect(mainElement).toHaveClass('max-w-full');

    await waitFor(() => {
      expect(screen.getByTestId('tablet-content')).toBeInTheDocument();
    });
  });

  it('renders Mobile layout (width 375px) with mobile drawer menu toggle', async () => {
    setWindowWidth(375);
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<div data-testid="mobile-content">Mobile View Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const toggleButton = container.querySelector('header button.md\\:hidden');
    expect(toggleButton).toBeTruthy();

    if (toggleButton) {
      fireEvent.click(toggleButton);
      const navLinks = screen.getAllByText('Background Jobs');
      expect(navLinks.length).toBeGreaterThanOrEqual(1);
    }

    await waitFor(() => {
      expect(screen.getByTestId('mobile-content')).toBeInTheDocument();
    });
  });

  it('verifies Background Jobs page renders horizontal scroll wrapper and min-w table', async () => {
    setWindowWidth(375);
    const { container } = render(
      <MemoryRouter>
        <JobsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Background Tasks & BullMQ Job Processing/i)).toBeInTheDocument();
    
    // Check that table container has overflow-x-auto to prevent horizontal page blowouts
    const overflowWrappers = container.querySelectorAll('.overflow-x-auto');
    expect(overflowWrappers.length).toBeGreaterThanOrEqual(1);

    const table = container.querySelector('table');
    expect(table).toHaveClass('min-w-[640px]');

    await waitFor(() => {
      expect(screen.getByText(/Live Job Queue History/i)).toBeInTheDocument();
    });
  });

  it('verifies Middleware Inspector uses TEST_SECRET_PLACEHOLDER in echo payload', async () => {
    const { container } = render(
      <MemoryRouter>
        <MiddlewarePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Middleware & Request Lifecycle Inspector/i)).toBeInTheDocument();
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.value).toContain('TEST_SECRET_PLACEHOLDER');
    expect(textarea.value).not.toContain('mySecretToken123');

    await waitFor(() => {
      expect(screen.getByText(/Live Request Log Stream/i)).toBeInTheDocument();
    });
  });

  it('verifies Cache & Performance Lab table has min-w and overflow containment', async () => {
    setWindowWidth(375);
    const { container } = render(
      <MemoryRouter>
        <CachePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Server-Side Caching & Performance Lab/i)).toBeInTheDocument();
    const table = container.querySelector('table');
    expect(table).toHaveClass('min-w-[550px]');

    await waitFor(() => {
      expect(screen.getByText(/Active Cache Keys/i)).toBeInTheDocument();
    });
  });
});
