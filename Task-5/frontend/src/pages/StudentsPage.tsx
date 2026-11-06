import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { StudentFilterBar } from '../components/students/StudentFilterBar';
import { StudentTable } from '../components/students/StudentTable';
import { Button } from '../components/common/Button';
import { Student, StudentFilterOptions } from '../../types/student';

// Initial preview dataset representing the 10 seed students (scaffolded for Phase 6)
const initialScaffoldStudents: Student[] = [
  {
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
    skills: ['React', 'Node.js', 'TypeScript', 'Tailwind CSS'],
    registrationStatus: 'Active',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    _id: '672b1001a1b2c3d4e5f60002',
    studentId: 'STU-2026-002',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+1 (555) 345-6789',
    dateOfBirth: '2004-08-23',
    gender: 'Female',
    collegeName: 'Cognifyz Institute of Technology',
    course: 'Data Science',
    academicYear: '2nd Year',
    skills: ['Python', 'SQL', 'Pandas'],
    registrationStatus: 'Active',
    createdAt: '2026-01-18T10:30:00.000Z',
    updatedAt: '2026-01-18T10:30:00.000Z',
  },
  {
    _id: '672b1001a1b2c3d4e5f60003',
    studentId: 'STU-2026-003',
    fullName: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    phone: '+1 (555) 456-7890',
    dateOfBirth: '2002-11-05',
    gender: 'Male',
    collegeName: 'Metropolitan Engineering College',
    course: 'Information Technology',
    academicYear: '4th Year',
    skills: ['AWS', 'Docker', 'Linux'],
    registrationStatus: 'Pending',
    createdAt: '2026-01-20T14:15:00.000Z',
    updatedAt: '2026-01-20T14:15:00.000Z',
  },
  {
    _id: '672b1001a1b2c3d4e5f60004',
    studentId: 'STU-2026-004',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 567-8901',
    dateOfBirth: '2005-02-17',
    gender: 'Female',
    collegeName: 'Cognifyz Institute of Technology',
    course: 'Electronics',
    academicYear: '1st Year',
    skills: ['C++', 'Arduino'],
    registrationStatus: 'Active',
    createdAt: '2026-01-25T11:00:00.000Z',
    updatedAt: '2026-01-25T11:00:00.000Z',
  },
  {
    _id: '672b1001a1b2c3d4e5f60005',
    studentId: 'STU-2026-005',
    fullName: 'Kevin Chen',
    email: 'kevin.chen@example.com',
    phone: '+1 (555) 678-9012',
    dateOfBirth: '2003-09-30',
    gender: 'Male',
    collegeName: 'Apex Institute of Technology',
    course: 'Mechanical',
    academicYear: '3rd Year',
    skills: ['MATLAB', 'SolidWorks'],
    registrationStatus: 'Active',
    createdAt: '2026-01-28T16:45:00.000Z',
    updatedAt: '2026-01-28T16:45:00.000Z',
  },
];

export const StudentsPage: React.FC = () => {
  const [filters, setFilters] = useState<StudentFilterOptions>({
    search: '',
    course: 'All',
    academicYear: 'All',
    status: 'All',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const handleFilterChange = (updates: Partial<StudentFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      course: 'All',
      academicYear: 'All',
      status: 'All',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  // Filter preview data locally for Phase 6 UI testing
  const filteredStudents = initialScaffoldStudents.filter((s) => {
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const match =
        s.fullName.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.course.toLowerCase().includes(term) ||
        s.studentId.toLowerCase().includes(term);
      if (!match) return false;
    }
    if (filters.course !== 'All' && s.course !== filters.course) return false;
    if (filters.academicYear !== 'All' && s.academicYear !== filters.academicYear) return false;
    if (filters.status !== 'All' && s.registrationStatus !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Students Directory</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, search and manage enrolled student profiles
          </p>
        </div>

        <Link to="/students/new">
          <Button icon={Plus}>Add Student</Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <StudentFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Student Table */}
      <StudentTable
        students={filteredStudents}
        onDeleteClick={(student) => setStudentToDelete(student)}
      />

      {/* Mock Delete Confirmation Modal for Phase 6 */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Student Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{studentToDelete.fullName}</span> ({studentToDelete.studentId})? In Phase 8, this will dispatch a real DELETE API request to the backend.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStudentToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  alert(`Phase 6 UI demonstration: Delete clicked for ${studentToDelete.studentId}. Live DELETE API connects in Phase 8.`);
                  setStudentToDelete(null);
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
