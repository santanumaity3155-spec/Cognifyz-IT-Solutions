import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/common/StatCard';

describe('StatCard Component', () => {
  it('renders title and numerical value correctly', () => {
    render(<StatCard title="Total Jobs" value={42} subtitle="2 active" />);
    expect(screen.getByText('Total Jobs')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('2 active')).toBeInTheDocument();
  });

  it('renders badge when provided', () => {
    render(<StatCard title="Cache Hit Ratio" value="94.2%" badge="Redis Live" badgeColor="green" />);
    expect(screen.getByText('94.2%')).toBeInTheDocument();
    expect(screen.getByText('Redis Live')).toBeInTheDocument();
  });
});

