import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('Phase 2: Frontend Scaffolding Smoke Test', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            service: 'Forma – Student Intelligence Platform API',
            status: 'Operational',
            task: 'Cognifyz Level 3 - Task 6',
          }),
      })
    ));
  });

  it('renders Forma Task 6 heading, requirement cards, and health status', async () => {
    render(<App />);
    expect(screen.getByText(/Forma – Student Intelligence Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. MongoDB Integration/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. User Authentication/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Role-Based Authorization/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Connected:/i)).toBeInTheDocument();
    });
  });
});
