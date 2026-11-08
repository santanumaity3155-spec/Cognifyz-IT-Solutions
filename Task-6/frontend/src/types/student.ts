export type RegistrationStatus = 'Active' | 'Pending' | 'Suspended' | 'Graduated';
export type Gender = 'Male' | 'Female' | 'Non-Binary' | 'Other';
export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'Postgraduate';

export interface StudentCreator {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export interface Student {
  _id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  collegeName: string;
  course: string;
  academicYear: AcademicYear;
  skills: string[];
  registrationStatus: RegistrationStatus;
  createdBy?: StudentCreator | string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  collegeName: string;
  course: string;
  academicYear: AcademicYear;
  skills: string[];
  registrationStatus: RegistrationStatus;
}

export interface DistributionItem {
  course: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  graduatedStudents: number;
  totalCourses: number;
  courseDistribution?: DistributionItem[];
  recentStudents?: Student[];
  scope: 'personal' | 'global';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentFilterOptions {
  search: string;
  course: string;
  academicYear: string;
  status: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  total?: number;
  count?: number;
  pagination?: PaginationMeta;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

