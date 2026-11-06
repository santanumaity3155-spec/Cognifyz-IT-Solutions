import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Frontend Scaffold Verification', () => {
  it('renders Forma Student Intelligence Platform heading', () => {
    render(<App />);
    expect(screen.getByText(/Forma – Student Intelligence Platform/i)).toBeInTheDocument();
  });

  it('renders Level 3 Task 5 badge', () => {
    render(<App />);
    expect(screen.getByText(/Level 3, Task 5/i)).toBeInTheDocument();
  });
});

