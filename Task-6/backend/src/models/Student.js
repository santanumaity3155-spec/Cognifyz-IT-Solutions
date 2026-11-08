import mongoose from 'mongoose';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;
const dobRegex = /^\d{4}-\d{2}-\d{2}$/;

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, 'Please provide a valid student email address'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [phoneRegex, 'Please provide a valid phone number (e.g. +1 555-123-4567)'],
    },
    dateOfBirth: {
      type: String,
      required: [true, 'Date of birth is required'],
      trim: true,
      match: [dobRegex, 'Date of birth must be in YYYY-MM-DD format'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Non-Binary', 'Other'],
        message: 'Gender must be Male, Female, Non-Binary, or Other',
      },
      default: 'Other',
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      default: 'Cognifyz Institute of Technology',
      index: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      enum: {
        values: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'],
        message: 'Academic year must be 1st Year, 2nd Year, 3rd Year, 4th Year, or Postgraduate',
      },
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    registrationStatus: {
      type: String,
      enum: {
        values: ['Active', 'Pending', 'Suspended', 'Graduated'],
        message: 'Status must be Active, Pending, Suspended, or Graduated',
      },
      default: 'Active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student creator user ID (createdBy) is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for role-based and ownership queries
studentSchema.index({ createdBy: 1, registrationStatus: 1 });
studentSchema.index({ createdBy: 1, course: 1 });

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default Student;

