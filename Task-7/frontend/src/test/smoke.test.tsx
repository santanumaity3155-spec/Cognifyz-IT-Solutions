import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.tsx';

vi.mock('../services/api.ts', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  },
  api: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
  },
}));

describe('Task-7 Frontend Scaffolding Smoke Tests', () => {
  it('renders Forma Developer Intelligence Module shell correctly', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Advanced API Usage & Developer Intelligence/i })).toBeInTheDocument();
    const expertBadges = screen.getAllByText(/Level 4: Expert/i);
    expect(expertBadges.length).toBeGreaterThan(0);
  });

  it('displays the three core architecture cards', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 3, name: /OAuth 2.0 & Token Protection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /External API Integration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Rate Limiting & In-Memory TTL Cache/i })).toBeInTheDocument();
  });
});
