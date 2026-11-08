import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { StudentsPage } from '../pages/students/StudentsPage';
import { StudentDetailPage } from '../pages/students/StudentDetailPage';
import { AddStudentPage } from '../pages/students/AddStudentPage';
import { EditStudentPage } from '../pages/students/EditStudentPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import studentService from '../services/studentService';
import dashboardService from '../services/dashboardService';
import { Student } from '../types/student';
import { UserProfile } from '../services/authService';

// Mock studentService and dashboardService
vi.mock('../services/studentService', () => ({
  default: {
    getAllStudents: vi.fn(),
    getStudentById: vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
    resetSeedData: vi.fn(),
  },
}));

vi.mock('../services/dashboardService', () => ({
  default: {
    getStats: vi.fn(),
    getAdminOverview: vi.fn(),
  },
}));

const mockAdminUser: UserProfile = {
  id: 'usr_admin_01',
  name: 'System Admin',
  email: 'admin@forma.edu',
  role: 'Admin',
  isActive: true,
};

const mockStudentUser: UserProfile = {
  id: 'usr_student_01',
  name: 'Alex Mercer',
  email: 'alex.mercer@forma.edu',
  role: 'Student',
  isActive: true,
};

const mockStudentsList: Student[] = [
  {
    _id: 'stu_mongo_01',
    studentId: 'STU-2026-001',
    fullName: 'David Miller',
    email: 'david.miller@example.com',
    phone: '+1 555-123-4567',
    dateOfBirth: '2002-05-14',
    gender: 'Male',
    collegeName: 'Cognifyz Institute of Technology',
    course: 'Computer Science',
    academicYear: '3rd Year',
    skills: ['React', 'Node.js', 'MongoDB'],
    registrationStatus: 'Active',
    createdBy: {
      _id: 'usr_student_01',
      name: 'Alex Mercer',
      email: 'alex.mercer@forma.edu',
      role: 'Student',
    },
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    _id: 'stu_mongo_02',
    studentId: 'STU-2026-002',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 555-987-6543',
    dateOfBirth: '2003-09-22',
    gender: 'Female',
    collegeName: 'Cognifyz Institute of Technology',
    course: 'Data Science',
    academicYear: '2nd Year',
    skills: ['Python', 'Pandas', 'PyTorch'],
    registrationStatus: 'Pending',
    createdBy: {
      _id: 'usr_admin_01',
      name: 'System Admin',
      email: 'admin@forma.edu',
      role: 'Admin',
    },
    createdAt: '2026-01-15T12:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z',
  },
];

const createMockAuthContext = (user: UserProfile | null): AuthContextType => ({
  user,
  loading: false,
  isAuthenticated: !!user,
  isAdmin: user?.role === 'Admin',
  isStudent: user?.role === 'Student',
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
});

describe('Phase 11: Authenticated Student Management Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================
  // 1. STUDENT LISTING & ROLE DIFFERENCES
  // ========================================================
  describe('StudentsPage & Role Scope', () => {
    it('1.1 renders Admin student directory with Created By column and Reset Seed action', async () => {
      vi.mocked(studentService.getAllStudents).mockResolvedValueOnce({
        success: true,
        message: 'Students retrieved successfully',
        data: mockStudentsList,
        total: 2,
        count: 2,
        pagination: { page: 1, limit: 8, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockAdminUser)}>
            <StudentsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('System Student Directory')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reset Seed/i })).toBeInTheDocument();
        expect(screen.getAllByText('STU-2026-001')[0]).toBeInTheDocument();
        expect(screen.getAllByText('David Miller')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Elena Rostova')[0]).toBeInTheDocument();
        // Admin sees Created By column
        expect(screen.getByText('Created By')).toBeInTheDocument();
      });
    });

    it('1.2 renders Student personal directory without Reset Seed action or Created By column', async () => {
      vi.mocked(studentService.getAllStudents).mockResolvedValueOnce({
        success: true,
        message: 'Personal students retrieved',
        data: [mockStudentsList[0]], // Only owned record
        total: 1,
        count: 1,
        pagination: { page: 1, limit: 8, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <StudentsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('My Student Directory')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Reset Seed/i })).not.toBeInTheDocument();
        expect(screen.getAllByText('STU-2026-001')[0]).toBeInTheDocument();
        expect(screen.queryByText('Elena Rostova')).not.toBeInTheDocument();
        // Student does not need Created By column
        expect(screen.queryByText('Created By')).not.toBeInTheDocument();
      });
    });

    it('1.3 allows searching and updates list based on debounced search input', async () => {
      vi.mocked(studentService.getAllStudents).mockResolvedValue({
        success: true,
        message: 'Students retrieved',
        data: [mockStudentsList[0]],
        total: 1,
        count: 1,
        pagination: { page: 1, limit: 8, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockAdminUser)}>
            <StudentsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search by student ID, name/i);
      fireEvent.change(searchInput, { target: { value: 'David' } });

      await waitFor(() => {
        expect(studentService.getAllStudents).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'David' })
        );
      });
    });

    it('1.4 filters students by course selection', async () => {
      vi.mocked(studentService.getAllStudents).mockResolvedValue({
        success: true,
        message: 'Students retrieved',
        data: [mockStudentsList[0]],
        total: 1,
        count: 1,
        pagination: { page: 1, limit: 8, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockAdminUser)}>
            <StudentsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      const courseSelect = screen.getByDisplayValue('All Courses');
      fireEvent.change(courseSelect, { target: { value: 'Computer Science' } });

      await waitFor(() => {
        expect(studentService.getAllStudents).toHaveBeenCalledWith(
          expect.objectContaining({ course: 'Computer Science' })
        );
      });
    });
  });

  // ========================================================
  // 2. ADD STUDENT RECORD
  // ========================================================
  describe('AddStudentPage Component', () => {
    it('2.1 validates required fields before submission', async () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <AddStudentPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Register Student/i }));

      expect(await screen.findByText(/Full name must be at least 2 characters long/i)).toBeInTheDocument();
      expect(screen.getByText(/Please provide a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Valid phone number is required/i)).toBeInTheDocument();
      expect(studentService.createStudent).not.toHaveBeenCalled();
    });

    it('2.2 allows adding and removing skills dynamically', () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <AddStudentPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      const skillInput = screen.getByPlaceholderText(/e.g. React, Node.js/i);
      fireEvent.change(skillInput, { target: { value: 'TypeScript' } });
      fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

      expect(screen.getByText('TypeScript')).toBeInTheDocument();

      const removeBtn = screen.getByLabelText(/Remove skill TypeScript/i);
      fireEvent.click(removeBtn);

      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    });

    it('2.3 submits valid form and calls createStudent without client-supplied createdBy', async () => {
      vi.mocked(studentService.createStudent).mockResolvedValueOnce({
        success: true,
        message: 'Student record created successfully',
        data: mockStudentsList[0],
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <AddStudentPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Marcus Brody' } });
      fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'marcus.brody@example.com' } });
      fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+1 555-444-8888' } });
      fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '2001-08-15' } });

      fireEvent.click(screen.getByRole('button', { name: /Register Student/i }));

      await waitFor(() => {
        expect(studentService.createStudent).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Marcus Brody',
            email: 'marcus.brody@example.com',
            phone: '+1 555-444-8888',
            dateOfBirth: '2001-08-15',
          })
        );
      });
    });
  });

  // ========================================================
  // 3. EDIT STUDENT RECORD
  // ========================================================
  describe('EditStudentPage Component', () => {
    it('3.1 loads existing student data and populates edit form', async () => {
      vi.mocked(studentService.getStudentById).mockResolvedValueOnce({
        success: true,
        message: 'Student retrieved',
        data: mockStudentsList[0],
      });

      render(
        <MemoryRouter initialEntries={['/students/STU-2026-001/edit']}>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <Routes>
              <Route path="/students/:id/edit" element={<EditStudentPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('David Miller')).toBeInTheDocument();
        expect(screen.getByDisplayValue('david.miller@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+1 555-123-4567')).toBeInTheDocument();
      });
    });

    it('3.2 displays access error when backend rejects unauthorized edit attempt with 403', async () => {
      vi.mocked(studentService.getStudentById).mockRejectedValueOnce(
        new Error('You do not have permission to view or modify this student record.')
      );

      render(
        <MemoryRouter initialEntries={['/students/STU-2026-999/edit']}>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <Routes>
              <Route path="/students/:id/edit" element={<EditStudentPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Cannot Edit Student Record')).toBeInTheDocument();
        expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
      });
    });
  });

  // ========================================================
  // 4. STUDENT DETAIL PAGE
  // ========================================================
  describe('StudentDetailPage Component', () => {
    it('4.1 renders student profile details and displays creator info for Admin', async () => {
      vi.mocked(studentService.getStudentById).mockResolvedValueOnce({
        success: true,
        message: 'Student retrieved',
        data: mockStudentsList[0],
      });

      render(
        <MemoryRouter initialEntries={['/students/STU-2026-001']}>
          <AuthContext.Provider value={createMockAuthContext(mockAdminUser)}>
            <Routes>
              <Route path="/students/:id" element={<StudentDetailPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('David Miller')).toBeInTheDocument();
        expect(screen.getByText('ID: STU-2026-001')).toBeInTheDocument();
        expect(screen.getByText('david.miller@example.com')).toBeInTheDocument();
        expect(screen.getByText('Alex Mercer')).toBeInTheDocument(); // Creator info for Admin
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('Node.js')).toBeInTheDocument();
      });
    });
  });

  // ========================================================
  // 5. DELETE MODAL & CONFIRMATION
  // ========================================================
  describe('Delete Student Confirmation Flow', () => {
    it('5.1 opens delete confirmation modal and executes deletion upon confirmation', async () => {
      vi.mocked(studentService.getAllStudents).mockResolvedValueOnce({
        success: true,
        message: 'Students retrieved',
        data: [mockStudentsList[0]],
        total: 1,
        count: 1,
        pagination: { page: 1, limit: 8, totalPages: 1 },
      });

      vi.mocked(studentService.deleteStudent).mockResolvedValueOnce({
        success: true,
        message: 'Student deleted',
        data: mockStudentsList[0],
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <StudentsPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('David Miller')[0]).toBeInTheDocument();
      });

      // Click delete button
      const deleteBtn = screen.getAllByLabelText(/Delete David Miller/i)[0];
      fireEvent.click(deleteBtn);

      // Modal should appear
      expect(screen.getByText('Confirm Student Deletion')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeInTheDocument();

      // Confirm deletion
      const confirmBtn = screen.getByRole('button', { name: /Delete Student/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(studentService.deleteStudent).toHaveBeenCalledWith('STU-2026-001');
      });
    });
  });

  // ========================================================
  // 6. DASHBOARD INTEGRATION
  // ========================================================
  describe('DashboardPage Role-Based Metrics', () => {
    it('6.1 displays global metrics and course distribution breakdown for Admin', async () => {
      vi.mocked(dashboardService.getStats).mockResolvedValueOnce({
        success: true,
        message: 'System-wide analytics',
        data: {
          totalStudents: 42,
          activeStudents: 35,
          pendingStudents: 5,
          graduatedStudents: 2,
          totalCourses: 5,
          scope: 'global',
          courseDistribution: [
            { course: 'Computer Science', count: 20, percentage: 48 },
            { course: 'Data Science', count: 12, percentage: 29 },
          ],
        },
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockAdminUser)}>
            <DashboardPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Administrator Mode: You possess full system-wide permissions/i)).toBeInTheDocument();
        expect(screen.getByText('Total Students (System)')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('System Course Enrollment Distribution')).toBeInTheDocument();
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
        expect(screen.getByText('Data Science')).toBeInTheDocument();
      });
    });

    it('6.2 displays scoped personal metrics for Student', async () => {
      vi.mocked(dashboardService.getStats).mockResolvedValueOnce({
        success: true,
        message: 'Personal analytics',
        data: {
          totalStudents: 3,
          activeStudents: 3,
          pendingStudents: 0,
          graduatedStudents: 0,
          totalCourses: 1,
          scope: 'personal',
          courseDistribution: [
            { course: 'Computer Science', count: 3, percentage: 100 },
          ],
        },
      });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={createMockAuthContext(mockStudentUser)}>
            <DashboardPage />
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Student Mode: Your session is cryptographically scoped/i)).toBeInTheDocument();
        expect(screen.getByText('My Student Records')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });
});
