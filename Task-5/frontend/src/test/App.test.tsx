import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Phase 6: Frontend Routing & Navigation Component Tests', () => {
  it('renders Forma branding and main navigation items', () => {
    render(<App />);

    // Brand logo & title
    expect(screen.getByText('FORMA')).toBeInTheDocument();
    expect(screen.getByText('Student Intelligence')).toBeInTheDocument();

    // Navigation links in Sidebar
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Students Directory')).toBeInTheDocument();
    expect(screen.getByText('Add New Student')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('renders landing page with Level 3 Task 5 showcase banner', () => {
    render(<App />);

    expect(
      screen.getByText(/FORMA – Student Intelligence Platform/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Official Task 5 Requirements/i)).toBeInTheDocument();
    expect(screen.getByText('RESTful API Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Interactive Frontend Client')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Data Fetching')).toBeInTheDocument();
  });
});
