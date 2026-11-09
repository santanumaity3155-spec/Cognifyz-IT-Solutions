import mongoose from 'mongoose';
import { getDatabaseStatus } from '../config/db.js';
import { getRedisClient, getRedisStatus } from '../config/redis.js';

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

// In-memory fallback repository when MongoDB and Redis are disconnected
const inMemoryStore = new Map();
const deletedTombstones = new Set();

/**
 * Unified JobLog persistence repository supporting MongoDB, Redis, and In-Memory fallback.
 */
export const JobLogRepository = {
  async create(data) {
    deletedTombstones.delete(data.jobId);
    const db = getDatabaseStatus();
    const redis = getRedisClient();
    const redisStatus = getRedisStatus();

    if (redis && redisStatus.isConnected) {
      try {
        await redis.del(`forma:deleted:${data.jobId}`);
      } catch {}
    }

    const doc = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (db.isConnected) {
      try {
        const created = await MongooseJobLog.create(doc);
        const obj = created.toObject();
        inMemoryStore.set(doc.jobId, obj);
        if (redis && redisStatus.isConnected) {
          await redis.set(`forma:job:${doc.jobId}`, JSON.stringify(obj));
          await redis.sadd('forma:jobs:all', doc.jobId);
        }
        return obj;
      } catch {}
    }

    if (redis && redisStatus.isConnected) {
      try {
        await redis.set(`forma:job:${doc.jobId}`, JSON.stringify(doc));
        await redis.sadd('forma:jobs:all', doc.jobId);
      } catch {}
    }

    inMemoryStore.set(doc.jobId, doc);
    return { ...doc };
  },

  async findByJobId(jobId) {
    if (deletedTombstones.has(jobId)) return null;

    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    if (redis && redisStatus.isConnected) {
      try {
        const isDeleted = await redis.get(`forma:deleted:${jobId}`);
        if (isDeleted) {
          deletedTombstones.add(jobId);
          inMemoryStore.delete(jobId);
          return null;
        }
      } catch {}
    }

    const db = getDatabaseStatus();
    if (db.isConnected) {
      try {
        const found = await MongooseJobLog.findOne({ jobId }).lean();
        if (found) return found;
      } catch {}
    }

    if (redis && redisStatus.isConnected) {
      try {
        const raw = await redis.get(`forma:job:${jobId}`);
        if (raw) return JSON.parse(raw);
      } catch {}
    }

    return inMemoryStore.get(jobId) || null;
  },

  async updateByJobId(jobId, updates) {
    if (deletedTombstones.has(jobId)) return null;

    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    if (redis && redisStatus.isConnected) {
      try {
        const isDeleted = await redis.get(`forma:deleted:${jobId}`);
        if (isDeleted) {
          deletedTombstones.add(jobId);
          inMemoryStore.delete(jobId);
          return null;
        }
      } catch {}
    }

    const db = getDatabaseStatus();
    const updateDoc = {
      ...updates,
      updatedAt: new Date().toISOString(),
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
          if (redis && redisStatus.isConnected) {
            await redis.set(`forma:job:${jobId}`, JSON.stringify(updated));
            await redis.sadd('forma:jobs:all', jobId);
          }
          return updated;
        }
      } catch {}
    }

    let current = inMemoryStore.get(jobId);

    if (redis && redisStatus.isConnected) {
      try {
        const raw = await redis.get(`forma:job:${jobId}`);
        if (raw) current = JSON.parse(raw);
        else if (!current) {
          // Job was deleted or does not exist; do not resurrect deleted records
          return null;
        }
      } catch {}
    }

    if (!current) {
      return null;
    }

    const merged = { ...current, ...updateDoc };
    inMemoryStore.set(jobId, merged);

    if (redis && redisStatus.isConnected) {
      try {
        await redis.set(`forma:job:${jobId}`, JSON.stringify(merged));
        await redis.sadd('forma:jobs:all', jobId);
      } catch {}
    }

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

    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    let items = [];

    if (redis && redisStatus.isConnected) {
      try {
        const ids = await redis.smembers('forma:jobs:all');
        if (ids && ids.length > 0) {
          const keys = ids.map((id) => `forma:job:${id}`);
          const rawDocs = await redis.mget(...keys);
          items = rawDocs.filter(Boolean).map((str) => JSON.parse(str));
        }
      } catch {}
    }

    if (items.length === 0) {
      items = Array.from(inMemoryStore.values());
    }

    items = items.filter((item) => !deletedTombstones.has(item.jobId));

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
    deletedTombstones.add(jobId);
    const db = getDatabaseStatus();
    if (db.isConnected) {
      try {
        await MongooseJobLog.deleteOne({ jobId });
      } catch {}
    }

    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    if (redis && redisStatus.isConnected) {
      try {
        await redis.set(`forma:deleted:${jobId}`, '1', 'EX', 3600);
        await redis.del(`forma:job:${jobId}`);
        await redis.srem('forma:jobs:all', jobId);
      } catch {}
    }

    const had = inMemoryStore.has(jobId);
    inMemoryStore.delete(jobId);
    return had || true;
  },

  async getCounts() {
    const db = getDatabaseStatus();
    if (db.isConnected) {
      try {
        const total = await MongooseJobLog.countDocuments();
        const waiting = await MongooseJobLog.countDocuments({ status: 'waiting' });
        const active = await MongooseJobLog.countDocuments({ status: 'active' });
        const completed = await MongooseJobLog.countDocuments({ status: 'completed' });
        const failed = await MongooseJobLog.countDocuments({ status: 'failed' });
        const cancelled = await MongooseJobLog.countDocuments({ status: 'cancelled' });
        const emailQueue = await MongooseJobLog.countDocuments({ queueName: 'emailQueue' });
        const reportQueue = await MongooseJobLog.countDocuments({ queueName: 'reportQueue' });
        const analyticsQueue = await MongooseJobLog.countDocuments({ queueName: 'analyticsQueue' });
        const maintenanceQueue = await MongooseJobLog.countDocuments({ queueName: 'maintenanceQueue' });

        return {
          total,
          waiting,
          active,
          completed,
          failed,
          cancelled,
          byQueue: {
            emailQueue,
            reportQueue,
            analyticsQueue,
            maintenanceQueue,
          },
        };
      } catch {}
    }

    const redis = getRedisClient();
    const redisStatus = getRedisStatus();
    let items = [];

    if (redis && redisStatus.isConnected) {
      try {
        const ids = await redis.smembers('forma:jobs:all');
        if (ids && ids.length > 0) {
          const keys = ids.map((id) => `forma:job:${id}`);
          const rawDocs = await redis.mget(...keys);
          items = rawDocs.filter(Boolean).map((str) => JSON.parse(str));
        }
      } catch {}
    }

    if (items.length === 0) {
      items = Array.from(inMemoryStore.values());
    }

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

