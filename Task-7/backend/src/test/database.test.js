import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { connectDB, disconnectDB, getDatabaseStatus, resetDatabaseStatusForTesting } from '../config/db.js';

describe('Database Connectivity and In-Memory Fallback Tests', () => {
  beforeEach(() => {
    resetDatabaseStatusForTesting();
  });

  afterEach(async () => {
    await disconnectDB();
  });

  it('engages in-memory fallback when URI is placeholder or empty', async () => {
    const status = await connectDB('your_mongodb_connection_string');

    expect(status.mode).toBe('in-memory-fallback');
    expect(status.isPersistent).toBe(false);
    expect(status.isConnected).toBe(false);
    expect(status.databaseName).toBe('in-memory-store');
  });

  it('reports database status accurately via getDatabaseStatus()', async () => {
    await connectDB('');
    const status = getDatabaseStatus();

    expect(status.mode).toBe('in-memory-fallback');
    expect(status.isPersistent).toBe(false);
    expect(status.error).toContain('MONGODB_URI not configured');
  });

  it('handles unreachable MongoDB hosts gracefully without crashing', async () => {
    // Attempt connecting to a non-existent port with small timeout
    const status = await connectDB('mongodb://127.0.0.1:29999/forma_task7', {
      serverSelectionTimeoutMS: 200,
    });

    expect(status.mode).toBe('in-memory-fallback');
    expect(status.isPersistent).toBe(false);
    expect(status.error).toBeDefined();
    expect(status.databaseName).toBe('in-memory-store');
  });
});

