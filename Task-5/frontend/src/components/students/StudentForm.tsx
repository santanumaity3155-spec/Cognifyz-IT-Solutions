import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Save, ArrowLeft } from 'lucide-react';
import { StudentFormData, Gender, AcademicYear, RegistrationStatus } from '../../types/student';
import { Button } from '../common/Button';

interface StudentFormProps {
  initialData?: Partial<StudentFormData>;
  onSubmit: (data: StudentFormData) => Promise<void> | void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const COURSES = [
  'Computer Science',
  'Information Technology',
  'Data Science',
  'Electronics',
  'Mechanical',
];

const YEARS: AcademicYear[] = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];
const GENDERS: Gender[] = ['Male', 'Female', 'Non-Binary', 'Other'];
const STATUSES: RegistrationStatus[] = ['Active', 'Pending', 'Suspended', 'Graduated'];

export const StudentForm: React.FC<StudentFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit = false,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<StudentFormData>({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    gender: initialData?.gender || 'Other',
    collegeName: initialData?.collegeName || 'Cognifyz Institute of Technology',
    course: initialData?.course || 'Computer Science',
    academicYear: initialData?.academicYear || '1st Year',
    skills: initialData?.skills || [],
    registrationStatus: initialData?.registrationStatus || 'Active',
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters long';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      newErrors.phone = 'Valid phone number is required (min 7 digits)';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.course) {
      newErrors.course = 'Please select a course';
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'Please select an academic year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    const clean = skillInput.trim();
    if (!formData.skills.includes(clean)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, clean] }));
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Alex Rivera"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${
                errors.fullName
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
              }`}
            />
            {errors.fullName && <p className="mt-1 text-xs text-rose-500">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="e.g. alex.rivera@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${
                errors.email
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +1 (555) 234-5678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${
                errors.phone
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
              }`}
            />
            {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-none focus:ring-2 dark:text-white ${
                errors.dateOfBirth
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
              }`}
            />
            {errors.dateOfBirth && <p className="mt-1 text-xs text-rose-500">{errors.dateOfBirth}</p>}
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Gender
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* College Name */}
          <div>
            <label htmlFor="collegeName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              College / Institution
            </label>
            <input
              id="collegeName"
              type="text"
              value={formData.collegeName}
              onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          Academic Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Course */}
          <div>
            <label htmlFor="course" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Degree Course <span className="text-rose-500">*</span>
            </label>
            <select
              id="course"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.course && <p className="mt-1 text-xs text-rose-500">{errors.course}</p>}
          </div>

          {/* Academic Year */}
          <div>
            <label htmlFor="academicYear" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Academic Year <span className="text-rose-500">*</span>
            </label>
            <select
              id="academicYear"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value as AcademicYear })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {errors.academicYear && <p className="mt-1 text-xs text-rose-500">{errors.academicYear}</p>}
          </div>

          {/* Registration Status */}
          <div>
            <label htmlFor="registrationStatus" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Registration Status
            </label>
            <select
              id="registrationStatus"
              value={formData.registrationStatus}
              onChange={(e) =>
                setFormData({ ...formData, registrationStatus: e.target.value as RegistrationStatus })
              }
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Technical Skills Tag Input */}
        <div>
          <label htmlFor="skillInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Technical Skills & Technologies
          </label>
          <div className="flex gap-2">
            <input
              id="skillInput"
              type="text"
              placeholder="e.g. React, Python, Docker (press Add or Enter)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
            <Button type="button" variant="secondary" onClick={handleAddSkill} icon={Plus}>
              Add
            </Button>
          </div>

          {/* Active Skills Chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-500 transition-colors"
                  aria-label={`Remove skill ${skill}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.skills.length === 0 && (
              <span className="text-xs text-slate-400 italic">No skills added yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/students')}
          icon={ArrowLeft}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          icon={Save}
        >
          {isEdit ? 'Save Changes' : 'Register Student'}
        </Button>
      </div>
    </form>
  );
};

