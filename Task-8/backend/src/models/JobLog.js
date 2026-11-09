import mongoose from 'mongoose';
import { getDatabaseStatus } from '../config/db.js';

const jobLogSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, index: true, unique: true },
    queueName: { type: String, required: true, index: true },
    jobType: { type: String, required: true },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'failed', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    error: { type: String, default: null },
    attemptsMade: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    processingTimeMs: { type: Number, default: null },
    processedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Mongoose model instance
const MongooseJobLog = mongoose.models.JobLog || mongoose.model('JobLog', jobLogSchema);

// In-memory fallback repository when MongoDB is disconnected
const inMemoryStore = new Map();

/**
 * Unified JobLog persistence repository supporting both MongoDB and In-Memory fallback.
 */
export const JobLogRepository = {
  async create(data) {
    const db = getDatabaseStatus();
    const doc = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (db.isConnected) {
      try {
        const created = await MongooseJobLog.create(doc);
        inMemoryStore.set(doc.jobId, created.toObject());
        return created.toObject();
      } catch {
        // Fall back to memory if DB query fails
      }
    }

    inMemoryStore.set(doc.jobId, doc);
    return { ...doc };
  },

  async findByJobId(jobId) {
    const db = getDatabaseStatus();
    if (db.isConnected) {
      try {
        const found = await MongooseJobLog.findOne({ jobId }).lean();
        if (found) return found;
      } catch {}
    }
    return inMemoryStore.get(jobId) || null;
  },

  async updateByJobId(jobId, updates) {
    const db = getDatabaseStatus();
    const updateDoc = {
      ...updates,
      updatedAt: new Date(),
    };

    if (db.isConnected) {
      try {
        const updated = await MongooseJobLog.findOneAndUpdate(
          { jobId },
          { $set: updateDoc },
          { new: true }
        ).lean();
        if (updated) {
          inMemoryStore.set(jobId, updated);
          return updated;
        }
      } catch {}
    }

    const existing = inMemoryStore.get(jobId) || {};
    const merged = { ...existing, ...updateDoc };
    inMemoryStore.set(jobId, merged);
    return merged;
  },

  async find(filter = {}, options = { skip: 0, limit: 50, sort: { createdAt: -1 } }) {
    const db = getDatabaseStatus();
    if (db.isConnected) {
      try {
        const query = {};
        if (filter.queueName) query.queueName = filter.queueName;
        if (filter.status) query.status = filter.status;
        const total = await MongooseJobLog.countDocuments(query);
        const docs = await MongooseJobLog.find(query)
          .sort({ createdAt: -1 })
          .skip(options.skip || 0)
          .limit(options.limit || 50)
          .lean();
        return { docs, total };
      } catch {}
    }

    // In-memory filter & pagination
    let items = Array.from(inMemoryStore.values());
    if (filter.queueName) {
      items = items.filter((item) => item.queueName === filter.queueName);
    }
    if (filter.status) {
      items = items.filter((item) => item.status === filter.status);
    }
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = items.length;
    const skip = options.skip || 0;
    const limit = options.limit || 50;
    const docs = items.slice(skip, skip + limit);

    return { docs, total };
  },

  async deleteByJobId(jobId) {
    const db = getDatabaseStatus();
    if (db.isConnected) {
      try {
        await MongooseJobLog.deleteOne({ jobId });
      } catch {}
    }
    const had = inMemoryStore.has(jobId);
    inMemoryStore.delete(jobId);
    return had;
  },

  async getCounts() {
    const items = Array.from(inMemoryStore.values());
    const counts = {
      total: items.length,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      byQueue: {
        emailQueue: 0,
        reportQueue: 0,
        analyticsQueue: 0,
        maintenanceQueue: 0,
      },
    };

    for (const item of items) {
      if (counts[item.status] !== undefined) counts[item.status]++;
      if (counts.byQueue[item.queueName] !== undefined) counts.byQueue[item.queueName]++;
    }

    return counts;
  },
};

export default JobLogRepository;

