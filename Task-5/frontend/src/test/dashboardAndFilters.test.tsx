import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { StudentFilterBar } from '../components/students/StudentFilterBar';
import * as dashboardHook from '../hooks/useDashboard';
import { ApiError } from '../services/api';

describe('Phase 9: Live Dashboard Analytics & Debounced Filters Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockStats = {
    totalStudents: 15,
    activeStudents: 10,
    pendingStudents: 3,
    graduatedStudents: 2,
    suspendedStudents: 0,
    totalCourses: 4,
    courseDistribution: [
      { course: 'Computer Science', count: 6, percentage: 40 },
      { course: 'Data Science', count: 4, percentage: 27 },
      { course: 'Electronics', count: 3, percentage: 20 },
      { course: 'Mechanical', count: 2, percentage: 13 },
    ],
    academicYearDistribution: [
      { academicYear: '1st Year', count: 5, percentage: 33 },
      { academicYear: '2nd Year', count: 4, percentage: 27 },
      { academicYear: '3rd Year', count: 3, percentage: 20 },
      { academicYear: '4th Year', count: 3, percentage: 20 },
    ],
    recentStudents: [
      {
        _id: '672b1001a1b2c3d4e5f60015',
        studentId: 'STU-2026-015',
        fullName: 'Lucas Scott',
        email: 'lucas.s@example.com',
        phone: '+1 (555) 000-9999',
        dateOfBirth: '2004-02-14',
        gender: 'Male' as const,
        collegeName: 'Cognifyz Institute of Technology',
        course: 'Computer Science',
        academicYear: '2nd Year' as const,
        skills: ['React', 'TypeScript'],
        registrationStatus: 'Active' as const,
        createdAt: '2026-02-15T09:00:00.000Z',
        updatedAt: '2026-02-15T09:00:00.000Z',
      },
    ],
    storageMode: 'in-memory-fallback',
  };

  // 1. Dashboard metrics and distributions rendering
  it('DashboardPage renders live statistics, distribution bars, and recent students', () => {
    vi.spyOn(dashboardHook, 'useDashboard').mockReturnValue({
      stats: mockStats,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Metric Cards
    expect(screen.getByText('15')).toBeInTheDocument(); // Total students
    expect(screen.getByText('10')).toBeInTheDocument(); // Active students
    expect(screen.getByText('3')).toBeInTheDocument(); // Pending students
    expect(screen.getByText('4')).toBeInTheDocument(); // Courses count

    // Course Distribution
    expect(screen.getByText('Course-Wise Student Distribution')).toBeInTheDocument();
    expect(screen.getAllByText('Computer Science').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('6 students (40%)')).toBeInTheDocument();

    // Academic Year Distribution
    expect(screen.getByText('Academic Year Breakdown')).toBeInTheDocument();
    expect(screen.getByText('1st Year')).toBeInTheDocument();
    expect(screen.getByText('5 students (33%)')).toBeInTheDocument();

    // Recent Students
    expect(screen.getByText('Lucas Scott')).toBeInTheDocument();
    expect(screen.getByText('STU-2026-015')).toBeInTheDocument();
    expect(screen.getByText('lucas.s@example.com')).toBeInTheDocument();
  });

  // 2. Dashboard error state handling
  it('DashboardPage renders ErrorBanner when stats request fails', () => {
    const mockRefetch = vi.fn();
    vi.spyOn(dashboardHook, 'useDashboard').mockReturnValue({
      stats: null,
      isLoading: false,
      error: new ApiError('Failed to load dashboard metrics', 500),
      refetch: mockRefetch,
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Failed to load dashboard metrics/i)).toBeInTheDocument();
    const retryBtn = screen.getByText('Retry Request');
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  // 3. Debounced Search & Clear Functionality in Filter Bar
  it('StudentFilterBar debounces search typing and provides instant clear button', async () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <StudentFilterBar
        filters={{
          search: '',
          course: 'All',
          academicYear: 'All',
          status: 'All',
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'Alex' } });

    // Should NOT call onFilterChange synchronously due to debounce
    expect(onFilterChange).not.toHaveBeenCalled();

    // Wait for the 300ms debounce to complete
    await waitFor(
      () => {
        expect(onFilterChange).toHaveBeenCalledWith({ search: 'Alex', page: 1 });
      },
      { timeout: 500 }
    );

    // Clear button appears
    const clearBtn = screen.getByTitle('Clear search');
    fireEvent.click(clearBtn);

    expect(onFilterChange).toHaveBeenCalledWith({ search: '', page: 1 });
  });

  // 4. Reset Filters Action
  it('StudentFilterBar reset button triggers onReset callback', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <StudentFilterBar
        filters={{
          search: 'query',
          course: 'Electronics',
          academicYear: '2nd Year',
          status: 'Active',
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />
    );

    const resetBtn = screen.getByTitle('Reset Filters');
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
