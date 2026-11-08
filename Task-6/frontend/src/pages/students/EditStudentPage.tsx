import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, AlertCircle, Loader2 } from 'lucide-react';
import studentService from '../../services/studentService';
import { Student, StudentFormData } from '../../types/student';
import { StudentForm } from '../../components/students/StudentForm';

export const EditStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            err instanceof Error ? err.message : 'Failed to retrieve student record for editing.';
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

  const handleSubmit = async (formData: StudentFormData) => {
    if (!student || !id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const targetId = student.studentId || student._id;
      const res = await studentService.updateStudent(targetId, formData);
      if (res.success) {
        navigate(`/students/${encodeURIComponent(targetId)}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update student record.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-xs">Loading student data for editing...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Cannot Edit Student Record</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          {error || 'You do not have authorization to edit this record or it does not exist.'}
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <Link
            to={`/students/${student.studentId || student._id}`}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel and Return to Profile</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Pencil className="w-7 h-7 text-amber-400" />
            <span>Edit Student Record</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Updating profile for <strong className="text-white">{student.fullName}</strong> ({student.studentId}).
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Prepopulated Form */}
      <StudentForm
        initialData={{
          fullName: student.fullName,
          email: student.email,
          phone: student.phone,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          collegeName: student.collegeName,
          course: student.course,
          academicYear: student.academicYear,
          skills: student.skills,
          registrationStatus: student.registrationStatus,
        }}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        isEdit={true}
      />
    </div>
  );
};

export default EditStudentPage;

