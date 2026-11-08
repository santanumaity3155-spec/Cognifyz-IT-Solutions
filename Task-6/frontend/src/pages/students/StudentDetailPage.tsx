import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap, 
  Building, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  User, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import { Student } from '../../types/student';
import { Badge } from '../../components/common/Badge';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    setLoading(true);
    setError(null);

    studentService
      .getStudentById(id)
      .then((res) => {
        if (isMounted && res.success) {
          setStudent(res.data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to retrieve student profile.';
          setError(message);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!student) return;
    setIsDeleting(true);
    try {
      const targetId = student.studentId || student._id;
      const res = await studentService.deleteStudent(targetId);
      if (res.success) {
        navigate('/students');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete student record.';
      setError(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-xs">Loading student profile...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Unable to View Student Record</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          {error || 'The requested student record could not be found or you do not have permission to view it.'}
        </p>
        <div className="pt-2">
          <Link
            to="/students"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Student Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const owner = typeof student.createdBy === 'object' ? student.createdBy : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Link
            to={`/students/${student.studentId || student._id}/edit`}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Record</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Student Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30">
              {student.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{student.fullName}</h1>
                <Badge status={student.registrationStatus} />
              </div>
              <p className="font-mono text-xs text-brand-400 mt-1 font-semibold">
                ID: {student.studentId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 font-medium">
              {student.academicYear}
            </span>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-xs">
          {/* Contact & Personal */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/80">
              Contact &amp; Identification
            </h3>
            <div className="space-y-2.5 text-slate-400">
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-white font-medium">{student.email}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="text-slate-200 font-mono">{student.phone}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Date of Birth: <strong className="text-slate-200">{student.dateOfBirth}</strong></span>
              </div>
              <div className="flex items-center space-x-2.5">
                <User className="w-4 h-4 text-slate-500" />
                <span>Gender: <strong className="text-slate-200">{student.gender}</strong></span>
              </div>
            </div>
          </div>

          {/* Academic & College */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800/80">
              Academic Program
            </h3>
            <div className="space-y-2.5 text-slate-400">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4 text-brand-400" />
                <span className="text-white font-medium">{student.course}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Building className="w-4 h-4 text-slate-500" />
                <span>College: <strong className="text-slate-200">{student.collegeName}</strong></span>
              </div>
              <div className="flex items-center space-x-2.5">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span>Academic Standing: <strong className="text-slate-200">{student.academicYear}</strong></span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Record Created: <strong className="text-slate-200">{new Date(student.createdAt).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="pt-6 mt-6 border-t border-slate-800 space-y-2">
          <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
            Technical Skills &amp; Competencies
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {student.skills && student.skills.length > 0 ? (
              student.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
                >
                  {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No skills listed for this profile.</span>
            )}
          </div>
        </div>

        {/* Ownership Metadata & RBAC Info */}
        <div className="pt-6 mt-6 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>
                {isAdmin && owner ? (
                  <>
                    Created by account: <strong className="text-white">{owner.name}</strong> ({owner.email}) [{owner.role || 'User'}]
                  </>
                ) : (
                  <>Resource Ownership: Encrypted and scoped to your authenticated account ID</>
                )}
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Mongo ID: {student._id}
            </span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Student Record"
        message={`Are you sure you want to permanently delete the profile for "${student.fullName}" (${student.studentId})?`}
        confirmText="Confirm Deletion"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default StudentDetailPage;

