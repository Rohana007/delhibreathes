const logger = require('../utils/logger');

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
    });
  }

  // Axios error (external API failure)
  if (err.isAxiosError) {
    return res.status(502).json({
      success: false,
      error: 'External Service Error',
      message: 'Failed to fetch data from external service',
    });
  }

  // Rate limit error
  if (err.name === 'TooManyRequests') {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};

