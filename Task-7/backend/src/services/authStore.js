import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { getDatabaseStatus } from '../config/db.js';

/**
 * In-memory fallback user repository.
 * Active when MongoDB daemon is not running or during standalone unit testing.
 */
class InMemoryUserStore {
  constructor() {
    this.users = new Map();
  }

  async createUser({ name, email, password, role = 'Student' }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = new mongoose.Types.ObjectId().toString();

    const userObj = {
      _id: id,
      id,
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isActive: true,
      github: {
        connected: false,
        githubId: null,
        username: null,
        avatarUrl: null,
        profileUrl: null,
        encryptedAccessToken: null,
        scopes: [],
        connectedAt: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      async comparePassword(candidate) {
        return bcrypt.compare(candidate, this.password);
      },
    };

    this.users.set(id, userObj);
    return userObj;
  }

  async findByEmail(email, { includePassword = false } = {}) {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalized) {
        return user;
      }
    }
    return null;
  }

  async findById(id, { includePassword = false } = {}) {
    return this.users.get(String(id)) || null;
  }

  async updateGitHubConnection(userId, githubData) {
    const user = await this.findById(userId);
    if (!user) return null;

    user.github = {
      ...user.github,
      ...githubData,
      connected: true,
      connectedAt: new Date(),
    };
    user.updatedAt = new Date();
    this.users.set(String(userId), user);
    return user;
  }

  async disconnectGitHub(userId) {
    const user = await this.findById(userId);
    if (!user) return null;

    user.github = {
      connected: false,
      githubId: null,
      username: null,
      avatarUrl: null,
      profileUrl: null,
      encryptedAccessToken: null,
      scopes: [],
      connectedAt: null,
    };
    user.updatedAt = new Date();
    this.users.set(String(userId), user);
    return user;
  }

  clear() {
    this.users.clear();
  }
}

const inMemoryStore = new InMemoryUserStore();

export const authStore = {
  async createUser(data) {
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected && dbStatus.mode === 'mongodb') {
      return User.create(data);
    }
    return inMemoryStore.createUser(data);
  },

  async findByEmail(email, options = {}) {
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected && dbStatus.mode === 'mongodb') {
      const query = User.findOne({ email: email.toLowerCase().trim() });
      if (options.includePassword) {
        query.select('+password');
      }
      return query.exec();
    }
    return inMemoryStore.findByEmail(email, options);
  },

  async findById(id, options = {}) {
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected && dbStatus.mode === 'mongodb') {
      const query = User.findById(id);
      if (options.includePassword) {
        query.select('+password');
      }
      return query.exec();
    }
    return inMemoryStore.findById(id, options);
  },

  async updateGitHubConnection(userId, githubData) {
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected && dbStatus.mode === 'mongodb') {
      return User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'github.connected': true,
            'github.githubId': githubData.githubId,
            'github.username': githubData.username,
            'github.avatarUrl': githubData.avatarUrl,
            'github.profileUrl': githubData.profileUrl,
            'github.encryptedAccessToken': githubData.encryptedAccessToken,
            'github.scopes': githubData.scopes || [],
            'github.connectedAt': new Date(),
          },
        },
        { new: true }
      );
    }
    return inMemoryStore.updateGitHubConnection(userId, githubData);
  },

  async disconnectGitHub(userId) {
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected && dbStatus.mode === 'mongodb') {
      return User.findByIdAndUpdate(
        userId,
        {
          $set: {
            github: {
              connected: false,
              githubId: null,
              username: null,
              avatarUrl: null,
              profileUrl: null,
              encryptedAccessToken: null,
              scopes: [],
              connectedAt: null,
            },
          },
        },
        { new: true }
      );
    }
    return inMemoryStore.disconnectGitHub(userId);
  },

  clearMemoryStoreForTesting() {
    inMemoryStore.clear();
  },
};

export default authStore;

