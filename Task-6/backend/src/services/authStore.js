import mongoose from 'mongoose';
import User from '../models/User.js';
import { getDatabaseStatus } from '../config/db.js';

// Pre-configured development seed accounts (initialized in-memory and in MongoDB when seeded)
export const initialSeedUsers = [
  {
    _id: '672e00000000000000000001',
    name: 'Forma Administrator',
    email: 'admin@forma.edu',
    password: 'AdminPassword2026!',
    role: 'Admin',
    isActive: true,
  },
  {
    _id: '672e00000000000000000002',
    name: 'Alex Mercer (Student)',
    email: 'alex.mercer@forma.edu',
    password: 'StudentPass2026!',
    role: 'Student',
    isActive: true,
  },
  {
    _id: '672e00000000000000000003',
    name: 'Inactive Student',
    email: 'inactive@forma.edu',
    password: 'InactivePass2026!',
    role: 'Student',
    isActive: false,
  },
];

// In-memory collection of Mongoose User documents for documented offline fallback
let inMemoryUsers = [];

/**
 * Initialize in-memory seed users with bcrypt-hashed passwords
 */
export const initInMemoryUsers = async () => {
  inMemoryUsers = [];
  for (const raw of initialSeedUsers) {
    const userDoc = new User({
      _id: new mongoose.Types.ObjectId(raw._id),
      name: raw.name,
      email: raw.email.toLowerCase(),
      password: raw.password,
      role: raw.role,
      isActive: raw.isActive,
    });
    await userDoc.hashPassword();
    inMemoryUsers.push(userDoc);
  }
};

// Initialize seed on module load
await initInMemoryUsers();

export const authStore = {
  /**
   * Check if running in active MongoDB mode
   */
  isMongoActive() {
    return getDatabaseStatus().isConnected && mongoose.connection.readyState === 1;
  },

  /**
   * Find a user by email address (includes password hash for authentication)
   */
  async findByEmail(email, { includePassword = true } = {}) {
    if (!email) return null;
    const normalizedEmail = email.trim().toLowerCase();

    if (this.isMongoActive()) {
      const query = User.findOne({ email: normalizedEmail });
      if (includePassword) {
        query.select('+password');
      }
      return query.exec();
    }

    // In-memory fallback
    const found = inMemoryUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!found) return null;

    // Return the User document
    return found;
  },

  /**
   * Find a user by MongoDB ObjectId
   */
  async findById(id) {
    if (!id) return null;

    if (this.isMongoActive()) {
      return User.findById(id).exec();
    }

    const idString = id.toString();
    return inMemoryUsers.find((u) => u._id.toString() === idString) || null;
  },

  /**
   * Create and persist a new User
   * Enforces role = 'Student' by default
   */
  async createUser({ name, email, password, role = 'Student' }) {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.isMongoActive()) {
      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: role === 'Admin' ? 'Admin' : 'Student',
        isActive: true,
      });

      await newUser.save();
      return newUser;
    }

    // In-memory fallback
    const userDoc = new User({
      _id: new mongoose.Types.ObjectId(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === 'Admin' ? 'Admin' : 'Student',
      isActive: true,
    });

    await userDoc.hashPassword();
    inMemoryUsers.push(userDoc);
    return userDoc;
  },

  /**
   * Reset store to clean state for tests
   */
  async resetStore() {
    await initInMemoryUsers();

    if (this.isMongoActive()) {
      await User.deleteMany({});
      for (const raw of initialSeedUsers) {
        const u = new User({
          _id: new mongoose.Types.ObjectId(raw._id),
          name: raw.name,
          email: raw.email.toLowerCase(),
          password: raw.password,
          role: raw.role,
          isActive: raw.isActive,
        });
        await u.save();
      }
    }
  },
};

export default authStore;

