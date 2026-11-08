import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.tsx';

describe('Task-7 Frontend Scaffolding Smoke Tests', () => {
  it('renders Forma Developer Intelligence Module shell correctly', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Forma Developer Intelligence Module/i })).toBeInTheDocument();
    const expertBadges = screen.getAllByText(/Level 4: Expert/i);
    expect(expertBadges.length).toBeGreaterThan(0);
  });

  it('displays the three core architecture cards', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 3, name: /OAuth 2.0 & Token Protection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /External API Integration/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Reliability & Rate Limiting/i })).toBeInTheDocument();
  });
});
