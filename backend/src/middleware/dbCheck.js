const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Middleware to check if MongoDB is connected before processing request
 * Returns 500 error if database is not connected
 */
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    logger.warn(`[DB Check] Request to ${req.method} ${req.path} failed - MongoDB not connected`);
    return res.status(500).json({
      success: false,
      error: 'MongoDB is not connected',
      message: 'Database connection is required for this operation',
      state: mongoose.connection.readyState,
      states: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      },
    });
  }
  next();
};

module.exports = checkDBConnection;

