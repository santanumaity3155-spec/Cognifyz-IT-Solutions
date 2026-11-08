import mongoose from 'mongoose';
import { env, maskConnectionString } from './environment.js';

/**
 * Internal state tracker for database connectivity.
 * Tracks active mode, connection state, masked URI, database name, and error details.
 */
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

/**
 * Register Mongoose lifecycle event listeners once
 */
let listenersRegistered = false;
const registerConnectionListeners = () => {
  if (listenersRegistered) return;

  mongoose.connection.on('connected', () => {
    dbStatus.state = 'connected';
    dbStatus.isConnected = true;
    dbStatus.isPersistent = true;
    dbStatus.mode = 'mongodb';
    dbStatus.error = null;
    dbStatus.connectedAt = new Date().toISOString();
    dbStatus.lastStateChange = new Date().toISOString();
    console.log('[DATABASE EVENT] Mongoose connected successfully.');
  });

  mongoose.connection.on('error', (err) => {
    dbStatus.state = 'error';
    dbStatus.isConnected = false;
    dbStatus.error = err.message;
    dbStatus.lastStateChange = new Date().toISOString();
    console.error(`[DATABASE EVENT] Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    dbStatus.state = 'disconnected';
    dbStatus.isConnected = false;
    dbStatus.lastStateChange = new Date().toISOString();
    console.log('[DATABASE EVENT] Mongoose disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    dbStatus.state = 'connected';
    dbStatus.isConnected = true;
    dbStatus.isPersistent = true;
    dbStatus.mode = 'mongodb';
    dbStatus.error = null;
    dbStatus.lastStateChange = new Date().toISOString();
    console.log('[DATABASE EVENT] Mongoose reconnected to MongoDB.');
  });

  listenersRegistered = true;
};

/**
 * Connect to MongoDB using Mongoose.
 * If MONGODB_URI is absent, invalid, or MongoDB service is unreachable,
 * it safely activates documented in-memory fallback without crashing,
 * clearly reporting isPersistent: false and mode: 'in-memory-fallback'.
 */
export const connectDB = async (customUri = null, options = {}) => {
  registerConnectionListeners();

  const uri = customUri || env.MONGODB_URI;
  const timeoutMs = options.serverSelectionTimeoutMS || 2000;

  // Check if URI is missing or placeholder
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

    console.log('\n======================================================');
    console.log('[DATABASE] Storage Engine: IN-MEMORY FALLBACK STORE');
    console.log('[DATABASE] Persistence Status: NON-PERSISTENT (Data resets on restart)');
    console.log('[DATABASE] Reason: No valid MONGODB_URI configured in environment.');
    console.log('[DATABASE] Status: Operational with full simulated schema & constraints.');
    console.log('======================================================\n');

    return { ...dbStatus };
  }

  const maskedUri = maskConnectionString(uri);

  try {
    dbStatus.state = 'connecting';
    dbStatus.lastStateChange = new Date().toISOString();
    console.log(`[DATABASE] Connecting to MongoDB at: ${maskedUri}...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      autoIndex: true,
      ...options,
    });

    const isConfirmedConnected = mongoose.connection.readyState === 1;

    dbStatus = {
      mode: isConfirmedConnected ? 'mongodb' : 'in-memory-fallback',
      state: isConfirmedConnected ? 'connected' : 'error',
      isConnected: isConfirmedConnected,
      isPersistent: isConfirmedConnected,
      uri: maskedUri,
      databaseName: conn.connection.name || 'forma_task6',
      host: conn.connection.host || 'unknown',
      port: conn.connection.port || null,
      error: null,
      connectedAt: new Date().toISOString(),
      lastStateChange: new Date().toISOString(),
    };

    console.log('\n======================================================');
    console.log('[DATABASE] Storage Engine: MONGODB (Mongoose ODM)');
    console.log('[DATABASE] Persistence Status: FULLY PERSISTENT');
    console.log(`[DATABASE] Database Name: ${dbStatus.databaseName}`);
    console.log(`[DATABASE] Host: ${dbStatus.host}${dbStatus.port ? `:${dbStatus.port}` : ''}`);
    console.log('======================================================\n');

    return { ...dbStatus };
  } catch (err) {
    dbStatus = {
      mode: 'in-memory-fallback',
      state: 'error',
      isConnected: false,
      isPersistent: false,
      uri: maskedUri,
      databaseName: 'in-memory-store',
      host: 'localhost (fallback)',
      port: null,
      error: err.message,
      connectedAt: null,
      lastStateChange: new Date().toISOString(),
    };

    console.warn('\n======================================================');
    console.warn('[DATABASE WARNING] MongoDB connection attempt failed.');
    console.warn(`[DATABASE WARNING] Target: ${maskedUri}`);
    console.warn(`[DATABASE WARNING] Error: ${err.message}`);
    console.warn('[DATABASE] Notice: MongoDB is the primary database architecture.');
    console.warn('[DATABASE] Activating documented IN-MEMORY FALLBACK for non-crash continuity.');
    console.warn('[DATABASE] Persistence Status: NON-PERSISTENT until MongoDB service starts.');
    console.warn('======================================================\n');

    return { ...dbStatus };
  }
};

/**
 * Returns current snapshot of database status.
 * Re-verifies mongoose readyState so it never claims connected if mongoose dropped.
 */
export const getDatabaseStatus = () => {
  const readyState = mongoose.connection.readyState;
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const isMongooseConnected = readyState === 1;

  if (dbStatus.mode === 'mongodb' && !isMongooseConnected) {
    return {
      ...dbStatus,
      state: readyState === 2 ? 'connecting' : 'disconnected',
      isConnected: false,
      isPersistent: false,
      error: dbStatus.error || 'Mongoose connection lost or disconnected',
    };
  }

  return { ...dbStatus };
};

/**
 * Gracefully disconnect from MongoDB if connected
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[DATABASE] MongoDB disconnected gracefully.');
    }
  } catch (err) {
    console.error('[DATABASE] Error during MongoDB disconnection:', err.message);
  } finally {
    dbStatus.state = 'disconnected';
    dbStatus.isConnected = false;
    dbStatus.isPersistent = false;
    dbStatus.lastStateChange = new Date().toISOString();
  }
};
