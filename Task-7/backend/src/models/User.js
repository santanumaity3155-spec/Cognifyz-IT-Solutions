import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const githubSchema = new mongoose.Schema(
  {
    connected: { type: Boolean, default: false },
    githubId: { type: String, default: null },
    username: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    profileUrl: { type: String, default: null },
    encryptedAccessToken: { type: String, default: null },
    scopes: { type: [String], default: [] },
    connectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    role: {
      type: String,
      enum: ['Student', 'Admin'],
      default: 'Student',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    github: {
      type: githubSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

