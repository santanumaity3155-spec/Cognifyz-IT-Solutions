export type RegistrationStatus = 'Active' | 'Pending' | 'Suspended' | 'Graduated';
export type Gender = 'Male' | 'Female' | 'Non-Binary' | 'Other';
export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'Postgraduate';

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
  course?: string;
  academicYear?: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  graduatedStudents: number;
  suspendedStudents: number;
  totalCourses: number;
  courseDistribution: DistributionItem[];
  academicYearDistribution: DistributionItem[];
  recentStudents: Student[];
  storageMode: string;
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

