const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Check if MongoDB is connected
 * @returns {boolean}
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1; // 1 = connected
}

/**
 * Wait for MongoDB connection with timeout
 * @param {number} timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns {Promise<boolean>} - Returns true if connected, false if timeout
 */
async function waitForMongoConnection(timeoutMs = 5000) {
  if (isMongoConnected()) {
    return true;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkConnection = () => {
      if (isMongoConnected()) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        logger.warn('[MongoDB] Connection wait timeout');
        resolve(false);
        return;
      }

      setTimeout(checkConnection, 100);
    };

    checkConnection();
  });
}

/**
 * Ensure MongoDB connection before executing query
 * @param {Function} queryFn - Function that returns a promise (the query)
 * @returns {Promise<any>}
 */
async function ensureConnectionAndQuery(queryFn) {
  const isConnected = await waitForMongoConnection(2000);
  
  if (!isConnected) {
    throw new Error('MongoDB connection not available. Please check your database connection.');
  }

  return await queryFn();
}

module.exports = {
  isMongoConnected,
  waitForMongoConnection,
  ensureConnectionAndQuery,
};

