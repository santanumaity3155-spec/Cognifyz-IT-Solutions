import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../components/common/Badge';

describe('Badge Component', () => {
  it('renders text with success variant', () => {
    render(<Badge variant="success" dot>Operational</Badge>);
    expect(screen.getByText('Operational')).toBeInTheDocument();
  });

  it('renders warning and error variants', () => {
    const { rerender } = render(<Badge variant="warning">Fallback</Badge>);
    expect(screen.getByText('Fallback')).toBeInTheDocument();

    rerender(<Badge variant="error">Failed</Badge>);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});

