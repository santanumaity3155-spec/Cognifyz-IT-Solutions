import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { StudentDetailPage } from '../pages/StudentDetailPage';
import * as studentHook from '../hooks/useStudent';
import * as healthHook from '../hooks/useHealth';
import { Student } from '../types/student';

const sampleStudent: Student = {
  _id: '672b1001a1b2c3d4e5f60001',
  studentId: 'STU-2026-001',
  fullName: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  phone: '+1 (555) 234-5678',
  dateOfBirth: '2003-04-12',
  gender: 'Male',
  collegeName: 'Cognifyz Institute of Technology',
  course: 'Computer Science',
  academicYear: '3rd Year',
  skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
  registrationStatus: 'Active',
  createdAt: '2026-01-15T09:00:00.000Z',
  updatedAt: '2026-01-15T09:00:00.000Z',
};

describe('Phase 11: Application Pages and Routing Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Landing Page
  it('LandingPage renders hero header, feature highlights, and start button', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('FORMA – Student Intelligence Platform')).toBeInTheDocument();
    expect(screen.getByText('Open Dashboard')).toBeInTheDocument();
    expect(screen.getByText('RESTful API Endpoints')).toBeInTheDocument();
    expect(screen.getByText('Interactive Frontend Client')).toBeInTheDocument();
  });

  // 2. 404 Not Found Page
  it('NotFoundPage renders 404 message and navigation links', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Error 404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Back Home')).toBeInTheDocument();
  });

  // 3. Settings Page
  it('SettingsPage displays server health status and platform configuration', () => {
    vi.spyOn(healthHook, 'useHealth').mockReturnValue({
      health: {
        success: true,
        message: 'Forma API is healthy',
        service: 'Forma – Student Intelligence Platform API',
        version: '1.0.0',
        uptime: '2m 15s',
        environment: 'development',
        timestamp: '2026-11-08T09:30:00.000Z',
        database: {
          isConnected: true,
          mode: 'in-memory-fallback',
          databaseName: 'forma_task5',
          statusMessage: 'In-Memory fallback store active',
        },
      },
      isOnline: true,
      isLoading: false,
      error: null,
      checkHealth: vi.fn(),
    });

    render(
      <BrowserRouter>
        <SettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Platform Settings')).toBeInTheDocument();
    expect(screen.getByText('In-Memory fallback store active')).toBeInTheDocument();
    expect(screen.getByText('Backend Base URL')).toBeInTheDocument();
  });

  // 4. Student Detail Page
  it('StudentDetailPage renders student profile, academic information, and action buttons', () => {
    vi.spyOn(studentHook, 'useStudent').mockReturnValue({
      student: sampleStudent,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/students/672b1001a1b2c3d4e5f60001']}>
        <StudentDetailPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Alex Rivera').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('STU-2026-001')).toBeInTheDocument();
    expect(screen.getByText('alex.rivera@example.com')).toBeInTheDocument();
    expect(screen.getByText('Cognifyz Institute of Technology')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('(3rd Year)')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Edit Student')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
