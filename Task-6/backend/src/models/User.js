import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const bcryptHashRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Excludes password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['Admin', 'Student'],
        message: 'Role must be either Admin or Student',
      },
      default: 'Student',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password using bcryptjs with work factor 10.
 * Safely guards against re-hashing if already a bcrypt hash or unmodified.
 */
userSchema.methods.hashPassword = async function () {
  // If already a valid bcrypt hash, never re-hash
  if (typeof this.password === 'string' && bcryptHashRegex.test(this.password)) {
    return this.password;
  }

  if (!this.isModified('password')) {
    return this.password;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return this.password;
};

/**
 * Pre-save middleware to automatically hash passwords with bcrypt
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || bcryptHashRegex.test(this.password)) {
    return next();
  }

  try {
    await this.hashPassword();
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare candidate password with stored bcrypt hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns safe user object without password or internal properties
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

/**
 * Strips password hash and internal mongoose version __v when converted to JSON
 */
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
