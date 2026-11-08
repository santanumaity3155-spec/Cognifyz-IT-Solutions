import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Button from '../components/common/Button.tsx';
import Card from '../components/common/Card.tsx';
import Badge from '../components/common/Badge.tsx';
import ConfirmModal from '../components/common/ConfirmModal.tsx';
import ErrorAlert from '../components/common/ErrorAlert.tsx';
import LoadingState from '../components/common/LoadingState.tsx';
import EmptyState from '../components/common/EmptyState.tsx';
import ConnectionStatus from '../components/common/ConnectionStatus.tsx';
import Sidebar from '../components/common/Sidebar.tsx';
import Navbar from '../components/common/Navbar.tsx';
import ConnectGitHubCard from '../components/github/ConnectGitHubCard.tsx';
import { AuthProvider } from '../context/AuthContext.tsx';
import api from '../services/api.ts';

vi.mock('../services/api.ts', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Phase 8: Frontend UI Components and Shell Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: { success: true, data: null } });
  });

  describe('1. Reusable UI Components', () => {
    it('renders Button with variants and handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /Click Me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders Button in loading state and disables interaction', () => {
      const handleClick = vi.fn();
      render(<Button isLoading={true} onClick={handleClick}>Submit</Button>);

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders Card with title, subtitle and custom children', () => {
      render(
        <Card title="Test Card" subtitle="Test Subtitle">
          <p>Card Content</p>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('renders Badge with correct variant and text', () => {
      render(<Badge variant="success">Active Status</Badge>);
      expect(screen.getByText('Active Status')).toBeInTheDocument();
    });

    it('renders ErrorAlert with title, message and triggers retry callback', () => {
      const handleRetry = vi.fn();
      render(<ErrorAlert title="Network Error" message="Failed to load telemetry" onRetry={handleRetry} />);

      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load telemetry')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Retry Request/i });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders LoadingState spinner and skeleton styles', () => {
      const { rerender } = render(<LoadingState message="Fetching data..." />);
      expect(screen.getByText('Fetching data...')).toBeInTheDocument();

      rerender(<LoadingState type="skeleton" />);
      expect(screen.queryByText('Fetching data...')).not.toBeInTheDocument();
    });

    it('renders EmptyState with action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Repositories Found"
          message="You currently have no public repositories."
          actionLabel="Refresh"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('No Repositories Found')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: /Refresh/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders ConfirmModal and fires cancel/confirm callbacks', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <ConfirmModal
          isOpen={true}
          title="Disconnect GitHub?"
          message="Are you sure you want to proceed?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByText('Disconnect GitHub?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);

      const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('renders ConnectionStatus in both connected and disconnected states', () => {
      const { rerender } = render(<ConnectionStatus connected={false} />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();

      rerender(<ConnectionStatus connected={true} username="octocat" />);
      expect(screen.getByText(/Connected: @octocat/i)).toBeInTheDocument();
    });
  });

  describe('2. Navigation and Shell Components', () => {
    it('renders Sidebar with all 5 core navigation links', () => {
      render(
        <MemoryRouter>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Developer Profile')).toBeInTheDocument();
      expect(screen.getByText('Repository Explorer')).toBeInTheDocument();
      expect(screen.getByText('API Status')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders Navbar with title, branding, and hamburger trigger', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter>
          <AuthProvider>
            <Navbar onToggleSidebar={handleToggle} title="Developer Intelligence Dashboard" />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Forma')).toBeInTheDocument();
      expect(screen.getByText('Developer Intelligence Dashboard')).toBeInTheDocument();

      const toggleBtn = screen.getByLabelText(/Toggle navigation menu/i);
      fireEvent.click(toggleBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('renders ConnectGitHubCard with Connect button and least-privilege badges', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ConnectGitHubCard />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('GitHub OAuth 2.0 Integration')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Connect GitHub/i })).toBeInTheDocument();
      expect(screen.getByText('Read-only Scope')).toBeInTheDocument();
      expect(screen.getByText('AES-256-GCM Encrypted')).toBeInTheDocument();
    });
  });
});
