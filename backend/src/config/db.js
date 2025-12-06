const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * MongoDB Connection Configuration
 * Supports both local MongoDB and MongoDB Atlas
 */

// Get MongoDB URI from environment variables
// Supports both MONGO_URI and MONGODB_URI for compatibility
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Default local MongoDB URI if not provided
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/delhi_breathes';

/**
 * Connect to MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Use provided URI or default to local MongoDB
    const mongoUri = MONGO_URI || DEFAULT_URI;

    // Validate URI format
    if (!mongoUri || (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'))) {
      logger.error('[MongoDB] Invalid MongoDB URI format');
      logger.error('[MongoDB] URI must start with mongodb:// or mongodb+srv://');
      throw new Error('Invalid MongoDB URI format');
    }

    // Set up connection event handlers BEFORE connecting
    mongoose.connection.on('connected', () => {
      const host = mongoose.connection.host || 'unknown';
      logger.info(`✅ [MongoDB] Connected successfully to: ${host}`);
      logger.info(`✅ [MongoDB] Database: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ [MongoDB] Connection error: ${err.message}`);
      
      // Provide helpful error messages
      if (err.message.includes('ECONNREFUSED')) {
        logger.error('[MongoDB] Connection refused - MongoDB server is not running');
        logger.info('[MongoDB] For local MongoDB: Start MongoDB service or run mongod');
        logger.info('[MongoDB] For MongoDB Atlas: Check network access and credentials');
      } else if (err.message.includes('authentication failed')) {
        logger.error('[MongoDB] Authentication failed - Check username and password');
        logger.info('[MongoDB] Ensure password is URL-encoded in connection string');
      } else if (err.message.includes('ENOTFOUND')) {
        logger.error('[MongoDB] Host not found - Check cluster URL');
        logger.info('[MongoDB] For MongoDB Atlas: Verify cluster URL is correct');
      }
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ [MongoDB] Disconnected from database');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 [MongoDB] Reconnected to database');
    });

    // Log connection attempt
    const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    logger.info(`[MongoDB] Attempting to connect to: ${maskedUri}`);

    // Connect to MongoDB
    // Note: useNewUrlParser and useUnifiedTopology are default in Mongoose 8.x
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 2, // Minimum number of connections
      retryWrites: true, // Retry writes on network errors
      w: 'majority', // Write concern
    });

    logger.info(`✅ [MongoDB] Connection established: ${conn.connection.host}`);
    logger.info(`✅ [MongoDB] Ready state: ${mongoose.connection.readyState} (1 = connected)`);

    return conn;
  } catch (error) {
    logger.error(`❌ [MongoDB] Connection failed: ${error.message}`);
    
    // Provide specific error guidance
    if (error.message.includes('ECONNREFUSED')) {
      logger.error('[MongoDB] ❌ MongoDB server is not running or not accessible');
      logger.info('[MongoDB] 💡 Solutions:');
      logger.info('[MongoDB]   1. For local: Start MongoDB service (net start MongoDB on Windows)');
      logger.info('[MongoDB]   2. For Atlas: Check network access IP whitelist (0.0.0.0/0)');
      logger.info('[MongoDB]   3. Verify connection string in .env file');
    } else if (error.message.includes('authentication')) {
      logger.error('[MongoDB] ❌ Authentication failed');
      logger.info('[MongoDB] 💡 Check: Username, password (URL-encoded), and database name');
    } else if (error.message.includes('ENOTFOUND')) {
      logger.error('[MongoDB] ❌ Host/cluster not found');
      logger.info('[MongoDB] 💡 Verify cluster URL in connection string');
    }

    // Exit process on connection failure (can be changed to allow server to start)
    logger.error('[MongoDB] Exiting application due to database connection failure');
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('[MongoDB] Disconnected from database');
    }
  } catch (error) {
    logger.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};

/**
 * Check if MongoDB is connected
 * @returns {boolean}
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get MongoDB connection state
 * @returns {string}
 */
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Get MongoDB connection info
 * @returns {object}
 */
const getConnectionInfo = () => {
  return {
    connected: isConnected(),
    state: getConnectionState(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    port: mongoose.connection.port || null,
    name: mongoose.connection.name || null,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  getConnectionState,
  getConnectionInfo,
};

