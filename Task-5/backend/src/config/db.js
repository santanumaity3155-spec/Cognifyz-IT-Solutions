import mongoose from 'mongoose';

let dbStatus = {
  mode: 'in-memory-fallback',
  isConnected: false,
  uri: null,
  databaseName: 'in-memory-store',
  error: null,
};

/**
 * Connect to MongoDB with automatic, documented fallback.
 * If MONGODB_URI is absent, invalid, or MongoDB service is unreachable,
 * it switches to high-fidelity in-memory storage without crashing the server.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // Check if URI is missing, empty, or default placeholder
  if (!uri || uri.trim() === '' || uri.includes('your_mongodb_connection_string')) {
    console.log('\n======================================================');
    console.log('[DATABASE] Storage Engine: IN-MEMORY FALLBACK STORE');
    console.log('[DATABASE] Reason: No active MONGODB_URI configured in environment.');
    console.log('[DATABASE] Status: Operational with full in-memory CRUD & statistics.');
    console.log('======================================================\n');
    dbStatus = {
      mode: 'in-memory-fallback',
      isConnected: false,
      uri: null,
      databaseName: 'in-memory-store',
      error: 'MONGODB_URI not provided. Running in documented in-memory fallback mode.',
    };
    return dbStatus;
  }

  try {
    console.log(`[DATABASE] Connecting to MongoDB at: ${uri.replace(/:([^:@]{1,})@/, ':****@')}...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500, // Fast timeout for responsive fallback
    });

    dbStatus = {
      mode: 'mongodb',
      isConnected: true,
      uri: uri.replace(/:([^:@]{1,})@/, ':****@'),
      databaseName: conn.connection.name || 'forma_task5',
      error: null,
    };

    console.log('\n======================================================');
    console.log('[DATABASE] Storage Engine: MONGODB (Mongoose)');
    console.log(`[DATABASE] Connected to Database: ${dbStatus.databaseName}`);
    console.log(`[DATABASE] Host: ${conn.connection.host}:${conn.connection.port}`);
    console.log('======================================================\n');

    return dbStatus;
  } catch (error) {
    console.warn('\n======================================================');
    console.warn('[DATABASE WARNING] Failed to connect to MongoDB server.');
    console.warn(`[DATABASE WARNING] Error: ${error.message}`);
    console.warn('[DATABASE] Gracefully activating documented IN-MEMORY FALLBACK STORE.');
    console.warn('[DATABASE] All CRUD endpoints will function seamlessly in memory.');
    console.warn('======================================================\n');

    dbStatus = {
      mode: 'in-memory-fallback',
      isConnected: false,
      uri: null,
      databaseName: 'in-memory-store',
      error: error.message,
    };

    return dbStatus;
  }
};

/**
 * Returns current snapshot of database status.
 */
export const getDatabaseStatus = () => ({ ...dbStatus });

/**
 * Gracefully disconnect from MongoDB if connected.
 */
export const disconnectDB = async () => {
  if (dbStatus.isConnected && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.log('[DATABASE] MongoDB connection closed gracefully.');
    } catch (err) {
      console.error('[DATABASE] Error during MongoDB disconnection:', err.message);
    }
  }
};
