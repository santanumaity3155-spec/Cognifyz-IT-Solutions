import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { StudentFormData, Gender, AcademicYear, RegistrationStatus } from '../../types/student';

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
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Alex Rivera"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border rounded-xl focus:outline-none focus:ring-2 text-white ${
                errors.fullName
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-800 focus:ring-brand-500'
              }`}
            />
            {errors.fullName && <p id="fullName-error" role="alert" className="mt-1 text-xs text-rose-400">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="e.g. alex.rivera@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border rounded-xl focus:outline-none focus:ring-2 text-white ${
                errors.email
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-800 focus:ring-brand-500'
              }`}
            />
            {errors.email && <p role="alert" className="mt-1 text-xs text-rose-400">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number <span className="text-rose-400">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +1 (555) 234-5678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border rounded-xl focus:outline-none focus:ring-2 text-white ${
                errors.phone
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-800 focus:ring-brand-500'
              }`}
            />
            {errors.phone && <p role="alert" className="mt-1 text-xs text-rose-400">{errors.phone}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Date of Birth <span className="text-rose-400">*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border rounded-xl focus:outline-none focus:ring-2 text-white ${
                errors.dateOfBirth
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-800 focus:ring-brand-500'
              }`}
            />
            {errors.dateOfBirth && <p role="alert" className="mt-1 text-xs text-rose-400">{errors.dateOfBirth}</p>}
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Gender
            </label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
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
            <label htmlFor="collegeName" className="block text-xs font-semibold text-slate-300 mb-1.5">
              College / Institution
            </label>
            <input
              id="collegeName"
              type="text"
              value={formData.collegeName}
              onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
            />
          </div>
        </div>

        <h3 className="text-base font-bold text-white pt-4 pb-3 border-b border-slate-800">
          Academic Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Course */}
          <div>
            <label htmlFor="course" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Degree Course <span className="text-rose-400">*</span>
            </label>
            <select
              id="course"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.course && <p role="alert" className="mt-1 text-xs text-rose-400">{errors.course}</p>}
          </div>

          {/* Academic Year */}
          <div>
            <label htmlFor="academicYear" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Academic Year <span className="text-rose-400">*</span>
            </label>
            <select
              id="academicYear"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value as AcademicYear })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {errors.academicYear && <p role="alert" className="mt-1 text-xs text-rose-400">{errors.academicYear}</p>}
          </div>

          {/* Registration Status */}
          <div>
            <label htmlFor="registrationStatus" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Registration Status
            </label>
            <select
              id="registrationStatus"
              value={formData.registrationStatus}
              onChange={(e) =>
                setFormData({ ...formData, registrationStatus: e.target.value as RegistrationStatus })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Technical Skills */}
        <div>
          <label htmlFor="skillInput" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Technical Skills &amp; Competencies
          </label>
          <div className="flex gap-2">
            <input
              id="skillInput"
              type="text"
              placeholder="e.g. React, Node.js, MongoDB (press Add or Enter)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Active Skills Badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-400 transition"
                  aria-label={`Remove skill ${skill}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.skills.length === 0 && (
              <span className="text-xs text-slate-500 italic">No skills added yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/students')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-indigo-600/30 transition focus:outline-none disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{isEdit ? 'Save Changes' : 'Register Student'}</span>
        </button>
      </div>
    </form>
  );
};

export default StudentForm;

