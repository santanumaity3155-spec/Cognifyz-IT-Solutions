import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Forma Frontend Scaffold', () => {
  it('renders application title and subtitle', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Forma – Student Intelligence Platform/i })).toBeInTheDocument();
    expect(screen.getByText(/Complex Form Validation/i)).toBeInTheDocument();
  });

  it('renders the 3 mandatory requirement feature cards', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 3, name: /^Validation$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^Dynamic DOM$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^Client Routing$/i })).toBeInTheDocument();
  });
});
