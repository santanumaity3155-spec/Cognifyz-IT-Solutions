import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { StudentTable } from '../components/students/StudentTable';
import { StudentFilterBar } from '../components/students/StudentFilterBar';
import { StudentForm } from '../components/students/StudentForm';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Pagination } from '../components/common/Pagination';
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
  skills: ['React', 'Node.js', 'TypeScript'],
  registrationStatus: 'Active',
  createdAt: '2026-01-15T09:00:00.000Z',
  updatedAt: '2026-01-15T09:00:00.000Z',
};

describe('Phase 8: Student Management and CRUD Component Tests', () => {
  // 1. Student Table
  it('StudentTable renders student data and columns accurately', () => {
    render(
      <BrowserRouter>
        <StudentTable students={[sampleStudent]} />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Alex Rivera').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('STU-2026-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('alex.rivera@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('+1 (555) 234-5678').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Computer Science').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
  });

  it('StudentTable renders empty state when students array is empty', () => {
    render(
      <BrowserRouter>
        <StudentTable students={[]} />
      </BrowserRouter>
    );

    expect(screen.getByText('No Students Found')).toBeInTheDocument();
    expect(screen.getByText('Add Student')).toBeInTheDocument();
  });

  // 2. Student Filter Bar
  it('StudentFilterBar renders search input and filter dropdowns', async () => {
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
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    await vi.waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith({ search: 'Priya', page: 1 });
    });
  });

  // 3. Student Form Validation
  it('StudentForm validates required fields and blocks submission on invalid input', () => {
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <StudentForm onSubmit={onSubmit} isEdit={false} />
      </BrowserRouter>
    );

    const submitBtn = screen.getByText('Register Student');
    fireEvent.click(submitBtn);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Full name must be at least 2 characters long/i)).toBeInTheDocument();
  });

  it('StudentForm allows adding and removing technical skills chips', () => {
    const onSubmit = vi.fn();

    render(
      <BrowserRouter>
        <StudentForm onSubmit={onSubmit} isEdit={false} />
      </BrowserRouter>
    );

    const skillInput = screen.getByPlaceholderText(/press add or enter/i);
    fireEvent.change(skillInput, { target: { value: 'Docker' } });
    fireEvent.click(screen.getByText('Add'));

    expect(screen.getByText('Docker')).toBeInTheDocument();

    const removeBtn = screen.getByLabelText('Remove skill Docker');
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Docker')).not.toBeInTheDocument();
  });

  // 4. Confirm Modal
  it('ConfirmModal triggers onConfirm and onCancel callbacks', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmModal
        isOpen={true}
        title="Delete Student Record"
        message="Are you sure you want to delete this student?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Delete Student Record')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    // When closed, modal should not render
    rerender(
      <ConfirmModal
        isOpen={false}
        title="Delete Student Record"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    expect(screen.queryByText('Delete Student Record')).not.toBeInTheDocument();
  });

  // 5. Pagination
  it('Pagination renders current page info and triggers onPageChange', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        pagination={{ page: 1, limit: 10, totalPages: 3 }}
        total={25}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText('Next')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

