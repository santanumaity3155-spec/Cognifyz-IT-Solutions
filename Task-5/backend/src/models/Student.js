import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    dateOfBirth: {
      type: String,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Non-Binary', 'Other'],
      default: 'Other',
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      default: 'Cognifyz Institute of Technology',
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'],
    },
    skills: {
      type: [String],
      default: [],
    },
    registrationStatus: {
      type: String,
      enum: ['Active', 'Pending', 'Suspended', 'Graduated'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default Student;
