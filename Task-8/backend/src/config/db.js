import mongoose from 'mongoose';
import { env, maskConnectionString } from './environment.js';
import { logger } from '../utils/logger.js';

let dbStatus = {
  mode: 'in-memory-fallback',
  state: 'disconnected', // 'connected' | 'disconnected' | 'connecting' | 'error'
  isConnected: false,
  isPersistent: false,
  uri: null,
  databaseName: null,
  host: null,
  port: null,
  error: null,
  connectedAt: null,
  lastStateChange: new Date().toISOString(),
};

let listenersAttached = false;

const attachMongooseListeners = () => {
  if (listenersAttached) return;

  mongoose.connection.on('connected', () => {
    dbStatus.state = 'connected';
    dbStatus.isConnected = true;
    dbStatus.isPersistent = true;
    dbStatus.mode = 'mongodb';
    dbStatus.error = null;
    dbStatus.connectedAt = new Date().toISOString();
    dbStatus.lastStateChange = new Date().toISOString();
    logger.info('[DATABASE] Mongoose connected successfully.');
  });

  mongoose.connection.on('error', (err) => {
    dbStatus.state = 'error';
    dbStatus.isConnected = false;
    dbStatus.error = err.message;
    dbStatus.lastStateChange = new Date().toISOString();
    logger.error(`[DATABASE ERROR] Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    dbStatus.state = 'disconnected';
    dbStatus.isConnected = false;
    dbStatus.lastStateChange = new Date().toISOString();
    logger.warn('[DATABASE] Mongoose disconnected.');
  });

  listenersAttached = true;
};

/**
 * Connect to MongoDB with automatic, documented fallback to in-memory store.
 * @param {string | null} [customUri=null]
 * @param {{ serverSelectionTimeoutMS?: number }} [options={}]
 */
export const connectDB = async (customUri = null, options = {}) => {
  attachMongooseListeners();

  const uri = customUri !== null ? customUri : env.MONGODB_URI;
  const timeoutMs = options.serverSelectionTimeoutMS || 1500;

  if (!uri || uri.trim() === '' || uri.includes('your_mongodb_connection_string') || uri.includes('replace_with')) {
    dbStatus = {
      mode: 'in-memory-fallback',
      state: 'disconnected',
      isConnected: false,
      isPersistent: false,
      uri: null,
      databaseName: 'in-memory-store',
      host: 'localhost (in-memory)',
      port: null,
      error: 'MONGODB_URI not configured. Operating in non-persistent in-memory fallback mode.',
      connectedAt: null,
      lastStateChange: new Date().toISOString(),
    };
    return dbStatus;
  }

  try {
    dbStatus.state = 'connecting';
    dbStatus.lastStateChange = new Date().toISOString();

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
    });

    dbStatus = {
      mode: 'mongodb',
      state: 'connected',
      isConnected: true,
      isPersistent: true,
      uri: maskConnectionString(uri),
      databaseName: conn.connection.name || 'forma_task8',
      host: conn.connection.host || 'localhost',
      port: conn.connection.port || 27017,
      error: null,
      connectedAt: new Date().toISOString(),
      lastStateChange: new Date().toISOString(),
    };

    logger.info(`[DATABASE] Connected to MongoDB: ${dbStatus.databaseName} at ${dbStatus.host}:${dbStatus.port}`);
    return dbStatus;
  } catch (err) {
    dbStatus = {
      mode: 'in-memory-fallback',
      state: 'disconnected',
      isConnected: false,
      isPersistent: false,
      uri: maskConnectionString(uri),
      databaseName: 'in-memory-store',
      host: 'localhost (in-memory)',
      port: null,
      error: `MongoDB unreachable (${err.message}). Safe in-memory fallback store engaged.`,
      connectedAt: null,
      lastStateChange: new Date().toISOString(),
    };

    logger.warn(`[DATABASE] MongoDB unavailable at ${maskConnectionString(uri)}. Falling back to in-memory store.`);
    return dbStatus;
  }
};

/**
 * Disconnect from MongoDB safely.
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    logger.error(`[DATABASE ERROR] Error during disconnect: ${err.message}`);
  } finally {
    dbStatus.isConnected = false;
    dbStatus.state = 'disconnected';
    dbStatus.lastStateChange = new Date().toISOString();
  }
};

export const getDatabaseStatus = () => {
  return { ...dbStatus };
};

export default { connectDB, disconnectDB, getDatabaseStatus };

